import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useState, useCallback, useEffect } from 'react';
import { router } from 'expo-router';
import { r, type TryOn } from '@/store';

export default function LooksScreen() {
   const [looks, setLooks] = useState<TryOn[]>([]);
   const [loading, setLoading] = useState(true);

   const load = useCallback(async () => {
      const list = await r.listTryOns();
      setLooks(list);
      setLoading(false);
      }, []);

   useEffect(() => {
      load().catch((e) => console.error('looks load', e));
      }, [load]);

   const remove = useCallback(
      async (id: number) => {
        await r.deleteTryOn(id);
        load();
       },
      [load],
   );

   return (
      <View style={styles.screen}>
         <FlatList
            data={looks}
            keyExtractor={(i) => String(i.id)}
            ListHeaderComponent={<Text style={styles.header}>Your looks</Text>}
            ListEmptyComponent={
                loading ? (
                  <Text style={styles.empty}>Loading…</Text>
                   ) : (
                     <Text style={styles.empty}>
                    No looks yet. Try on something in the wardrobe.
                   </Text>
                  )
            }
            renderItem={({ item }) => (
              <View style={styles.row}>
                <Text style={styles.primary}>Look #{item.id}</Text>
                <Text style={styles.secondary}>
                 Item {item.itemId} · {item.createdAt.slice(0, 10)}
                </Text>
                <View style={styles.actions}>
                   <TouchableOpacity
                       style={styles.link}
                       onPress={() => router.replace('/studio')}>
                      <Text style={styles.linkText}>Open</Text>
                    </TouchableOpacity>
                   <TouchableOpacity
                       style={styles.link}
                       onPress={() => remove(item.id)}>
                      <Text style={styles.linkText}>Delete</Text>
                   </TouchableOpacity>
                </View>
              </View>
             )}
          />
      </View>
     );
}

const styles = StyleSheet.create({
   screen: { flex: 1, padding: 16 },
   header: { fontSize: 24, fontWeight: '800', marginBottom: 12 },
   row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: '#eee',
     },
   primary: { fontSize: 15, fontWeight: '600', flex: 1 },
   secondary: { fontSize: 11, color: '#888', flexShrink: 1 },
   actions: { flexDirection: 'row', gap: 12 },
   link: { paddingHorizontal: 8 },
   linkText: { fontSize: 13, color: '#06c', fontWeight: '600' },
   empty: { color: '#888', marginTop: 40, textAlign: 'center' },
});
