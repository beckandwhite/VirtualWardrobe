import {
  parseItemId,
  studioHref,
  itemHref,
  exitTo,
  WARDROBE_HREF,
  CAPTURE_HREF,
  type ExitDecision,
} from '../../src/navigation/routes';

// M3-17 (#47) canonical route + navigation-decision helpers. These are the pure
// rules the id-bearing routes (/studio, /item) and the flat modals wire in, so the
// happy path + the error/return paths (invalid item id, cancel/back, deep-link
// params) are asserted here without a router — mirrors the M4-2 route-level style.

describe('parseItemId (canonical deep-link id / invalid-id resolution)', () => {
  it('accepts a single positive-integer string', () => {
    expect(parseItemId('1')).toBe(1);
    expect(parseItemId('42')).toBe(42);
    expect(parseItemId(' 7 ')).toBe(7);
  });

  it('rejects a missing / blank param (→ null, the fallback branch)', () => {
    expect(parseItemId(undefined)).toBeNull();
    expect(parseItemId(null)).toBeNull();
    expect(parseItemId('')).toBeNull();
    expect(parseItemId('   ')).toBeNull();
  });

  it('rejects a repeated param (array) — never queries a junk id', () => {
    expect(parseItemId(['1', '2'])).toBeNull();
    expect(parseItemId([])).toBeNull();
  });

  it('rejects non-numeric, negative, zero, and fractional ids', () => {
    expect(parseItemId('abc')).toBeNull();
    expect(parseItemId('1abc')).toBeNull();
    expect(parseItemId('-5')).toBeNull();
    expect(parseItemId('0')).toBeNull();
    expect(parseItemId('1.5')).toBeNull();
    expect(parseItemId('NaN')).toBeNull();
    expect(parseItemId('1e3')).toBeNull();
  });

  it('rejects an unsafe-large integer', () => {
    expect(parseItemId('99999999999999999999')).toBeNull();
  });
});

describe('studioHref (canonical studio deep link)', () => {
  it('builds ?id= for a real garment', () => {
    expect(studioHref(5)).toBe('/studio?id=5');
  });

  it('falls back to a bare /studio for no / invalid id (resolves first item)', () => {
    expect(studioHref(null)).toBe('/studio');
    expect(studioHref(undefined)).toBe('/studio');
    expect(studioHref(0)).toBe('/studio');
    expect(studioHref(-1)).toBe('/studio');
  });
});

describe('itemHref', () => {
  it('builds the canonical item-detail link', () => {
    expect(itemHref(9)).toBe('/item?id=9');
  });
});

describe('exitTo (#47 D-4 modal / return exit)', () => {
  it('goes back when there is history (returns to the originating surface)', () => {
    expect(exitTo(true)).toEqual<ExitDecision>({ action: 'back' });
  });

  it('replaces to the wardrobe when there is nothing behind (no dead end)', () => {
    expect(exitTo(false)).toEqual<ExitDecision>({
      action: 'replace',
      route: WARDROBE_HREF,
    });
  });

  it('honors a custom fallback route', () => {
    expect(exitTo(false, CAPTURE_HREF)).toEqual<ExitDecision>({
      action: 'replace',
      route: CAPTURE_HREF,
    });
  });
});
