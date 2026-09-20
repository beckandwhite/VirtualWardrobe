import {
    clampTransform,
    autoTransformFor,
    SCALE_MIN,
    SCALE_MAX,
    ROTATION_MAX,
    IDENTITY_TRANSFORM,
    serializeTransform,
    deserializeTransform,
} from '../../src/composer';
import type { Keypoint, GarmentType } from '../../src/pose/types';

// A realistic standing figure, normalized 0..1.
function figure(): Keypoint[] {
    return [
        { name: 'left_shoulder', x: 0.4, y: 0.3 },
        { name: 'right_shoulder', x: 0.6, y: 0.3 },
        { name: 'left_hip', x: 0.42, y: 0.55 },
        { name: 'right_hip', x: 0.58, y: 0.55 },
        { name: 'left_ankle', x: 0.43, y: 0.95 },
        { name: 'right_ankle', x: 0.57, y: 0.95 },
       ];
}

describe('clampTransform', () => {
    it('clamps every field into its valid range', () => {
       const t = clampTransform({ x: 2, y: -1, scale: 0, rotation: 999, opacity: 1.5 });
       expect(t.x).toBe(1);
       expect(t.y).toBe(0);
       expect(t.scale).toBe(SCALE_MIN);
       expect(t.rotation).toBe(ROTATION_MAX);
       expect(t.opacity).toBe(1);
       });

    it('leaves an in-range transform untouched', () => {
       const inRange = { x: 0.5, y: 0.5, scale: 1, rotation: 0, opacity: 1 };
       expect(clampTransform(inRange)).toEqual(inRange);
       });
     });

    describe('autoTransformFor', () => {
       it('derives a usable top placement from a figure', () => {
          const t = autoTransformFor(figure(), 'top' as GarmentType);
          expect(t.x).toBeGreaterThan(0);
          expect(t.x).toBeLessThan(1);
          expect(t.scale).toBeGreaterThanOrEqual(SCALE_MIN);
          expect(t.scale).toBeLessThanOrEqual(SCALE_MAX);
          expect(t.opacity).toBe(1);
           });

       it('falls back to the centered identity default when keypoints are absent', () => {
          expect(autoTransformFor([], 'top' as GarmentType)).toEqual(IDENTITY_TRANSFORM);
           });
       });

    describe('serialize / deserialize round-trip', () => {
       it('round-trips an arbitrary transform through JSON deterministically', () => {
          const t = { x: 0.33, y: 0.66, scale: 1.4, rotation: -12, opacity: 0.8 };
          const raw = serializeTransform(t);
          expect(serializeTransform(t)).toBe(raw);
          expect(deserializeTransform(raw)).toEqual(t);
           });

       it('recovers the identity default from malformed or empty input', () => {
          expect(deserializeTransform('not json')).toEqual(IDENTITY_TRANSFORM);
          expect(deserializeTransform('')).toEqual(IDENTITY_TRANSFORM);
          expect(deserializeTransform('{}')).toEqual(IDENTITY_TRANSFORM);
           });

       it('round-trips through a clamped auto transform', () => {
          const t = autoTransformFor(figure(), 'dress' as GarmentType);
          expect(deserializeTransform(serializeTransform(t))).toEqual(t);
           });
       });
