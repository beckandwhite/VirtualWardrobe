// M4-3 · pose-provider failure & fallback regressions.
//
// The pose flow is the app's most fragile runtime path: provider selection is
// platform-branching, a failed model load must degrade to the manual overlay
// instead of crashing, and an empty/malformed detection must still yield a safe
// transform. These tests exercise that contract without TensorFlow or a browser:
// a failing detector is injected through `MoveNetPoseProvider`'s test seam and
// the factories are imported directly.
// Expo's platform-aware eslint resolver collapses `providers` and `providers.web`
// to the same resolved path, so `import/no-duplicates` is a false positive here —
// the split import IS the point of the platform-split test. Disable per-line.
// eslint-disable-next-line import/no-duplicates
import { createPoseProvider as createGeneric, type PoseProviderKind as GenericKind } from '../../src/pose/providers';
// eslint-disable-next-line import/no-duplicates
import { createPoseProvider as createWeb, type PoseProviderKind as WebKind } from '../../src/pose/providers.web';
import {
    MoveNetPoseProvider,
} from '../../src/pose/MoveNetPoseProvider';
import {
    safeEstimate,
    ManualPoseProvider,
    pickKey,
} from '../../src/pose/PoseProvider';
import { SamplePoseProvider, SAMPLE_KEYPPOINTS } from '../../src/pose/samplePose';
import { autoTransformFor, IDENTITY_TRANSFORM } from '../../src/composer';
import type { PoseDetectorLike } from '../../src/pose/poseLoader';
import type { Keypoint } from '../../src/pose/types';

// A detector whose `estimatePoses` always rejects — simulates a broken model or a
// corrupted model.json at runtime.
function failingDetector(): PoseDetectorLike {
    return {
        estimatePoses() {
            return Promise.reject(new Error('model bytes missing'));
        },
    };
}

describe('M4-3 · factory platform split', () => {
    it('generic (node/jest/native fallback) defaults to the manual no-ML provider', async () => {
       const p = createGeneric();
        expect(p.name).toBe('manual');
        expect(await p.estimate('body://x')).toEqual([]);
        const sample = createGeneric('sample' as GenericKind);
        expect(sample.name).toBe('sample');
        expect((await sample.estimate('body://x')).length).toBeGreaterThan(0);
       });

    it('web factory defaults to the MoveNet provider, falling back to named overrides', async () => {
       const web = createWeb();
        expect(web.name).toBe('movenet-web');
        expect(createWeb('manual' as WebKind).name).toBe('manual');
        expect(createWeb('sample' as WebKind).name).toBe('sample');
        // An unrecognized kind degrades to the web default (MoveNet), never nothing.
        expect(createWeb('bogus' as WebKind).name).toBe('movenet-web');
       });

    it('web and generic factories agree on the manual + sample providers', async () => {
       expect(await createGeneric('sample' as GenericKind).estimate('x')).toEqual(
          await createWeb('sample' as WebKind).estimate('x'),
          );
        expect(await createGeneric('manual' as GenericKind).estimate('x'))
          .toEqual(await createWeb('manual' as WebKind).estimate('x'));
       });
});

describe('M4-3 · ManualPoseProvider + safeEstimate', () => {
    it('the manual provider is the supported no-ML fallback (empty keypoints)', async () => {
       // ManualPoseProvider.estimate ignores its image arg — it never looks at a photo.
       expect(await new ManualPoseProvider().estimate()).toEqual([]);
       // Empty keypoints are the manual-fallback signal: the studio places the
       // centered identity transform rather than auto-draping.
        expect(autoTransformFor([], 'top')).toEqual(IDENTITY_TRANSFORM);
       });

    it('safeEstimate swallows a throwing provider and returns manual []', async () => {
       const provider = new MoveNetPoseProvider(failingDetector());
        const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
        const out = await safeEstimate(provider, 'body://photo');
       expect(out).toEqual([]);
        expect(warn).toHaveBeenCalled();
       warn.mockRestore();
       });

    it('safeEstimate degrades a non-array result to [] (no crash on bad shape)', async () => {
       const broken = {
           name: 'broken',
           estimate: async () => undefined as unknown as Keypoint[],
        };
       expect(await safeEstimate(broken, 'body://x')).toEqual([]);
       });

    it('safeEstimate passes a healthy provider through untouched', async () => {
        const kps = await safeEstimate(new SamplePoseProvider(), 'body://x');
        expect(kps).toEqual(SAMPLE_KEYPPOINTS);
        expect(pickKey(kps, 'left_shoulder')).toBeDefined();
        });

     // End-to-end fallback chain (AC1 + AC2): a throwing provider must degrade
     // through `safeEstimate` to empty keypoints, and those empty keypoints must
     // yield the centered identity transform — i.e. estimation failure lands on the
     // manual-overlay path instead of crashing.
    it('a failing provider degrades end-to-end to the manual identity transform', async () => {
        const provider = new MoveNetPoseProvider(failingDetector());
        const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
        const keypoints = await safeEstimate(provider, 'body://photo');
        expect(keypoints).toEqual([]);
        expect(autoTransformFor(keypoints, 'top')).toEqual(IDENTITY_TRANSFORM);
        expect(warn).toHaveBeenCalled();
        warn.mockRestore();
        });
});
