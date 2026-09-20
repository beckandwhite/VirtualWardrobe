import { ManualPoseProvider, type PoseProvider } from './PoseProvider';
import { SamplePoseProvider } from './samplePose';

// Generic provider factory — the default for tsc + the node/jest environment (and
// any platform file that is not `.web`/`.native`). It never imports TensorFlow,
// so the test + tooling paths stay free of web-only deps.
//
// Expo Metro resolves `providers.web.ts` on web and `providers.native.ts` on
// native, so this generic file is only ever the fallback. It defaults to the
// manual provider (the safe no-ML path, M2-4).
export type PoseProviderKind = 'manual' | 'sample';

export function createPoseProvider(kind: PoseProviderKind = 'manual'): PoseProvider {
   if(kind === 'sample') return new SamplePoseProvider();
   return new ManualPoseProvider();
}
