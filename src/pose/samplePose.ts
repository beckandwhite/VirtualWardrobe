import type { Keypoint } from './types';
import type { PoseProvider } from './PoseProvider';

// Q6 fixture: a standing, straight-on figure with arms slightly out.
// Coords are normalized 0..1 (x: left→right, y: top→bottom) so they feed
// computeGarmentBox the same way a real MoveNet detection would (M2-1).
export const SAMPLE_KEYPPOINTS: Keypoint[] = [
     { name: 'nose', x: 0.5, y: 0.12, score: 1 },
     { name: 'left_ear', x: 0.45, y: 0.13, score: 1 },
     { name: 'right_ear', x: 0.55, y: 0.13, score: 1 },
     { name: 'left_shoulder', x: 0.4, y: 0.3, score: 1 },
     { name: 'right_shoulder', x: 0.6, y: 0.3, score: 1 },
     { name: 'left_elbow', x: 0.34, y: 0.42, score: 1 },
     { name: 'right_elbow', x: 0.66, y: 0.42, score: 1 },
     { name: 'left_wrist', x: 0.32, y: 0.55, score: 1 },
     { name: 'right_wrist', x: 0.68, y: 0.55, score: 1 },
     { name: 'left_hip', x: 0.42, y: 0.55, score: 1 },
     { name: 'right_hip', x: 0.58, y: 0.55, score: 1 },
     { name: 'left_knee', x: 0.43, y: 0.78, score: 1 },
     { name: 'right_knee', x: 0.57, y: 0.78, score: 1 },
     { name: 'left_ankle', x: 0.43, y: 0.95, score: 1 },
     { name: 'right_ankle', x: 0.57, y: 0.95, score: 1 },
];

// The M0 demo pose provider: always returns the fixture, so the auto-placement
// branch of the studio runs visibly. M2-1 swaps this for MoveNetPoseProvider on
// web (same PoseProvider interface, drop-in). Kept free of `react-native` so the
// pure test suite can import it in a node environment.
export class SamplePoseProvider implements PoseProvider {
    readonly name = 'sample';
    // Ignores the image: always returns the fixture so the auto-placement branch
    // runs visibly. M2-1's MoveNetPoseProvider takes the same arg and uses it.
    async estimate(_image?: string): Promise<Keypoint[]> {
        return SAMPLE_KEYPPOINTS;
       }
}
