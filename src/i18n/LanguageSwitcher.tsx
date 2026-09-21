import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useI18n } from '@/i18n/useI18n';
import { LOCALE_LABELS, type Locale } from '@/i18n';

// M3-3: the language switcher. Toggling calls `setLocale`, which re-renders the
// consuming tree immediately (no reload-crash — M3-3 AC2). Placed on the
// onboarding screen (the M0-4 flow that most needs it) via `src/i18n/index.ts`.
export default function LanguageSwitcher() {
   const { locale, setLocale, t } = useI18n();
   // Exclude the active locale; the switcher offers what's *not* currently shown.
  const others = (Object.keys(LOCALE_LABELS) as Locale[]).filter((l) => l !== locale);
   return (
          <View style={styles.section}>
              <Text style={styles.title}>{t('language.title')}</Text>
              <View style={styles.row}>
                 {others.map((l) => (
                        <TouchableOpacity
                           key={l}
                           style={styles.chip}
                           activeOpacity={0.8}
                           onPress={() => setLocale(l)}>
                            <Text style={styles.chipText}>{LOCALE_LABELS[l]}</Text>
                         </TouchableOpacity>
                     ))}
              </View>
          </View>
      );
}

const styles = StyleSheet.create({
   section: { marginTop: 12, gap: 8 },
   title: {
     fontSize: 13,
     fontWeight: '700',
     textTransform: 'uppercase',
     letterSpacing: 1,
     color: '#888',
    },
   row: { flexDirection: 'row', gap: 8 },
   chip: {
     backgroundColor: '#f2f2f2',
     paddingVertical: 8,
     paddingHorizontal: 14,
     borderRadius: 10,
   },
   chipText: { fontSize: 14, fontWeight: '600' },
});
