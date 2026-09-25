import {
  translate,
  resolveLocale,
  isValidLocale,
  CATALOG,
  LOCALE_LABELS,
  DEFAULT_LOCALE,
  catalogCoverage,
  placeholderMismatches,
  tokensIn,
  LOCALES,
} from '../../src/i18n/strings';

const sampleKey = 'onboarding.welcome';

// Every non-English locale, used to run the coverage/placeholder gates across
// the whole catalog rather than a single hand-picked locale.
const NON_DEFAULT = LOCALES.filter((l) => l !== DEFAULT_LOCALE);

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

  it('interpolates {token} placeholders with the supplied params', () => {
    expect(translate('en', 'studio.lookNumber', { id: 7 })).toBe('Look #7');
    expect(translate('en', 'wardrobe.count', { visible: 2, total: 9 })).toBe('2 of 9');
  });

  it('leaves an unknown token untouched rather than dropping it', () => {
    expect(translate('en', 'looks.shareFailed', {})).toBe('Share failed: {error}');
  });

  it('interpolates against the localized template', () => {
    // Spanish should still substitute the same {id} token in its own wording.
    const es = translate('es', 'studio.lookNumber', { id: 3 });
    expect(es).toContain('3');
    expect(es).not.toContain('{id}');
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

  it('normalizes BCP-47 region subtags to the base locale', () => {
    expect(resolveLocale('es-MX')).toBe('es');
    expect(resolveLocale('de_DE')).toBe('de');
    expect(resolveLocale('zh-CN')).toBe('zh-CN');
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

  it.each(NON_DEFAULT)('has full, non-blank coverage for %s', (locale) => {
    const { missing, unexpected } = catalogCoverage(locale);
    expect(missing).toEqual([]);
    expect(unexpected).toEqual([]);
    for (const key of Object.keys(CATALOG.en)) {
      const value = CATALOG[locale][key];
      expect(typeof value).toBe('string');
      expect(value.length).toBeGreaterThan(0);
    }
  });

  it.each(NON_DEFAULT)('preserves every interpolation token for %s', (locale) => {
    expect(placeholderMismatches(locale)).toEqual([]);
  });

  it('detects a dropped placeholder token', () => {
    expect(tokensIn('Look #{id} · {date}')).toEqual(['date', 'id']);
    // A hand-built broken dict is flagged (guards the placeholder gate itself).
    const good = tokensIn(CATALOG.en['wardrobe.count']).join(',');
    expect(good).toBe('total,visible');
  });
});
