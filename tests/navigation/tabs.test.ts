import { TABS, TAB_NAMES, type TabName } from '../../src/navigation/tabs';
import { CATALOG, LOCALES } from '../../src/i18n/strings';

// M3-17 (#47) tab-bar composition. TABS is the single owner of the persistent
// bottom bar; this test locks the set so a regression — a dropped, added, or
// reordered tab, or the retired M7-2b `catalog` tab sneaking back — is caught, and
// asserts D-8 (welcome stays a permanent tab).

describe('TABS (persistent five-icon bottom bar)', () => {
  it('is exactly the five canonical tabs, in left-to-right order (Plans/05)', () => {
    expect(TAB_NAMES).toEqual<TabName[]>([
      'welcome',
      'me',
      'wardrobe',
      'studio',
      'looks',
    ]);
  });

  it('keeps welcome as a permanent tab (#47 D-8)', () => {
    expect(TAB_NAMES).toContain('welcome');
  });

  it('does not reintroduce the retired standalone catalog tab (M7-2b)', () => {
    expect(TAB_NAMES).not.toContain('catalog' as TabName);
  });

  it('gives every tab a title key and an icon', () => {
    for (const tab of TABS) {
      expect(typeof tab.titleKey).toBe('string');
      expect(tab.titleKey.startsWith('tabs.')).toBe(true);
      expect(typeof tab.icon).toBe('string');
      expect((tab.icon as string).length).toBeGreaterThan(0);
    }
  });

  it('resolves every tab title in every shipped locale', () => {
    for (const locale of LOCALES) {
      for (const tab of TABS) {
        const value = CATALOG[locale][tab.titleKey];
        expect(typeof value).toBe('string');
        expect(value.length).toBeGreaterThan(0);
      }
    }
  });
});
