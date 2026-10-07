import { MoveNetPoseProvider } from '../../src/pose/MoveNetPoseProvider';
import { loadPoseDetector, type PoseDetectorLike } from '../../src/pose/poseLoader';
import { COCO_KEYPOINT_NAMES, type RawKeypoint } from '../../src/pose/keypoints';

jest.mock('../../src/pose/poseLoader', () => {
    const actual = jest.requireActual('../../src/pose/poseLoader');
    return {
        ...actual,
        loadPoseDetector: jest.fn(),
    };
});

function rawPose(overrides: Partial<RawKeypoint> = {}): RawKeypoint[] {
    return COCO_KEYPOINT_NAMES.map((_, i) => ({
        x: 0.5,
        y: i * (1 / COCO_KEYPOINT_NAMES.length),
        score: 0.9,
        ...overrides,
    }));
}

function fakeDetector(poses: { keypoints: RawKeypoint[] }[]): PoseDetectorLike {
    return {
        async estimatePoses() {
            return poses;
        },
    };
}

describe('MoveNetPoseProvider', () => {
    let originalImage: any;

    beforeAll(() => {
        originalImage = globalThis.Image;
    })

    afterEach(() => {
        jest.clearAllMocks();
        globalThis.Image = originalImage;
    })

    describe('estimate', () => {
        it('returns mapped keypoints on successful inference', async () => {
            const detector = fakeDetector([{ keypoints: rawPose() }]);
            const provider = new MoveNetPoseProvider(detector);
            const kps = await provider.estimate('body://photo');
            expect(kps).toHaveLength(17);
            expect(kps[0].name).toBe('nose');
        });

        it('returns empty array when no poses are detected', async () => {
            const detector = fakeDetector([]);
            const provider = new MoveNetPoseProvider(detector);
            const kps = await provider.estimate('body://blank');
            expect(kps).toEqual([]);
        });

        it('propagates inference rejection', async () => {
            const detector = {
                async estimatePoses() {
                    throw new Error('inference failed');
                },
            };
            const provider = new MoveNetPoseProvider(detector);
            await expect(provider.estimate('body://fail')).rejects.toThrow('inference failed');
        });

        it('lazily loads detector if none provided in constructor', async () => {
            const detector = fakeDetector([{ keypoints: rawPose() }]);
            (loadPoseDetector as jest.Mock).mockResolvedValue(detector);
            
            const provider = new MoveNetPoseProvider();
            const kps = await provider.estimate('body://photo');
            
            expect(loadPoseDetector).toHaveBeenCalledTimes(1);
            expect(kps).toHaveLength(17);
        });
    });

    describe('toDecodableSource (via estimate)', () => {
        it('handles image load success in browser environment', async () => {
            const detector = fakeDetector([{ keypoints: rawPose() }]);
            const provider = new MoveNetPoseProvider(detector);
            const spySource = jest.spyOn(detector, 'estimatePoses');

            globalThis.Image = class {
                crossOrigin: string = '';
                onload: () => void = () => {};
                onerror: (e: any) => void = () => {};
                private _src: string = '';
                set src(val: string) {
                    this._src = val;
                    setTimeout(() => this.onload(), 0);
                }
                get src() { return this._src; }
            } as any;

            await provider.estimate('body://photo');
            expect(spySource).toHaveBeenCalledWith(expect.any(Object));
        });

        it('handles image load failure in browser environment', async () => {
            const detector = fakeDetector([{ keypoints: rawPose() }]);
            const provider = new MoveNetPoseProvider(detector);

            globalThis.Image = class {
                crossOrigin: string = '';
                onload: () => void = () => {};
                onerror: (e: any) => void = () => {};
                private _src: string = '';
                set src(val: string) {
                    this._src = val;
                    setTimeout(() => this.onerror(new Error('load failed')), 0);
                }
                get src() { return this._src; }
            } as any;

            await expect(provider.estimate('body://fail')).rejects.toThrow('load failed');
        });

        it('returns raw string when Image is undefined (non-DOM environment)', async () => {
            const detector = fakeDetector([{ keypoints: rawPose() }]);
            const provider = new MoveNetPoseProvider(detector);
            const spySource = jest.spyOn(detector, 'estimatePoses');

            (globalThis as any).Image = undefined;

            await provider.estimate('body://photo');
            expect(spySource).toHaveBeenCalledWith('body://photo');
        });
    });

    describe('reset', () => {
        it('drops the detector and reloads it on next estimate', async () => {
            const detector1 = fakeDetector([{ keypoints: rawPose() }]);
            const detector2 = fakeDetector([{ keypoints: rawPose() }]);
            (loadPoseDetector as jest.Mock)
                .mockResolvedValueOnce(detector1)
                .mockResolvedValueOnce(detector2);

            const provider = new MoveNetPoseProvider();
            await provider.estimate('body://1');
            expect(loadPoseDetector).toHaveBeenCalledTimes(1);

            provider.reset();
            await provider.estimate('body://2');
            expect(loadPoseDetector).toHaveBeenCalledTimes(2);
        });
    });
});
