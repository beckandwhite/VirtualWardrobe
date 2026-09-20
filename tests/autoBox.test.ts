import {
  computeGarmentBox,
  boxToTransform,
  computeBoxForKeypoints,
} from '../src/composer/autoBox';
import type { Keypoint, GarmentType } from '../src/pose/types';

// A realistic standing figure, normalized 0..1.
function figure(): Record<string, Keypoint> {
  return {
    left_shoulder: { name: 'left_shoulder', x: 0.40, y: 0.30 },
    right_shoulder: { name: 'right_shoulder', x: 0.60, y: 0.30 },
    left_hip: { name: 'left_hip', x: 0.42, y: 0.55 },
    right_hip: { name: 'right_hip', x: 0.58, y: 0.55 },
    left_ankle: { name: 'left_ankle', x: 0.43, y: 0.95 },
    right_ankle: { name: 'right_ankle', x: 0.57, y: 0.95 },
  };
}

const fig = figure();

describe('computeGarmentBox', () => {
  it('returns null for an empty keypoint set', () => {
    expect(computeGarmentBox([], 'top')).toBeNull();
  });

  it('places a top centered between shoulders at shoulder y', () => {
    const t = computeGarmentBox(Object.values(fig), 'top' as GarmentType);
    expect(t).not.toBeNull();
    expect(t!.x).toBeCloseTo(0.5, 5);
    expect(t!.y).toBeCloseTo(0.30, 5);
    expect(t!.scale).toBeGreaterThan(0.1);
  });

  it('places shoes near the ankles', () => {
    const t = computeGarmentBox(Object.values(fig), 'shoes' as GarmentType);
    expect(t).not.toBeNull();
    expect(t!.y).toBeGreaterThan(fig.left_ankle.y);
  });

  it('boxes a dress taller than a top', () => {
    const top = computeGarmentBox(Object.values(fig), 'top' as GarmentType);
    const dress = computeGarmentBox(Object.values(fig), 'dress' as GarmentType);
    expect(dress!.scale).toBeGreaterThan(top!.scale);
   });

   it('returns null for bottom when hips are missing', () => {
     const withoutHips = Object.values(fig).filter((k) => !String(k.name).includes('hip'));
     expect(computeGarmentBox(withoutHips, 'bottom' as GarmentType)).toBeNull();
     });

  it('boxToTransform produces an identity-usable transform', () => {
    const box = computeBoxForKeypoints(Object.values(fig), 'top' as GarmentType)!;
    const t = boxToTransform(box);
    expect(t.rotation).toBe(0);
    expect(t.opacity).toBe(1);
    expect(t.x).toBeCloseTo(box.cx, 5);
    expect(t.y).toBeCloseTo(box.cy, 5);
   });
});
