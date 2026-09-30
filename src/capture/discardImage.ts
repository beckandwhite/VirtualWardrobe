import { Platform } from 'react-native';
import { File } from 'expo-file-system';

// #64 (D57.1): destructively drop the capture the user did NOT keep in the review
// step — the cutout replaces the original, so exactly one image survives. Web
// captures are `blob:` object URLs (revoked); native captures are docs/caches-dir
// files (deleted). Best-effort: a failed cleanup is logged, never thrown, so it
// can't block the save.
export function discardImage(uri: string): void {
   if (!uri) return;
   try {
      if (Platform.OS === 'web') {
         if (uri.startsWith('blob:')) URL.revokeObjectURL(uri);
         return;
      }
      const file = new File(uri);
      if (file.exists) file.delete();
   } catch (e) {
      console.warn('discardImage failed (ignored):', e);
   }
}
