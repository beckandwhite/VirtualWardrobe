import { useCallback, useState } from 'react';
import { Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Paths, File } from 'expo-file-system';
import { pickImageFromLibrary } from './pickImage';

// M1-1: a single, platform-agnostic capture entry point. Screens never branch on
// platform — they call `takePhoto(source)` and get back a persisted image URI.
// Native copies the captured asset into the docs dir for a stable, restart-safe
// path; web keeps the (short-lived) object URL, since the browser FS model differs
// and re-fetching a stored blob is M1-1's out-of-scope concern.
export type CaptureSource = 'camera' | 'library';

export interface CaptureResult {
   uri: string;
   source: CaptureSource;
}

// Stable location for captured garment photos. Native persists under the docs dir;
// a leftover file after delete is acceptable for MVP (M1-2's best-effort GC owns this).
const CAPTURE_DIR = 'captures';

export interface CaptureApi {
   // True unless a camera permission prompt came back denied/undetermined on this run.
   cameraAvailable: boolean;
   // Capture a garment photo from `source`, persist it, and return the stable URI.
   // Returns null on cancel or permission denial (callers keep the screen usable).
   takePhoto: (source: CaptureSource) => Promise<CaptureResult | null>;
}

export function useCapture(): CaptureApi {
   // Web has no expo-camera; the capture button only means "camera" on native.
   const [cameraAvailable, setCameraAvailable] = useState<boolean>(Platform.OS !== 'web');

    // Persist a captured URI to a stable path. Web returns the URI untouched.
    const persist = useCallback((sourceUri: string): string => {
      if (Platform.OS === 'web') return sourceUri;
      // Ensure the captures dir exists on first run; createDirectory is idempotent.
      Paths.document.createDirectory(CAPTURE_DIR);
      const dest = new File(Paths.document, `${CAPTURE_DIR}/${Date.now()}.jpg`);
      const src = new File(sourceUri);
      src.copy(dest, { overwrite: true });
      return dest.uri;
       }, []);

   const takePhoto = useCallback(
      async (source: CaptureSource): Promise<CaptureResult | null> => {
         try {
            if (source === 'library') {
               // Library goes through the platform-split picker: on web this uses a
               // real input.click() (Safari won't open the dialog from expo's
               // synthetic click, nor after an awaited permission call), on native
               // it requests permission + launches the library picker.
               const picked = await pickImageFromLibrary();
               if (!picked) return null;
               return { uri: persist(picked.uri), source };
            }
            const perm = await ImagePicker.requestCameraPermissionsAsync();
            if (!perm.granted) {
               setCameraAvailable(false);
               return null;
            }
            const res = await ImagePicker.launchCameraAsync({ mediaTypes: 'images', quality: 0.7 });
            if (res.canceled || !res.assets?.[0]) return null;
            const uri = persist(res.assets[0].uri);
            return { uri, source };
           } catch (e) {
            console.error('useCapture failed', e);
            return null;
           }
        },
       [persist],
    );

   return { cameraAvailable, takePhoto };
}
