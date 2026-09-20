import { Platform } from 'react-native';
import * as Sharing from 'expo-sharing';
import { r } from '@/store';
import type { TryOn, ItemCategory } from '@/store';
import { exportTryOn, downloadDataUri, type ExportOutput } from './export';
import { serializeTransform } from './transform';
import type { Transform } from '@/pose';

/**
 * M3-2 unified share sheet. Both the studio (M2-3) and the Looks gallery call
 * `shareLook` — no duplicated sharing logic. Studio passes a live garment+
 * transform (persisted first if needed); gallery passes an already-persisted
 * `TryOn` row.
 */

export type ShareResult =
    | { kind: 'shared'; look: TryOn; output: ExportOutput }
    | { kind: 'downloaded'; look: TryOn; output: ExportOutput }
    | { kind: 'error'; look: TryOn; output: ExportOutput; error: string };

const SHARING_CANCELLED = 'SHARING_CANCELLED';

// Decide the cross-platform branch for a finished ExportOutput without touching
// the platform itself — pure, callable from node tests. Web = download the
// data URI; native = `expo-sharing` (iOS/Android save to the media library).
export function shareKindFor(
    os: 'web' | 'ios' | 'android' | 'harmony',
    out: ExportOutput,
): 'download' | 'sheet' | 'error' {
    if (!out.outputPath) return 'error';
    if (os === 'web') return 'download';
    return 'sheet';
}

// Resolve an existing look's transform back to a live Transform value for re-edit.
export function reopenTransform(raw: string): Transform {
    try {
        return JSON.parse(raw) as Transform;
    } catch {
        return { x: 0.5, y: 0.5, scale: 0.5, rotation: 0, opacity: 1 };
    }
}

/**
 * Shared share path. Takes an already-persisted `TryOn` row and dispatches to
 * the platform share sheet. Both the studio and gallery call this after
 * `persistLook`, so they use the same share sheet — no duplicated code.
 */
export async function shareLook(row: TryOn): Promise<ShareResult> {
    if (!row.outputPath) {
       return {
          kind: 'error',
          look: row,
          output: { kind: 'garment', outputPath: '', error: 'no output path' },
          error: 'no output path',
        };
    }
    if (Platform.OS === 'web') {
        downloadDataUri(row.outputPath);
        return { kind: 'downloaded', look: row, output: { kind: 'composite', outputPath: row.outputPath } };
    }
    try {
        await Sharing.shareAsync(row.outputPath);
        return { kind: 'shared', look: row, output: { kind: 'garment', outputPath: row.outputPath } };
    } catch (e) {
        if ((e as { code?: string })?.code === SHARING_CANCELLED) {
            // Cancellation is not an error; the look was still persisted.
            return { kind: 'shared', look: row, output: { kind: 'garment', outputPath: row.outputPath } };
        }
        console.error('shareLook: sharing failed', e);
        return {
            kind: 'error',
            look: row,
            output: { kind: 'garment', outputPath: row.outputPath, error: String(e) },
            error: String(e),
         };
     }
}

/**
 * Persist a live garment+transform into a TryOn row using the M2-3 composer
 * pipeline. Both the studio's `save & share` and the gallery's "re-export"
 * paths flow through this — one code path for both.
 */
export async function persistLook(
     {
       garment,
       bodyPath,
       transform,
       dims,
      }: {
      garment: { id: number; type: ItemCategory; name: string; imagePath: string; inWardrobe: boolean };
      bodyPath: string;
      transform: Transform;
      dims?: { w: number; h: number };
     },
): Promise<TryOn> {
    const out = await exportTryOn(
         {
            bodyUri: bodyPath,
            garmentSource: garment.inWardrobe ? garment.imagePath : { uri: garment.imagePath },
            transform,
           },
     dims ?? { w: 720, h: 960 },
     );
    if (out.error || !out.outputPath) throw new Error(out.error ?? 'export produced no image');

     let itemId: number;
    if (garment.inWardrobe) {
      itemId = garment.id;
    } else {
      const inserted = await r.insertItem({
        type: garment.type,
        name: garment.name,
        color: 'unknown',
        tags: ['catalog'],
        imagePath: garment.imagePath,
       });
      itemId = inserted.id;
     }
    const body = await r.insertBodyPhoto(bodyPath);
    return r.insertTryOn(body.id, itemId, serializeTransform(transform), out.outputPath);
}

/**
 * Delete a saved look: remove the TryOn row. Best-effort: the referenced Item
 * and BodyPhoto are *kept* (per M3-2 AC). No image GC for MVP; tracked as a
 * follow-up in the M3-2 issue.
 */
export async function deleteLook(
        id: number,
): Promise<void> {
    await r.deleteTryOn(id);
}
