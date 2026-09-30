import { removeBackground as imglyRemoveBackground } from '@imgly/background-removal';
import type { BackgroundRemovalResult } from './removeBackground';

// Web on-device background removal via @imgly/background-removal (WASM, runs
// entirely in the browser — no upload, consistent with the app's offline stance).
// Native uses removeBackground.ts (the custom Expo module). Output is a transparent
// PNG blob turned into an object URL, matching the { uri, removed } contract. Any
// failure (unsupported browser, WASM load error) degrades to the original URI so a
// capture is never blocked.
export async function removeBackground(sourceUri: string): Promise<BackgroundRemovalResult> {
   // SSR / non-DOM guard: nothing to run without a browser.
   if (typeof document === 'undefined') return { uri: sourceUri, removed: false };
   try {
      const blob = await imglyRemoveBackground(sourceUri, {
         output: { format: 'image/png' },
      });
      return { uri: URL.createObjectURL(blob), removed: true };
   } catch (e) {
      console.warn('removeBackground (web) failed, keeping original:', e);
      return { uri: sourceUri, removed: false };
   }
}
