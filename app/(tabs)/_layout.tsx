import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useI18n } from '@/i18n/useI18n';

// M1-1 routing baseline (D19.4): the primary screens live as tabs. A route group
// is transparent in URLs, so `router.push('/studio?id=…')` and `redirect('/wardrobe')`
// from flat screens still resolve — welcome and studio are now tabs in this group.
// The bar stays visible on every screen: welcome (orientation), me (profile +
// settings), wardrobe, catalog, studio (try-on), looks.
// M3-3: tab titles are localized (the (tabs) group lives inside I18nProvider).
export default function WardrobeGroup() {
  const { t } = useI18n();
  return (
    <Tabs screenOptions={{ headerShown: false, tabBarShowLabel: true }}>
      <Tabs.Screen
        name="welcome"
        options={{
          title: t('tabs.welcome'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="information-circle-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="me"
        options={{
          title: t('tabs.me'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-circle-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="wardrobe"
        options={{
          title: t('tabs.wardrobe'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="shirt-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="catalog"
        options={{
          title: t('tabs.catalog'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="pricetags-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="studio"
        options={{
          title: t('tabs.studio'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="color-wand-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="looks"
        options={{
          title: t('tabs.looks'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="images-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
