import {
  Text,
  View,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from 'react-native';
import { useCallback, useState } from 'react';
import * as Linking from 'expo-linking';
import { r } from '@/store';
import { PERSON_PHOTO_KEY, usePersonPhoto } from '@/store/onboarding';
import { useCapture } from '@/capture/useCapture';
import { useI18n } from '@/i18n/useI18n';
import LanguageSwitcher from '@/i18n/LanguageSwitcher';

const REPO = 'https://github.com/beckandwhite/VirtualWardrobe';

// The four About & feedback actions (D61). Each opens a canonical GitHub page in
// the platform's external browser via expo-linking. `testId` becomes a web
// `data-testid` and `href` a web `<a href>`, so the e2e harness can assert the
// section's destinations without clicking (a click on web makes expo's Linking
// openURL navigate the page to the href); native ignores both DOM-only props.
type FeedbackAction = { testId: string; href: string; labelKey: string };
const FEEDBACK_ACTIONS: readonly FeedbackAction[] = [
  { testId: 'me.link.about', href: `${REPO}`, labelKey: 'me.feedback.about' },
  { testId: 'me.link.bug', href: `${REPO}/issues/new?template=bug_report.md`, labelKey: 'me.feedback.bug' },
  {
    testId: 'me.link.feature',
    href: `${REPO}/issues/new?template=feature_request.md`,
    labelKey: 'me.feedback.feature',
  },
  { testId: 'me.link.guide', href: `${REPO}/blob/main/docs/usage.md`, labelKey: 'me.feedback.guide' },
] as const;

// The "Me" profile + settings tab. It owns the user's body photo — a single
// persisted `person_photo_uri` (app_settings) that the studio reads as the default
// try-on body — and hosts the language switcher. Picking goes through
// useCapture().takePhoto('library') so the file is copied into the docs dir on
// native (a restart-safe path); web keeps the object URL, the same limitation the
// rest of the app already has (M1-1).
export default function MeScreen() {
  const { t } = useI18n();
  const { takePhoto } = useCapture();
  // Bumping this key forces usePersonPhoto to re-read after we persist a new photo,
  // so the preview updates without a remount.
  const [reloadKey, setReloadKey] = useState(0);
  const photo = usePersonPhoto(reloadKey);
  const [busy, setBusy] = useState(false);

  const pickPhoto = useCallback(async () => {
     // No await before takePhoto: on web the library picker must fire inside the
    // gesture or the browser drops the file dialog (see pickImage.web.ts).
    setBusy(true);
    try {
      const result = await takePhoto('library');
      if (!result) return;
      await r.setSetting(PERSON_PHOTO_KEY, result.uri);
      setReloadKey((k) => k + 1);
     } catch (e) {
      console.error('me: set photo failed', e);
     } finally {
      setBusy(false);
     }
   }, [takePhoto]);

  // A failed external open is a visible, localized error (not swallowed) so the
  // user knows the link didn't open; cleared on the next attempt.
  const [linkError, setLinkError] = useState<string | null>(null);
  const openLink = useCallback(async (href: string) => {
    setLinkError(null);
    try {
      if (!(await Linking.canOpenURL(href))) throw new Error(href);
      await Linking.openURL(href);
     } catch (e) {
      setLinkError(t('me.feedback.openFailed'));
      console.error('me: open feedback link failed', e);
     }
    }, [t]);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <StatusBar />
      <View style={styles.card}>
        <Text style={styles.title} accessibilityRole="header">
          {t('me.header')}
        </Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('me.photo.title')}</Text>
          {photo ? (
            <Image
              source={{ uri: photo }}
              style={styles.photo}
              resizeMode="cover"
              accessibilityRole="image"
            />
          ) : (
            <View style={[styles.photo, styles.photoEmpty]}>
              <Text style={styles.photoEmptyText}>{t('me.photo.empty')}</Text>
            </View>
          )}
          <Text style={styles.hint}>{t('me.photo.hint')}</Text>
          <TouchableOpacity
            style={styles.button}
            accessibilityRole="button"
            accessibilityState={{ busy }}
            disabled={busy}
            activeOpacity={0.8}
            onPress={pickPhoto}
          >
            <Text style={styles.buttonText}>
              {photo ? t('me.photo.change') : t('me.photo.set')}
            </Text>
          </TouchableOpacity>
        </View>

          <LanguageSwitcher />

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('me.feedback.title')}</Text>
            <Text style={styles.hint}>{t('me.feedback.hint')}</Text>
              <View style={styles.feedbackList}>
                {FEEDBACK_ACTIONS.map((action) => (
                  // `testID` -> `data-testid` and `href` -> an `<a>` on web, so the
                  // e2e harness can locate each action and read its destination URL
                  // without clicking (a click on web makes expo's Linking openURL
                  // navigate the page away from /me). Native ignores `testID`/`href`;
                  // `onPress` runs the real external-browser open via expo-linking.
                   <TouchableOpacity
                  key={action.testId}
                  accessibilityRole="link"
                  accessibilityLabel={t(action.labelKey)}
                  activeOpacity={0.8}
                  onPress={() => openLink(action.href)}
                   >
                      <View
                       testID={action.testId}
                       // `href` isn't a typed RN prop (web-only, renders an <a>);
                       // spread it via a cast so a non-existent DOM prop doesn't
                       // trip excess-property checks while staying native-inert.
                       {...({ href: action.href } as Record<string, string>)}
                       style={styles.feedbackLink}
                      >
                      <Text style={styles.feedbackText}>{t(action.labelKey)}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
              {linkError ? (
                <Text style={styles.linkError}>{linkError}</Text>
              ) : null}
          </View>
        </View>
      </ScrollView>
    );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 24, flexGrow: 1 },
  card: { gap: 16, width: '100%', maxWidth: 480, alignSelf: 'center' },
  title: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  section: { marginTop: 8, gap: 10 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase' as 'uppercase',
    letterSpacing: 1,
    color: '#888',
  },
  photo: {
    width: '100%',
    aspectRatio: 3 / 4,
    borderRadius: 14,
    backgroundColor: '#f2f2f2',
  },
  photoEmpty: { alignItems: 'center', justifyContent: 'center' },
  photoEmptyText: { color: '#888', fontSize: 14 },
  hint: { fontSize: 12, color: '#888', lineHeight: 18 },
  button: {
    backgroundColor: '#111',
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
   buttonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
   feedbackList: { gap: 8 },
   feedbackLink: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#f2f2f2',
    },
   feedbackText: { fontSize: 15, fontWeight: '600', color: '#111' },
   linkError: { color: '#cf222e', fontSize: 13, lineHeight: 18 },
});
