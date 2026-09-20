import type { Keypoint } from './types';

// MoveNet (and pose-detection in general) emits 17 COCO keypoints in a fixed
// order. The studio's computeGarmentBox looks up keypoints by *name*, so we map
// the positional output of the model to the named `Keypoint` shape the pure
// composer consumes. Kept as a pure function so it unit-tests in node.
// Order per @tensorflow-models/pose-detection `COCO_KEYPOINTS` and tfhub MoveNet.
export const COCO_KEYPOINT_NAMES = [
   'nose',
   'left_eye',
   'right_eye',
   'left_ear',
   'right_ear',
   'left_shoulder',
   'right_shoulder',
   'left_elbow',
   'right_elbow',
   'left_wrist',
   'right_wrist',
   'left_hip',
   'right_hip',
   'left_knee',
   'right_knee',
   'left_ankle',
   'right_ankle',
] as const;

// The minimal shape of a raw pose-detection keypoint we rely on. We avoid
// importing the model's own types here to keep this module dependency-free.
export interface RawKeypoint {
   x: number;
   y: number;
   score?: number;
}

// Map an ordered raw keypoint array to our named, normalized `Keypoint[]`.
// Out-of-range indices fall back to the numeric index so nothing is silently
// dropped. `score < minScore` keypoints are dropped (the model's own confidence
// filter) so weak detections don't drive the auto-box.
export function mapKeypoints(raw: RawKeypoint[], minScore = 0.3): Keypoint[] {
   return raw
    .map((kp, i) => {
       const name: string = i < COCO_KEYPOINT_NAMES.length ? COCO_KEYPOINT_NAMES[i] : String(i);
       return { name, x: kp.x, y: kp.y, score: kp.score };
       })
    .filter((k) => (k.score ?? 1) >= minScore);
}
