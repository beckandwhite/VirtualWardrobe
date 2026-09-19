import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { initStore } from '@/store';

export default function RootLayout() {
    useEffect(() => {
        initStore().catch((e) => console.error('store init failed', e));
    }, []);

    return (
       <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="onboarding" />
          <Stack.Screen name="wardrobe" />
            <Stack.Screen name="catalog" />
            <Stack.Screen name="looks" />
            <Stack.Screen name="studio" options={{ presentation: 'modal' }} />
       </Stack>
   );
}
