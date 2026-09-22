// The react-hooks/immutability rule flags shared-value `.value =` writes as
// "modifying a variable React considers immutable", but Reanimated shared values
// are the explicit exception — their whole contract is that `.value` is mutated.
/* eslint-disable react-hooks/immutability */
import {
      Image,
    PanResponder,
    Text,
    View,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    type ImageSourcePropType,
} from 'react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { Slider } from '@/studio/Slider';
import { pickImageFromLibrary } from '@/capture/pickImage';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    useAnimatedReaction,
    withTiming,
    runOnJS,
} from 'react-native-reanimated';
import { r, type Item, type StoreItem, type TryOn } from '@/store';
import { createPoseProvider, safeEstimate } from '@/pose';
import {
    autoTransformFor,
    clampTransform,
    IDENTITY_TRANSFORM,
    SCALE_MIN,
    SCALE_MAX,
    ROTATION_MIN,
    ROTATION_MAX,
} from '@/composer';
import {
    shareLook,
    persistLook,
    reopenTransform,
    type ShareResult,
} from '@/composer/share';
import { noticeForShare, EXPORT_ERROR_NOTICE } from '@/composer/notice';
import type { Keypoint, Transform } from '@/pose';
import sampleBody from '../assets/sample/body.png';
import sampleGarment from '../assets/sample/garment.png';

// A garment to overlay: either a wardrobe Item or a catalog StoreItem, normalized
// to a common shape the studio only ever talks to.
interface Garment {
    id: number;
    type: Item['type'];
    name: string;
    imagePath: string;
    inWardrobe: boolean;
}

const CATALOG_PLACEHOLDER = 'catalog://placeholder';

// Skeleton segments to render so the user sees *where* the auto-box came from.
// Indexed into the fixed 17-keypoint ORDER that `SAMPLE_KEYPPOINTS` produces
// (nose 0 → right_ankle 16 — the COCO ordering the web provider matches).
const KEYS = [
     [5, 11], [11, 12], [12, 23], [12, 14], [14, 16], [23, 25], [25, 27],
     [6, 12], [6, 11], [5, 6], [5, 7], [7, 9], [7, 5], [6, 8], [8, 10],
     [1, 2], [1, 3], [2, 4],
];
function lineBetween(a: { x: number; y: number }, b: { x: number; y: number }) {
     const x1 = a.x, y1 = a.y, x2 = b.x, y2 = b.y;
     const dx = x2 - x1, dy = y2 - y1;
     return {
        left: Math.min(x1, x2),
        top: Math.min(y1, y2),
        width: Math.hypot(dx, dy),
        angle: Math.atan2(dy, dx),
       };
}

// The bundled placeholder stands in for any garment with no real image of its own.
function resolveGarmentSource(item: Garment): ImageSourcePropType {
     const real = item.imagePath && !item.imagePath.startsWith(CATALOG_PLACEHOLDER);
     return real ? { uri: item.imagePath } : sampleGarment;
}

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

function toGarment(i: Item): Garment {
     return { id: i.id, type: i.type, name: i.name, imagePath: i.imagePath, inWardrobe: true };
}
function toGarmentStore(s: StoreItem): Garment {
     return {
        id: s.id,
        type: s.category,
        name: s.name,
        imagePath: s.imagePaths[0] ?? CATALOG_PLACEHOLDER,
        inWardrobe: false,
       };
}

