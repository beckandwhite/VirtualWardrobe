import {
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from 'react-native';
import { router } from 'expo-router';
import { type Href } from 'expo-router';
import { useCallback, useState } from 'react';
import { r } from '@/store';
import { useOnboarding } from '@/store/onboarding';
import { continueWelcomeTransition } from '@/onboarding/welcomeGate';
import { useI18n } from '@/i18n/useI18n';
import LanguageSwitcher from '@/i18n/LanguageSwitcher';

// M3-16 first-run orientation. A single, non-blocking screen that tells a new
// user what the app is, the four-step workflow, and the honest manual fallback.
// The route decision (whether to show it) lives in src/onboarding/welcomeGate.ts;
// this screen only renders its body and the continue/skip continuation.
//
// The continuation persists `has_seen_welcome = '1'` (so the welcome shows at
// most once, D44.1) then replaces into the next journey step — the M0-4 camera
// onboarding for a not-yet-onboarded user, else the wardrobe. Continue and Skip
// resolve to the same next step (the welcome is one screen); they differ only in
// emphasis. The transition is asserted without a router via
// continueWelcomeTransition (src/onboarding/welcomeGate.ts).
const STEP_KEYS = [
   'welcome.step1.title',
   'welcome.step2.title',
   'welcome.step3.title',
   'welcome.step4.title',
] as const;

export default function WelcomeScreen() {
  const { t } = useI18n();
  const onboarded = useOnboarding();
  const [busy, setBusy] = useState(false);

   // Continue / Skip both persist the seen flag and advance. The destination is a
   // pure function of the resolved onboarding flag, so the route is deterministic.
  const advance = useCallback(async () => {
    setBusy(true);
    const transition = continueWelcomeTransition(onboarded === true);
    await r.setSeenWelcome();
     // The transition's route is a string from the pure module; the typed router
     // narrows `Href`. The two destinations are registered flat screens, so this
     // cast is safe and keeps the module router-free.
    router.replace(transition.route as Href);
   }, [onboarded]);

  return (
     <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <StatusBar />
      <View style={styles.card}>
        <Text style={styles.title} accessibilityRole="header">
          {t('welcome.title')}
        </Text>
        <Text style={styles.subtitle}>{t('welcome.subtitle')}</Text>

        <View style={styles.steps}>
          <Text style={styles.stepsHeading} accessibilityRole="header">
            {t('welcome.steps.heading')}
          </Text>
          {STEP_KEYS.map((titleKey, i) => {
            const bodyKey = `welcome.step${i + 1}.body`;
            return (
                <View key={titleKey} style={styles.step}>
                 <View style={styles.numberBadge}>
                   <Text style={styles.number}>{i + 1}</Text>
                 </View>
                 <View style={styles.stepCopy}>
                   <Text style={styles.stepTitle}>{t(titleKey)}</Text>
                   <Text style={styles.stepBody}>{t(bodyKey)}</Text>
                 </View>
               </View>
             );
           })}
        </View>

        <View style={styles.fallback}>
          <Text style={styles.fallbackText}>{t('welcome.fallback')}</Text>
        </View>

        <LanguageSwitcher />

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.primaryButton}
            accessibilityRole="button"
            accessibilityState={{ busy }}
            disabled={busy}
            activeOpacity={0.8}
            onPress={advance}
          >
            <Text style={styles.primaryText}>{t('welcome.continue')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.skipButton}
            accessibilityRole="button"
            accessibilityState={{ busy }}
            disabled={busy}
            activeOpacity={0.8}
            onPress={advance}
          >
            <Text style={styles.skipText}>{t('welcome.skip')}</Text>
          </TouchableOpacity>
        </View>
      </View>
     </ScrollView>
   );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#fff',
   },
   // Centered, padded, and capped so the orientation stays readable on a wide
   // web viewport as well as a narrow phone.
  content: {
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
    flexGrow: 1,
   },
  card: {
    gap: 16,
    width: '100%',
    maxWidth: 480,
   },
  title: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
   },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: '#4a4a4a',
   },
  steps: {
    gap: 12,
    marginTop: 8,
   },
  stepsHeading: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase' as 'uppercase',
    letterSpacing: 1,
    color: '#888',
   },
  step: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
   },
  numberBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#111',
    alignItems: 'center',
    justifyContent: 'center',
   },
  number: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
   },
  stepCopy: {
    flex: 1,
    gap: 2,
   },
  stepTitle: {
    fontSize: 15,
    fontWeight: '700',
   },
  stepBody: {
    fontSize: 13,
    lineHeight: 19,
    color: '#666',
   },
  fallback: {
    backgroundColor: '#f6f8fa',
    borderRadius: 12,
    padding: 14,
   },
  fallbackText: {
    fontSize: 13,
    lineHeight: 19,
    color: '#444',
   },
  footer: {
    gap: 10,
    marginTop: 8,
   },
  primaryButton: {
    backgroundColor: '#111',
    paddingVertical: 16,
    paddingHorizontal: 28,
    borderRadius: 14,
    alignItems: 'center',
   },
  primaryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
   },
  skipButton: {
    paddingVertical: 10,
    alignItems: 'center',
   },
  skipText: {
    fontSize: 14,
    color: '#888',
    fontWeight: '600',
   },
});
