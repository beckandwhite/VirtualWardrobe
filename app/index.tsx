import { Redirect } from 'expo-router';
import { Text, View, ActivityIndicator } from 'react-native';
import { useSeenWelcome, usePersonPhotoPresence } from '@/store/onboarding';
import { welcomeGate } from '@/onboarding/welcomeGate';
import { useI18n } from '@/i18n/useI18n';

export default function Index() {
  const seenWelcome = useSeenWelcome();
  const hasPhoto = usePersonPhotoPresence();
  const { t } = useI18n();
   // The routing decision is a pure function of the two resolved inputs
   // (src/onboarding/welcomeGate.ts) so M3-16/M7-1 assert every branch without a
   // router; this screen is the thin view that renders its result. M7-1 retires
   // the M0-4 `/onboarding` step: a photoless user is sent to the Me tab for body
   // capture (D44.1), and the welcome still shows at most once.
  const route = welcomeGate(seenWelcome, hasPhoto);

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
