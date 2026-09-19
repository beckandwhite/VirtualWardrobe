import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useState, useCallback, useEffect } from 'react';
import { router } from 'expo-router';
import { r, type StoreItem } from '@/store';

export default function CatalogScreen() {
   const [items, setItems] = useState<StoreItem[]>([]);
   const [loading, setLoading] = useState(true);

   const load = useCallback(async () => {
      const list = await r.listStoreItems();
      setItems(list);
      setLoading(false);
     }, []);

   useEffect(() => {
      load().catch((e) => console.error('catalog load', e));
     }, [load]);

   const addToWardrobe = useCallback(async (entry: StoreItem) => {
       await r.insertItem({
          type: entry.category,
          name: entry.name,
          color: entry.color,
          tags: ['catalog'],
          imagePath: entry.imagePaths[0] ?? 'catalog://placeholder',
       });
       router.replace('/wardrobe');
       }, []);

   return (
         <View style={styles.screen}>
         <FlatList
           data={items}
            numColumns={2}
            keyExtractor={(i) => String(i.id)}
              contentContainerStyle={styles.list}
              ListHeaderComponent={<Text style={styles.header}>Catalog</Text>}
              ListEmptyComponent={<Text>{loading ? 'Loading…' : 'Empty'}</Text>}
              renderItem={({ item }) => (
                   <TouchableOpacity
                     activeOpacity={0.8}
                     onPress={() => addToWardrobe(item)}>
                       <View style={styles.card}>
                          <Text style={styles.name}>{item.name}</Text>
                          <Text style={styles.color}>{item.color} · {item.category}</Text>
                         </View>
                      </TouchableOpacity>
                   )}
           />
          </View>
        );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 16 },
  list: { paddingBottom: 60 },
  header: { fontSize: 24, fontWeight: '800', marginBottom: 12 },
  card: {
    height: 150,
    borderRadius: 14,
    backgroundColor: '#f5f5f5',
    padding: 12,
    marginBottom: 12,
    justifyContent: 'flex-end',
   },
  name: { fontSize: 14, fontWeight: '600' },
   color: { fontSize: 11, color: '#888', textTransform: 'capitalize' },
});
