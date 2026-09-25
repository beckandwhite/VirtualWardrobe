// M6-1 i18n foundation (pure, expo-free, jest-runnable).
//
// The canonical English catalog (`locales/en.ts`) is the source-of-truth; every
// other locale lives in its own `locales/<locale>.ts` file so translators (and
// parallel translation work items M6-3..M6-10) each own a single file. This
// module assembles them into `CATALOG`, and keeps the pure resolution/fallback/
// interpolation helpers the app and tests share. Zero runtime dependencies.

import { en } from './locales/en';
import { hu } from './locales/hu';
import { de } from './locales/de';
import { es } from './locales/es';
import { it } from './locales/it';
import { fr } from './locales/fr';
import { vi } from './locales/vi';
import { zhCN } from './locales/zh-CN';
import { zhTW } from './locales/zh-TW';

export const LOCALES = [
  'en',
  'hu',
  'de',
  'es',
  'it',
  'fr',
  'vi',
  'zh-CN',
  'zh-TW',
] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'en';

export const LOCALE_LABELS: Record<Locale, string> = {
  en: 'English',
  hu: 'Magyar',
  de: 'Deutsch',
  es: 'Español',
  it: 'Italiano',
  fr: 'Français',
  vi: 'Tiếng Việt',
  'zh-CN': '简体中文',
  'zh-TW': '繁體中文',
};

export type Dict = Record<string, string>;

export const CATALOG: Record<Locale, Dict> = {
  en,
  hu,
  de,
  es,
  it,
  fr,
  vi,
  'zh-CN': zhCN,
  'zh-TW': zhTW,
};

// Placeholder tokens look like `{name}`. Kept as a shared constant so the
// interpolation helper and the coverage check agree on the grammar.
const TOKEN_RE = /\{(\w+)\}/g;

export function tokensIn(value: string): string[] {
  return [...value.matchAll(TOKEN_RE)].map((m) => m[1]).sort();
}

export function catalogCoverage(locale: string): {
  missing: string[];
  unexpected: string[];
} {
  const target = resolveLocale(locale) as Locale;
  const expected = Object.keys(CATALOG[DEFAULT_LOCALE]);
  const actual = Object.keys(CATALOG[target] ?? {});

  return {
    missing: expected.filter((key) => !(key in (CATALOG[target] ?? {}))),
    unexpected: actual.filter((key) => !(key in CATALOG[DEFAULT_LOCALE])),
  };
}

// Keys whose interpolation tokens diverge from the canonical English value.
// A translation that drops or renames a `{token}` would silently swallow the
// substituted value, so this is a hard gate (see strings.test.ts).
export function placeholderMismatches(locale: string): string[] {
  const target = resolveLocale(locale) as Locale;
  const dict = CATALOG[target] ?? {};
  const mismatches: string[] = [];
  for (const [key, value] of Object.entries(CATALOG[DEFAULT_LOCALE])) {
    const expected = tokensIn(value).join(',');
    const actual = tokensIn(dict[key] ?? '').join(',');
    if (key in dict && expected !== actual) mismatches.push(key);
  }
  return mismatches;
}

// Resolve a locale with fallback to English, then to the key itself — so a
// missing key never renders blank (the common i18n footgun).
export function resolveLocale(input: string | null | undefined): Locale {
  const raw = input?.trim();
  if (!raw) return DEFAULT_LOCALE;

  const normalized = raw.replace(/_/g, '-');
  if (normalized in CATALOG) return normalized as Locale;

  const base = normalized.split('-')[0].toLowerCase();
  if (base in CATALOG) return base as Locale;

  return DEFAULT_LOCALE;
}

export function isValidLocale(input: string): input is Locale {
  return input.replace(/_/g, '-') in CATALOG;
}

// Substitute `{token}` placeholders. Unknown tokens are left untouched so a
// missing param is visible in QA rather than silently dropped.
function interpolate(
  template: string,
  params: Record<string, string | number>,
): string {
  return template.replace(TOKEN_RE, (match, name: string) =>
    name in params ? String(params[name]) : match,
  );
}

export function translate(
  locale: Locale,
  key: string,
  params?: Record<string, string | number>,
): string {
  const dict = CATALOG[locale] ?? CATALOG[DEFAULT_LOCALE];
  const template = dict[key] ?? CATALOG[DEFAULT_LOCALE][key] ?? key;
  return params ? interpolate(template, params) : template;
}
