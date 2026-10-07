/**
 * JS bridge unit tests for modules/vw-background-removal (issue #84).
 *
 * `requireOptionalNativeModule` is called at module load time, so each scenario
 * that needs a different module presence isolates itself with `jest.resetModules()`
 * and a fresh dynamic import.
 */

// ─── helpers ───────────────────────────────────────────────────────────────

type BridgeModule = {
  removeBackgroundAsync: (uri: string) => Promise<{ uri: string; removed: boolean }>;
  isAvailable: boolean;
};

const INPUT_URI = 'file:///photos/input.jpg';
const OUTPUT_URI = 'file:///caches/vw-bg-removed-abc.png';

/**
 * Re-import the bridge module after setting up the mock for
 * `expo-modules-core`.  `requireOptionalNativeModule` is replaced by a factory
 * that returns `nativeImpl` (or `null` when called with `null`).
 */
async function loadBridge(
  nativeImpl: { removeBackground: jest.Mock } | null,
): Promise<BridgeModule> {
  jest.resetModules();
  jest.doMock('expo-modules-core', () => ({
    requireOptionalNativeModule: () => nativeImpl,
  }));
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('../../modules/vw-background-removal') as BridgeModule;
}

// ─── module unavailable ─────────────────────────────────────────────────────

describe('removeBackgroundAsync — module unavailable (Expo Go / not linked)', () => {
  let bridge: BridgeModule;

  beforeAll(async () => {
    bridge = await loadBridge(null);
  });

  it('isAvailable is false', () => {
    expect(bridge.isAvailable).toBe(false);
  });

  it('resolves to { uri: input, removed: false } without calling native', async () => {
    await expect(bridge.removeBackgroundAsync(INPUT_URI)).resolves.toEqual({
      uri: INPUT_URI,
      removed: false,
    });
  });
});

// ─── module present — success path ──────────────────────────────────────────

describe('removeBackgroundAsync — valid result from native', () => {
  let bridge: BridgeModule;
  let mockRemoveBackground: jest.Mock;

  beforeAll(async () => {
    mockRemoveBackground = jest.fn().mockResolvedValue({ uri: OUTPUT_URI, removed: true });
    bridge = await loadBridge({ removeBackground: mockRemoveBackground });
  });

  it('isAvailable is true', () => {
    expect(bridge.isAvailable).toBe(true);
  });

  it('passes the input URI to the native method', async () => {
    await bridge.removeBackgroundAsync(INPUT_URI);
    expect(mockRemoveBackground).toHaveBeenCalledWith(INPUT_URI);
  });

  it('returns the cutout URI and removed: true', async () => {
    await expect(bridge.removeBackgroundAsync(INPUT_URI)).resolves.toEqual({
      uri: OUTPUT_URI,
      removed: true,
    });
  });
});

// ─── module present — passthrough result (removed: false) ───────────────────

describe('removeBackgroundAsync — native returns removed: false (no subject / unsupported OS)', () => {
  let bridge: BridgeModule;

  beforeAll(async () => {
    const mock = jest.fn().mockResolvedValue({ uri: INPUT_URI, removed: false });
    bridge = await loadBridge({ removeBackground: mock });
  });

  it('propagates the original URI and removed: false', async () => {
    await expect(bridge.removeBackgroundAsync(INPUT_URI)).resolves.toEqual({
      uri: INPUT_URI,
      removed: false,
    });
  });
});

// ─── module present — malformed result ──────────────────────────────────────

describe('removeBackgroundAsync — malformed result from native', () => {
  it('falls back to original URI when result has no uri string', async () => {
    const mock = jest.fn().mockResolvedValue({ removed: true }); // missing uri
    const bridge = await loadBridge({ removeBackground: mock });
    await expect(bridge.removeBackgroundAsync(INPUT_URI)).resolves.toEqual({
      uri: INPUT_URI,
      removed: false,
    });
  });

  it('falls back when result is null', async () => {
    const mock = jest.fn().mockResolvedValue(null);
    const bridge = await loadBridge({ removeBackground: mock });
    await expect(bridge.removeBackgroundAsync(INPUT_URI)).resolves.toEqual({
      uri: INPUT_URI,
      removed: false,
    });
  });

  it('coerces a truthy non-boolean removed to true', async () => {
    const mock = jest.fn().mockResolvedValue({ uri: OUTPUT_URI, removed: 1 });
    const bridge = await loadBridge({ removeBackground: mock });
    await expect(bridge.removeBackgroundAsync(INPUT_URI)).resolves.toEqual({
      uri: OUTPUT_URI,
      removed: true,
    });
  });

  it('coerces a falsy non-boolean removed to false', async () => {
    const mock = jest.fn().mockResolvedValue({ uri: OUTPUT_URI, removed: 0 });
    const bridge = await loadBridge({ removeBackground: mock });
    await expect(bridge.removeBackgroundAsync(INPUT_URI)).resolves.toEqual({
      uri: OUTPUT_URI,
      removed: false,
    });
  });
});

// ─── module present — native rejection ──────────────────────────────────────

describe('removeBackgroundAsync — native call rejects', () => {
  it('resolves to original URI and removed: false instead of propagating the error', async () => {
    const mock = jest.fn().mockRejectedValue(new Error('ML Kit error'));
    const bridge = await loadBridge({ removeBackground: mock });
    await expect(bridge.removeBackgroundAsync(INPUT_URI)).resolves.toEqual({
      uri: INPUT_URI,
      removed: false,
    });
  });

  it('handles a non-Error rejection (string) without throwing', async () => {
    const mock = jest.fn().mockRejectedValue('model not available');
    const bridge = await loadBridge({ removeBackground: mock });
    await expect(bridge.removeBackgroundAsync(INPUT_URI)).resolves.toEqual({
      uri: INPUT_URI,
      removed: false,
    });
  });
});
