import { Platform } from 'react-native';
import { ManualPoseProvider, type PoseProvider } from './PoseProvider';
import { SamplePoseProvider } from './samplePose';

// Platform factory the studio calls. Web/M0-5 → sample (the box auto-places
// visibly); native → manual (the M2-4 fallback). When M2-1 lands, the web branch
// becomes MoveNetPoseProvider — same PoseProvider interface, drop-in.
export function createPoseProvider(): PoseProvider {
    if (Platform.OS === 'web') {
       return new SamplePoseProvider();
     }
    return new ManualPoseProvider();
}
