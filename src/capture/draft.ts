import type { NewItem } from '@/store';
import type { CaptureResult } from '@/capture';

// The add-item flow, extracted so it unit-tests without a store or a router.
//
// `app/capture.tsx`'s `captureAndSave` does, on a successful capture:
//   tags = ['draft', <source>, ...(hint ? <hint>)]  →
//   r.insertItem({ type:'other', name:'New item', color:'unknown', tags,
//                  imagePath: result.uri, thumbnailPath: result.uri })  →
//   router.replace('/wardrobe').
// On `!result` (cancel / denial / throw) it only does `setBusy(false)` — no
// insert, no navigation (M1-1 draft shape per D19.5: type 'other' + default color).
//
// `buildDraftFromCapture` returns the insertion input for a real result, or `null`
// when there is nothing to save — the null is exactly the screen's "don't insert,
// don't navigate" branch, so the two diverge on the same decision. M4-2 / D29.3.

// The valid chip values the capture screen offers (M1-1 hint row). The screen's
// `hint` state is a `string` (empty = no chip); the chips it can hold are this
// set, so a non-empty `hint` is always one of these.
export const DRAFT_HINTS = [
      'top',
      'bottom',
      'dress',
      'outerwear',
      'shoes',
      'other',
    ] as const;
export type DraftHint = (typeof DRAFT_HINTS)[number];

export function buildDraftFromCapture(
    result: CaptureResult | null,
    hint: string = '',
): NewItem | null {
    if (!result) return null;
    const tags = ['draft', result.source];
    if (hint) tags.push(hint);
    return {
        type: 'other',
        name: 'New item',
        color: 'unknown',
        tags,
        imagePath: result.uri,
        thumbnailPath: result.uri,
     };
}

// The screen's "save failed / nothing captured" decision as a pure step: a null
// draft is never inserted or navigated away, so a capture error (cancel / denial
// / thrown save) never lands the user in the wardrobe on an unsaved item. The
// screen resets `busy` on that branch; this helper decides only navigation. The
// `route` carries a typed literal so the screen's `router.replace` keeps its
// strong `Href` type.
export type CaptureNext =
       | { navigate: false; route: null }
       | { navigate: true; route: '/wardrobe' };

export function captureNextStep(draft: NewItem | null): CaptureNext {
    return draft ? { navigate: true, route: '/wardrobe' } : { navigate: false, route: null };
}
