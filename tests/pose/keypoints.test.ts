import { mapKeypoints, COCO_KEYPOINT_NAMES, type RawKeypoint } from '../../src/pose/keypoints';
import { MoveNetPoseProvider } from '../../src/pose/MoveNetPoseProvider';
import { computeGarmentBox } from '../../src/composer';
import type { PoseDetectorLike } from '../../src/pose/poseLoader';

// A raw single-pose output: 17 COCO keypoints in order, all high confidence,
// normalized to 0..1. This is the exact shape MoveNet-SinglePose-Lite emits.
function rawPose(overrides: Partial<RawKeypoint> = {}): RawKeypoint[] {
   return COCO_KEYPOINT_NAMES.map((_, i) => ({
      x: 0.5,
      y: i * (1 / COCO_KEYPOINT_NAMES.length),
      score: 0.9,
        ...overrides,
       }));
}

describe('mapKeypoints', () => {
   it('names positional COCO output and keeps normalized coords', () => {
      const out = mapKeypoints(rawPose());
      expect(out).toHaveLength(17);
       // Index 0 is 'nose', 16 is 'right_ankle' — the fixed COCO ordering.
      expect(out[0].name).toBe('nose');
      expect(out[5].name).toBe('left_shoulder');
      expect(out[16].name).toBe('right_ankle');
       expect(out.every((k) => k.x >= 0 && k.x <= 1 && k.y >= 0 && k.y <= 1)).toBe(true);
    });

   it('drops keypoints below the confidence floor', () => {
      const raw = rawPose({ score: 0.1 }); // all below 0.3
      expect(mapKeypoints(raw)).toHaveLength(0);
       const mixed = rawPose({ score: 0.5 });
      mixed[3] = { ...mixed[3], score: 0.1 };
      expect(mapKeypoints(mixed)).toHaveLength(16);
       });

   it('falls back to the numeric index when an out-of-range keypoint appears', () => {
      const raw = [
          ...rawPose(),
          { x: 0.5, y: 0.5, score: 1 },
          { x: 0.5, y: 0.5, score: 1 },
          ];
      const out = mapKeypoints(raw);
      expect(out).toHaveLength(19);
       expect(out[17].name).toBe('17');
       expect(out[18].name).toBe('18');
        });
});

// End-to-end: a fake detector (no TensorFlow, no network) flows through the
// provider's mapping into computeGarmentBox — proving M2-1's output is drop-in
// for the existing composer with no changes to its input contract.
function fakeDetector(poses: { keypoints: RawKeypoint[]}[]): PoseDetectorLike {
   return {
      async estimatePoses() {
          return poses;
      },
      };
}

describe('MoveNetPoseProvider → computeGarmentBox', () => {
   it('maps a detected pose into an auto-box the composer consumes', async () => {
      const detector = fakeDetector([{ keypoints: rawPose() }]);
      const provider = new MoveNetPoseProvider(detector);
      const kps = await provider.estimate('body://photo');
      expect(kps.length).toBeGreaterThan(0);
       // A top needs shoulder + hip context; the fixture has both.
      const t = computeGarmentBox(kps, 'top');
      expect(t).not.toBeNull();
      expect(t!.x).toBeGreaterThanOrEqual(0);
      expect(t!.x).toBeLessThanOrEqual(1);
       });

   it('returns no keypoints when the pose is empty', async () => {
      const provider = new MoveNetPoseProvider(fakeDetector([]));
      expect(await provider.estimate('body://blank')).toEqual([]);
        });
});
