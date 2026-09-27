import { resolveBodySource } from '@/studio/bodySource';

// M7-5 Part C: the studio seeds its try-on body from the saved person photo
// (`person_photo_uri`), falling back to the bundled sample when unset, and a
// per-session "Pick photo" override still wins. The decision is factored into
// the pure `resolveBodySource` so all three cases are assertable without a store
// or a mounted screen. `sample` stands in for the bundled asset (a require id).
const sample = { __sample: 'bundled-body' } as unknown as number;

describe('resolveBodySource (studio body-photo seed)', () => {
  it('resolves to the saved person photo uri when one is set', () => {
    expect(resolveBodySource('file://me.jpg', sample)).toEqual({
      uri: 'file://me.jpg',
    });
  });

  it('falls back to the bundled sample when the saved uri is unset or empty', () => {
    expect(resolveBodySource(null, sample)).toBe(sample);
    expect(resolveBodySource(undefined, sample)).toBe(sample);
    expect(resolveBodySource('', sample)).toBe(sample);
  });

  it('lets a per-session Pick photo override replace the seeded body', () => {
    // Seed from the saved photo...
    const seeded = resolveBodySource('file://saved.jpg', sample);
    expect(seeded).toEqual({ uri: 'file://saved.jpg' });
    // ...then the user picks a new photo. The picker routes through the same
    // resolver, applied after the seed, so the picked uri wins.
    const overridden = resolveBodySource('file://picked.jpg', sample);
    expect(overridden).toEqual({ uri: 'file://picked.jpg' });
    expect(overridden).not.toEqual(seeded);
  });
});
