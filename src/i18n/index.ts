// M3-3 i18n. Pure core (expo-free, jest-runnable): the catalog + `translate`.
// The React integration lives in `src/i18n/useI18n.ts`.
// M3-3 i18n. Pure core (expo-free, jest-runnable): the catalog + `translate`.
// The React integration (I18nProvider/useI18n/LanguageSwitcher) is imported
// directly from './useI18n' / './LanguageSwitcher' — kept out of this barrel on
// purpose so it never pulls react-native/expo into the pure test surface.
export {
  CATALOG,
  LOCALE_LABELS,
  DEFAULT_LOCALE,
  resolveLocale,
  isValidLocale,
  translate,
} from './strings';
export type { Locale, Dict } from './strings';

