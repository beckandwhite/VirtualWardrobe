import { entryRedirect, type EntryRoute } from '../../src/onboarding/entryRedirect';

// Entry-screen routing decision (app/index.tsx) extracted into a pure function so
// the three branches are assertable without expo-router — M4-2 AC1 (screen
// transitions at the route level) + AC3 (a flow verified without a device).

describe('entryRedirect', () => {
   it('shows a loading state while the onboarding flag is unresolved (null)', () => {
      expect(entryRedirect(null)).toBe('loading');
      expect(entryRedirect(null)).not.toBe('/onboarding');
      expect(entryRedirect(null)).not.toBe('/wardrobe');
    });

   it('redirects to onboarding when the user is not yet onboarded', () => {
      expect(entryRedirect(false)).toBe('/onboarding');
    });

   it('redirects to the wardrobe when the user is onboarded', () => {
      expect(entryRedirect(true)).toBe('/wardrobe');
    });

   it('covers exactly the three route outcomes the entry screen renders', () => {
      const routes: EntryRoute[] = ['loading', '/onboarding', '/wardrobe'];
      expect([entryRedirect(null), entryRedirect(false), entryRedirect(true)]).toEqual(routes);
    });
});
