import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { r } from '@/store';
import {
  translate,
  resolveLocale,
  LOCALE_LABELS,
  DEFAULT_LOCALE,
  type Locale,
} from './strings';

// M3-3 i18n React layer. Thin wrapper over the pure core (`strings.ts`) — the
// only thing that touches the store. Language is a persisted setting, so a
// switch writes app_settings then re-renders; it never reloads the app (no
// `expo-localization`, no reload-crash, M3-3 AC2).

export interface I18n {
  locale: Locale;
  t: (key: string) => string;
  setLocale: (locale: Locale) => void;
}

const I18nContext = createContext<I18n>({
  locale: DEFAULT_LOCALE,
  t: (key) => translate(DEFAULT_LOCALE, key),
  setLocale: () => undefined,
});

export function useI18n(): I18n {
  return useContext(I18nContext);
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocal] = useState<Locale>(DEFAULT_LOCALE);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        // Persisted choice wins; fall back to the system language's BCP-47
        // prefix (e.g. "es-MX" -> "es") when the user has no saved choice.
        const saved = await r.getSetting('language');
        const next = resolveLocale(saved ?? systemLocalePrefix());
        if (alive) setLocal(next);
      } catch (e) {
        console.error('useI18n load failed', e);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const t = useCallback((key: string) => translate(locale, key), [locale]);

  const setLocale = useCallback(
    async (next: Locale) => {
      setLocal(next); // re-render immediately; no reload
      try {
        await r.setSetting('language', next);
      } catch (e) {
        console.error('useI18n persist failed', e);
      }
    },
    [],
  );

  // Minimal so consumers can render a switcher without importing the core.
  const value: I18n = { locale, t, setLocale };
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

// System-language BCP-47 prefix -> known locale, or undefined (use default).
function systemLocalePrefix(): string | undefined {
  // `settings` is RN's global; guarded so the pure core stays expo-free and the
  // hook degrades to the default locale when the global is absent (tests/web).
  const raw = (globalThis as { settings?: { locale?: string } }).settings?.locale;
  if (!raw) return undefined;
  const prefix = raw.split('-')[0].toLowerCase();
  return LOCALE_LABELS[(prefix as Locale)] !== undefined ? prefix : undefined;
}
