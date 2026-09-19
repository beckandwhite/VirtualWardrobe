import type { Keypoint, KeypointName } from './types';

// Platform-agnostic pose abstraction. M2-1 adds the web MoveNet implementation;
// M3-1 (spike) adds the native MediaPipe implementation behind the same interface.
// The composer UI only ever talks to this, never a platform-specific module.

export interface PoseProvider {
   // Returns normalized 0..1 keypoints, or null when pose estimation is unavailable
   // (drives the manual-overlay fallback, M2-4).
   estimate(image: string): Promise<Keypoint[]>;
   readonly name: string;
}

// The manual fallback. Native uses this in MVP so the studio works with zero ML.
export class ManualPoseProvider implements PoseProvider {
   readonly name = 'manual';
   async estimate(): Promise<Keypoint[]> {
      return [];
   }
}

// A no-throw wrapper so a failing provider degrades to manual instead of crashing.
export async function safeEstimate(provider: PoseProvider, image: string): Promise<Keypoint[]> {
   try {
      const kps = await provider.estimate(image);
      return Array.isArray(kps) ? kps : [];
   } catch (e) {
      console.warn(`PoseProvider "${provider.name}" failed, falling back to manual:`, e);
      return [];
   }
}

// Index helper for the keypoint names used by computeGarmentBox.
export function pickKey(keypoints: Keypoint[], name: KeypointName): Keypoint | undefined {
   return keypoints.find((k) => k.name === name);
}

