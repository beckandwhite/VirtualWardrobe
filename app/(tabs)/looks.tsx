import {
  Image,
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  type ImageSourcePropType,
} from 'react-native';
import { useState, useCallback, useEffect } from 'react';
import { router } from 'expo-router';
import { r, type TryOn } from '@/store';
import { deleteLook, shareLook } from '@/composer/share';
import { useI18n } from '@/i18n/useI18n';
import sampleBody from '../../assets/sample/body.png';

export default function LooksScreen() {
  const { t } = useI18n();
  const [looks, setLooks] = useState<TryOn[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLooks(await r.listTryOns());
    setLoading(false);
  }, []);

  useEffect(() => {
    load().catch((e) => console.error('looks load', e));
  }, [load]);

  const remove = useCallback(
    async (id: number) => {
      await deleteLook(id);
      load();
    },
    [load],
  );

  // Re-share a stored look through the M3-2 unified share sheet — the same
  // function the studio calls, so sharing behaves identically everywhere.
  const reShare = useCallback(
    async (look: TryOn) => {
      const result = await shareLook(look);
      if (result.kind === 'error')
        setNotice(t('looks.shareFailed', { error: result.error }));
      else setNotice(t('looks.shared'));
    },
    [t],
  );

  // Reopen a look into the studio editor, deep-linking its item so the
  // studio restores the body + garment. The stored transform is re-applied
  // from the row on studio mount (M2-2 / M3-2 reconstruct).
  const reopen = useCallback((look: TryOn) => {
    router.push(`/studio?id=${look.itemId}`);
  }, []);

  return (
    <View style={styles.screen}>
      <Text style={styles.header}>{t('looks.header')}</Text>
      {notice ? <Text style={styles.notice}>{notice}</Text> : null}

      {!looks.length && !loading ? (
        <Text style={styles.empty}>{t('looks.empty')}</Text>
      ) : null}

      {loading && !looks.length ? (
        <Text style={styles.empty}>{t('common.loading')}</Text>
      ) : null}

      {looks.length > 0 ? (
        <View style={styles.grid}>
          {looks.map((look) => (
            <TouchableOpacity
              key={look.id}
              style={styles.card}
              activeOpacity={0.8}
              onPress={() => reopen(look)}
            >
              <Image
                source={
                  (look.outputPath
                    ? { uri: look.outputPath }
                    : sampleBody) as ImageSourcePropType
                }
                style={styles.thumb}
                resizeMode="cover"
                fadeDuration={0}
              />
              <Text style={styles.caption} numberOfLines={1}>
                {t('looks.caption', {
                  id: look.id,
                  date: look.createdAt.slice(0, 10),
                })}
              </Text>
              <View style={styles.cardActions}>
                <TouchableOpacity
                  style={styles.chip}
                  activeOpacity={0.8}
                  onPress={() => reShare(look)}
                >
                  <Text style={styles.chipText}>{t('common.share')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.chip}
                  activeOpacity={0.8}
                  onPress={() => remove(look.id)}
                >
                  <Text style={[styles.chipText, styles.chipDanger]}>
                    {t('common.delete')}
                  </Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 16, backgroundColor: '#fff' },
  header: { fontSize: 24, fontWeight: '800', marginBottom: 12 },
  notice: { color: '#238636', fontSize: 13, marginBottom: 8 },
  empty: { color: '#888', marginTop: 40, textAlign: 'center' },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  card: {
    width: '46%',
    backgroundColor: '#f6f8fa',
    borderRadius: 12,
    padding: 8,
    paddingBottom: 6,
  },
  thumb: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    backgroundColor: '#eee',
  },
  caption: {
    fontSize: 12,
    color: '#57606a',
    marginTop: 6,
    marginBottom: 4,
  },
  cardActions: { flexDirection: 'row', gap: 8 },
  chip: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#eaecef',
    alignItems: 'center',
  },
  chipText: { fontSize: 12, color: '#24292f', fontWeight: '600' },
  chipDanger: { color: '#cf222e' },
});
