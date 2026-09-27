import {
  Image,
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  type ImageSourcePropType,
} from 'react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { router } from 'expo-router';
import { r, type StoreItem } from '@/store';
import { PLACEHOLDER_URIS } from '@/catalog/placeholders';
import { useI18n } from '@/i18n/useI18n';
import { WARDROBE_HREF, studioHref } from '@/navigation/routes';

function resolveSource(item: StoreItem): ImageSourcePropType {
  return { uri: PLACEHOLDER_URIS[item.category] };
}

// Self-contained catalog grid: lists the bundled placeholder store, and lets a
// StoreItem be copied into a real user Item via "add to wardrobe" / "try on".
// M7-2b embeds this beneath the own-clothes section in the Wardrobe tab, so it
// renders as a plain wrap grid — no FlatList / screen wrapper — to compose
// inside the wardrobe's single scroll without nesting virtualized lists.
export default function CatalogSection() {
  const { t } = useI18n();
  const [items, setItems] = useState<StoreItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  // A catalog action copies a StoreItem into a real Item before navigating; this
  // in-flight latch drops a double-tap so we never insert twice / stack two screens
  // (the guarded-push target is a fresh id each time, so a time latch is what fits
  // an async copy-then-navigate — #47 double-push).
  const inFlight = useRef(false);

  const load = useCallback(async () => {
    const list = await r.listStoreItems();
    setItems(list);
    setLoading(false);
  }, []);

  useEffect(() => {
    load().catch((e) => console.error('catalog load', e));
  }, [load]);

  // "Add to wardrobe" copies the catalog entry into a real user Item (distinct
  // id, source 'user', tags ['catalog']) and bounces to the wardrobe tab.
  const addToWardrobe = useCallback(async (entry: StoreItem) => {
    if (inFlight.current) return;
    inFlight.current = true;
    try {
      const inserted = await r.insertItem({
        type: entry.category,
        name: entry.name,
        color: entry.color,
        tags: ['catalog'],
        imagePath: entry.imagePaths[0] ?? '',
      });
      setCopiedId(inserted.id);
      router.replace(WARDROBE_HREF);
    } finally {
      inFlight.current = false;
    }
  }, []);

  // "Try on" copies to a user Item first, then deep-links the studio with that
  // id — preselecting it exactly like a wardrobe item.
  const tryOn = useCallback(async (entry: StoreItem) => {
    if (inFlight.current) return;
    inFlight.current = true;
    try {
      const inserted = await r.insertItem({
        type: entry.category,
        name: entry.name,
        color: entry.color,
        tags: ['catalog'],
        imagePath: entry.imagePaths[0] ?? '',
      });
      router.push(studioHref(inserted.id));
    } finally {
      inFlight.current = false;
    }
  }, []);

  const renderCard = useCallback(
    (item: StoreItem) => {
      const isCopied = item.id === copiedId;
      return (
        <View style={styles.thumb}>
          <Image
            source={resolveSource(item)}
            style={styles.thumbImg}
            resizeMode="cover"
            fadeDuration={0}
          />
          <Text numberOfLines={1} style={styles.itemName}>
            {item.name}
          </Text>
          <Text style={styles.itemColor}>
            {t(`color.${item.color}`)} · {t(`category.${item.category}`)}
          </Text>
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.btn, styles.btnPrimary]}
              activeOpacity={0.8}
              onPress={() => tryOn(item)}
            >
              <Text style={styles.btnPrimaryText}>{t('common.tryOn')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.btn,
                styles.btnSecondary,
                isCopied && styles.btnDone,
              ]}
              activeOpacity={0.8}
              disabled={isCopied}
              onPress={() => addToWardrobe(item)}
            >
              <Text style={styles.btnSecondaryText}>
                {isCopied ? t('catalog.added') : t('catalog.add')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    },
    [addToWardrobe, tryOn, copiedId, t],
  );

  return (
    <View style={styles.section}>
      <Text style={styles.header}>{t('catalog.header')}</Text>
      {items.length === 0 ? (
        <Text style={styles.emptyText}>
          {loading ? t('common.loading') : t('catalog.empty')}
        </Text>
      ) : (
        <View style={styles.grid}>
          {items.map((item) => (
            <View key={String(item.id)} style={styles.cell}>
              {renderCard(item)}
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: 16 },
  header: { fontSize: 24, fontWeight: '800', marginTop: 8, marginBottom: 10 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: 12,
    rowGap: 12,
    paddingBottom: 8,
  },
  cell: { flexBasis: '47%', flexGrow: 1 },
  thumb: {
    height: 210,
    borderRadius: 14,
    backgroundColor: '#eee',
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
    padding: 10,
  },
  thumbImg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 120,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    backgroundColor: '#f5f5f5',
  },
  itemName: { fontSize: 13, fontWeight: '600', color: '#333' },
  itemColor: { fontSize: 11, color: '#888', textTransform: 'capitalize' },
  actions: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 8,
  },
  btn: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
  },
  btnPrimary: { backgroundColor: '#111' },
  btnPrimaryText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  btnSecondary: { backgroundColor: '#f2f2f2' },
  btnSecondaryText: { color: '#333', fontSize: 12, fontWeight: '700' },
  btnDone: { backgroundColor: '#e6f4ea' },
  emptyText: {
    color: '#888',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 40,
  },
});
