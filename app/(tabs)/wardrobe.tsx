import {
   View,
   Text,
   StyleSheet,
   FlatList,
   TouchableOpacity,
   Image,
   TextInput,
} from 'react-native';
import { useMemo, useState } from 'react';
import { router } from 'expo-router';
import { useItems } from '@/store';
import { applyFilters, type FilterCriteria } from '@/wardrobe';
import { emptyStateVariant, hasActiveCriteria } from '@/wardrobe/emptyState';

// M1-3: the wardrobe browse experience. A virtualized thumbnail grid (reuse the
// M1-2 `useItems` + `Item` snapshot) with a filter/search bar on top. The visible
// list is a pure, memoized function of the snapshot + active facets + query, so
// re-renders stay cheap. Filters AND together; clearing everything restores the
// full wardrobe.

const CATEGORIES = ['top', 'bottom', 'dress', 'outerwear', 'shoes', 'other'] as const;

const SWATCH = [
    { name: 'white', hex: '#ffffff' },
    { name: 'black', hex: '#111111' },
    { name: 'gray', hex: '#9aa0a6' },
    { name: 'red', hex: '#d64545' },
    { name: 'blue', hex: '#4a6cd4' },
    { name: 'green', hex: '#3f9d5a' },
    { name: 'brown', hex: '#7a5230' },
    { name: 'pink', hex: '#d47ba0' },
    { name: 'yellow', hex: '#e3b53e' },
    { name: 'unknown', hex: '#dddddd' },
];

export default function WardrobeScreen() {
   const { items, loading, reload } = useItems();

   const [query, setQuery] = useState('');
   const [criteria, setCriteria] = useState<FilterCriteria>({});

    // Pure facet+search derivation, memoized on the snapshot + active inputs.
   const visible = useMemo(
      () => applyFilters(items, criteria, query),
      [items, criteria, query],
   );

    // The "N of M" / "Clear filters" surface and the empty-state selection are
    // pure selectors (src/wardrobe/emptyState.ts) the QA-2 flow tests exercise;
    // this screen is the thin view that renders their result.
   const hasActive = hasActiveCriteria(criteria, query);
    const empty = emptyStateVariant(items, visible);
    const clearAll = () => {
      setCriteria({});
      setQuery('');
     };

   const toggleCategory = (c: string) =>
      setCriteria((prev) => ({ ...prev, category: prev.category === c ? undefined : c }));
   const toggleColor = (c: string) =>
      setCriteria((prev) => ({ ...prev, color: prev.color === c ? undefined : c }));

   return (
         <View style={styles.screen}>
            <Text style={styles.header}>Your wardrobe</Text>

             <TextInput
              style={styles.search}
              value={query}
              onChangeText={setQuery}
              placeholder="Search name or tags"
              placeholderTextColor="#9aa0a6"
              autoCorrect={false}
              autoCapitalize="none"
              />

             <View style={styles.chips}>
               {CATEGORIES.map((c) => (
                    <TouchableOpacity
                     key={c}
                     activeOpacity={0.7}
                     style={[styles.chip, criteria.category === c ? styles.chipActive : null]}
                     onPress={() => toggleCategory(c)}>
                      <Text style={[styles.chipText, criteria.category === c ? styles.chipTextActive : null]}>{c}</Text>
                     </TouchableOpacity>
                   ))}
             </View>

             <View style={styles.chips}>
               {SWATCH.map((c) => (
                     <TouchableOpacity
                     key={c.name}
                     activeOpacity={0.7}
                     accessibilityLabel={c.name}
                     style={[
                       styles.swatch,
                       { backgroundColor: c.hex },
                       criteria.color === c.name ? styles.swatchActive : null,
                     ]}
                     onPress={() => toggleColor(c.name)}>
                       {criteria.color === c.name ? (
                             <Text style={styles.tick}>✓</Text>
                       ) : null}
                      </TouchableOpacity>
                    ))}
             </View>

             {hasActive ? (
                  <Text style={styles.resultCount} onPress={clearAll} numberOfLines={1}>
                   {visible.length} of {items.length}
                 </Text>
              ) : null}

             <FlatList
              data={visible}
              keyExtractor={(i) => String(i.id)}
              numColumns={2}
              contentContainerStyle={styles.list}
              refreshing={loading}
              onRefresh={reload}
              ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
               ListEmptyComponent={
                    empty === 'none' ? (
                           <View style={styles.empty}>
                              <Text style={styles.emptyText}>
                           No items yet. Tap the + to add your first one.
                             </Text>
                           </View>
                        ) : (
                            empty === 'filtered' ? (
                                   <View style={styles.empty}>
                                       <Text style={styles.emptyText}>
                               Nothing matches your filters.
                                 </Text>
                                   <TouchableOpacity activeOpacity={0.7} onPress={clearAll}>
                                      <Text style={styles.clearLink}>Clear filters</Text>
                                    </TouchableOpacity>
                                  <TouchableOpacity
                                activeOpacity={0.7}
                                onPress={() => router.push('/capture')}>
                                     <Text style={styles.addLink}>Add an item</Text>
                                  </TouchableOpacity>
                               </View>
                              ) : null
                       )}
              renderItem={({ item }) => (
                       <TouchableOpacity
                       key={String(item.id)}
                       activeOpacity={0.85}
                       style={styles.thumb}
                       onPress={() => router.push(`/item?id=${item.id}`)}>
                             <Image
                            source={{ uri: item.thumbnailPath ?? item.imagePath }}
                            style={styles.thumbImg}
                            resizeMode="cover"
                            fadeDuration={0}
                             />
                             <Text numberOfLines={1} style={styles.itemName}>{item.name}</Text>
                             <Text style={styles.itemColor}>{item.color}</Text>
                            <TouchableOpacity
                            style={styles.tryOn}
                            activeOpacity={0.8}
                            onPress={() =>
                            router.push(`/studio?id=${item.id}`)}>
                              <Text style={styles.tryOnText}>Try on</Text>
                            </TouchableOpacity>
                          </TouchableOpacity>
                        )}
              />

             <TouchableOpacity
                style={styles.fab}
                activeOpacity={0.8}
                onPress={() => router.push('/capture')}>
                  <Text style={styles.fabText}>+</Text>
              </TouchableOpacity>
          </View>
   );
}

