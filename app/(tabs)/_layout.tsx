import { Tabs } from 'expo-router';

// M1-1 routing baseline (D19.4): the three primary screens live as tabs. A route
// group is transparent in URLs, so `router.push('/studio')` and
// `redirect('/wardrobe')` from flat screens still resolve.
// No tab icons: @expo/vector-icons isn't an install — text labels for MVP.
export default function WardrobeGroup() {
    return (
         <Tabs screenOptions={{ headerShown: false, tabBarShowLabel: true }}>
             <Tabs.Screen name="wardrobe" options={{ title: 'Wardrobe' }} />
             <Tabs.Screen name="catalog" options={{ title: 'Catalog' }} />
             <Tabs.Screen name="looks" options={{ title: 'Looks' }} />
         </Tabs>
     );
}
