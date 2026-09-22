import {
   noticeForShare,
   EXPORT_ERROR_NOTICE,
   canShareRow,
   type StudioNotice,
} from '../../src/composer/notice';

// The studio's "save & share" flow + error rendering (app/studio.tsx). The
// transform math (clampTransform / autoTransformFor / serialize) and the export
// geometry (compose) are already regression-tested in
// tests/composer/transform.test.ts and tests/composer/export.test.ts — this suite
// covers what those do not: the *notice the screen renders* from a share result
// and from an export failure. That mapping lives in src/composer/notice.ts
// (node-importable), so it asserts the error-rendering branch without a UI —
// M4-2 AC4 (critical studio controls by regression) + AC1 (save/share transition).

describe('noticeForShare', () => {
   it('renders an info notice for a downloaded look (web share)', () => {
      const notice = noticeForShare({ kind: 'downloaded' });
      expect(notice?.kind).toBe('info');
      expect(notice?.text).toContain('downloaded image');
     });

   it('renders an info notice for a shared look (native share sheet)', () => {
      expect(noticeForShare({ kind: 'shared' })?.text).toBe('Look saved.',);
     });

   it('renders an error notice when the share fails', () => {
      const notice = noticeForShare({ kind: 'error' });
      expect(notice?.kind).toBe('error');
      expect(notice?.text).toContain('Share failed');
     });
});

describe('EXPORT_ERROR_NOTICE', () => {
   it('is a red error notice so a failed export is never silent', () => {
      expect(EXPORT_ERROR_NOTICE?.kind).toBe('error');
      expect(EXPORT_ERROR_NOTICE?.text).toContain('Export failed');
     });
});

describe('canShareRow', () => {
   it('shares a persisted look and guards against a null row', () => {
      expect(canShareRow({ outputPath: 'file:///out.jpg' })).toBe(true);
      expect(canShareRow({ outputPath: null })).toBe(true);
      expect(canShareRow(null)).toBe(false);
     });
});

// The full save→share decision end to end, without a UI: a persistent row is
// required to start a share (the studio's `if (!row) return`), a null row is the
// "nothing to share" branch, and a present row maps to a notice by its kind.
function shareOutcome(
    persistedRow: { outputPath: string | null } | null,
    shareResult: { kind: 'shared' | 'downloaded' | 'error' },
): StudioNotice {
    if (!canShareRow(persistedRow)) return null;
    return noticeForShare(shareResult);
}

describe('save & share decision (device-free)', () => {
   it('shares nothing when persistence produced no look', () => {
      expect(shareOutcome(null, { kind: 'shared' })).toBeNull();
     });

   it('renders the downloaded-image notice on a successful web share', () => {
      expect(shareOutcome({ outputPath: 'file:///o.jpg' }, { kind: 'downloaded' })?.text)
         .toContain('downloaded image');
     });

   it('renders a share error notice when sharing fails after a successful persist', () => {
      expect(shareOutcome({ outputPath: 'file:///o.jpg' }, { kind: 'error' })?.kind).toBe('error');
     });
});
