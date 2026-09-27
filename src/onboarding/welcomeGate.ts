// M3-16 / M7-1 first-run welcome gate, extracted so the entry routing decision is
// unit-testable without expo-router (mirrors entryRedirect.ts / D29.2).
//
// The entry screen (`app/index.tsx`) reads:
//    - `has_seen_welcome` (M3-16 product orientation, shown at most once)
//    - `person_photo_uri`  presence (has the user captured a body photo yet?)
// and branches on them to decide where a freshly-launched user belongs. Pure
// function of the two resolved inputs, so every branch is assertable without a
// router or a store.
//
// M7-1: the M0-4 `/onboarding` camera flow is retired. The Me tab is now the
// sole body-capture surface, so a photoless user is nudged there instead. The
// route is a pure function of photo-presence — `hasPhoto ? '/wardrobe' : '/me'`
// — which also nudges a returning-but-photoless user.
export type WelcomeRoute =
  // Still resolving an input — a loading spinner, never a blank.
  | 'loading'
  // First launch (welcome not yet seen): the product orientation screen.
  | '/welcome'
  // Seen the welcome but no body photo yet: the Me tab for body capture.
  | '/me'
  // Seen the welcome and a photo is set: the main wardrobe.
  | '/wardrobe';

// The persisted key + settled value for the welcome flag, so a continuation
// event can be asserted without the store.
export const WELCOME_KEY = 'has_seen_welcome';
export const WELCOME_FLAG = '1';

// Which route the entry screen resolves to. `null` means "still loading" for
// that input. The welcome is shown only on the truly-first launch (welcome not
// seen); once seen it is never re-shown (D44.1). After that the destination is a
// pure function of photo-presence: no photo → the Me tab for capture, else the
// wardrobe.
export function welcomeGate(
  seenWelcome: boolean | null,
  hasPhoto: boolean | null,
): WelcomeRoute {
  if (seenWelcome === null) return 'loading';
  if (!seenWelcome) return '/welcome';
  if (hasPhoto === null) return 'loading';
  return hasPhoto ? '/wardrobe' : '/me';
}

// The "continue" continuation as a pure transition. It persists
// `has_seen_welcome = '1'` and then replaces into the next step of the journey —
// the Me tab for body capture when no photo is set yet, else the wardrobe.
// Modeled here as a pure event so a test can assert the persistence + routing
// without a router or a store.
export function continueWelcomeTransition(hasPhoto: boolean): {
  key: string;
  value: string;
  route: string;
} {
  return { key: WELCOME_KEY, value: WELCOME_FLAG, route: hasPhoto ? '/wardrobe' : '/me' };
}
