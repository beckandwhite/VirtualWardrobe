import { useCallback, useEffect, useRef } from 'react';
import { router, type Href } from 'expo-router';
import { shouldNavigate, type NavState } from './pushGuard';

// M3-17 (#47) guarded push hook. Screens call the returned function instead of
// `router.push` so a double-tap / duplicate handler fire on the same target within
// the debounce window is dropped (no duplicate stack entry). The decision itself is
// the pure `shouldNavigate` (pushGuard.ts); this is the thin router-bound wrapper.
//
// M4-5 (#48): the hook also tracks mount lifecycle. A navigation resolved after the
// originating screen unmounted is the deterministic invalid-state condition behind
// the reported `InvalidStateError` — every async call site fires `router.replace`/
// `router.back` after an `await`, so a slow completion lands on a dead screen. The
// mount flag flips off on unmount, so a post-unmount navigation is dropped instead
// of transitioning the router in an invalid state.
export function useGuardedPush(): (href: Href) => void {
  const state = useRef<NavState>({ mounted: false, last: { target: null, at: 0 } });
  // Live-mount tracking: on while the hook is mounted, off on unmount, so a
  // navigation that resolves after the screen is gone is suppressed (#48). The
  // NavState object identity is stable (the ref is never reassigned), so capture
  // it once for the cleanup to mutate the mount flag of the same object.
  useEffect(() => {
    const nav = state.current;
    nav.mounted = true;
    return () => {
      nav.mounted = false;
      };
    }, []);
  return useCallback((href: Href) => {
    const target = String(href);
    const now = Date.now();
    if (!shouldNavigate(state.current, target, now)) return;
    state.current.last = { target, at: now };
    router.push(href);
   }, []);
 }
