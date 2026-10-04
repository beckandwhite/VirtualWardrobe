import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useI18n } from '@/i18n/useI18n';
import { LOCALE_LABELS, type Locale } from '@/i18n';

// M3-3: the language switcher. Toggling calls `setLocale`, which re-renders the
// consuming tree immediately (no reload-crash — M3-3 AC2). Placed on the
// onboarding screen (the M0-4 flow that most needs it) via `src/i18n/index.ts`.
//
// #65: the eight non-active alternatives used to sit in a single non-wrapping
// `flexDirection: 'row'`, so on the welcome card the later buttons ran past the
// card's right edge and were clipped (a hidden horizontal scroll). The grid now
// wraps (flexWrap) with compact `flexBasis` cells: ~4 columns on a desktop-width
// card, flowing to fewer columns / more rows on narrow viewports — no clipping,
// no horizontal scroll. Each cell keeps its readable native-language label and
// carries an explicit accessibility role + label so native and screen readers get
// clear button semantics.
export default function LanguageSwitcher() {
    const { locale, setLocale, t } = useI18n();
     // Exclude the active locale; the switcher offers what's *not* currently shown.
  const others = (Object.keys(LOCALE_LABELS) as Locale[]).filter((l) => l !== locale);
    return (
             <View style={styles.section}>
                 <Text style={styles.title}>{t('language.title')}</Text>
                 <View style={styles.grid}>
                    {others.map((l) => (
                           <TouchableOpacity
                            key={l}
                            style={styles.chip}
                            activeOpacity={0.8}
                            accessibilityRole="button"
                            accessibilityLabel={LOCALE_LABELS[l]}
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
     // #65: a wrapping grid. ~23% basis + flexGrow yields four compact columns on a
     // desktop-width card; on narrower viewports the row fills and the remaining
     // cells wrap to new rows (never clipped, no horizontal scroll).
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      },
    chip: {
      flexBasis: '23%',
      flexGrow: 1,
      backgroundColor: '#f2f2f2',
      paddingVertical: 8,
      paddingHorizontal: 8,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      },
    chipText: { fontSize: 13, fontWeight: '600', textAlign: 'center' },
});
