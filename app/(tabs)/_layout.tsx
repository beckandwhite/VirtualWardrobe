import { Tabs } from 'expo-router';
import { useI18n } from '@/i18n/useI18n';

// M1-1 routing baseline (D19.4): the three primary screens live as tabs. A route
// group is transparent in URLs, so `router.push('/studio')` and
// `redirect('/wardrobe')` from flat screens still resolve.
// No tab icons: @expo/vector-icons isn't an install — text labels for MVP.
// M3-3: tab titles are localized (the (tabs) group lives inside I18nProvider).
export default function WardrobeGroup() {
  const { t } = useI18n();
     return (
          <Tabs screenOptions={{ headerShown: false, tabBarShowLabel: true }}>
              <Tabs.Screen name="wardrobe" options={{ title: t('tabs.wardrobe') }} />
               <Tabs.Screen name="catalog" options={{ title: t('tabs.catalog') }} />
                <Tabs.Screen name="looks" options={{ title: t('tabs.looks') }} />
          </Tabs>
       );
}
