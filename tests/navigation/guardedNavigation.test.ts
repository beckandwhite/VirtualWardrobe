import {
  shouldNavigate,
  DOUBLE_PUSH_WINDOW_MS,
  type NavState,
} from '../../src/navigation/pushGuard';

// M4-5 (#48) regression coverage for the expo-router InvalidStateError.
//
// The reported crash (`Uncaught Error InvalidStateError: The object is in an
// invalid state`, stack into the router bundle) ships with no repro steps and is
// NOT reproducible in the node jest env (there is no router/worklets bridge here,
// and `npm run e2e:web` is a happy path that stays green). The concrete,
// deterministic invalid-state condition we CAN model at the decision layer is a
// navigation issued after the originating screen has already unmounted: every
// async call site (`welcome.advance`, `capture.finalize`, `item.leave`,
// `catalog.addToWardrobe/tryOn`) issues a `router.replace`/`router.back` *after an
// `await`* with no unmount guard, so a slow async completion — or a transition that
// overlaps another — fires on a dead screen. That dead-screen navigation is the
// classic InvalidStateError trigger.
//
// `shouldNavigate` is the pure decision the router-bound `useGuardedPush` now wires
// in: it drops any navigation off a screen that is no longer mounted, while
// composing the existing same-target time-dedup (`shouldPush`). Per #48 the
// duplicate/overlapping theory stays a hypothesis, so this adds ONLY the unmount
// guard — no new debounce — and preserves the deep-link back()/replace() exit while
// the screen is mounted.

const fresh = { mounted: true, last: { target: null, at: 0 } };

describe('shouldNavigate (#48 unmount guard)', () => {
  it('allows the first navigation of a mounted screen', () => {
    expect(shouldNavigate(fresh, '/wardrobe', 1000)).toBe(true);
  });

  it('drops a navigation issued after the screen unmounted — the invalid-state trigger', () => {
    const gone = { mounted: false, last: fresh.last } as NavState;
    expect(shouldNavigate(gone, '/wardrobe', 1000)).toBe(false);
    expect(shouldNavigate(gone, '/studio?id=1', 1000)).toBe(false);
  });

  it('drops any target once unmounted, regardless of window (the guard is target-independent)', () => {
    const gone = { mounted: false, last: { target: '/capture', at: 1000 } } as NavState;
    expect(shouldNavigate(gone, '/studio', 1000)).toBe(false);
    expect(
       shouldNavigate(gone, '/item?id=9', 1000 + DOUBLE_PUSH_WINDOW_MS + 1),
      ).toBe(false);
    expect(shouldNavigate(gone, '/item?id=9', 1000, 0)).toBe(false);
   });

  it('preserves the same-target dedup while mounted (neighboring behavior, #47)', () => {
    const prev = { mounted: true, last: { target: '/studio?id=1', at: 1000 } } as NavState;
    expect(shouldNavigate(prev, '/studio?id=1', 1000 + 100)).toBe(false);
    expect(shouldNavigate(prev, '/studio?id=1', 1000 + DOUBLE_PUSH_WINDOW_MS)).toBe(true);
   });

  it('allows a distinct target back-to-back while mounted (valid navigation)', () => {
    const prev = { mounted: true, last: { target: '/studio?id=1', at: 1000 } } as NavState;
    expect(shouldNavigate(prev, '/studio?id=2', 1000 + 1)).toBe(true);
    expect(shouldNavigate(prev, '/captures', 1000 + 1)).toBe(true);
   });

  it('keeps a deep-link exit allowed while mounted (back()/replace() both proceed)', () => {
    expect(shouldNavigate(fresh, '/wardrobe', 5000)).toBe(true);
    expect(shouldNavigate(fresh, '/studio', 5000)).toBe(true);
   });
});
