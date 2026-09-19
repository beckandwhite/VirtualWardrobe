import {
   View,
   Text,
   StyleSheet,
   FlatList,
   TouchableOpacity,
} from 'react-native';
import { useCallback, useState, useEffect } from 'react';
import * as ImagePicker from 'expo-image-picker';
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

   const capture = useCallback(async () => {
       try {
          const perm = await ImagePicker.requestCameraPermissionsAsync();
          if (perm.status !== 'granted') {
            console.warn('camera permission not granted');
            return;
             }
          const photo = await ImagePicker.launchCameraAsync({
             allowsEditing: true,
             quality: 0.7,
             });
   if (photo.canceled || !photo.assets?.[0]) return;
    await r.insertItem({
      type: 'top',
      name: 'New item',
      color: 'unknown',
      imagePath: photo.assets[0].uri,
       });
    await load();
       } catch (e) {
         console.error('capture failed', e);
         }
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
                   <View key={String(item.id)} style={styles.thumb}>
                           <Text style={styles.itemName}>{item.name}</Text>
                               <Text style={styles.itemColor}>{item.color}</Text>
                              </View>
                     )}
            />

            <TouchableOpacity
                style={styles.fab}
            activeOpacity={0.8}
            onPress={capture}>
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
