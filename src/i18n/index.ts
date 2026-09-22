// M6-1 i18n. Pure core (expo-free, jest-runnable): the catalog + helpers.
// The React integration lives in `src/i18n/useI18n.tsx` and `LanguageSwitcher.tsx`.
export {
  CATALOG,
  LOCALES,
  LOCALE_LABELS,
  DEFAULT_LOCALE,
  resolveLocale,
  isValidLocale,
  translate,
  catalogCoverage,
} from './strings';
export type { Locale, Dict } from './strings';

