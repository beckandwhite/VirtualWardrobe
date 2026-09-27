import {
  shouldPush,
  DOUBLE_PUSH_WINDOW_MS,
  type PushRecord,
} from '../../src/navigation/pushGuard';

// M3-17 (#47) double-push guard. The pure decision the useGuardedPush hook wires to
// the router: an identical target repeated inside the window is dropped so no
// duplicate screen is stacked, while a different target (or the same one later)
// proceeds.

const fresh: PushRecord = { target: null, at: 0 };

describe('shouldPush', () => {
  it('allows the first push (no prior target)', () => {
    expect(shouldPush(fresh, '/studio?id=1', 1000)).toBe(true);
  });

  it('drops an identical target repeated within the window (double-tap)', () => {
    const prev: PushRecord = { target: '/studio?id=1', at: 1000 };
    expect(shouldPush(prev, '/studio?id=1', 1000 + 100)).toBe(false);
    expect(
      shouldPush(prev, '/studio?id=1', 1000 + DOUBLE_PUSH_WINDOW_MS - 1),
    ).toBe(false);
  });

  it('allows the same target again once the window has elapsed', () => {
    const prev: PushRecord = { target: '/studio?id=1', at: 1000 };
    expect(
      shouldPush(prev, '/studio?id=1', 1000 + DOUBLE_PUSH_WINDOW_MS),
    ).toBe(true);
    expect(shouldPush(prev, '/studio?id=1', 5000)).toBe(true);
  });

  it('always allows a different target, even back-to-back', () => {
    const prev: PushRecord = { target: '/studio?id=1', at: 1000 };
    expect(shouldPush(prev, '/studio?id=2', 1000 + 1)).toBe(true);
    expect(shouldPush(prev, '/capture', 1000 + 1)).toBe(true);
  });

  it('honors a custom window', () => {
    const prev: PushRecord = { target: '/item?id=3', at: 0 };
    expect(shouldPush(prev, '/item?id=3', 50, 100)).toBe(false);
    expect(shouldPush(prev, '/item?id=3', 150, 100)).toBe(true);
  });
});
