import {
  Image,
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from 'react-native';
import { useState } from 'react';
import { useLocalSearchParams, router } from 'expo-router';
import { useItem, upsertItem, deleteItem, makeThumbnail } from '@/store';
import type { ItemCategory } from '@/store';
import { useI18n } from '@/i18n/useI18n';

// M1-2: detail/edit screen. Turns a captured draft (M1-1) into a typed item and
// owns full CRUD. A thumbnail is generated on save so the gallery (M1-3) decodes
// a small image, not the full-res capture. Delete cascades the item's TryOn rows.

const CATEGORIES: ItemCategory[] = [
  'top',
  'bottom',
  'dress',
  'outerwear',
  'shoes',
  'other',
];

const COLORS = [
  { name: 'white', swatch: '#ffffff' },
  { name: 'black', swatch: '#111111' },
  { name: 'gray', swatch: '#9aa0a6' },
  { name: 'red', swatch: '#d64545' },
  { name: 'blue', swatch: '#4a6cd4' },
  { name: 'green', swatch: '#3f9d5a' },
  { name: 'brown', swatch: '#7a5230' },
  { name: 'pink', swatch: '#d47ba0' },
  { name: 'yellow', swatch: '#e3b53e' },
];

export default function ItemScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { item, loading } = useItem(id ? Number(id) : null);
  const { t } = useI18n();

  const [type, setType] = useState<ItemCategory>('other');
  const [color, setColor] = useState('unknown');
  const [tagsText, setTagsText] = useState('');
  const [busy, setBusy] = useState(false);

  // Seed local state once the item arrives (item loads async, so it can't seed
  // initial state directly). Keyed on item.id so re-editing a different item reseeds.
  const [seededId, setSeededId] = useState<number | null>(null);
  if (item && seededId !== item.id) {
    setType(item.type);
    setColor(item.color);
    setTagsText(item.tags.join(', '));
    setSeededId(item.id);
  }

  if (loading || !item) {
    return (
      <View style={styles.center}>
        <Text style={styles.hint}>
          {loading ? t('common.loading') : t('item.notFound')}
        </Text>
        {!loading ? (
          <TouchableOpacity style={styles.back} onPress={() => router.back()}>
            <Text style={styles.backText}>{t('common.back')}</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    );
  }

  const tags = () =>
    tagsText
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

  const save = async () => {
    setBusy(true);
    try {
      const thumbnailPath = await makeThumbnail(item.imagePath);
      await upsertItem(item.id, {
        type,
        color,
        tags: tags(),
        thumbnailPath,
      });
      await router.back();
    } catch (e) {
      console.error('item save failed', e);
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      await deleteItem(item.id);
      await router.back();
    } catch (e) {
      console.error('item delete failed', e);
      setBusy(false);
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Image
        source={{ uri: item.thumbnailPath ?? item.imagePath }}
        style={styles.preview}
        resizeMode="contain"
      />

      <Text style={styles.label}>{t('item.label.type')}</Text>
      <View style={styles.chips}>
        {CATEGORIES.map((c) => (
          <TouchableOpacity
            key={c}
            style={[styles.chip, c === type ? styles.chipActive : null]}
            activeOpacity={0.7}
            onPress={() => setType(c)}
          >
            <Text
              style={[
                styles.chipText,
                c === type ? styles.chipTextActive : null,
              ]}
            >
              {t(`category.${c}`)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>{t('item.label.color')}</Text>
      <View style={styles.chips}>
        {COLORS.map((c) => (
          <TouchableOpacity
            key={c.name}
            style={[
              styles.swatch,
              { backgroundColor: c.swatch },
              c.name === color ? styles.swatchActive : null,
            ]}
            accessibilityLabel={t(`color.${c.name}`)}
            activeOpacity={0.7}
            onPress={() => setColor(c.name)}
          >
            {c.name === color ? <Text style={styles.tick}>✓</Text> : null}
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>{t('item.label.tags')}</Text>
      <TextInput
        style={styles.tags}
        value={tagsText}
        onChangeText={setTagsText}
        placeholder={t('item.tags.placeholder')}
        placeholderTextColor="#9aa0a6"
        autoCorrect={false}
      />

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.button, styles.primary, busy ? styles.busy : null]}
          disabled={busy}
          activeOpacity={0.8}
          onPress={save}
        >
          <Text style={styles.primaryText}>
            {busy ? t('common.saving') : t('common.save')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, busy ? styles.busy : null]}
          disabled={busy}
          activeOpacity={0.8}
          onPress={remove}
        >
          <Text style={styles.deleteText}>{t('common.delete')}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 24, gap: 12 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  hint: { color: '#888', fontSize: 15 },
  preview: {
    width: '100%',
    height: 320,
    borderRadius: 14,
    backgroundColor: '#f2f2f2',
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase' as 'uppercase',
    letterSpacing: 1,
    color: '#888',
    marginTop: 4,
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
  swatch: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatchActive: { borderColor: '#111', borderWidth: 3 },
  tick: { color: 'rgba(255,255,255,0.9)', fontSize: 14, fontWeight: '700' },
  tags: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
  },
  actions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#f2f2f2',
  },
  primary: { backgroundColor: '#111' },
  busy: { opacity: 0.6 },
  primaryText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  deleteText: { color: '#c53434', fontSize: 15, fontWeight: '700' },
  back: { paddingVertical: 10, paddingHorizontal: 16 },
  backText: { color: '#06c', fontSize: 15 },
});
