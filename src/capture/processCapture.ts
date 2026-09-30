import { removeBackground, type BackgroundRemovalResult } from './removeBackground';

// #64: the single integration point the capture screen calls after a photo is
// taken, on both native and web. Auto-runs on-device background removal and, on
// success, returns the transparent-PNG cutout as the item image; on passthrough
// (unsupported platform, no subject found, or failure) it returns the original
// untouched. Both screen handlers (native camera/library and the web file picker)
// funnel through here so the behavior can't diverge.
//
// Interim (this increment): non-destructive — the original raw file is left on
// disk. Destroying the non-kept image (D57.1) lands together with the review /
// "adjust" affordance (accept / re-run / revert-to-original), since revert needs
// the original and both need on-device UI verification.
export async function processCaptureImage(rawUri: string): Promise<BackgroundRemovalResult> {
   return removeBackground(rawUri);
}
