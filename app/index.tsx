import { Redirect } from 'expo-router';
import { Text, View, ActivityIndicator } from 'react-native';
import { useOnboarding } from '@/store/onboarding';

export default function Index() {
   const onboarded = useOnboarding();

   if (onboarded === null) {
      return (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
             <ActivityIndicator />
             <Text style={{ marginTop: 12 }}>Loading your wardrobe…</Text>
            </View>
      );
   }

   if (!onboarded) {
      return <Redirect href="/onboarding" />;
   }

   return <Redirect href="/wardrobe" />;
}
