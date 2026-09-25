// M3-16 first-run welcome gate, extracted so the entry routing decision is
// unit-testable without expo-router (mirrors entryRedirect.ts / D29.2).
//
// The entry screen (`app/index.tsx`) reads two persisted flags:
//    - `has_onboarded`    (M0-4 camera onboarding)
//    - `has_seen_welcome` (M3-16 product orientation)
// and branches on them to decide where a freshly-launched user belongs. Pure
// function of the two resolved flags, so M3-16 asserts every branch without a
// router or a store.
export type WelcomeRoute =
  // Still resolving either flag — a loading spinner, never a blank.
  | 'loading'
  // First launch: the product orientation screen.
  | '/welcome'
  // Seen the welcome but not the M0-4 onboarding: camera permissions.
  | '/onboarding'
  // Both done: the main wardrobe.
  | '/wardrobe';

// The persisted key + settled value, mirroring ONBOARDED_KEY/ONBOARDED_FLAG in
// cameraState.ts so a continuation event can be asserted without the store.
export const WELCOME_KEY = 'has_seen_welcome';
export const WELCOME_FLAG = '1';

// Which route the entry screen resolves to for a given pair of resolved flags.
// `null` means "still loading" for that flag. The welcome is shown only on the
// truly-first launch (both flags false) and is gated on `!onboarded`, so a user
// who already completed M0-4 onboarding is never re-shown the orientation.
export function welcomeGate(
  onboarded: boolean | null,
  seenWelcome: boolean | null,
): WelcomeRoute {
  if (onboarded === null || seenWelcome === null) return 'loading';
  if (!onboarded && !seenWelcome) return '/welcome';
  if (!onboarded) return '/onboarding';
  return '/wardrobe';
}

// The "continue" / "skip" continuation as a pure transition. Both actions persist
// `has_seen_welcome = '1'` and then replace into the next step of the journey —
// the M0-4 onboarding when the user has not onboarded yet, else the wardrobe.
// Modeled here as a pure event so a test can assert the persistence + routing
// without a router or a store.
export function continueWelcomeTransition(onboarded: boolean): {
  key: string;
  value: string;
  route: string;
} {
  return { key: WELCOME_KEY, value: WELCOME_FLAG, route: onboarded ? '/wardrobe' : '/onboarding' };
}
