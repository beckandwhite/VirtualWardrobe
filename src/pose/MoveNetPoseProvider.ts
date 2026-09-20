import type { Keypoint } from './types';
import type { PoseProvider } from './PoseProvider';
import { loadPoseDetector, mapKeypoints, type RawKeypoint, type PoseDetectorLike } from './poseLoader';

// Web MoveNet pose provider. Wraps the cached detector; `estimate` returns
// normalized 0..1 keypoints that feed `computeGarmentBox` (M0-2) directly, or
// throws (`PoseUnavailable`) so the studio's `safeEstimate` falls back to the
// manual path.
//
// ADR-004: the model bytes are a bundled asset (see `MOVENET_MODEL_URL` in
// poseLoader), so after a one-time vendor (`npm run fetch:pose`) inference is
// network-free at runtime.
export class MoveNetPoseProvider implements PoseProvider {
   readonly name = 'movenet-web';
   private detector: PoseDetectorLike | null = null;

   // Optional pre-loaded detector (test seam); otherwise lazily loaded.
   constructor(detector?: PoseDetectorLike) {
      this.detector = detector ?? null;
       }

   async estimate(image: string): Promise<Keypoint[]> {
      if(!this.detector) this.detector = await loadPoseDetector();

        // pose-detection consumes a decodable image on web. A bare string is the
        // body URI the studio passes; turn it into an HTMLImageElement so the
        // model sees pixels. `Image` only exists in the web runtime — guarded.
      const source = await toDecodableSource(image);
      const poses = await this.detector.estimatePoses(source);
      if(!poses.length) return [];

        // MoveNet single-pose returns one pose with 17 COCO keypoints in a fixed
        // order; map to our named Keypoint shape and filter by confidence.
      return mapKeypoints(poses[0].keypoints as unknown as RawKeypoint[]);
        }

     /** Drop the detector reference so the model can be GC'd on unmount. */
   reset(): void {
      this.detector = null;
        }
    }

// Turn a body-photo URI into something pose-detection can read on web. A string
// becomes a decoded HTMLImageElement; an already-decodable object (e.g. a test
// stub) passes through. In a non-DOM runtime (it should never be reached) it
// resolves to the raw string so the load path is still exercisable.
async function toDecodableSource(image: string): Promise<unknown> {
   const g = globalThis as { Image?: new () => HTMLImageElement };
   if(typeof g.Image === 'undefined') return image;
   const img = new g.Image() as unknown as HTMLImageElement;
   img.crossOrigin = 'anonymous';
   await new Promise((resolve, reject) => {
      img.onload = () => resolve(img);
      img.onerror = (e) => reject(e instanceof Error ? e : new Error('image load failed'));
      img.src = image;
       });
   return img;
}
