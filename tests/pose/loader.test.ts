// M4-3 · pose-loader single-flight + failed-load regressions.
//
// `loadPoseDetector` is the web model init path. It must:
//   - be single-flight (concurrent callers share one init, no duplicate loads),
//   - surface a failed load as a recognizable `PoseUnavailable` so the studio's
//     `safeEstimate` degrades to the manual overlay instead of crashing,
//   - cache failures until `resetPoseDetector` so a bad model isn't retried
//     spuriously on every render.
//
// The heavy `@tensorflow*` boundary is mocked so the real loader logic runs with
// no model bytes, no WebGL, and no network — exactly the failure conditions this
// suite targets (D30.1). We assert call *counts*, not reference identity: the
// loader is `async`, so each call wraps the cached promise in a new Promise.
const createDetector = jest.fn();
jest.mock('@tensorflow/tfjs-backend-webgl', () => ({}) as never);
jest.mock('@tensorflow/tfjs-core', () => ({
    setBackend: jest.fn(async () => undefined),
 }) as never);
jest.mock('@tensorflow-models/pose-detection', () => ({
    createDetector,
    SupportedModels: { MoveNet: 'movenet' },
    movenet: { modelType: { SINGLEPOSE_LIGHTNING: 'lite' } },
 }) as never);

// The mocks must be declared before the import (jest hoists `jest.mock` above the
// import); the import/first rule is a false positive here — disable it explicitly.
// eslint-disable-next-line import/first
import {
    loadPoseDetector,
    resetPoseDetector,
    PoseUnavailable,
    MOVENET_MODEL_URL,
} from '../../src/pose/poseLoader';

describe('M4-3 · pose-loader single-flight + failed-load', () => {
    beforeEach(async () => {
       createDetector.mockReset();
       await resetPoseDetector();
        });

    it('is single-flight: concurrent callers trigger exactly one model load', async () => {
       createDetector.mockResolvedValue({ estimatePoses: async () => [] });
       const a = loadPoseDetector();
       const b = loadPoseDetector();
       const c = loadPoseDetector();
       await Promise.all([a, b, c]);
       expect(createDetector).toHaveBeenCalledTimes(1);
        });

    it('caches a successful load until reset (no re-init)', async () => {
       createDetector.mockResolvedValue({ estimatePoses: async () => [] });
       const first = await loadPoseDetector();
       const second = await loadPoseDetector();
       expect(first).toBe(second); // served from the cached promise
       expect(createDetector).toHaveBeenCalledTimes(1);
        });

    it('surfaces a missing / undecodable model as PoseUnavailable (the fallback signal)', async () => {
       createDetector.mockRejectedValue(new Error('model.json not found'));
       await expect(loadPoseDetector()).rejects.toBeInstanceOf(PoseUnavailable);
        });

    it('caches a failed load until reset, so a bad model is not retried every render', async () => {
       createDetector.mockRejectedValue(new Error('corrupt weights'));
       await expect(loadPoseDetector()).rejects.toBeInstanceOf(PoseUnavailable);
       await expect(loadPoseDetector()).rejects.toBeInstanceOf(PoseUnavailable);
       expect(createDetector).toHaveBeenCalledTimes(1); // same cached rejection, no new init
        });

    it('resetPoseDetector clears a failure so the next attempt can succeed', async () => {
        createDetector.mockRejectedValueOnce(new Error('transient'));
        await expect(loadPoseDetector()).rejects.toBeInstanceOf(PoseUnavailable);
        await resetPoseDetector();
        createDetector.mockResolvedValue({ estimatePoses: async () => [] });
        await expect(loadPoseDetector()).resolves.toBeDefined();
        expect(createDetector).toHaveBeenCalledTimes(2);
      });

    // AC4 / "model absence / invalid URL handling": the loader must thread the
    // bundled `MOVENET_MODEL_URL` into `createDetector` (ADR-004, network-free).
    // A regression that drops or mis-points the URL breaks the model load; this
    // pins the contract so a bad/missing URL is caught, not silently ignored.
    it('threads the bundled MOVENET_MODEL_URL into createDetector (no runtime fetch)', async () => {
        createDetector.mockResolvedValue({ estimatePoses: async () => [] });
        await loadPoseDetector();
        const [, opts] = createDetector.mock.calls[0];
        expect(opts).toMatchObject({
            modelType: 'lite',
            modelUrl: MOVENET_MODEL_URL,
        });
     });
});
