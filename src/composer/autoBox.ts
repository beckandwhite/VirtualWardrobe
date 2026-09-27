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
// Signed angle (degrees) of the a→b line off the horizontal, clamped to the
// transform's rotation range so a garment can never tip past the manual limit
// (M7-7 / D47.5: rotation follows the shoulder/hip/ankle line, clamped ±45°).
function lineAngleDeg(a: Keypoint, b: Keypoint): number {
   const deg = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
   return Math.max(-45, Math.min(45, deg));
}

interface Box {
   cx: number; // center x (0..1)
   cy: number; // center y (0..1)
   width: number; // 0..1
   height: number; // 0..1
   rotation: number; // degrees; body-line angle, clamped ±45 (0 for a straight pose)
}

// For a garment type, derive an aspect-aware anchor box from the available
// keypoints (M7-7 / D47.5). Each type gets its own vertical anchor and its own
// width/height so a non-square garment (trousers, dress) is never collapsed to a
// square, and a rotation from the relevant body line. Returns null when we can't
// place it confidently -> caller uses the identity transform.
export function computeBoxForKeypoints(keypoints: Keypoint[], type: GarmentType): Box | null {
   const shoulderL = pickKey(keypoints, 'left_shoulder');
   const shoulderR = pickKey(keypoints, 'right_shoulder');
   const hipL = pickKey(keypoints, 'left_hip');
   const hipR = pickKey(keypoints, 'right_hip');
   const kneeL = pickKey(keypoints, 'left_knee');
   const kneeR = pickKey(keypoints, 'right_knee');
   const ankleL = pickKey(keypoints, 'left_ankle');
   const ankleR = pickKey(keypoints, 'right_ankle');

   const shoulderWidth = shoulderL && shoulderR ? dist(shoulderL, shoulderR) : null;

   if (type === 'shoes') {
      // Feet anchor: a pair of shoes sits at (and just below) the ankle line.
      if (!ankleL || !ankleR) return null;
      const mid = midpoint(ankleL, ankleR);
      const spread = dist(ankleL, ankleR);
      const width = spread * 1.5;
      const height = spread * 0.7;
      return {
        cx: mid.x,
        cy: mid.y + height * 0.2,
        width,
        height,
        rotation: lineAngleDeg(ankleL, ankleR),
      };
   }

   // Tops, outerwear, dresses, bottoms all need shoulder + hip context.
   const hipsOk = hipL && hipR;

   if (type === 'dress') {
      // Shoulders → mid-thigh: hangs to the knees (extrapolated when knees are absent).
      if (!shoulderL || !shoulderR || !hipsOk) return null;
      const shoulder = midpoint(shoulderL, shoulderR);
      const hip = midpoint(hipL, hipR);
      const bottomY =
        kneeL && kneeR ? midpoint(kneeL, kneeR).y : hip.y + (hip.y - shoulder.y);
      const width = (shoulderWidth ?? 0.3) * 1.3;
      const height = bottomY - shoulder.y;
      return {
        cx: shoulder.x,
        cy: (shoulder.y + bottomY) / 2,
        width,
        height,
        rotation: lineAngleDeg(shoulderL, shoulderR),
      };
   }

   if (type === 'outerwear' || type === 'top') {
      if (!shoulderL || !shoulderR || !hipsOk) return null;
      const shoulder = midpoint(shoulderL, shoulderR);
      const hip = midpoint(hipL, hipR);
      const torso = hip.y - shoulder.y;
      // Top: shoulders→hips, centered mid-torso. Outerwear: wider, hangs below the hips.
      const bottomY = type === 'outerwear' ? hip.y + torso * 0.2 : hip.y;
      const width = (shoulderWidth ?? 0.3) * (type === 'outerwear' ? 1.5 : 1.4);
      const height = (bottomY - shoulder.y) * (type === 'outerwear' ? 1.05 : 1.1);
      return {
        cx: shoulder.x,
        cy: (shoulder.y + bottomY) / 2,
        width,
        height,
        rotation: lineAngleDeg(shoulderL, shoulderR),
      };
   }

   if (type === 'bottom') {
      // Hips → ankles: the true leg length, narrow (leg) width.
      if (!hipL || !hipR) return null;
      const hip = midpoint(hipL, hipR);
      const hipWidth = dist(hipL, hipR);
      const bottomY =
        ankleL && ankleR ? midpoint(ankleL, ankleR).y : hip.y + hipWidth * 2.5;
      const width = hipWidth * 1.1;
      const height = (bottomY - hip.y) * 1.05;
      return {
        cx: hip.x,
        cy: (hip.y + bottomY) / 2,
        width,
        height,
        rotation: lineAngleDeg(hipL, hipR),
      };
   }

   return null;
}

// Convert a box to a Transform the compositor can apply. The garment image is
// contain-fit into a square layer (studio) / square rect (compose.ts), so a
// single `scale` sized to the box's longer axis lets the source image keep its
// own aspect ratio inside the box — no scaleX/scaleY needed, preserving the #57
// export contract (D47.5). Rotation is carried through from the body line.
export function boxToTransform(box: Box): Transform {
   const side = Math.max(box.width, box.height);
   return {
     x: box.cx,
     y: box.cy,
     scale: side,
     rotation: box.rotation,
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
