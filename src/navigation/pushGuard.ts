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
