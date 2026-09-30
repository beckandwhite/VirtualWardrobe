import { removeBackground, type BackgroundRemovalResult } from './removeBackground';

// #64: the single integration point the capture screen calls after a photo is
// taken, on both native and web. Auto-runs on-device background removal and
// returns the transparent-PNG cutout (on success) or the original untouched (on
// passthrough — unsupported platform, no subject found, or failure). Both screen
// handlers (native camera/library and the web file picker) funnel through here so
// the behavior can't diverge. The screen then shows the result in a review step
// where the user keeps the cutout or reverts to the original; `resolveReviewChoice`
// decides which file survives and which is destroyed (D57.1).
export async function processCaptureImage(rawUri: string): Promise<BackgroundRemovalResult> {
   return removeBackground(rawUri);
}

export type ReviewChoice = 'cutout' | 'original';

export interface CutoutReview {
   rawUri: string;
   cutoutUri: string;
   removed: boolean;
}

// Which capture survives and which is discarded (D57.1), given the user's review
// choice. Pure, so the destructive decision is unit-tested without touching disk.
// 'cutout' only wins when a distinct cutout actually exists (removed and a
// different URI); otherwise the original is kept. On passthrough the two URIs are
// the same, so nothing is discarded.
export function resolveReviewChoice(
   review: CutoutReview,
   choice: ReviewChoice,
): { keptUri: string; discardUri: string | null } {
   const useCutout =
      choice === 'cutout' && review.removed && review.cutoutUri !== review.rawUri;
   const keptUri = useCutout ? review.cutoutUri : review.rawUri;
   const otherUri = useCutout ? review.rawUri : review.cutoutUri;
   const discardUri = otherUri !== keptUri ? otherUri : null;
   return { keptUri, discardUri };
}
