import {
  Text,
  View,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import {
  useCapture,
  processCaptureImage,
  resolveReviewChoice,
  discardImage,
  type CaptureSource,
  type CaptureResult,
  type CutoutReview,
  type ReviewChoice,
} from '@/capture';
import { FilePickerButton } from '@/capture/FilePickerButton';
import { r } from '@/store';
import { useI18n } from '@/i18n/useI18n';
import {
  buildDraftFromCapture,
  captureNextStep,
  DRAFT_HINTS,
} from '@/capture/draft';

// M1-1 capture screen: a garment-type hint chip row + Photo/Camera actions.
// A capture produces an `Item` draft (D19.5: type 'other' + default color) that
// M1-2 will type in full; here the user gets the image in with minimal friction.
//
// #64: after a photo is taken, background removal runs on-device automatically,
// then a review step shows the cutout. The user keeps the cutout or reverts to
// the original (or re-runs); whichever they don't keep is destroyed (D57.1). On
// passthrough (unsupported platform / no subject) the review shows the original
// and only offers "keep" + "try again".

const HINTS = DRAFT_HINTS;

type Review = CutoutReview & { source: CaptureSource };

export default function CaptureScreen() {
  const { cameraAvailable, takePhoto } = useCapture();
  const { t } = useI18n();
  const [busy, setBusy] = useState(false);
  const [hint, setHint] = useState('');
  const [review, setReview] = useState<Review | null>(null);
  const [processing, setProcessing] = useState(false);

  // Run on-device background removal on a raw capture and enter the review step.
  const enterReview = async (rawUri: string, source: CaptureSource) => {
    const res = await processCaptureImage(rawUri);
    setReview({ rawUri, cutoutUri: res.uri, removed: res.removed, source });
  };

  const captureAndSave = async (source: CaptureSource) => {
    setBusy(true);
    try {
      const result = await takePhoto(source);
      // Nothing captured (cancel / denial / error): no review, no insert, no nav.
      if (result) await enterReview(result.uri, source);
    } catch (e) {
      console.error('capture failed', e);
    } finally {
      setBusy(false);
    }
  };

  // Web-only path: FilePickerButton gives us a blob URI directly.
  const captureFromUri = async (uri: string) => {
    setBusy(true);
    try {
      await enterReview(uri, 'library');
    } catch (e) {
      console.error('capture failed', e);
    } finally {
      setBusy(false);
    }
  };

  // Commit the review: keep one image, destroy the other (D57.1), build the
  // draft, insert, and navigate — the original M1-1 save behavior.
  const finalize = async (choice: ReviewChoice) => {
    if (!review) return;
    const { keptUri, discardUri } = resolveReviewChoice(review, choice);
    if (discardUri) discardImage(discardUri);
    const result: CaptureResult = { uri: keptUri, source: review.source };
    const draft = buildDraftFromCapture(result, hint);
    setReview(null);
    if (!draft) return;
    try {
      await r.insertItem(draft);
      const next = captureNextStep(draft);
      if (next.navigate) await router.replace(next.route);
    } catch (e) {
      console.error('capture save failed', e);
    }
  };

  // Re-run removal on the untouched original; drop the previous cutout so a
  // rejected attempt never orphans a file.
  const retry = async () => {
    if (!review || processing) return;
    setProcessing(true);
    try {
      const res = await processCaptureImage(review.rawUri);
      if (
        review.removed &&
        review.cutoutUri !== review.rawUri &&
        review.cutoutUri !== res.uri
      ) {
        discardImage(review.cutoutUri);
      }
      setReview({ ...review, cutoutUri: res.uri, removed: res.removed });
    } finally {
      setProcessing(false);
    }
  };

  if (review) {
    return (
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <Text style={styles.title}>{t('capture.title')}</Text>
        <Text style={styles.status}>
          {processing
            ? t('capture.bg.processing')
            : review.removed
              ? t('capture.bg.removed')
              : t('capture.bg.failed')}
        </Text>

        <View style={styles.preview}>
          <Image
            source={{ uri: review.cutoutUri }}
            style={styles.previewImage}
            resizeMode="contain"
          />
        </View>

        <View style={styles.actions}>
          {review.removed ? (
            <TouchableOpacity
              style={styles.action}
              activeOpacity={0.8}
              disabled={processing}
              onPress={() => finalize('cutout')}
            >
              <Text style={styles.actionText}>{t('capture.bg.useCutout')}</Text>
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity
            style={[styles.action, styles.actionSecondary]}
            activeOpacity={0.8}
            disabled={processing}
            onPress={() => finalize('original')}
          >
            <Text style={styles.actionSecondaryText}>
              {t('capture.bg.keepOriginal')}
            </Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={styles.retry}
          activeOpacity={0.7}
          disabled={processing}
          onPress={retry}
        >
          <Text style={styles.retryText}>{t('capture.bg.retry')}</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{t('capture.title')}</Text>
      <Text style={styles.body}>{t('capture.body')}</Text>

      <Text style={styles.sectionTitle}>{t('capture.hint')}</Text>
      <View style={styles.chips}>
        {HINTS.map((h) => (
          <TouchableOpacity
            key={h}
            style={[styles.chip, h === hint ? styles.chipActive : null]}
            activeOpacity={0.7}
            onPress={() => setHint(h === hint ? '' : h)}
          >
            <Text
              style={[
                styles.chipText,
                h === hint ? styles.chipTextActive : null,
              ]}
            >
              {h}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.actions}>
        {Platform.OS === 'web' ? (
          <FilePickerButton
            style={styles.action}
            labelStyle={styles.actionText}
            disabled={busy}
            onPick={captureFromUri}
          >
            {t('capture.photo')}
          </FilePickerButton>
        ) : (
          <TouchableOpacity
            style={styles.action}
            activeOpacity={0.8}
            disabled={busy}
            onPress={() => captureAndSave('library')}
          >
            <Text style={styles.actionText}>{t('capture.photo')}</Text>
          </TouchableOpacity>
        )}
        {cameraAvailable && Platform.OS !== 'web' ? (
          <TouchableOpacity
            style={styles.action}
            activeOpacity={0.8}
            disabled={busy}
            onPress={() => captureAndSave('camera')}
          >
            <Text style={styles.actionText}>{t('capture.camera')}</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 24, gap: 12 },
  title: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  body: { fontSize: 15, lineHeight: 22, color: '#4a4a4a' },
  status: { fontSize: 15, fontWeight: '600', color: '#4a4a4a' },
  preview: {
    marginTop: 8,
    borderRadius: 14,
    backgroundColor: '#f2f2f2',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  previewImage: { width: '100%', height: '100%' },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase' as 'uppercase',
    letterSpacing: 1,
    color: '#888',
    marginTop: 8,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 18,
    backgroundColor: '#f2f2f2',
  },
  chipActive: { backgroundColor: '#111' },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    textTransform: 'capitalize',
  },
  chipTextActive: { color: '#fff' },
  actions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  action: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: '#111',
    alignItems: 'center',
  },
  actionText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  actionSecondary: { backgroundColor: '#f2f2f2' },
  actionSecondaryText: { color: '#111', fontSize: 16, fontWeight: '700' },
  retry: { paddingVertical: 12, alignItems: 'center' },
  retryText: { color: '#4a4a4a', fontSize: 15, fontWeight: '600' },
});
