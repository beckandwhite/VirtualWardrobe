import {
 welcomeGate,
 continueWelcomeTransition,
 WELCOME_KEY,
 WELCOME_FLAG,
 type WelcomeRoute,
} from '../../src/onboarding/welcomeGate';
import { CATALOG, LOCALES } from '../../src/i18n/strings';

// M3-16 / M7-1 first-run welcome gate. The routing decision (app/index.tsx) lives
// in src/onboarding/welcomeGate.ts as a pure function of `has_seen_welcome` and
// `person_photo_uri` presence, so every branch is assertable without a router or a
// store (mirrors entryRedirect.test.ts / D29.2). M7-1 retired the M0-4
// `/onboarding` camera flow: a photoless user is routed to the Me tab instead.

describe('welcomeGate', () => {
 it('shows a loading state while either input is unresolved (null)', () => {
   expect(welcomeGate(null, null)).toBe('loading');
   expect(welcomeGate(null, true)).toBe('loading');
   expect(welcomeGate(null, false)).toBe('loading');
   // Welcome seen, but photo-presence still resolving.
   expect(welcomeGate(true, null)).toBe('loading');
  });

 it('shows the welcome only on a truly first launch (welcome not seen)', () => {
   expect(welcomeGate(false, false)).toBe('/welcome');
   expect(welcomeGate(false, true)).toBe('/welcome');
   // A first launch never depends on photo-presence — the welcome comes first.
   expect(welcomeGate(false, null)).toBe('/welcome');
  });

 it('routes a seen-welcome user with no body photo to the Me tab for capture', () => {
   expect(welcomeGate(true, false)).toBe('/me');
  });

 it('routes a seen-welcome user with a body photo straight to the wardrobe', () => {
   expect(welcomeGate(true, true)).toBe('/wardrobe');
  });

 it('never re-shows the welcome once it has been seen', () => {
     // A returning user (welcome seen) is not interrupted, regardless of photo.
   expect(welcomeGate(true, false)).not.toBe('/welcome');
   expect(welcomeGate(true, true)).not.toBe('/welcome');
  });

 it('covers exactly the four route outcomes the entry screen renders', () => {
   const routes: WelcomeRoute[] = [
     welcomeGate(null, null),
     welcomeGate(false, false),
     welcomeGate(true, false),
     welcomeGate(true, true),
    ];
   expect(routes).toEqual(['loading', '/welcome', '/me', '/wardrobe']);
  });
});

describe('continueWelcomeTransition (single Continue action)', () => {
 it('persists has_seen_welcome = "1" and routes on photo-presence', () => {
     // M7-1: the Skip button is gone; the single Continue action persists the
     // seen flag and routes by photo-presence — no photo → the Me tab (D44.1).
   expect(continueWelcomeTransition(false)).toEqual({
     key: WELCOME_KEY,
     value: WELCOME_FLAG,
     route: '/me',
     });
   expect(continueWelcomeTransition(true)).toEqual({
     key: WELCOME_KEY,
     value: WELCOME_FLAG,
     route: '/wardrobe',
     });
  });

 it('targets the Me tab when no photo is set, else the wardrobe', () => {
   expect(continueWelcomeTransition(false).route).toBe('/me');
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
     }
   });
});
