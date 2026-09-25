import {
 welcomeGate,
 continueWelcomeTransition,
 WELCOME_KEY,
 WELCOME_FLAG,
 type WelcomeRoute,
} from '../../src/onboarding/welcomeGate';
import { CATALOG, LOCALES } from '../../src/i18n/strings';

// M3-16 first-run welcome gate. The routing decision (app/index.tsx) lives in
// src/onboarding/welcomeGate.ts as a pure function of the two persisted flags —
// `has_onboarded` and `has_seen_welcome` — so every branch is assertable without
// a router or a store (mirrors entryRedirect.test.ts / D29.2).

describe('welcomeGate', () => {
 it('shows a loading state while either flag is unresolved (null)', () => {
   expect(welcomeGate(null, null)).toBe('loading');
   expect(welcomeGate(null, true)).toBe('loading');
   expect(welcomeGate(true, null)).toBe('loading');
   expect(welcomeGate(null, false)).toBe('loading');
   expect(welcomeGate(false, null)).toBe('loading');
  });

 it('shows the welcome only on a truly first launch (both flags false)', () => {
   expect(welcomeGate(false, false)).toBe('/welcome');
  });

 it('routes a seen-welcome, not-yet-onboarded user to the M0-4 onboarding', () => {
   expect(welcomeGate(false, true)).toBe('/onboarding');
  });

 it('routes a fully-settled returning user straight to the wardrobe', () => {
   expect(welcomeGate(true, true)).toBe('/wardrobe');
   expect(welcomeGate(true, false)).toBe('/wardrobe');
  });

 it('never re-shows the welcome to a user who already onboarded', () => {
     // AC3: a returning user (onboarded) is not interrupted, even if the welcome
     // flag is somehow still false.
   expect(welcomeGate(true, false)).not.toBe('/welcome');
   expect(welcomeGate(true, true)).not.toBe('/welcome');
  });

 it('covers exactly the four route outcomes the entry screen renders', () => {
   const routes: WelcomeRoute[] = [
     welcomeGate(null, null),
     welcomeGate(false, false),
     welcomeGate(false, true),
     welcomeGate(true, true),
    ];
   expect(routes).toEqual(['loading', '/welcome', '/onboarding', '/wardrobe']);
  });
});

describe('continueWelcomeTransition (primary / skip behavior)', () => {
 it('persists has_seen_welcome = "1" and is the same for continue and skip', () => {
     // Continue and Skip resolve to the same persisted flag and the same next
     // route for a given onboarding state — both are idempotent one-screen
     // dismissals (D44.1).
   expect(continueWelcomeTransition(false)).toEqual({
     key: WELCOME_KEY,
     value: WELCOME_FLAG,
     route: '/onboarding',
     });
   expect(continueWelcomeTransition(true)).toEqual({
     key: WELCOME_KEY,
     value: WELCOME_FLAG,
     route: '/wardrobe',
     });
  });

 it('targets the M0-4 onboarding when not yet onboarded, else the wardrobe', () => {
   expect(continueWelcomeTransition(false).route).toBe('/onboarding');
   expect(continueWelcomeTransition(true).route).toBe('/wardrobe');
  });

 it('writes the canonical welcome flag key/value', () => {
   expect(continueWelcomeTransition(false).key).toBe('has_seen_welcome');
   expect(continueWelcomeTransition(false).value).toBe('1');
  });
});

describe('welcome copy (AC4 — honest manual fallback, no native pose promise)', () => {
 const FALLBACK = 'welcome.fallback';
 const STEP3 = 'welcome.step3.body';

   // The manual-fallback wording must describe the manual path honestly and must
   // never claim automatic / native pose support. These phrases are the ones
   // that would over-promise while M3-1 remains NO-GO.
 const FORBIDDEN = [/native/i, /automatic pose/i, /\bml\b/i, /pose detection/i];

 it('every locale ships a non-blank manual-fallback string', () => {
   for (const locale of LOCALES) {
     const value = CATALOG[locale][FALLBACK];
     expect(typeof value).toBe('string');
     expect(value.length).toBeGreaterThan(0);
     }
   });

 it('no locale promises native / ML pose support in the fallback copy', () => {
   for (const locale of LOCALES) {
     const value = CATALOG[locale][FALLBACK] ?? '';
     for (const forbidden of FORBIDDEN) {
       expect(forbidden.test(value)).toBe(false);
       }
     }
   });

 it('the fallback copy is honest: it concedes automatic may be unavailable', () => {
   const en = CATALOG.en[FALLBACK];
   expect(en).toMatch(/may be unavailable/i);
  });

 it('the fallback copy names the manual adjustment (move/scale/rotate)', () => {
   const en = CATALOG.en[FALLBACK];
   expect(en).toMatch(/move/i);
   expect(en).toMatch(/scale/i);
   expect(en).toMatch(/rotate/i);
  });

 it('the step-3 copy references adjusting / the manual path', () => {
   const en = CATALOG.en[STEP3];
   expect(en).toMatch(/(manually|by hand|adjust|position)/i);
  });

 it('every locale ships non-blank welcome title, subtitle, and four steps', () => {
   for (const locale of LOCALES) {
     expect(CATALOG[locale]['welcome.title']?.length).toBeGreaterThan(0);
     expect(CATALOG[locale]['welcome.subtitle']?.length).toBeGreaterThan(0);
     expect(CATALOG[locale]['welcome.step1.title']?.length).toBeGreaterThan(0);
     expect(CATALOG[locale]['welcome.step2.title']?.length).toBeGreaterThan(0);
     expect(CATALOG[locale]['welcome.step3.title']?.length).toBeGreaterThan(0);
     expect(CATALOG[locale]['welcome.step4.title']?.length).toBeGreaterThan(0);
     expect(CATALOG[locale]['welcome.continue']?.length).toBeGreaterThan(0);
     expect(CATALOG[locale]['welcome.skip']?.length).toBeGreaterThan(0);
     }
   });
});
