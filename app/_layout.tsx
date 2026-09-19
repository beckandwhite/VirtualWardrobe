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
             <Stack.Screen name="(tabs)" />
             {/* Flat modals (D19.4): full-screen, reached by push/replace. */}
             <Stack.Screen name="capture" options={{ presentation: 'modal' }} />
           <Stack.Screen name="studio" options={{ presentation: 'modal' }} />
        </Stack>
    );
}
