import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useI18n } from '@/i18n/useI18n';
import { TABS } from '@/navigation/tabs';

// M1-1 routing baseline (D19.4): the primary screens live as tabs. A route group
// is transparent in URLs, so `router.push('/studio?id=…')` and `redirect('/wardrobe')`
// from flat screens still resolve — welcome and studio are now tabs in this group.
// The bar stays visible on every screen: welcome (orientation), me (profile +
// settings), wardrobe, studio (try-on), looks.
// M7-2b: the catalog was consolidated into the wardrobe tab (two sections in one
// scroll), so the standalone catalog tab/route was retired — five icons remain.
// M3-3: tab titles are localized (the (tabs) group lives inside I18nProvider).
// M3-17 (#47): the tab set (order, titles, icons) is the single-owner descriptor
// TABS (src/navigation/tabs.ts, D-8: welcome stays a permanent tab); this layout
// just maps it, and a localized accessibility label is set per tab so the active
// nav control reads its location to assistive tech at every viewport width.
export default function WardrobeGroup() {
  const { t } = useI18n();
  return (
    <Tabs screenOptions={{ headerShown: false, tabBarShowLabel: true }}>
      {TABS.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: t(tab.titleKey),
            tabBarAccessibilityLabel: t(tab.titleKey),
            tabBarIcon: ({ color, size }) => (
              <Ionicons name={tab.icon} size={size} color={color} />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
