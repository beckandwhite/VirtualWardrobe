import {
   View,
   Text,
   StyleSheet,
   FlatList,
   TouchableOpacity,
   Image,
} from 'react-native';
import { useCallback, useState, useEffect } from 'react';
import { router } from 'expo-router';
import { r, type Item } from '@/store';

export default function WardrobeScreen() {
    const [items, setItems] = useState<Item[]>([]);
    const [refreshing, setRefreshing] = useState(false);

    const load = useCallback(async () => {
        const list = await r.listItems();
          setItems(list);
         }, []);

  useEffect(() => {
       load().catch((e) => console.error('wardrobe load', e));
       }, [load]);

   const onRefresh = useCallback(async () => {
        setRefreshing(true);
         try {
           await load();
           } catch (e) {
            console.error('refresh failed', e);
             }
        setRefreshing(false);
        }, [load]);

    return (
         <View style={styles.screen}>
            <FlatList
              data={items}
              keyExtractor={(i) => String(i.id)}
              numColumns={2}
              contentContainerStyle={styles.list}
              refreshing={refreshing}
              onRefresh={onRefresh}
              ListHeaderComponent={
                  <Text style={styles.header}>Your wardrobe</Text>
            }
                ListEmptyComponent={
                     items.length === 0 ? (
                    <Text style={styles.empty}>
                    No items yet. Tap the + to add your first one.
                    </Text>
                    ) : null
                  }
              ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
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
                          <Text style={styles.itemName}>{item.name}</Text>
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
   screen: {
      flex: 1,
      padding: 16,
    },
   list: {
      paddingBottom: 80,
    },
   header: {
      fontSize: 24,
      fontWeight: '800',
      marginTop: 8,
      marginBottom: 12,
   },
    thumb: {
       height: 140,
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
       height: 90,
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
      textAlign: 'center',
      color: '#888',
      marginTop: 40,
      fontSize: 14,
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
