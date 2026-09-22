// The entry screen's routing decision, extracted so it unit-tests without
// expo-router. `app/index.tsx` reads `useOnboarding(): boolean | null` and
// branches: `null` → a loading spinner (still resolving the flag), `false` →
// redirect to onboarding, `true` → redirect to the wardrobe. Pure function of the
// resolved flag so QA-2 asserts all three branches without a router. QA-2 / D29.2.
export type EntryRoute = 'loading' | '/onboarding' | '/wardrobe';

export function entryRedirect(onboarded: boolean | null): EntryRoute {
    if (onboarded === null) return 'loading';
    return onboarded ? '/wardrobe' : '/onboarding';
}
