import { Redirect } from 'expo-router';
import { Text, View, ActivityIndicator } from 'react-native';
import { useOnboarding } from '@/store/onboarding';
import { entryRedirect } from '@/onboarding/entryRedirect';

export default function Index() {
   const onboarded = useOnboarding();
   // The routing decision is a pure function of the resolved flag
   // (src/onboarding/entryRedirect.ts) so M4-2 asserts all three branches without
   // a router; this screen is the thin view that renders its result.
   const route = entryRedirect(onboarded);

   if (route === 'loading') {
      return (
           <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
             <ActivityIndicator />
             <Text style={{ marginTop: 12 }}>Loading your wardrobe…</Text>
            </View>
        );
    }

   return <Redirect href={route} />;
}
