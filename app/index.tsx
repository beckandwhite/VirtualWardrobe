import { Redirect } from 'expo-router';
import { Text, View, ActivityIndicator } from 'react-native';
import { useOnboarding, useSeenWelcome } from '@/store/onboarding';
import { welcomeGate } from '@/onboarding/welcomeGate';
import { useI18n } from '@/i18n/useI18n';

export default function Index() {
  const onboarded = useOnboarding();
  const seenWelcome = useSeenWelcome();
  const { t } = useI18n();
   // The routing decision is a pure function of the two resolved flags
   // (src/onboarding/welcomeGate.ts) so M3-16/M4-2 assert every branch without a
   // router; this screen is the thin view that renders its result. The welcome
   // gate supersedes entryRedirect: it adds the first-run orientation step while
   // keeping the loading/onboarding/wardrobe behavior unchanged (D44.1).
  const route = welcomeGate(onboarded, seenWelcome);

  if (route === 'loading') {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
        <Text style={{ marginTop: 12 }}>{t('index.loading')}</Text>
      </View>
    );
  }

  return <Redirect href={route} />;
}
