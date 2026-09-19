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
import { useCapture, type CaptureSource } from '@/capture';
import { r, type ItemCategory } from '@/store';

// M1-1 capture screen: a garment-type hint chip row + Photo/Camera actions.
// A capture produces an `Item` draft (D19.5: type 'other' + default color) that
// M1-2 will type in full; here the user gets the image in with minimal friction.

const HINTS: ItemCategory[] = ['top', 'bottom', 'dress', 'outerwear', 'shoes', 'other'];

export default function CaptureScreen() {
   const { cameraAvailable, takePhoto } = useCapture();
   const [busy, setBusy] = useState(false);
   const [hint, setHint] = useState('');

   const captureAndSave = async (source: CaptureSource) => {
      setBusy(true);
      try {
         const result = await takePhoto(source);
         if (!result) {
            setBusy(false);
            return;
         }
          const tags = ['draft', source];
          if (hint) tags.push(hint);
          // Best-effort hint: a user-tapped chip seeds the draft's tags; M1-2 types it fully.
          await r.insertItem({
             type: 'other',
             name: 'New item',
             color: 'unknown',
             tags,
             imagePath: result.uri,
             thumbnailPath: result.uri,
              });
          await router.replace('/wardrobe');
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
              <TouchableOpacity
                style={styles.action}
                activeOpacity={0.8}
                disabled={busy}
                onPress={() => captureAndSave('library')}>
                <Text style={styles.actionText}>Photo</Text>
              </TouchableOpacity>
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