export default function StudioScreen() {
     const { id } = useLocalSearchParams<{ id?: string }>();

     const [garment, setGarment] = useState<Garment | null>(null);
     const [bodySource, setBodySource] = useState<ImageSourcePropType>(sampleBody);
     const [bodyPath, setBodyPath] = useState<string | null>(null);
     const [keypoints, setKeypoints] = useState<Keypoint[]>([]);
     const [autoPlaced, setAutoPlaced] = useState(false);
     const [saving, setSaving] = useState(false);
     const [showSkeleton, setShowSkeleton] = useState(true);
      const [dims, setDims] = useState({ w: 0, h: 0 });
       // The manual-fallback banner (M2-4): shown when pose auto-drape is unavailable.
      const [manualBanner, setManualBanner] = useState({ open: true, dismissed: false });
       // A visible error surface for a failed export/share (M2-3: never silent).
      const [notice, setNotice] = useState<{ kind: 'info' | 'error'; text: string } | null>(null);
       // The minimal saved-looks strip (M2-3): recent TryOn rows, newest first.
      const [recent, setRecent] = useState<TryOn[]>([]);
      const refreshRecent = useCallback(async () => {
          setRecent((await r.listTryOns()).slice(0, 4));
      }, []);
      useEffect(() => {
          refreshRecent().catch((e) => console.error('studio: recent looks', e));
      }, [refreshRecent]);

     // The transform, split into one numeric shared value per field. Each field
     // is a Reanimated `AnimatableValue` (a number), so slider/drag edits animate
     // on the UI thread with no main-thread jank (M2-2). The five are composed in
     // `garmentStyle` and mirrored back into a single `Transform` for the sliders,
     // the readouts, and serialization on save — the one transform type both the
     // auto (web) and manual (native) paths serialize (M2-4).
     const sx = useSharedValue(IDENTITY_TRANSFORM.x);
     const sy = useSharedValue(IDENTITY_TRANSFORM.y);
     const ss = useSharedValue(IDENTITY_TRANSFORM.scale);
     const srot = useSharedValue(IDENTITY_TRANSFORM.rotation);
     const sop = useSharedValue(IDENTITY_TRANSFORM.opacity);
     const size = useSharedValue({ w: 0, h: 0 });

     // Mirror of the five fields for JS-side consumers (serialization + readouts).
     const [mirror, setMirror] = useState<Transform>({ ...IDENTITY_TRANSFORM });
     // The last auto-derived box, so "Reset" returns to confident auto placement.
     const autoRef = useRef<Transform>({ ...IDENTITY_TRANSFORM });

     // Mirror the shared fields into a single Transform for display + save.
     useAnimatedReaction(
          () => ({
             x: sx.value,
             y: sy.value,
             scale: ss.value,
             rotation: srot.value,
             opacity: sop.value,
            }),
          (cur) => {
             runOnJS(setMirror)(cur);
            },
          [sx, sy, ss, srot, sop],
     );

     // Write a partial transform on the UI thread: read the live fields, clamp the
     // assembled Transform (so a computed auto-box or a slider can't leave an
     // out-of-range field), then push each field through withTiming.
     const applyTransform = useCallback(
          (patch: Partial<Transform>, animate = true) => {
             const cur: Transform = {
                x: sx.value,
                y: sy.value,
                scale: ss.value,
                rotation: srot.value,
                opacity: sop.value,
             };
             const next = clampTransform({ ...cur, ...patch });
             const set = animate ? withTiming : (v: number) => v;
             sx.value = set(next.x, { duration: 150 });
             sy.value = set(next.y, { duration: 150 });
             ss.value = set(next.scale, { duration: 150 });
             srot.value = set(next.rotation, { duration: 150 });
             sop.value = set(next.opacity, { duration: 150 });
          },
          [sx, sy, ss, srot, sop],
     );

     /* eslint-disable react-hooks/refs */
     // 1. Resolve the garment: deep-linked wardrobe item, else first wardrobe item,
     //    else first catalog entry. (Q2/Q3: always shows something.)
     useEffect(() => {
          let alive = true;
          (async () => {
             try {
                const chosen = id ? await r.getItem(Number(id)) : undefined;
                if (chosen && alive) {
                   setGarment(toGarment(chosen));
                   return;
                }
                const wardrobe = await r.listItems();
                if (wardrobe.length) {
                   if (alive) setGarment(toGarment(wardrobe[0]));
                   return;
                }
                const catalog = await r.listStoreItems();
                if (catalog.length && alive) setGarment(toGarmentStore(catalog[0]));
             } catch (e) {
                console.error('studio: garment resolve failed', e);
             }
          })();
          return () => {
             alive = false;
          };
     }, [id]);

     // 2. Pose → auto box → animated start. Web auto-places via MoveNet; native
     //    ManualPoseProvider returns [] → identity + the "adjusting manually" banner
     //    (M2-4). Same code path, only the provider selection differs.
     useEffect(() => {
          if (!garment) return;
          let alive = true;
          (async () => {
             const provider = createPoseProvider();
             const kps = await safeEstimate(provider, bodyPath ?? '');
             if (!alive) return;
             setKeypoints(kps);
             const auto = autoTransformFor(kps, garment.type);
             const placed = kps.length > 0;
             autoRef.current = auto;
             setAutoPlaced(placed);
             applyTransform(auto, true);
             setManualBanner((b) => (b.dismissed ? b : { open: !placed, dismissed: b.dismissed }));
          })();
          return () => {
             alive = false;
          };
     }, [garment, bodyPath, applyTransform]);

     // 3. Drag the overlay to reposition. PanResponder deltas map to normalized
     //    0..1 stage space and write the x/y shared values for 1:1 tracking. Reads
     //    `.value` off the shared refs at event time (not render), so the
     //    react-hooks/refs flag on this memo is a conservative false positive.
     const startRef = useRef({ x: 0.5, y: 0.5 });
     const panResponder = useMemo(
          () =>
             PanResponder.create({
                onStartShouldSetPanResponder: () => true,
                onMoveShouldSetPanResponder: () => true,
                onPanResponderGrant: () => {
                   startRef.current = { x: sx.value, y: sy.value };
                },
                onPanResponderMove: (_e, g) => {
                   const w = size.value.w || 1;
                   const h = size.value.h || 1;
                   sx.value = clamp01(startRef.current.x + g.dx / w);
                   sy.value = clamp01(startRef.current.y + g.dy / h);
                },
             }),
          [sx, sy, size],
     );
     /* eslint-enable react-hooks/refs */

     // Reanimated UI-thread style for the garment overlay: translate (normalized→px),
     // scale, rotate, opacity — all from the single shared transform.
     const garmentStyle = useAnimatedStyle(() => ({
          position: 'absolute',
          left: 0,
          top: 0,
          width: size.value.w,
          height: size.value.h,
          opacity: sop.value,
          transform: [
             { translateX: sx.value * size.value.w },
             { translateY: sy.value * size.value.h },
             { scale: ss.value },
             { rotate: `${srot.value}deg` },
          ],
     }));

     const pickPhoto = useCallback(async () => {
          try {
             // Call synchronously in the gesture — no await before the picker, or
             // Safari drops the user activation and the dialog never opens.
             const picked = await pickImageFromLibrary();
             if (!picked) return;
             setBodySource({ uri: picked.uri });
             setBodyPath(picked.uri);
          } catch (e) {
             console.error('studio: pick photo failed', e);
          }
     }, []);

        // Persist the current composite: export + write the TryOn row via the
        // M2-3 composer pipeline (web composite / native garment degrade, D21.3).
        // Stateful wrapper that keeps the error surface + the recent strip fresh.
       const persist = useCallback(async (): Promise<TryOn | null> => {
            if (!garment) return null;
            setSaving(true);
            try {
                const row = await persistLook({
                   garment,
                   bodyPath: bodyPath ?? 'sample://body',
                   transform: mirror,
                   dims: { w: Math.max(dims.w, 720), h: Math.max(dims.h, 960) },
                   });
              await refreshRecent();
             return row;
             } catch (e) {
            // M2-3: a failed export surfaces visibly, never silent.
            console.error('studio: export/save failed', e);
            setNotice(EXPORT_ERROR_NOTICE);
            return null;
           } finally {
            setSaving(false);
          }
          },
          [garment, bodyPath, mirror, dims.w, dims.h, refreshRecent],
      );

        // Share the just-exported look through the M3-2 unified share sheet (the
        // same function the Looks gallery calls — no duplicated share code).
        const share = useCallback(async () => {
           const row = await persist();
           if (!row) return;
           const result: ShareResult = await shareLook(row);
            // The notice surface is a pure mapping of the share-result kind
            // (src/composer/notice.ts) the M4-2 flow tests exercise.
           const notice = noticeForShare(result);
           setNotice(notice);
           if (notice?.kind === 'error') return;
        }, [persist]);

         // Open an existing saved look back into the editor (reconstruct from the
         // stored transform — M2-3 reopen / M3-2 gallery).
       const reopen = useCallback(
            async (look: TryOn) => {
              const item = await r.getItem(look.itemId);
              if (!item) return;
              applyTransform(reopenTransform(look.transform), false);
              setGarment(toGarment(item));
              setBodySource({ uri: look.outputPath ?? undefined });
              setBodyPath(look.outputPath ?? null);
              setNotice({ kind: 'info', text: `Reopened look #${look.id}` });
             },
             [applyTransform],
       );

     // Overlay layer: a faint skeleton the user can toggle so they see *why* the
     // auto-box landed where it did (M2-1). Keypoints drive it; empty on manual.
     const showSkeletonWithPoints = showSkeleton && keypoints.length > 0 && !!garment;
     const overlay = showSkeletonWithPoints ? (
          <View pointerEvents="none" style={StyleSheet.absoluteFill}>
             {KEYS.map(([a, b], i) => {
                const pa = keypoints[a];
                const pb = keypoints[b];
                if (!pa || !pb) return null;
                const { left, top, width, angle } = lineBetween(pa, pb);
                return (
                     <View
                         key={`seg-${i}`}
                         style={{
                            position: 'absolute',
                            left,
                            top,
                            width,
                            height: 2,
                            backgroundColor: 'rgba(88,166,255,0.35)',
                            transform: [{ rotate: `${angle}rad` }],
                         }}
                    />
                );
             })}
             {keypoints.map((k, i) => {
                const dot = 6;
                return (
                     <View
                         key={`kp-${i}`}
                         style={{
                            position: 'absolute',
                            left: k.x * dims.w - dot / 2,
                            top: k.y * dims.h - dot / 2,
                            width: dot,
                            height: dot,
                            borderRadius: dot / 2,
                            backgroundColor: 'rgba(88,166,255,0.9)',
                         }}
                    />
                );
             })}
          </View>
     ) : null;

     const statusText = autoPlaced
          ? 'Auto-placed from detected pose'
          : 'Auto-drape unavailable — adjusting manually';

     return (
          <View style={styles.screen}>
             <View
                style={styles.stage}
                onLayout={(e) => {
                   const { width, height } = e.nativeEvent.layout;
                   size.value = { w: width, h: height };
                   setDims({ w: width, h: height });
                }}>
                <Image source={bodySource} style={StyleSheet.absoluteFill} resizeMode="contain" />
               <Animated.View {...panResponder.panHandlers} style={garmentStyle}>
                     <Image
                      source={resolveGarmentSource(garment ?? placeholderGarment())}
                      style={styles.garmentImg}
                      resizeMode="contain"
                   />
                </Animated.View>
                {overlay}
             </View>

             {manualBanner.open && !manualBanner.dismissed && (
                  <View style={styles.banner}>
                     <Text style={styles.bannerText}>
                        Auto-drape unavailable here — adjusting manually.
                     </Text>
                     <TouchableOpacity
                        onPress={() => setManualBanner((b) => ({ ...b, dismissed: true }))}>
                        <Text style={styles.bannerDismiss}>Dismiss</Text>
                     </TouchableOpacity>
                  </View>
             )}

               <View style={styles.controls}>
                  <Text style={styles.status}>{statusText}</Text>

                  {notice && (
                     <View
                        style={[styles.notice, notice.kind === 'error' ? styles.noticeError : null]}>
                        <Text
                         style={[
                         styles.noticeText,
                         notice.kind === 'error' ? styles.noticeErrorText : null,
                       ]}>
                          {notice.text}
                        </Text>
                        <TouchableOpacity onPress={() => setNotice(null)} style={{ marginLeft: 8 }}>
                           <Text style={styles.noticeDismiss}>×</Text>
                          </TouchableOpacity>
                       </View>
                  )}

                  <Slider
                   label="Scale"
                   min={SCALE_MIN}
                   max={SCALE_MAX}
                   value={mirror.scale}
                   display={mirror.scale.toFixed(2)}
                   onChange={(v) => applyTransform({ scale: v }, true)}
                />
                <Slider
                   label="Rotate"
                   min={ROTATION_MIN}
                   max={ROTATION_MAX}
                   value={mirror.rotation}
                   display={`${Math.round(mirror.rotation)}°`}
                   onChange={(v) => applyTransform({ rotation: v }, true)}
                />
                <Slider
                   label="Opacity"
                   min={0}
                   max={1}
                   value={clamp01(mirror.opacity)}
                   display={mirror.opacity.toFixed(1)}
                   onChange={(v) => applyTransform({ opacity: v }, true)}
                />

                <View style={styles.buttonRow}>
                   <TouchableOpacity style={styles.button} activeOpacity={0.8} onPress={() => applyTransform(autoRef.current, true)}>
                      <Text style={styles.buttonText}>Reset</Text>
                   </TouchableOpacity>
                   <TouchableOpacity
                      style={styles.button}
                      activeOpacity={0.8}
                      onPress={() => setShowSkeleton((s) => !s)}>
                      <Text style={styles.buttonText}>Skeleton: {showSkeleton ? 'on' : 'off'}</Text>
                   </TouchableOpacity>
                </View>
                <TouchableOpacity style={styles.button} activeOpacity={0.8} onPress={pickPhoto}>
                   <Text style={styles.buttonText}>Pick photo</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.primary, saving ? styles.busy : null]}
                  disabled={saving}
                  activeOpacity={0.8}
                  onPress={share}>
                   <Text style={styles.primaryText}>{saving ? 'Saving…' : 'Save & share'}</Text>
                </TouchableOpacity>
             </View>

             <RecentLooks looks={recent} onReopen={reopen} />
           </View>
      );
}

