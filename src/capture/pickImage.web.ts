import type { PickedImage } from './pickImage';

// Web image-library picker that works in Safari/WebKit.
//
// expo-image-picker's web path opens the file dialog with a *synthetic* event —
// `input.dispatchEvent(new MouseEvent('click'))` (ExponentImagePicker.web.ts).
// Chrome/Firefox honor a synthetic click while a user gesture is active, but
// WebKit refuses to open a file dialog from an untrusted event and does nothing,
// silently. Here we call the real `HTMLInputElement.click()` synchronously inside
// the caller's onPress gesture, which WebKit honors, then hand back a blob URL in
// the same `{ uri }` shape as the native picker.
//
// IMPORTANT: callers must invoke this with no `await` before it in the gesture
// handler, or the user activation is spent and even a real `.click()` is ignored.
export async function pickImageFromLibrary(): Promise<PickedImage | null> {
   // SSR guard: nothing to click without a DOM.
   if (typeof document === 'undefined') return null;

   return new Promise<PickedImage | null>((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.style.display = 'none';
      document.body.appendChild(input);

      let settled = false;
      const cleanup = () => {
         if (input.parentNode) input.parentNode.removeChild(input);
      };
      const finish = (result: PickedImage | null) => {
         if (settled) return;
         settled = true;
         cleanup();
         resolve(result);
      };

      input.addEventListener('change', () => {
         const file = input.files?.[0];
         finish(file ? { uri: URL.createObjectURL(file) } : null);
      });
      // Fired when the dialog is dismissed without a selection (modern browsers).
      input.addEventListener('cancel', () => finish(null));

      // The real click — trusted because we're still inside the caller's gesture.
      input.click();
   });
}
