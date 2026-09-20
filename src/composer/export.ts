import { Platform } from 'react-native';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { compose, resolveGarmentUri, type ExportInput, type ExportOutput } from './compose';

// Platform export. Web composites body+garment to a canvas data URI; native
// degrades to the garment image itself (expo-image-manipulator in SDK 57 has no
// two-image compose action — see decision D21.3). The pure `compose` core lives
// in compose.ts and is unit-tested; this module wires the platform bits.

// Web: a real composite to a data URI.
function compositeOnWeb(input: ExportInput, w: number, h: number): ExportOutput {
    try {
        const uri = compose(
            input,
            w,
            h,
             () => document.createElement('canvas') as unknown as {
                 width: number;
                height: number;
                getContext: (k: string) => never;
                toDataURL: () => string;
             },
        );
        return { kind: 'composite', outputPath: uri };
      } catch (e) {
        return { kind: 'composite', outputPath: '', error: String(e) };
      }
}

// Native: degrade to the garment image via the manipulator (single-image only).
// Uses the legacy `manipulateAsync` shape since the new context API needs a
// shared ref we don't have at export time.
async function garmentOnNative(input: ExportInput): Promise<ExportOutput> {
    const gUri = resolveGarmentUri(input.garmentSource);
    if (!gUri) return { kind: 'garment', outputPath: '', error: 'no garment to export' };
    try {
        const out = await manipulateAsync(gUri, [], {
            format: SaveFormat.JPEG,
            compress: 0.9,
            base64: false,
           });
        return { kind: 'garment', outputPath: out.uri };
      } catch (e) {
        return { kind: 'garment', outputPath: '', error: `native export failed: ${String(e)}` };
      }
}

export async function exportTryOn(
    input: ExportInput,
    size: { w: number; h: number } = { w: 720, h: 960 },
): Promise<ExportOutput> {
    if (Platform.OS === 'web') return compositeOnWeb(input, size.w, size.h);
    return garmentOnNative(input);
}

// Download a data URI on web (native "Save to Photos" uses the share sheet /
// media library, not a download).
export function downloadDataUri(dataUri: string, filename = 'look.jpg'): void {
    if (Platform.OS !== 'web') return;
    const a = document.createElement('a');
    a.href = dataUri;
    a.download = filename;
    a.click();
}

export { compose, resolveGarmentUri, type ExportInput, type ExportOutput } from './compose';
