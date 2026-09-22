import {
  translate,
  resolveLocale,
  isValidLocale,
  CATALOG,
  LOCALE_LABELS,
  DEFAULT_LOCALE,
  catalogCoverage,
  LOCALES,
} from '../../src/i18n/strings';

const sampleKey = 'onboarding.welcome';

describe('translate', () => {
  it('returns English for the default locale', () => {
    expect(translate('en', sampleKey)).toBe(CATALOG.en[sampleKey]);
  });

  it('returns the translation for a non-default locale', () => {
    expect(translate('es', sampleKey)).toBe(CATALOG.es[sampleKey]);
    expect(translate('es', sampleKey)).not.toBe(CATALOG.en[sampleKey]);
  });

  it('falls back to English when a locale is missing the key', () => {
    expect(translate('hu', 'nonexistent.key')).toBe('nonexistent.key');
  });

  it('falls back to English when an unknown locale is passed via resolveLocale', () => {
    expect(translate(resolveLocale('ja'), sampleKey)).toBe(CATALOG.en[sampleKey]);
  });
});

describe('resolveLocale', () => {
  it('passes through valid locales and falls back for unknowns', () => {
    expect(resolveLocale('es')).toBe('es');
    expect(resolveLocale('en')).toBe('en');
    expect(resolveLocale('zh-CN')).toBe('zh-CN');
    expect(resolveLocale('fr')).toBe('fr');
    expect(resolveLocale('ja')).toBe(DEFAULT_LOCALE);
    expect(resolveLocale(null)).toBe(DEFAULT_LOCALE);
    expect(resolveLocale(undefined)).toBe(DEFAULT_LOCALE);
  });
});

describe('isValidLocale', () => {
  it('accepts known locales and rejects unknowns', () => {
    expect(isValidLocale('en')).toBe(true);
    expect(isValidLocale('es')).toBe(true);
    expect(isValidLocale('hu')).toBe(true);
    expect(isValidLocale('zh-CN')).toBe(true);
    expect(isValidLocale('fr')).toBe(true);
    expect(isValidLocale('ja')).toBe(false);
    expect(isValidLocale('')).toBe(false);
  });
});

describe('catalogs', () => {
  it('ships the nine supported locales and their labels', () => {
    expect(LOCALES).toEqual(['en', 'hu', 'de', 'es', 'it', 'fr', 'vi', 'zh-CN', 'zh-TW']);
    expect(Object.keys(CATALOG).sort()).toEqual([...LOCALES].sort());
    expect(LOCALE_LABELS['hu']).toBe('Magyar');
    expect(LOCALE_LABELS['zh-CN']).toBe('简体中文');
  });

  it('reports missing and unexpected keys for a locale', () => {
    const result = catalogCoverage('hu');
    expect(result.missing).toEqual([]);
    expect(result.unexpected).toEqual([]);
  });

  it('does not leave any English key blank in the Hungarian catalog', () => {
    for (const key of Object.keys(CATALOG.en)) {
      expect(CATALOG.hu[key]).toBeDefined();
      expect(typeof CATALOG.hu[key]).toBe('string');
      expect(CATALOG.hu[key].length).toBeGreaterThan(0);
    }
  });
});
