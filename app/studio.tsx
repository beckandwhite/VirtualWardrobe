import {
   Image,
   PanResponder,
   Text,
   View,
   StyleSheet,
   TouchableOpacity,
   type ImageSourcePropType,
} from 'react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocalSearchParams, router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { r, type Item, type StoreItem } from '@/store';
import { createPoseProvider, safeEstimate } from '@/pose';
import { computeGarmentBox } from '@/composer';
import {
   IDENTITY_TRANSFORM,
   serializeTransform,
   type Keypoint,
   type Transform,
} from '@/pose';
import sampleBody from '../../assets/sample/body.png'; // eslint-disable-line import/no-unresolved
import sampleGarment from '../../assets/sample/garment.png'; // eslint-disable-line import/no-unresolved

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
const clampRange = (v: number, lo: number, hi: number) =>
   Math.max(lo, Math.min(hi, v));

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
    const [transform, setTransform] = useState<Transform>(IDENTITY_TRANSFORM);
    const [autoPlaced, setAutoPlaced] = useState(false);
    const [saving, setSaving] = useState(false);
    const [dims, setDims] = useState({ w: 0, h: 0 });
    const [showSkeleton, setShowSkeleton] = useState(true);

   // Tracked in an effect so the ref is never read/written during render
   // (react-hooks/refs). onPanResponderGrant reads the last committed transform.
   const tRef = useRef(transform);
   useEffect(() => {
      tRef.current = transform;
   }, [transform]);
   const startRef = useRef({ x: 0.5, y: 0.5 });

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

   // 2. Pose → box → initial transform. SamplePoseProvider (web) auto-places;
   //    ManualPoseProvider (native) returns [] → identity + "adjusting manually".
   useEffect(() => {
      if (!garment) return;
      let alive = true;
      (async () => {
         const provider = createPoseProvider();
         const kps = await safeEstimate(provider, bodyPath ?? '');
         if (!alive) return;
         setKeypoints(kps);
         const t = computeGarmentBox(kps, garment.type);
         setAutoPlaced(t !== null);
         setTransform(t ?? { ...IDENTITY_TRANSFORM });
      })();
      return () => {
         alive = false;
      };
   }, [garment, bodyPath]);

       // 3. Drag the overlay to reposition (state-driven, no Reanimated yet — M2-2 swaps
      //    this for a Reanimated pinch/drag). Pan deltas map to normalized 0..1 space.
      // The handlers read tRef only at event time, not render, so the react-hooks/refs
      // flag on this memo is a conservative false positive.
    /* eslint-disable react-hooks/refs */
     const panResponder = useMemo(
          () =>
           PanResponder.create({
              onStartShouldSetPanResponder: () => true,
              onMoveShouldSetPanResponder: () => true,
              onPanResponderGrant: () => {
                 startRef.current = { x: tRef.current.x, y: tRef.current.y };
               },
              onPanResponderMove: (_e, g) => {
                 const w = dims.w || 1;
                 const h = dims.h || 1;
                 setTransform((prev) => ({
                     ...prev,
                    x: clamp01(startRef.current.x + g.dx / w),
                    y: clamp01(startRef.current.y + g.dy / h),
                   }));
               },
            }),
          [dims.w, dims.h],
      );
     /* eslint-enable react-hooks/refs */

   const pickPhoto = useCallback(async () => {
      try {
         const res = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: 'images',
            quality: 0.7,
         });
         if (res.canceled || !res.assets?.[0]) return;
         setBodySource({ uri: res.assets[0].uri });
         setBodyPath(res.assets[0].uri);
      } catch (e) {
         console.error('studio: pick photo failed', e);
      }
   }, []);

   const recompute = useCallback(() => {
      if (!garment) return;
      const t = computeGarmentBox(keypoints, garment.type);
      setAutoPlaced(t !== null);
      setTransform(t ?? { ...IDENTITY_TRANSFORM });
   }, [garment, keypoints]);

   const save = useCallback(async () => {
      if (!garment) return;
      setSaving(true);
      try {
         let itemId = garment.id;
         if (!garment.inWardrobe) {
            const inserted = await r.insertItem({
               type: garment.type,
               name: garment.name,
               color: 'unknown',
               tags: ['catalog'],
               imagePath: garment.imagePath,
            });
            itemId = inserted.id;
         }
         const body = await r.insertBodyPhoto(bodyPath ?? 'sample://body');
         await r.insertTryOn(body.id, itemId, serializeTransform(transform));
         router.replace('/looks');
      } catch (e) {
         console.error('studio: save failed', e);
         setSaving(false);
      }
   }, [garment, bodyPath, transform]);

    const base = Math.max(dims.w, dims.h) || 300;

    // Overlay layer: a faint skeleton the user can toggle so they see *why* the
    // auto-box landed where it did (M2-1 acceptance).
    const showSkeletonWithPoints = showSkeleton && keypoints.length > 0 && !!garment;
    const overlay = showSkeletonWithPoints ? (
       <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          {KEYS.map(([a, b], i) => {
            const pa = keypoints[a];
            const pb = keypoints[b];
             if(!pa || !pb) return null;
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

   return (
      <View style={styles.screen}>
         <View
          style={styles.stage}
          onLayout={(e) => setDims({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
            <Image
              source={bodySource}
              style={StyleSheet.absoluteFill}
              resizeMode="contain"
            />
            <View
               {...panResponder.panHandlers}
               style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  width: base,
                  height: base,
                  overflow: 'hidden',
                  opacity: transform.opacity,
                  transform: [
                      { translateX: transform.x * dims.w },
                      { translateY: transform.y * dims.h },
                      { scale: transform.scale },
                      { rotate: `${transform.rotation}deg` },
                   ],
                }}>
                <Image
                   source={resolveGarmentSource(garment ?? placeholderGarment())}
                   style={{ width: '100%', height: '100%' }}
                   resizeMode="contain"
                 />
              </View>
              {overlay}
           </View>

         <View style={styles.controls}>
            <Text style={styles.status}>
               {autoPlaced ? 'Auto-placed from sample pose' : 'Pose unavailable — adjusting manually'}
            </Text>
            <Text style={styles.hint}>Drag the garment to move it.</Text>

             <Stepper
              label="Scale"
              display={transform.scale.toFixed(2)}
              onDec={() =>
                setTransform((p) => ({
                   ...p,
                   scale: clampRange(p.scale - 0.05, 0.1, 3),
                  }))
               }
              onInc={() =>
                setTransform((p) => ({
                   ...p,
                   scale: clampRange(p.scale + 0.05, 0.1, 3),
                  }))}
             />
             <Stepper
              label="Rotate"
              display={`${transform.rotation}°`}
              onDec={() =>
                setTransform((p) => ({
                   ...p,
                   rotation: clampRange(p.rotation - 5, -45, 45),
                  }))}
              onInc={() =>
                setTransform((p) => ({
                   ...p,
                   rotation: clampRange(p.rotation + 5, -45, 45),
                  }))}
             />
             <Stepper
              label="Opacity"
              display={transform.opacity.toFixed(1)}
              onDec={() =>
                setTransform((p) => ({
                   ...p,
                   opacity: clamp01(p.opacity - 0.1),
                  }))}
              onInc={() =>
                setTransform((p) => ({
                   ...p,
                   opacity: clamp01(p.opacity + 0.1),
                  }))}
             />

              <TouchableOpacity style={styles.button} activeOpacity={0.8} onPress={recompute}>
                 <Text style={styles.buttonText}>Reset placement</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.button} activeOpacity={0.8} onPress={() => setShowSkeleton((s) => !s)}>
                 <Text style={styles.buttonText}>Skeleton: {showSkeleton ? 'on' : 'off'}</Text>
              </TouchableOpacity>
            <TouchableOpacity style={styles.button} activeOpacity={0.8} onPress={pickPhoto}>
               <Text style={styles.buttonText}>Pick photo</Text>
            </TouchableOpacity>
            <TouchableOpacity
               style={[styles.button, styles.primary, saving ? styles.busy : null]}
               disabled={saving}
               activeOpacity={0.8}
               onPress={save}>
               <Text style={styles.primaryText}>
                  {saving ? 'Saving…' : 'Save look'}
               </Text>
            </TouchableOpacity>
         </View>
      </View>
   );
}

function Stepper({
   label,
   display,
   onDec,
   onInc,
}: {
   label: string;
   display: string;
   onDec: () => void;
   onInc: () => void;
}) {
   return (
      <View style={styles.stepper}>
         <Text style={styles.stepperLabel}>{label}</Text>
         <TouchableOpacity style={styles.stepBtn} activeOpacity={0.7} onPress={onDec}>
            <Text style={styles.stepText}>–</Text>
         </TouchableOpacity>
         <Text style={styles.stepperValue}>{display}</Text>
         <TouchableOpacity style={styles.stepBtn} activeOpacity={0.7} onPress={onInc}>
            <Text style={styles.stepText}>+</Text>
         </TouchableOpacity>
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
   hint: {
      fontSize: 12,
      color: '#8b949e',
      marginBottom: 4,
   },
   stepper: {
      flexDirection: 'row',
      alignItems: 'center',
   },
   stepperLabel: {
      width: 80,
      fontSize: 13,
      color: '#c9d1d9',
   },
   stepperValue: {
      flex: 1,
      textAlign: 'center',
      fontSize: 13,
      color: '#8b949e',
   },
   stepBtn: {
      width: 36,
      height: 36,
      borderRadius: 8,
      backgroundColor: '#21262d',
      alignItems: 'center',
      justifyContent: 'center',
   },
   stepText: {
      color: '#fff',
      fontSize: 18,
      fontWeight: '700',
   },
   button: {
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
});
