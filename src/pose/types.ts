// Shared geometry + garment types for the pose-aware try-on.

// A normalized keypoint in 0..1 image space, as returned by a PoseProvider. The
// `name` is `KeypointName` on the pure/native path and a raw COCO keypoint index
// or name on the web MoveNet path, so it is typed `string | number`.
export interface Keypoint {
   name: string | number;
   x: number;
   y: number;
   score?: number;
}

// The standard 17 MoveNet/PoseLandmarker keypoints we rely on.
export type KeypointName =
     | 'left_shoulder'
     | 'right_shoulder'
     | 'left_elbow'
     | 'right_elbow'
     | 'left_wrist'
     | 'right_wrist'
     | 'left_hip'
     | 'right_hip'
     | 'left_knee'
     | 'right_knee'
     | 'left_ankle'
     | 'right_ankle'
     | 'nose'
     | 'left_ear'
     | 'right_ear';

export type GarmentType =
     | 'top'
     | 'bottom'
     | 'dress'
     | 'outerwear'
     | 'shoes'
     | 'other';

// A garment placed over a body photo. Normalized 0..1 origin, scale is a multiplier,
// rotation in degrees, opacity 0..1.
export interface Transform {
   x: number;
   y: number;
   scale: number;
   rotation: number;
   opacity: number;
}

export const IDENTITY_TRANSFORM: Transform = {
   x: 0.5,
   y: 0.5,
   scale: 0.5,
   rotation: 0,
   opacity: 1,
};

export function serializeTransform(t: Transform): string {
    return JSON.stringify(t);
}

export function deserializeTransform(raw: string): Transform {
    try {
        const p = JSON.parse(raw) as Partial<Transform>;
        return {
          x: p.x ?? 0.5,
          y: p.y ?? 0.5,
          scale: p.scale ?? 0.5,
          rotation: p.rotation ?? 0,
          opacity: p.opacity ?? 1,
        };
    } catch {
        return { ...IDENTITY_TRANSFORM };
    }
}
