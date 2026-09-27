import type { Keypoint, GarmentType } from '../../../src/pose/types';

// ─────────────────────────────────────────────────────────────────────────────
// M7-6 auto-fit SPIKE fixtures (gates M7-7 / #59).
//
// This module is the single, typed source of truth for the auto-fit quality bar.
// It is jest-runnable (pure data + pure helpers, no expo/RN imports) so the
// eventual M7-7 tests can `import` it directly.
//
// Coordinate space: keypoints are normalized 0..1 (x: left→right, y: top→bottom),
// exactly what the web MoveNet provider emits and what `computeBoxForKeypoints`
// consumes. All expected boxes are normalized the same way.
//
// A `Box` is the *aspect-aware* placement truth (center + separate width/height).
// The M7-6 composer collapsed this to a single square `scale = max(width, height)`
// (the primary measured failure). M7-7 places against the box directly (per-type
// anchor + aspect-ratio-aware width/height + body-line rotation), so every
// non-degenerate case's `currentStatus.failingDimensions` is now [].
// ─────────────────────────────────────────────────────────────────────────────

export interface Box {
  cx: number; // center x, normalized 0..1
  cy: number; // center y, normalized 0..1
  width: number; // normalized 0..1 (fraction of frame width)
  height: number; // normalized 0..1 (fraction of frame height)
}

export interface ExpectedPlacement {
  box: Box;
  rotation: number; // degrees; 0 for a straight-on pose
}

// The dimensions the quality bar scores independently.
export type Dimension =
  | 'horizontal' // cx
  | 'vertical' // cy
  | 'width'
  | 'height'
  | 'rotation';

// ─────────────────────────────────────────────────────────────────────────────
// LOCKED QUALITY BAR — tolerance per dimension (M7-6 deliverable #3).
// A placement "meets the bar" for a case when every scored dimension is within
// tolerance of the expected box. Positions are absolute (fraction of the frame);
// sizes are relative to the expected size (a garment's own scale sets what a
// "20% off" miss feels like).
// ─────────────────────────────────────────────────────────────────────────────
export const AUTOFIT_TOLERANCE = {
  horizontalCenter: 0.03, // |Δcx|, absolute (frame-width fraction)
  verticalCenter: 0.04, // |Δcy|, absolute (frame-height fraction)
  widthRel: 0.2, // |Δwidth| / expected.width
  heightRel: 0.2, // |Δheight| / expected.height
  rotationDeg: 5, // |Δrotation|, degrees
} as const;

// Evaluate a candidate box+rotation against an expected placement and return the
// set of dimensions that FAIL the bar (empty = meets the bar). Pure + reusable by
// M7-7's tests.
export function failingDimensions(
  actual: Box,
  actualRotation: number,
  expected: ExpectedPlacement,
  tol: typeof AUTOFIT_TOLERANCE = AUTOFIT_TOLERANCE,
): Dimension[] {
  const fails: Dimension[] = [];
  if (Math.abs(actual.cx - expected.box.cx) > tol.horizontalCenter) fails.push('horizontal');
  if (Math.abs(actual.cy - expected.box.cy) > tol.verticalCenter) fails.push('vertical');
  if (Math.abs(actual.width - expected.box.width) / expected.box.width > tol.widthRel)
    fails.push('width');
  if (Math.abs(actual.height - expected.box.height) / expected.box.height > tol.heightRel)
    fails.push('height');
  if (Math.abs(actualRotation - expected.rotation) > tol.rotationDeg) fails.push('rotation');
  return fails;
}

export interface AutofitCase {
  id: string;
  garmentType: GarmentType;
  description: string;
  keypoints: Keypoint[];
  // The target placement M7-7 should produce, or null when NO confident
  // placement is expected (graceful degradation to the manual/identity start).
  expected: ExpectedPlacement | null;
  // Measured behaviour of the CURRENT composer against `expected` under the bar
  // above. Documents the M7-6 gap so M7-7 has a red→green target: when M7-7
  // lands, these `failingDimensions` should shrink to [] and the skipped
  // "quality bar" suite can be enabled.
  currentStatus: {
    failingDimensions: Dimension[];
    note: string;
  };
}

// Canonical standing, straight-on figure (matches tests/autoBox.test.ts + the
// M0-5 SAMPLE_KEYPPOINTS geometry). Reused, translated, and tilted below.
function straightFigure(): Keypoint[] {
  return [
    { name: 'nose', x: 0.5, y: 0.12, score: 1 },
    { name: 'left_shoulder', x: 0.4, y: 0.3, score: 1 },
    { name: 'right_shoulder', x: 0.6, y: 0.3, score: 1 },
    { name: 'left_hip', x: 0.42, y: 0.55, score: 1 },
    { name: 'right_hip', x: 0.58, y: 0.55, score: 1 },
    { name: 'left_knee', x: 0.44, y: 0.75, score: 1 },
    { name: 'right_knee', x: 0.56, y: 0.75, score: 1 },
    { name: 'left_ankle', x: 0.43, y: 0.95, score: 1 },
    { name: 'right_ankle', x: 0.57, y: 0.95, score: 1 },
  ];
}

