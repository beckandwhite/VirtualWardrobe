import { compose, resolveGarmentUri, type ExportInput } from '../../src/composer/compose';

// A stubbed 2D-canvas that records every fillRect so the test can assert which
// layers the pipeline drew, and into what rects. This is the seam M3-5's e2e
// harness uses in place of a real browser canvas.
function makeStubCanvas() {
    const calls: { type: string; args: number[] }[] = [];
    const ctx = {
       save: () => {},
       restore: () => {},
       translate: (x: number, y: number) => calls.push({ type: 'translate', args: [x, y] }),
       rotate: (r: number) => calls.push({ type: 'rotate', args: [r] }),
       fillRect: (x: number, y: number, w: number, h: number) =>
          calls.push({ type: 'fillRect', args: [x, y, w, h] }),
       fillStyle: '' as string,
       imageSmoothingEnabled: true,
       __calls: calls,
    };
    const canvas = {
       width: 0,
       height: 0,
       getContext: () => ctx,
       toDataURL: () => 'data:image/png;base64,STUB',
     };
    return { canvas: canvas as never, ctx: ctx as never, calls };
}

const bodyUri = 'body://photo';
const garmentUri = 'assets://shirt.png';
const W = 720;
const H = 960;

describe('resolveGarmentUri', () => {
    it('returns the real uri for a real path', () => {
       expect(resolveGarmentUri(garmentUri)).toBe(garmentUri);
       expect(resolveGarmentUri({ uri: garmentUri })).toBe(garmentUri);
    });
    it('returns null for the catalog placeholder', () => {
       expect(resolveGarmentUri('catalog://placeholder')).toBeNull();
       expect(resolveGarmentUri('catalog://other')).toBeNull();
       expect(resolveGarmentUri(null)).toBeNull();
       expect(resolveGarmentUri({ uri: undefined })).toBeNull();
    });
});

describe('compose', () => {
    it('draws the body full-canvas then the garment at the transformed rect', () => {
       const stub = makeStubCanvas();
       const input: ExportInput = {
          bodyUri,
          garmentSource: garmentUri,
          transform: { x: 0.5, y: 0.3, scale: 1, rotation: 0, opacity: 1 },
        };
       const out = compose(input, W, H, () => stub.canvas);
       expect(out).toBe('data:image/png;base64,STUB');

       // First fillRect is the body, full canvas.
       expect(stub.calls[0]).toEqual({
          type: 'fillRect',
          args: [0, 0, W, H],
       });
       // Garment is translated to (x*w, y*h) = (360, 288).
       const translate = stub.calls.find((c) => c.type === 'translate');
       expect(translate).toEqual({ type: 'translate', args: [360, 288] });
       // Garment side = max(W,H)*scale = 960, centered rect (-480,-480,960,960).
       const garmentRect = stub.calls
          .filter((c) => c.type === 'fillRect')
          .find((c) => c.args[2] === 960);
       expect(garmentRect).toEqual({
          type: 'fillRect',
          args: [-480, -480, 960, 960],
       });
    });

    it('skips the garment layer for a placeholder source', () => {
       const stub = makeStubCanvas();
       const input: ExportInput = {
          bodyUri,
          garmentSource: 'catalog://placeholder',
          transform: { x: 0.5, y: 0.5, scale: 1, rotation: 0, opacity: 1 },
       };
       compose(input, W, H, () => stub.canvas);
       // Only the body fillRect, no translate/rotate for a garment.
       expect(stub.calls.filter((c) => c.type === 'fillRect')).toHaveLength(1);
       expect(stub.calls.find((c) => c.type === 'translate')).toBeUndefined();
    });

    it('rotates the garment when rotation is non-zero', () => {
       const stub = makeStubCanvas();
       const input: ExportInput = {
          bodyUri,
          garmentSource: garmentUri,
          transform: { x: 0.5, y: 0.5, scale: 1, rotation: 180, opacity: 1 },
       };
       compose(input, W, H, () => stub.canvas);
       const rotate = stub.calls.find((c) => c.type === 'rotate');
       expect(rotate?.args[0]).toBeCloseTo(Math.PI, 5); // 180deg → π rad
    });
});