// The minimal saved-looks strip (M2-3): a horizontal row of the most recent
// TryOn rows; tap to reopen one into the editor. The first-class gallery is M3-2.
function RecentLooks({
       looks,
       onReopen,
}: {
    looks: TryOn[];
    onReopen: (look: TryOn) => void;
}) {
    if (!looks.length) return null;
    return (
           <View style={styles.recentRow}>
             <Text style={styles.recentHeader}>Recent</Text>
             <ScrollView
               horizontal
               showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.recentScroll}>
               {looks.map((look) => (
                  <TouchableOpacity
                           key={look.id}
                           style={styles.recentCard}
                           activeOpacity={0.8}
                           onPress={() => onReopen(look)}>
                            <Text style={styles.recentTitle}>Look #{look.id}</Text>
                           {look.createdAt ? (
                               <Text style={styles.recentDate}>{look.createdAt.slice(0, 10)}</Text>
                             ) : null}
                          </TouchableOpacity>
                       ))}
              </ScrollView>
           </View>
      );
}

function placeholderGarment(): Garment {
     return { id: 0, type: 'top', name: 'Sample garment', imagePath: CATALOG_PLACEHOLDER, inWardrobe: false };
}

const styles = StyleSheet.create({
     screen: {
        flex: 1,
        backgroundColor: '#0d1117',
     },
     stage: {
        flex: 1,
     },
     garmentImg: {
        width: '100%',
        height: '100%',
     },
     banner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#1b2330',
        paddingHorizontal: 16,
        paddingVertical: 10,
     },
     bannerText: {
        color: '#f0b429',
        fontSize: 13,
        flex: 1,
     },
     bannerDismiss: {
        color: '#8b949e',
        fontSize: 13,
        fontWeight: '600',
        marginLeft: 12,
     },
     controls: {
        backgroundColor: '#161b22',
        padding: 16,
        gap: 10,
     },
     status: {
        fontSize: 13,
        color: '#58a6ff',
        fontWeight: '600',
     },
     buttonRow: {
        flexDirection: 'row',
        gap: 10,
     },
     button: {
        flex: 1,
        backgroundColor: '#21262d',
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: 'center',
     },
     buttonText: {
        fontSize: 15,
        color: '#c9d1d9',
        fontWeight: '600',
     },
     primary: {
        backgroundColor: '#238636',
     },
     busy: {
        opacity: 0.6,
     },
     primaryText: {
        fontSize: 15,
        color: '#fff',
        fontWeight: '700',
      },
     // Visible error/info surface for export/share (M2-3: a failure never silent).
     notice: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1b2330',
        borderRadius: 8,
        padding: 10,
       },
     noticeError: {
        backgroundColor: '#3a1f1f',
       },
     noticeText: {
        flex: 1,
        fontSize: 13,
        color: '#8b949e',
       },
     noticeErrorText: {
        color: '#f85149',
       },
     noticeDismiss: {
        color: '#c9d1d9',
        fontSize: 18,
        paddingHorizontal: 6,
       },
     // Minimal recent-looks strip (M2-3); the full gallery is M3-2.
     recentRow: {
        backgroundColor: '#161b22',
        padding: 16,
        paddingTop: 0,
       },
     recentHeader: {
        fontSize: 13,
        color: '#8b949e',
        marginBottom: 8,
       },
     recentScroll: {
        gap: 10,
        paddingBottom: 4,
       },
     recentCard: {
        width: 96,
        height: 64,
        backgroundColor: '#21262d',
        borderRadius: 10,
        padding: 10,
        justifyContent: 'center',
       },
     recentTitle: {
        fontSize: 13,
        color: '#c9d1d9',
        fontWeight: '600',
       },
     recentDate: {
        fontSize: 11,
        color: '#8b949e',
       },
      });