// Same figure shifted right by +0.2 in x — isolates the HORIZONTAL dimension
// (the current model tracks cx exactly, so this documents the strong axis).
function shiftedFigure(dx: number): Keypoint[] {
  return straightFigure().map((k) => ({ ...k, x: k.x + dx }));
}

// A leaning torso: shoulders tilted ~11°, hips tilted the opposite way — isolates
// the ROTATION dimension (the current model always emits rotation 0).
function leaningFigure(): Keypoint[] {
  return [
    { name: 'nose', x: 0.5, y: 0.12, score: 1 },
    { name: 'left_shoulder', x: 0.4, y: 0.32, score: 1 },
    { name: 'right_shoulder', x: 0.6, y: 0.28, score: 1 },
    { name: 'left_hip', x: 0.42, y: 0.57, score: 1 },
    { name: 'right_hip', x: 0.58, y: 0.53, score: 1 },
    { name: 'left_ankle', x: 0.43, y: 0.95, score: 1 },
    { name: 'right_ankle', x: 0.57, y: 0.95, score: 1 },
  ];
}

// Figure with the ankles dropped — shoes have no anchor and must degrade.
function noAnklesFigure(): Keypoint[] {
  return straightFigure().filter((k) => !String(k.name).includes('ankle'));
}

export const AUTOFIT_FIXTURES: AutofitCase[] = [
  {
    id: 'straight-top',
    garmentType: 'top',
    description: 'Top on a straight-on figure: should cover shoulders→hips (mid-torso center).',
    keypoints: straightFigure(),
    expected: { box: { cx: 0.5, cy: 0.425, width: 0.28, height: 0.275 }, rotation: 0 },
    currentStatus: {
      failingDimensions: [],
      note:
        'M7-7: top anchored mid-torso (shoulders→hips), width from shoulder span, aspect-aware height — meets the bar.',
    },
  },
  {
    id: 'straight-bottom',
    garmentType: 'bottom',
    description: 'Trousers on a straight-on figure: should run hips→ankles, narrow (leg) width.',
    keypoints: straightFigure(),
    expected: { box: { cx: 0.5, cy: 0.75, width: 0.18, height: 0.42 }, rotation: 0 },
    currentStatus: {
      failingDimensions: [],
      note: 'M7-7: height is the true hip→ankle span, width from hip span (not squared) — meets the bar.',
    },
  },
  {
    id: 'straight-dress',
    garmentType: 'dress',
    description: 'Dress on a straight-on figure: shoulders→mid-thigh, hangs below the hips.',
    keypoints: straightFigure(),
    expected: { box: { cx: 0.5, cy: 0.525, width: 0.26, height: 0.45 }, rotation: 0 },
    currentStatus: {
      failingDimensions: [],
      note: 'M7-7: dress spans shoulders→knees (mid-thigh), so the center/height now match — meets the bar.',
    },
  },
  {
    id: 'straight-outerwear',
    garmentType: 'outerwear',
    description: 'Jacket on a straight-on figure: wider than a top, shoulders→below hips.',
    keypoints: straightFigure(),
    expected: { box: { cx: 0.5, cy: 0.45, width: 0.3, height: 0.32 }, rotation: 0 },
    currentStatus: {
      failingDimensions: [],
      note: 'M7-7: outerwear widened to shoulder×1.5 and extended below the hips — meets the bar.',
    },
  },
  {
    id: 'straight-shoes',
    garmentType: 'shoes',
    description: 'Shoes on a straight-on figure: at the feet, just below the ankles.',
    keypoints: straightFigure(),
    expected: { box: { cx: 0.5, cy: 0.97, width: 0.21, height: 0.1 }, rotation: 0 },
    currentStatus: {
      failingDimensions: [],
      note: 'M7-7: shoe box sized from ankle spread ×1.5 (wide enough for a pair) — meets the bar.',
    },
  },
  {
    id: 'shifted-top',
    garmentType: 'top',
    description:
      'Top on a figure shifted right by +0.2 — HORIZONTAL isolation. The current model tracks cx exactly.',
    keypoints: shiftedFigure(0.2),
    expected: { box: { cx: 0.7, cy: 0.425, width: 0.28, height: 0.275 }, rotation: 0 },
    currentStatus: {
      failingDimensions: [],
      note: 'M7-7: horizontal still tracks the shoulder midpoint under translation; vertical/scale now also pass.',
    },
  },
  {
    id: 'leaning-top',
    garmentType: 'top',
    description:
      'Top on a ~11°-leaning torso — ROTATION isolation. The garment should rotate to the shoulder line.',
    keypoints: leaningFigure(),
    expected: { box: { cx: 0.5, cy: 0.425, width: 0.28, height: 0.275 }, rotation: -11 },
    currentStatus: {
      failingDimensions: [],
      note: 'M7-7: rotation now follows the shoulder-line angle (~-11°) plus the corrected top anchor/scale — meets the bar.',
    },
  },
  {
    id: 'no-ankles-shoes',
    garmentType: 'shoes',
    description:
      'Shoes with no ankle keypoints — must degrade (return null → identity start), never mis-place.',
    keypoints: noAnklesFigure(),
    expected: null,
    currentStatus: {
      failingDimensions: [],
      note: 'Correct graceful degradation: no ankles → no confident placement → manual/identity start.',
    },
  },
];
