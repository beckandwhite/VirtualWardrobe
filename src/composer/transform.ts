import type { Keypoint, GarmentType, Transform } from '../pose/types';
import { IDENTITY_TRANSFORM, serializeTransform, deserializeTransform } from '../pose/types';
import { computeGarmentBox } from './autoBox';

// Manual-control bounds. Position is 0..1 (normalized stage space); scale,
// rotation, opacity carry their own ranges so a slider or a computed auto-box
// can never push the garment into a meaningless state. Pure + clamped so both
// the auto path (computeGarmentBox) and the manual path (sliders/drag) land in
// the same valid space — the single transform type M2-2/M2-4 both share.

export const SCALE_MIN = 0.1;
export const SCALE_MAX = 3;
export const ROTATION_MIN = -45;
export const ROTATION_MAX = 45;

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const clampRange = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

// Clamp any transform (auto-derived or user-adjusted) into the valid ranges.
// Pure and total: any input yields a usable transform.
export function clampTransform(t: Transform): Transform {
    return {
       x: clamp01(t.x),
       y: clamp01(t.y),
       scale: clampRange(t.scale, SCALE_MIN, SCALE_MAX),
       rotation: clampRange(t.rotation, ROTATION_MIN, ROTATION_MAX),
       opacity: clamp01(t.opacity),
     };
}

// The auto-derived start for a pose + garment type. Returns the computed box
// clamped into range when we can place it confidently, else the sane centered
// default (the manual-fallback start, M2-4). Either way the type is identical.
export function autoTransformFor(keypoints: Keypoint[], type: GarmentType): Transform {
    const box = computeGarmentBox(keypoints, type);
    return box ? clampTransform(box) : { ...IDENTITY_TRANSFORM };
}

export { IDENTITY_TRANSFORM, serializeTransform, deserializeTransform };
