import { Platform } from 'react-native';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { resolveGarmentUri, type ExportInput, type ExportOutput } from './compose';

// Platform export. Web composites body+garment via canvas drawImage; native
// degrades to the garment image itself (expo-image-manipulator in SDK 57 has no
// two-image compose action — see decision D21.3). The pure `compose` core in
// compose.ts is used only by unit tests (it stubs fillRect so tests can verify
// transform math without a real browser canvas).

// Load a DOM Image from a URI. Rejects on failure; callers degrade gracefully.
function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new (window.Image as typeof HTMLImageElement)();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error(`img load failed: ${src.slice(0, 80)}`));
        img.src = src;
    });
}

// Web: a real canvas composite using drawImage so the output is a visible JPEG,
// not a placeholder fillRect (which compose.ts draws for unit-test purposes).
async function compositeOnWeb(input: ExportInput, w: number, h: number): Promise<ExportOutput> {
    try {
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) return { kind: 'composite', outputPath: '', error: 'no 2d context' };
        ctx.imageSmoothingEnabled = true;

        // Body layer: contain-fit. Falls back to a light-grey fill when the body
        // URI is the 'sample://body' sentinel (no photo picked yet) or unreachable.
        const bodyUri = input.bodyUri;
        const isRealUri = !!bodyUri && !bodyUri.startsWith('sample://');
        if (isRealUri) {
            try {
                const img = await loadImage(bodyUri);
                const scale = Math.min(w / img.width, h / img.height);
                const bw = img.width * scale;
                const bh = img.height * scale;
                ctx.drawImage(img, (w - bw) / 2, (h - bh) / 2, bw, bh);
            } catch {
                ctx.fillStyle = '#f0f0f0';
                ctx.fillRect(0, 0, w, h);
            }
        } else {
            ctx.fillStyle = '#f0f0f0';
            ctx.fillRect(0, 0, w, h);
        }

        // Garment layer: apply the normalized 0..1 Transform (translate, rotate,
        // scale, opacity) exactly as the studio overlay does on screen.
        const gUri = resolveGarmentUri(input.garmentSource);
        if (gUri) {
            try {
                const img = await loadImage(gUri);
                const { x, y, scale, rotation, opacity } = input.transform;
                const side = Math.max(w, h) * scale;
                ctx.save();
                ctx.globalAlpha = Math.max(0, Math.min(1, opacity));
                ctx.translate(x * w, y * h);
                ctx.rotate((rotation * Math.PI) / 180);
                ctx.drawImage(img, -side / 2, -side / 2, side, side);
                ctx.restore();
            } catch {
                // Garment URI unreachable — export body-only rather than failing.
            }
        }

        return { kind: 'composite', outputPath: canvas.toDataURL('image/jpeg', 0.9) };
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

export { resolveGarmentUri, type ExportInput, type ExportOutput } from './compose';
