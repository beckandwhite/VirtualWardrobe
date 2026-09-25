import { useEffect, useState } from 'react';
import { initStore } from './db';
import { r } from './repo';

// Read a boolean app setting out of the store as `boolean | null`: `null` while
// the store resolves (a loading state), then the raw value coerced. A read
// failure degrades to `false` so a setting that can't be read never wedges a user
// behind a gate.
function useBoolSetting(key: string, onError: string): boolean | null {
  const [value, setValue] = useState<boolean | null>(null);

  useEffect(() => {
     let alive = true;
    (async () => {
    try {
       await initStore();
       const raw = await r.getSetting(key);
       if (alive) setValue(raw === '1');
         } catch (e) {
         console.error(onError, e);
         if (alive) setValue(false);
         }
    })();
     return () => {
       alive = false;
         };
     }, [key, onError]);

  return value;
}

export function useOnboarding(): boolean | null {
  return useBoolSetting('has_onboarded', 'useOnboarding failed');
}

// M3-16 first-run orientation flag, kept separate from onboarding so the welcome
// is seen at most once even if the M0-4 flow is bypassed (D44.1).
export function useSeenWelcome(): boolean | null {
  return useBoolSetting('has_seen_welcome', 'useSeenWelcome failed');
}
