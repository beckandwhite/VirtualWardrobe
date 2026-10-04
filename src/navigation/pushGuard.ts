// M3-17 (#47) double-push guard — the pure decision only, kept runtime-free so it
// unit-tests in the node jest env. The stateful hook that wires it to expo-router
// lives in useGuardedPush.ts (which imports react + the router and is never pulled
// into a test).
//
// Repeating the SAME navigation target back-to-back — a double-tap on "Try on" /
// "Add", or a re-render firing the same handler twice — must not stack a duplicate
// screen. `shouldPush` says whether a push to `target` should proceed given the
// previous push and the current time.

export const DOUBLE_PUSH_WINDOW_MS = 700;

export interface PushRecord {
  // The last target pushed (`String(href)`), or null before the first push.
  target: string | null;
  // When that push happened (ms epoch).
  at: number;
}

export function shouldPush(
  prev: PushRecord,
  target: string,
  now: number,
  windowMs: number = DOUBLE_PUSH_WINDOW_MS,
): boolean {
   // Suppress only an identical target repeated inside the window; a different
   // target, or the same one after the window, always proceeds.
  if (prev.target === target && now - prev.at < windowMs) return false;
  return true;
 }

// M4-5 (#48) the unmount-aware decision the router-bound `useGuardedPush` wires
// in. A navigation issued after the originating screen has unmounted is the
// deterministic invalid-state condition behind the reported `InvalidStateError`:
// every async call site (`welcome.advance`, `capture.finalize`, `item.leave`,
// `catalog.*`) fires `router.replace`/`router.back` *after an `await`* with no
// unmount guard, so a slow completion (or a transition overlapping another) lands
// on a dead screen. The mount check comes before the dedup: an unmounted screen
// must be dropped for *any* target, so the same-target time guard can't resurrect
// a stale transition. While mounted the decision is exactly the #47 dedup, so the
// happy path and the deep-link back()/replace() exit are unchanged.
export interface NavState {
   // Whether the screen that owns this hook is still mounted.
   mounted: boolean;
    // The last push decision, reused by shouldPush.
   last: PushRecord;
}

export function shouldNavigate(
   state: NavState,
   target: string,
   now: number,
   windowMs: number = DOUBLE_PUSH_WINDOW_MS,
): boolean {
   if (!state.mounted) return false;
   return shouldPush(state.last, target, now, windowMs);
}
