import type { ShareResult } from './share';

// The studio's save/share notice logic, extracted into a node/jest-importable
// module (no react-native / expo-reactive imports) so QA-2 can assert the
// "save & share / error rendering" branch without a UI. The studio's `share()`
// and `persist()` set a `notice` (`info`/`error`) from the composer result — the
// mapping below is exactly that surface, the gap the composer suites
// (transform.test.ts / export.test.ts) do not cover (those assert geometry, not
// the notice). QA-2 / D29.5.
export type StudioNotice = { kind: 'info' | 'error'; text: string } | null;

// A persisted look must exist before a share starts; the studio returns early on a
// null row, sharing nothing. (This is the "nothing to share" guard.)
export function canShareRow(row: SharedRow | null): row is SharedRow {
    return row !== null;
}

// The minimal row the share step reads structurally (a `TryOn`/ShareResult carry
// this). A row with no output path cannot be shared.
export interface SharedRow {
    outputPath: string | null;
}

// The studio's error surface for a failed export/save — the `notice` set in
// `studio.tsx`'s `persist` catch. The M2-3 contract (D21.3): a failed export is
// never silent, always a red error notice.
export const EXPORT_ERROR_NOTICE: StudioNotice = {
    kind: 'error',
    text: 'Export failed — try again.',
};

// The notice the studio renders from a completed share. Mirrors `share()`:
//   'error'      → a red error notice
//   'downloaded' → a green info notice naming the downloaded image
//   'shared'      → a green info notice
export function noticeForShare(result: Pick<ShareResult, 'kind'>): StudioNotice {
    if (result.kind === 'error') return { kind: 'error', text: 'Share failed.' };
    return {
        kind: 'info',
        text: result.kind === 'downloaded' ? 'Look saved — downloaded image.' : 'Look saved.',
     };
}
