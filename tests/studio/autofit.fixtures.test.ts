import { computeBoxForKeypoints } from '../../src/composer/autoBox';
import {
  AUTOFIT_FIXTURES,
  AUTOFIT_TOLERANCE,
  failingDimensions,
  type Box,
} from '../fixtures/autofit/fixtures';

// ─────────────────────────────────────────────────────────────────────────────
// M7-6 auto-fit SPIKE fixtures, now consumed by the M7-7 implementation.
//
// Two suites:
//  1. LIVE characterization: exercises the composer on every fixture and asserts
//     horizontal alignment + graceful degradation, and locks the measured gap
//     (`currentStatus`, now [] for every case after M7-7's per-type placement).
//  2. "M7-7 quality bar": asserts every non-degenerate fixture MEETS the bar on
//     every dimension. This was the red→green target; it is now enabled and green.
// ─────────────────────────────────────────────────────────────────────────────

// M7-7: the composer now returns a rotation on the box (body-line angle), so the
// suites score the placement's OWN rotation rather than a hard-coded 0.
type PlacedBox = Box & { rotation: number };

describe('M7-6 auto-fit fixtures — live characterization (current model)', () => {
  it('exposes a non-empty, well-formed fixture set', () => {
    expect(AUTOFIT_FIXTURES.length).toBeGreaterThan(0);
    for (const c of AUTOFIT_FIXTURES) {
      expect(c.keypoints.length).toBeGreaterThan(0);
      for (const k of c.keypoints) {
        expect(k.x).toBeGreaterThanOrEqual(0);
        expect(k.x).toBeLessThanOrEqual(1);
        expect(k.y).toBeGreaterThanOrEqual(0);
        expect(k.y).toBeLessThanOrEqual(1);
      }
    }
  });

  for (const c of AUTOFIT_FIXTURES) {
    describe(c.id, () => {
      const actual = computeBoxForKeypoints(c.keypoints, c.garmentType) as PlacedBox | null;

      if (c.expected === null) {
        it('degrades: no confident placement', () => {
          expect(actual).toBeNull();
        });
        return;
      }

      it('produces a placement', () => {
        expect(actual).not.toBeNull();
      });

      it('meets the HORIZONTAL bar (the strong axis)', () => {
        const fails = failingDimensions(actual as PlacedBox, (actual as PlacedBox).rotation, c.expected!);
        expect(fails).not.toContain('horizontal');
      });

      it('matches the documented current gap (locks the M7-6 baseline)', () => {
        const fails = failingDimensions(actual as PlacedBox, (actual as PlacedBox).rotation, c.expected!);
        expect(fails).toEqual(c.currentStatus.failingDimensions);
      });
    });
  }
});

// M7-7 TARGET: the per-type anchor + aspect-aware scaling + body-line rotation is
// in; every non-degenerate fixture meets the bar on every dimension.
describe('M7-7 quality bar — every fixture meets tolerance', () => {
  for (const c of AUTOFIT_FIXTURES) {
    if (c.expected === null) continue;
    it(`${c.id} places within tolerance ${JSON.stringify(AUTOFIT_TOLERANCE)}`, () => {
      const actual = computeBoxForKeypoints(c.keypoints, c.garmentType) as PlacedBox | null;
      expect(actual).not.toBeNull();
      const fails = failingDimensions(actual as PlacedBox, (actual as PlacedBox).rotation, c.expected!);
      expect(fails).toEqual([]);
    });
  }
});
