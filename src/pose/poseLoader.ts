// Web-only pose model loader. TensorFlow.js + pose-detection are *never* bundled
// into the native app — this module is only ever reached from the web branch of
// `createPoseProvider`, and even then the heavy packages are pulled in via
// dynamic `import()` so a native Metro bundle (no jsdom/web) can tree-shake them
// out and the model bytes never ship to native. If loading fails, callers catch
// and fall back to `ManualPoseProvider` (M2-1: a failed load degrades to
// manual, no crash).
//
// ADR-004 ("fully local"): the model must be a *bundled* asset, not fetched at
// runtime. `MOVENET_MODEL_URL` (from `./modelUrl`, overwritten by
// `npm run fetch:pose`) points pose-detection's `modelUrl` at the copy in
// `public/` so no bytes are fetched at runtime.

import { MOVENET_MODEL_URL } from './modelUrl';
import type { RawKeypoint } from './keypoints';

export { MOVENET_MODEL_URL };
export { COCO_KEYPOINT_NAMES, mapKeypoints } from './keypoints';
export type { RawKeypoint } from './keypoints';

// The detector surface we consume. Kept structural so a fake can stand in for
// the real one in tests and the module stays decoupled from the package's own
// types. The input is `unknown` because web passes a decoded HTMLImageElement
// while tests pass a plain string.
export interface PoseDetectorLike {
   estimatePoses(source: unknown): Promise<{ keypoints: RawKeypoint[] }[]>;
}

// Thrown so the factory can distinguish "web, model failed to load" → fall back
// to manual, from "native, deliberately no model" → also manual but without a
// retry. The studio already wraps `estimate` in `safeEstimate`, so this is the
// cleanest signal.
export class PoseUnavailable extends Error {
   constructor(message?: string) {
      super(message ?? 'pose model unavailable');
      this.name = 'PoseUnavailable';
       }
}

let detectorPromise: Promise<PoseDetectorLike> | null = null;

export async function loadPoseDetector(): Promise<PoseDetectorLike> {
   if(!detectorPromise) detectorPromise = initDetector();
   return detectorPromise;
    }

// Reset the cached detector (used by tests / hot reload).
export async function resetPoseDetector(): Promise<void> {
   detectorPromise = null;
    }

async function initDetector(): Promise<PoseDetectorLike> {
   try {
       // Self-registers the webgl backend on import; then we activate it so
       // tfjs runs on GPU on web (CPU fallback is automatic if webgl is missing).
      await import('@tensorflow/tfjs-backend-webgl');
      const { setBackend } = await import('@tensorflow/tfjs-core');
      try {
          await setBackend('webgl');
       } catch (e) {
           // No webgl → tfjs-core will fall back to CPU automatically.
          console.warn('poseLoader: webgl backend unavailable, using CPU', e);
           }

      const pd = await import('@tensorflow-models/pose-detection');
        // `PoseDetector.estimatePoses` takes a narrower input type than our loose
        // `PoseDetectorLike`; the bridge cast is safe because we only ever pass a
        // decodable image/string.
       return (await pd.createDetector(pd.SupportedModels.MoveNet, {
         modelType: pd.movenet.modelType.SINGLEPOSE_LIGHTNING,
          modelUrl: MOVENET_MODEL_URL,
           })) as unknown as PoseDetectorLike;
          } catch(e) {
            // Surface a recognizable error the factory maps to "use manual".
      throw new PoseUnavailable(`failed to load MoveNet: ${String(e)}`);
             }
 }