const styles = StyleSheet.create({
   screen: { flex: 1, padding: 16 },
   header: {
      fontSize: 24,
      fontWeight: '800',
      marginTop: 8,
      marginBottom: 10,
   },
   search: {
      borderWidth: 1,
      borderColor: '#e0e0e0',
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 8,
      fontSize: 15,
   },
   chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
   chip: {
      paddingVertical: 7,
      paddingHorizontal: 13,
      borderRadius: 16,
      backgroundColor: '#f2f2f2',
   },
   chipActive: { backgroundColor: '#111' },
   chipText: { fontSize: 12, fontWeight: '600', color: '#333', textTransform: 'capitalize' },
   chipTextActive: { color: '#fff' },
   swatch: {
      width: 34,
      height: 34,
      borderRadius: 17,
      borderWidth: 2,
      borderColor: 'rgba(0,0,0,0.12)',
      alignItems: 'center',
      justifyContent: 'center',
   },
   swatchActive: { borderColor: '#111', borderWidth: 3 },
   tick: { color: 'rgba(255,255,255,0.9)', fontSize: 13, fontWeight: '700' },
   resultCount: {
      fontSize: 12,
      color: '#888',
      marginTop: 12,
      marginBottom: 4,
   },
   list: { paddingBottom: 80 },
   thumb: {
      height: 150,
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
      height: 96,
      borderTopLeftRadius: 14,
      borderTopRightRadius: 14,
      backgroundColor: '#f5f5f5',
   },
   itemName: {
      fontSize: 13,
      fontWeight: '600',
      color: '#333',
   },
   itemColor: {
      fontSize: 11,
      color: '#888',
      textTransform: 'capitalize',
   },
   tryOn: {
      marginTop: 8,
      backgroundColor: '#111',
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 8,
      alignSelf: 'flex-start',
   },
   tryOnText: {
      color: '#fff',
      fontSize: 12,
      fontWeight: '700',
   },
   empty: {
      marginTop: 40,
      alignItems: 'center',
      gap: 6,
   },
   emptyText: {
      color: '#888',
      fontSize: 14,
      textAlign: 'center',
   },
   clearLink: {
      color: '#06c',
      fontSize: 13,
      fontWeight: '600',
   },
   addLink: {
      color: '#111',
      fontSize: 13,
      fontWeight: '700',
   },
   fab: {
      position: 'absolute',
      right: 24,
      bottom: 24,
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: '#111',
      alignItems: 'center',
      justifyContent: 'center',
   },
   fabText: {
      color: '#fff',
      fontSize: 32,
      lineHeight: 34,
   },
});
