import {
   buildDraftFromCapture,
   captureNextStep,
   DRAFT_HINTS,
   type DraftHint,
} from '../../src/capture/draft';

// The add-item flow (app/capture.tsx): takePhoto → build a draft Item → insert →
// replace /wardrobe; on a null result, reset busy and don't navigate. The draft
// shape + the next-step decision live in src/capture/draft.ts (the single source
// of truth the screen imports), so these tests exercise that pure logic without a
// store or router — M4-2 AC1 (capture→wardrobe transition) + AC3 (device-free).

const libResult = { uri: 'file:///captures/a.jpg', source: 'library' as const };

describe('buildDraftFromCapture', () => {
   it('returns null when nothing was captured (cancel / denial / throw)', () => {
      expect(buildDraftFromCapture(null)).toBeNull();
      expect(buildDraftFromCapture(null, 'top')).toBeNull();
     });

   it('builds a M1-1 draft (type "other", default color, draft tags) from a library capture', () => {
      const draft = buildDraftFromCapture(libResult);
      expect(draft).toEqual({
        type: 'other',
        name: 'New item',
        color: 'unknown',
        tags: ['draft', 'library'],
        imagePath: libResult.uri,
        thumbnailPath: libResult.uri,
        });
     });

   it('appends the hint chip as a tag when one is selected', () => {
      const draft = buildDraftFromCapture(libResult, 'dress');
      expect(draft?.tags).toEqual(['draft', 'library', 'dress']);
     });

   it('omits the hint tag when no chip is selected (empty string)', () => {
      const draft = buildDraftFromCapture(libResult, '');
      expect(draft?.tags).toEqual(['draft', 'library']);
     });

   it('tags a camera capture with the "camera" source, not "library"', () => {
      const cam = { uri: 'file:///captures/c.jpg', source: 'camera' as const };
      expect(buildDraftFromCapture(cam)?.tags).toEqual(['draft', 'camera']);
     });

   it('offers exactly the six garment hint chips the capture screen shows', () => {
      expect([...DRAFT_HINTS].sort()).toEqual(
          ['bottom', 'dress', 'outerwear', 'shoes', 'top', 'other'].sort(),
       );
      expect(DRAFT_HINTS).toContain('top' as DraftHint);
     });
});

describe('captureNextStep', () => {
   it('resets busy and does not navigate when the draft is null', () => {
      expect(captureNextStep(null)).toEqual({ navigate: false, route: null });
     });

   it('navigates to the wardrobe when a draft was built', () => {
      const draft = buildDraftFromCapture(libResult, 'top');
      const next = captureNextStep(draft);
      expect(next.navigate).toBe(true);
      if (next.navigate) expect(next.route).toBe('/wardrobe');
     });
});
