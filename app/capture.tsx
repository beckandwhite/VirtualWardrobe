import {
   Text,
   View,
   StyleSheet,
   TouchableOpacity,
   ScrollView,
   Platform,
} from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import { useCapture, type CaptureSource, type CaptureResult } from '@/capture';
import { FilePickerButton } from '@/capture/FilePickerButton';
import { r } from '@/store';
import {
   buildDraftFromCapture,
   captureNextStep,
   DRAFT_HINTS,
 } from '@/capture/draft';

// M1-1 capture screen: a garment-type hint chip row + Photo/Camera actions.
// A capture produces an `Item` draft (D19.5: type 'other' + default color) that
// M1-2 will type in full; here the user gets the image in with minimal friction.
// The draft-shape + the "on nothing captured / on error, reset busy and don't
// navigate" decision live in src/capture/draft.ts as the single source of truth
// the M4-2 flow tests exercise.

const HINTS = DRAFT_HINTS;

export default function CaptureScreen() {
   const { cameraAvailable, takePhoto } = useCapture();
   const [busy, setBusy] = useState(false);
   const [hint, setHint] = useState('');

    const captureAndSave = async (source: CaptureSource) => {
      setBusy(true);
      try {
         const result = await takePhoto(source);
         const draft = buildDraftFromCapture(result, hint);
         if (!draft) {
             // Nothing captured (cancel / denial / error): reset busy, no insert, no nav.
            setBusy(false);
            return;
             }
               // Best-effort hint: a user-tapped chip seeds the draft's tags; M1-2 types it fully.
         await r.insertItem(draft);
         const next = captureNextStep(draft);
         if (next.navigate) await router.replace(next.route);
         } catch (e) {
       console.error('capture save failed', e);
       setBusy(false);
         }
        };

   // Web-only path: FilePickerButton gives us a blob URI directly (persist is a
   // no-op on web), so we build the draft inline and skip the takePhoto wrapper.
   const captureFromUri = async (uri: string) => {
      setBusy(true);
      try {
         const result: CaptureResult = { uri, source: 'library' };
         const draft = buildDraftFromCapture(result, hint);
         if (!draft) { setBusy(false); return; }
         await r.insertItem(draft);
         const next = captureNextStep(draft);
         if (next.navigate) await router.replace(next.route);
      } catch (e) {
         console.error('capture save failed', e);
         setBusy(false);
      }
   };

   return (
        <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
           <Text style={styles.title}>Add a garment</Text>
           <Text style={styles.body}>
             Pick a photo from your library or photograph it with the camera. Type it later.
          </Text>

           <Text style={styles.sectionTitle}>Hint (optional)</Text>
           <View style={styles.chips}>
             {HINTS.map((h) => (
                <TouchableOpacity
                  key={h}
                  style={[styles.chip, h === hint ? styles.chipActive : null]}
                  activeOpacity={0.7}
                  onPress={() => setHint(h === hint ? '' : h)}>
                  <Text style={[styles.chipText, h === hint ? styles.chipTextActive : null]}>{h}</Text>
                </TouchableOpacity>
                ))}
           </View>

           <View style={styles.actions}>
              {Platform.OS === 'web' ? (
                <FilePickerButton
                  style={styles.action}
                  labelStyle={styles.actionText}
                  disabled={busy}
                  onPick={captureFromUri}>
                  Photo
                </FilePickerButton>
              ) : (
                <TouchableOpacity
                  style={styles.action}
                  activeOpacity={0.8}
                  disabled={busy}
                  onPress={() => captureAndSave('library')}>
                  <Text style={styles.actionText}>Photo</Text>
                </TouchableOpacity>
              )}
              {cameraAvailable && Platform.OS !== 'web' ? (
                <TouchableOpacity
                  style={styles.action}
                  activeOpacity={0.8}
                  disabled={busy}
                  onPress={() => captureAndSave('camera')}>
                  <Text style={styles.actionText}>Camera</Text>
                </TouchableOpacity>
              ) : null}
            </View>
        </ScrollView>
   );
}

const styles = StyleSheet.create({
   screen: { flex: 1, backgroundColor: '#fff' },
   content: { padding: 24, gap: 12 },
   title: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
   body: { fontSize: 15, lineHeight: 22, color: '#4a4a4a' },
   sectionTitle: {
      fontSize: 13,
      fontWeight: '700',
      textTransform: 'uppercase' as 'uppercase',
      letterSpacing: 1,
      color: '#888',
      marginTop: 8,
   },
   chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
   chip: {
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderRadius: 18,
      backgroundColor: '#f2f2f2',
   },
   chipActive: { backgroundColor: '#111' },
   chipText: { fontSize: 13, fontWeight: '600', color: '#333', textTransform: 'capitalize' },
   chipTextActive: { color: '#fff' },
   actions: { flexDirection: 'row', gap: 12, marginTop: 8 },
   action: {
      flex: 1,
      paddingVertical: 16,
      borderRadius: 14,
      backgroundColor: '#111',
      alignItems: 'center',
   },
   actionText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
