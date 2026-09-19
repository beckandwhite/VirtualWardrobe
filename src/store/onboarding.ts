import { useEffect, useState } from 'react';
import { initStore } from './db';
import { r } from './repo';

export function useOnboarding(): boolean | null {
   const [onboarded, setOnboarded] = useState<boolean | null>(null);

   useEffect(() => {
      let alive = true;
   (async () => {
     try {
        await initStore();
        const raw = await r.getSetting('has_onboarded');
        if (alive) setOnboarded(raw === '1');
        } catch (e) {
          console.error('useOnboarding failed', e);
          if (alive) setOnboarded(false);
        }
    })();
      return () => {
        alive = false;
        };
    }, []);

   return onboarded;
}
