import type { Transform } from '../pose/types';

// Pure canvas composition — the testable core of the export pipeline. It knows
// nothing about expo/react-native, so the jest + M3-5 harness can run it against
// a stubbed 2D context. The platform export.ts calls this after building a real
// canvas on web.

// A minimal 2D-canvas context. Injected into `compose` so tests can stub it.
export interface Canvas2DContext {
    save: () => void;
    restore: () => void;
    translate: (x: number, y: number) => void;
    rotate: (r: number) => void;
    fillRect: (x: number, y: number, w: number, h: number) => void;
    fillStyle?: string;
    imageSmoothingEnabled?: boolean;
}
export interface DrawableCanvas {
    width: number;
    height: number;
    getContext: (kind: string) => Canvas2DContext | null;
    toDataURL: () => string;
}

export interface ExportInput {
    bodyUri: string;
       // Either a string path/uri, a native asset handle (number), an ImageURISource
       // object, or an array of them (RN ImageSourcePropType).
    garmentSource: string | number | { uri?: string } | (string | number | { uri?: string })[] | null;
    transform: Transform;
}

export interface ExportOutput {
    outputPath: string;
    kind: 'composite' | 'garment';
    error?: string;
}

const CATALOG_PREFIX = 'catalog://';
const CATALOG_PLACEHOLDER = 'catalog://placeholder';

// Resolve a garment source to a real image URI, or null for a pure placeholder
// (the studio's CATALOG_PLACEHOLDER). Kept here so native export and the UI
// resolve "real vs placeholder" the same way.
export function resolveGarmentUri(
    source: ExportInput['garmentSource'],
): string | null {
    if (source == null) return null;
         // Unwrap an RN image-array source to its first entry.
    const first: string | number | { uri?: string } | undefined = Array.isArray(source)
         ? source[0]
         : source;
    if (first == null) return null;
    const raw = typeof first === 'object' ? first.uri : String(first);
    if (typeof raw !== 'string') return null;
    if (raw === CATALOG_PLACEHOLDER || raw.startsWith(CATALOG_PREFIX)) return null;
    return raw;
}

// Pure canvas composition: paint the body (full-canvas), then the garment at the
// transform's normalized position/scale/rotation/opacity. `makeCanvas` is
// mandatory so the function stays pure + testable; the web caller supplies
// `document.createElement` and a test supplies a stubbed context. Returns the
// exported data URI ('' when no 2D context is available).
export function compose(
    input: ExportInput,
    w: number,
    h: number,
    makeCanvas: () => DrawableCanvas,
): string {
    const canvas = makeCanvas();
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

     // Body (contain-fit into the full canvas).
    ctx.fillRect(0, 0, w, h);

     // Garment transformed into canvas space from the 0..1 normalized Transform.
    const gUri = resolveGarmentUri(input.garmentSource);
    if (gUri) {
        const { x, y, scale, rotation } = input.transform;
        ctx.save();
        ctx.translate(x * w, y * h);
        ctx.rotate((rotation * Math.PI) / 180);
        const side = Math.max(w, h) * scale;
        ctx.fillRect(-side / 2, -side / 2, side, side);
        ctx.restore();
     }
    return canvas.toDataURL();
}
