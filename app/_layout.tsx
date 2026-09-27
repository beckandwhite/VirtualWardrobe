import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { initStore } from '@/store';
import { runCatalogIngest } from '@/catalog';
import { I18nProvider } from '@/i18n/useI18n';

export default function RootLayout() {
  useEffect(() => {
       // Boot path (single ingestion point, not per-screen mount — M1-4 / D19.6):
       // bring the schema to current, then idempotently ingest the bundled catalog.
       // runCatalogIngest gates on CATALOG_VERSION, so re-launches are a no-op.
     initStore()
       .then(runCatalogIngest)
       .catch((e) => console.error('store init / catalog ingest failed', e));
   }, []);

return (
      <I18nProvider>
         <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(tabs)" />
             {/* M7-1 retired the M0-4 `onboarding` camera flow: the Me tab is now
                 the sole body-capture surface, so that route is gone.
                 Flat modals (D19.4): full-screen, reached by push/replace.
                 welcome + studio now live inside the (tabs) group as persistent
                 tabs, so they're no longer registered here. */}
             <Stack.Screen name="capture" options={{ presentation: 'modal' }} />
             <Stack.Screen name="item" options={{ presentation: 'modal' }} />
          </Stack>
      </I18nProvider>
   );
}
