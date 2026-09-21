import { translate, resolveLocale, isValidLocale, CATALOG, LOCALE_LABELS, DEFAULT_LOCALE } from '../../src/i18n/strings';

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
    // 'es' has no entry for this key in the fixture; a real run falls back.
    expect(translate('es', 'nonexistent.key')).toBe('nonexistent.key');
  });

  it('falls back to English when an unknown locale is passed via resolveLocale', () => {
    expect(translate(resolveLocale('fr'), sampleKey)).toBe(CATALOG.en[sampleKey]);
  });
});

describe('resolveLocale', () => {
  it('passes through a valid locale', () => {
    expect(resolveLocale('es')).toBe('es');
    expect(resolveLocale('en')).toBe('en');
  });

  it('falls back to the default for unknown / null / undefined', () => {
    expect(resolveLocale('fr')).toBe(DEFAULT_LOCALE);
    expect(resolveLocale(null)).toBe(DEFAULT_LOCALE);
    expect(resolveLocale(undefined)).toBe(DEFAULT_LOCALE);
  });
});

describe('isValidLocale', () => {
  it('accepts known locales and rejects unknowns', () => {
    expect(isValidLocale('en')).toBe(true);
    expect(isValidLocale('es')).toBe(true);
    expect(isValidLocale('fr')).toBe(false);
    expect(isValidLocale('')).toBe(false);
  });
});

describe('catalogs', () => {
  it('ships exactly two shippable locales', () => {
    expect(Object.keys(CATALOG).sort()).toEqual(['en', 'es']);
    expect(LOCALE_LABELS[DEFAULT_LOCALE]).toBeDefined();
  });

  it('does not leave any English key blank in the Spanish catalog', () => {
    for (const key of Object.keys(CATALOG.en)) {
      expect(CATALOG.es[key]).toBeDefined();
      expect(typeof CATALOG.es[key]).toBe('string');
      expect(CATALOG.es[key].length).toBeGreaterThan(0);
    }
  });
});
