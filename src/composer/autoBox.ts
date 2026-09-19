import type { Keypoint, GarmentType, Transform } from '../pose/types';
import { pickKey } from '../pose/PoseProvider';

// Deterministic pose -> garment box. This is the MVP garment fitting: no mesh,
// just anchor points per garment type. Pure + unit-tested. See M0-2 / M2-2.

function midpoint(a: Keypoint, b: Keypoint): Keypoint {
   return { name: 'mid', x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}
function dist(a: Keypoint, b: Keypoint): number {
   return Math.hypot(a.x - b.x, a.y - b.y);
}

interface Box {
   cx: number; // center x (0..1)
   cy: number; // center y (0..1)
   width: number; // 0..1
   height: number; // 0..1
}

// For a garment type, derive an anchor box from the available keypoints.
// Returns null when we can't place it confidently -> caller uses identity transform.
export function computeBoxForKeypoints(keypoints: Keypoint[], type: GarmentType): Box | null {
   const shoulderL = pickKey(keypoints, 'left_shoulder');
   const shoulderR = pickKey(keypoints, 'right_shoulder');
   const hipL = pickKey(keypoints, 'left_hip');
   const hipR = pickKey(keypoints, 'right_hip');

   const shoulderWidth = shoulderL && shoulderR ? dist(shoulderL, shoulderR) : null;

   if (type === 'shoes') {
      const ankleL = pickKey(keypoints, 'left_ankle');
      const ankleR = pickKey(keypoints, 'right_ankle');
      if (!ankleL || !ankleR) return null;
      const mid = midpoint(ankleL, ankleR);
      const width = dist(ankleL, ankleR) * 0.8;
      return { cx: mid.x, cy: mid.y + width * 0.3, width, height: width * 0.6 };
   }

   // Tops, outerwear, dresses, bottoms all need shoulder + hip context.
   const hipsOk = hipL && hipR;

   if (type === 'dress') {
      if (!shoulderL || !shoulderR || !hipsOk) return null;
      const top = midpoint(shoulderL, shoulderR);
      const bottom = midpoint(hipL, hipR);
      const width = (shoulderWidth ?? 0.3) * 1.25;
      const height = dist(top, bottom) * 1.4;
      return { cx: top.x, cy: (top.y + bottom.y) / 2, width, height };
   }

   if (type === 'outerwear' || type === 'top') {
      if (!shoulderL || !shoulderR || !hipsOk) return null;
      const top = midpoint(shoulderL, shoulderR);
      const bottom = type === 'outerwear' ? midpoint(hipL, hipR) : top; // outerwear extends to hips
      const width = (shoulderWidth ?? 0.3) * 1.1;
      const height = dist(top, bottom) * (type === 'outerwear' ? 1.2 : 0.9);
      return { cx: top.x, cy: (top.y + bottom.y) / 2, width, height };
   }

   if (type === 'bottom') {
      if (!hipL || !hipR) return null;
      const top = midpoint(hipL, hipR);
      const width = dist(hipL, hipR) * 0.85;
      const height = width * 1.8; // legs
      return { cx: top.x, cy: top.y + height / 2, width, height };
   }

   return null;
}

// Convert a box to a Transform the compositor can apply.
// width/height are absolute normalized sizes; scale is a multiplier from IDENTITY.
export function boxToTransform(box: Box): Transform {
   // Assume the source garment image is roughly square and centered at 0.5,0.5.
   const side = Math.max(box.width, box.height);
   return {
     x: box.cx,
     y: box.cy,
     scale: side,
     rotation: 0,
     opacity: 1,
   };
}

// Top-level: pose -> transform (or null). This is the function under test.
export function computeGarmentBox(
     keypoints: Keypoint[],
     type: GarmentType,
     ): Transform | null {
     const box = computeBoxForKeypoints(keypoints, type);
     if (!box) return null;
     return boxToTransform(box);
}
