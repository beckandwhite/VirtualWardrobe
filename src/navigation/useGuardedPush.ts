import { useCallback, useRef } from 'react';
import { router, type Href } from 'expo-router';
import { shouldPush, type PushRecord } from './pushGuard';

// M3-17 (#47) guarded push hook. Screens call the returned function instead of
// `router.push` so a double-tap / duplicate handler fire on the same target within
// the debounce window is dropped (no duplicate stack entry). The decision itself is
// the pure `shouldPush` (pushGuard.ts); this is the thin router-bound wrapper.
export function useGuardedPush(): (href: Href) => void {
  const last = useRef<PushRecord>({ target: null, at: 0 });
  return useCallback((href: Href) => {
    const target = String(href);
    const now = Date.now();
    if (!shouldPush(last.current, target, now)) return;
    last.current = { target, at: now };
    router.push(href);
  }, []);
}
