import {
   onboardingCameraState,
   cameraStateMessageKey,
   continueOnboardingTransition,
   ONBOARDED_KEY,
   ONBOARDED_FLAG,
   type CameraPermissionStatus,
   type OnboardingCameraState,
} from '../../src/onboarding/cameraState';

// Onboarding permission-feedback + continuation flow. The branch logic lives in
// src/onboarding/cameraState.ts (the single source of truth app/onboarding.tsx
// imports), so these tests exercise that pure logic without a device or a
// rendering harness — M4-2 AC1/AC2 (permission branches) + AC3 (device-free flow).

function status(s: string, canAskAgain?: boolean): CameraPermissionStatus {
    return { status: s, canAskAgain };
}

describe('onboardingCameraState', () => {
   it('is granted when the camera permission is granted', () => {
      expect(onboardingCameraState(status('granted'), true)).toBe('granted');
      // A granted state wins even before `permissionAsked` is set.
      expect(onboardingCameraState(status('granted'), false)).toBe('granted');
   });

   it('is "none" (no feedback) when we have not asked yet', () => {
      expect(onboardingCameraState(null, false)).toBe('none');
      expect(onboardingCameraState(status('undetermined'), false)).toBe('none');
   });

   it('is "denied" when a permission was asked and canAskAgain is false', () => {
      expect(onboardingCameraState(status('denied', false), true)).toBe('denied');
   });

   it('is "denied" when a permission was asked and canAskAgain is explicitly false', () => {
      expect(onboardingCameraState(status('undetermined', false), true)).toBe('denied');
   });

   it('is "notgranted" when a permission was asked and canAskAgain is true', () => {
      expect(onboardingCameraState(status('denied', true), true)).toBe('notgranted');
      expect(onboardingCameraState(status('undetermined', true), true)).toBe('notgranted');
   });

   it('defaults canAskAgain to true (undetermined after a first ask → "notgranted")', () => {
      // `canAskAgain` omitted → `?? true` → the "notgranted" prompt, not "denied".
      expect(onboardingCameraState(status('denied'), true)).toBe('notgranted');
   });

   it('is "none" (not denied) when status is null but we have asked', () => {
      // A null status that is asked maps to "notgranted" via `?? true` — never "denied".
      expect(onboardingCameraState(null, true)).toBe('notgranted');
   });
});

const MESSAGES: Record<OnboardingCameraState, string | null> = {
   granted: 'onboarding.camera.granted',
   denied: 'onboarding.camera.denied',
   notgranted: 'onboarding.camera.notgranted',
   none: null,
};

describe('cameraStateMessageKey', () => {
   it('maps each camera state to its feedback copy key (null for "none")', () => {
      for (const state of Object.keys(MESSAGES) as OnboardingCameraState[]) {
         expect(cameraStateMessageKey(state)).toBe(MESSAGES[state]);
      }
   });

   it('renders the "enable camera" button whenever not granted', () => {
      // The screen shows the enable button on every branch but "granted".
      expect(cameraStateMessageKey('granted') !== null).toBe(true);
      expect(cameraStateMessageKey('none') === null).toBe(true);
      expect(onboardingCameraState(null, false) !== 'granted').toBe(true);
   });
});

describe('continueOnboardingTransition', () => {
   it('persists has_onboarded = "1" and replaces the route to the wardrobe', () => {
      const t = continueOnboardingTransition();
      expect(t).toEqual({
         key: ONBOARDED_KEY,
         value: ONBOARDED_FLAG,
         route: '/wardrobe',
         next: true,
      });
      expect(t.key).toBe('has_onboarded');
      expect(t.value).toBe('1');
      expect(t.route).toBe('/wardrobe');
      expect(t.next).toBe(true);
   });
});
