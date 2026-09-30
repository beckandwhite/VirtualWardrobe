import { requireOptionalNativeModule } from 'expo-modules-core';

/**
 * Result of a background-removal attempt.
 * - `uri`: the resulting image URI (a new transparent PNG when `removed` is true,
 *   otherwise the original input `uri` unchanged).
 * - `removed`: whether the native module actually produced a cut-out image.
 */
export type RemoveBackgroundResult = {
  uri: string;
  removed: boolean;
};

// The native module's registered `Name(...)` is "VwBackgroundRemoval".
// `requireOptionalNativeModule` returns `null` (instead of throwing) when the
// module isn't linked into the current binary — e.g. Expo Go or any build
// created before prebuild/dev-client was enabled (see #75).
const VwBackgroundRemoval = requireOptionalNativeModule<{
  removeBackground(uri: string): Promise<RemoveBackgroundResult>;
}>('VwBackgroundRemoval');

/**
 * `true` when the native module is present in the running binary and can attempt
 * background removal. `false` in Expo Go and any environment where the custom
 * dev build hasn't shipped the module.
 */
export const isAvailable: boolean = VwBackgroundRemoval != null;

/**
 * Remove the background from the image at `uri` on-device.
 *
 * Gracefully degrades: if the native module is unavailable (Expo Go / not built),
 * or the platform is unsupported (iOS < 17 / Android < API 24), or no subject is
 * found, it resolves to `{ uri, removed: false }` with the original URI. It never
 * throws for these expected conditions.
 */
export async function removeBackgroundAsync(uri: string): Promise<RemoveBackgroundResult> {
  if (VwBackgroundRemoval == null) {
    return { uri, removed: false };
  }

  try {
    const result = await VwBackgroundRemoval.removeBackground(uri);
    // Defensive: fall back to the original URI if the native side returned
    // something unexpected.
    if (result && typeof result.uri === 'string') {
      return { uri: result.uri, removed: Boolean(result.removed) };
    }
    return { uri, removed: false };
  } catch {
    return { uri, removed: false };
  }
}

export default {
  isAvailable,
  removeBackgroundAsync,
};
