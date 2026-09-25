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

// The user's body photo, persisted in the generic `app_settings` table and reused
// as the default try-on body in the studio. A plain string setting (not a boolean),
// so it has its own small read hook rather than reusing useBoolSetting.
export const PERSON_PHOTO_KEY = 'person_photo_uri';

// Read the persisted person photo as `string | null`: `null` while the store
// resolves or when unset. `reloadKey` lets a writer (the Me screen) force a re-read
// after it persists a new photo, so the displayed image updates without a remount.
export function usePersonPhoto(reloadKey = 0): string | null {
  const [uri, setUri] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        await initStore();
        const raw = await r.getSetting(PERSON_PHOTO_KEY);
        if (alive) setUri(raw ?? null);
      } catch (e) {
        console.error('usePersonPhoto failed', e);
        if (alive) setUri(null);
      }
    })();
    return () => {
      alive = false;
    };
  }, [reloadKey]);

  return uri;
}
