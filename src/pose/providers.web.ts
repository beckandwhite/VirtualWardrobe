// Web factory (Expo platform: `.web`). Web is where the pose "wow" ships, so it
// selects `MoveNetPoseProvider` and loads the *bundled* model via the loader
// (`poseLoader.ts`, dynamic `import()`). This is the only file that references
// TensorFlow, and Expo Metro only resolves it on web — so `@tensorflow*` is
// excluded from the native build.
import type { PoseProvider } from './PoseProvider';
import { ManualPoseProvider } from './PoseProvider';
import { SamplePoseProvider } from './samplePose';
import { MoveNetPoseProvider } from './MoveNetPoseProvider';

export type PoseProviderKind = 'manual' | 'movenet' | 'sample';

export function createPoseProvider(kind: PoseProviderKind = 'movenet'): PoseProvider {
   switch(kind) {
      case 'manual':
         return new ManualPoseProvider();
       case 'sample':
         return new SamplePoseProvider();
       case 'movenet':
       default:
         // Default on web. A failed estimate throws `PoseUnavailable`, which the
         // studio's `safeEstimate` catches and degrades to manual keypoints (the
         // M2-1 "failed load falls back to manual" acceptance path).
            return new MoveNetPoseProvider();
       }
}

export { MoveNetPoseProvider };
