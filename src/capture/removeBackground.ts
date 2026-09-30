import { removeBackgroundAsync } from '../../modules/vw-background-removal';

// #64: on-device background removal. This native default delegates to the custom
// Expo module (modules/vw-background-removal) wrapping iOS Vision (17+) and
// Android ML Kit Subject Segmentation. That module needs a custom dev build (#75)
// and is absent in Expo Go, where `removeBackgroundAsync` degrades to a passthrough
// — so the capture flow never blocks on a cutout. Web overrides this file with
// removeBackground.web.ts (@imgly/background-removal, in-browser WASM).
export interface BackgroundRemovalResult {
   // The transparent-PNG cutout on success, or the original URI on passthrough.
   uri: string;
   // True only when a real cutout was produced (false = kept the original).
   removed: boolean;
}

export async function removeBackground(sourceUri: string): Promise<BackgroundRemovalResult> {
   try {
      return await removeBackgroundAsync(sourceUri);
   } catch (e) {
      console.warn('removeBackground (native) failed, keeping original:', e);
      return { uri: sourceUri, removed: false };
   }
}
