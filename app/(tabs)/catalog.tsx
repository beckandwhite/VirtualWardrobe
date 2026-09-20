import {
   Image,
   Text,
   View,
   StyleSheet,
   FlatList,
   TouchableOpacity,
   type ImageSourcePropType,
} from 'react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { router } from 'expo-router';
import { r, type StoreItem, type ItemCategory } from '@/store';
import topPh from '../../assets/store/placeholder-top.png';
import bottomPh from '../../assets/store/placeholder-bottom.png';
import dressPh from '../../assets/store/placeholder-dress.png';
import outerwearPh from '../../assets/store/placeholder-outerwear.png';
import shoesPh from '../../assets/store/placeholder-shoes.png';
import otherPh from '../../assets/store/placeholder-other.png';

// Catalog images ship as bundled PNGs, not file URIs — the manifest stores the
// asset *path* as a string for reference, but the UI resolves by category to the
// imported asset (an ImageSourcePropType: a handle on native, a URL on web).
// Mirrors the studio's sampleGarment placeholder resolution.
const PLACEHOLDER: Record<ItemCategory, ImageSourcePropType> = {
   top: topPh,
   bottom: bottomPh,
   dress: dressPh,
   outerwear: outerwearPh,
   shoes: shoesPh,
   other: otherPh,
};

function resolveSource(item: StoreItem): ImageSourcePropType {
   return PLACEHOLDER[item.category];
}

export default function CatalogScreen() {
   const [items, setItems] = useState<StoreItem[]>([]);
   const [loading, setLoading] = useState(true);
   const [copiedId, setCopiedId] = useState<number | null>(null);

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
      const inserted = await r.insertItem({
         type: entry.category,
         name: entry.name,
         color: entry.color,
         tags: ['catalog'],
         imagePath: entry.imagePaths[0] ?? '',
      });
      setCopiedId(inserted.id);
      router.replace('/wardrobe');
   }, []);

   // "Try on" copies to a user Item first, then deep-links the studio with that
   // id — preselecting it exactly like a wardrobe item.
   const tryOn = useCallback(async (entry: StoreItem) => {
      const inserted = await r.insertItem({
         type: entry.category,
         name: entry.name,
         color: entry.color,
         tags: ['catalog'],
         imagePath: entry.imagePaths[0] ?? '',
      });
      router.push(`/studio?id=${inserted.id}`);
   }, []);

   const renderCard = useCallback(
       ({ item }: { item: StoreItem }) => {
          const isCopied = item.id === copiedId;
          return (
                   <View style={styles.thumb}>
                      <Image source={resolveSource(item)} style={styles.thumbImg} resizeMode="cover" fadeDuration={0} />
                      <Text numberOfLines={1} style={styles.itemName}>{item.name}</Text>
                      <Text style={styles.itemColor}>{item.color} · {item.category}</Text>
                      <View style={styles.actions}>
                      <TouchableOpacity
                      style={[styles.btn, styles.btnPrimary]}
                      activeOpacity={0.8}
                      onPress={() => tryOn(item)}>
                             <Text style={styles.btnPrimaryText}>Try on</Text>
                           </TouchableOpacity>
                      <TouchableOpacity
                      style={[styles.btn, styles.btnSecondary, isCopied && styles.btnDone]}
                      activeOpacity={0.8}
                      disabled={isCopied}
                      onPress={() => addToWardrobe(item)}>
                             <Text style={styles.btnSecondaryText}>{isCopied ? 'Added ✓' : 'Add'}</Text>
                           </TouchableOpacity>
                      </View>
                   </View>
                );
        },
       [addToWardrobe, tryOn, copiedId],
    );

   const content = useMemo(() => {
      return (
      <FlatList
       data={items}
        numColumns={2}
         keyExtractor={(i) => String(i.id)}
           contentContainerStyle={styles.list}
           columnWrapperStyle={styles.row}
           ListHeaderComponent={
            <Text style={styles.header}>Catalog</Text>
           }
            ListEmptyComponent={
        <Text style={styles.emptyText}>{loading ? 'Loading…' : 'Nothing in the catalog yet.'}</Text>
           }
            renderItem={renderCard}
       />
       );
   }, [items, loading, renderCard]);

   return <View style={styles.screen}>{content}</View>;
}

const styles = StyleSheet.create({
   screen: { flex: 1, padding: 16 },
   header: { fontSize: 24, fontWeight: '800', marginTop: 8, marginBottom: 10 },
   list: { paddingBottom: 80 },
   row: { gap: 12 },
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
   emptyText: { color: '#888', fontSize: 14, textAlign: 'center', marginTop: 40 },
});
