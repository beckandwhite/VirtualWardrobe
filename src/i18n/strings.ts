// M3-3 i18n core (pure, expo-free, jest-runnable).
//
// Zero-dep by design (D23.1): a tiny type-checked catalog + a single `translate`
// pure function instead of i18next/react-i18next. The codebase already favors
// "a small in-house core over a new dependency" (D21.3 / D7), and the onboarding
// flow that needed this most is the smallest surface. A catalog is a record of
// records — strictly more legible than an `i18next.init()` config for two
// locales, with no runtime/dependency at all.
//
// Pure shape mirrors the composer (`compose`, `autoBox`): the React layer
// (`useI18n`, `LanguageSwitcher`) is the only thing that touches the store.

// Keys are the canonical English strings; a locale value is the translation.
export type Locale = 'en' | 'es';

export const DEFAULT_LOCALE: Locale = 'en';

// Native-language labels for the switcher (en shows "English", es shows "Español").
export const LOCALE_LABELS: Record<Locale, string> = {
  en: 'English',
  es: 'Español',
};

export type Dict = Record<string, string>;

// Two shippable locales (M3-3 AC2). `es` proves the switch re-renders without a
// reload-crash; add locales by extending this record + LOCALE_LABELS.
export const CATALOG: Record<Locale, Dict> = {
  en: {
    'app.title': 'VirtualWardrobe',
    'onboarding.welcome': 'Welcome to VirtualWardrobe',
    'onboarding.body': 'Try on clothes from photos you take and a curated catalog — all on ' +
      'your device, nothing uploaded.',
    'onboarding.camera': 'Camera',
    'onboarding.camera.granted': '✓ Camera access enabled',
    'onboarding.camera.denied': 'Camera permission denied. Re-enable it in your device settings ' +
      'to use the camera; you can still open photos.',
    'onboarding.camera.notgranted': 'Camera access not granted. You can re-enable it anytime from here.',
    'onboarding.camera.enable': 'Enable camera',
    'onboarding.camera.hint': 'Camera lets you photograph clothes. The wardrobe works without it.',
    'onboarding.start': 'Start →',
    'tabs.wardrobe': 'Wardrobe',
    'tabs.catalog': 'Catalog',
    'tabs.looks': 'Looks',
    'language.title': 'Language',
  },
  es: {
    'app.title': 'VirtualWardrobe',
    'onboarding.welcome': 'Bienvenido a VirtualWardrobe',
    'onboarding.body': 'Prueba ropa con fotos que tomes y de un catálogo curado — todo en tu ' +
      'dispositivo, sin subidas.',
    'onboarding.camera': 'Cámara',
    'onboarding.camera.granted': '✓ Acceso a la cámara activado',
    'onboarding.camera.denied': 'Permiso de cámara denegado. Vuelve a activarlo en la configuración ' +
      'de tu dispositivo para usar la cámara; aún puedes abrir fotos.',
    'onboarding.camera.notgranted': 'Acceso a la cámara no concedido. Puedes reactivarlo cuando quieras.',
    'onboarding.camera.enable': 'Activar cámara',
    'onboarding.camera.hint': 'La cámara te permite fotografiar ropa. El armario funciona sin ella.',
    'onboarding.start': 'Comenzar →',
    'tabs.wardrobe': 'Guardarropa',
    'tabs.catalog': 'Catálogo',
    'tabs.looks': 'Looks',
    'language.title': 'Idioma',
  },
};

// Resolve a locale with fallback to English, then to the key itself — so a
// missing key never renders blank (the common i18n footgun).
export function resolveLocale(input: string | null | undefined): Locale {
  return (input as Locale) in CATALOG ? (input as Locale) : DEFAULT_LOCALE;
}

export function isValidLocale(input: string): input is Locale {
  return input in CATALOG;
}

export function translate(locale: Locale, key: string): string {
  const dict = CATALOG[locale] ?? CATALOG[DEFAULT_LOCALE];
  return dict[key] ?? CATALOG[DEFAULT_LOCALE][key] ?? key;
}
