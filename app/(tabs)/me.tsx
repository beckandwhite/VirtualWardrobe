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
import { r } from '@/store';
import { PERSON_PHOTO_KEY, usePersonPhoto } from '@/store/onboarding';
import { useCapture } from '@/capture/useCapture';
import { useI18n } from '@/i18n/useI18n';
import LanguageSwitcher from '@/i18n/LanguageSwitcher';

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
});
