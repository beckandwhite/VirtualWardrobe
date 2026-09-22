// Onboarding camera-permission feedback, as a pure branch.
//
// `app/onboarding.tsx` shows the user different copy depending on the camera
// permission the native camera prompt returned. That decision is a pure function
// of the `PermissionResponse` status + whether we've asked yet — so it lives here
// (node/jest-importable, no `expo-camera`/`expo-router` in the module graph) as the
// single source of truth both the JSX and the M4-2 flow tests exercise. M4-2 / D29.1.
export type OnboardingCameraState = 'none' | 'granted' | 'denied' | 'notgranted';

export interface CameraPermissionStatus {
   status: 'granted' | 'denied' | 'undetermined' | string;
   canAskAgain?: boolean;
}

export function onboardingCameraState(
    status: CameraPermissionStatus | null,
    permissionAsked: boolean,
      ): OnboardingCameraState {
    if (status?.status === 'granted') return 'granted';
    if (!permissionAsked) return 'none';
    return (status?.canAskAgain ?? true) ? 'notgranted' : 'denied';
     }

// The "finish" continuation as a pure transition. `app/onboarding.tsx`'s
// `finish()` persists `has_onboarded = '1'` via `r.setOnboarded()` and then
// `router.replace('/wardrobe')` — regardless of the current onboarded value it is
// idempotent and lands the user in the wardrobe. Modeled here as a pure event so
// M4-2 can assert the continuation without a router or a store.
export const ONBOARDED_KEY = 'has_onboarded';
export const ONBOARDED_FLAG = '1';

export function continueOnboardingTransition(): {
    key: string;
    value: string;
    route: string;
    next: boolean;
} {
    return { key: ONBOARDED_KEY, value: ONBOARDED_FLAG, route: '/wardrobe', next: true };
}

// Which feedback row the screen renders for a given camera state — the copy key
// both the JSX branch and the flow test exercise.
export function cameraStateMessageKey(
    state: OnboardingCameraState,
): string | null {
    switch (state) {
        case 'granted': return 'onboarding.camera.granted';
        case 'denied': return 'onboarding.camera.denied';
        case 'notgranted': return 'onboarding.camera.notgranted';
        default: return null;
    }
}
