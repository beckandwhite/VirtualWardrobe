import { emptyStateVariant, hasActiveCriteria } from '../../src/wardrobe/emptyState';
import { applyFilters, type FilterableItem } from '../../src/wardrobe/filter';

// The wardrobe's refresh + empty-state selection (app/(tabs)/wardrobe.tsx). The
// snapshot derivation (applyFilters) already lives in src/wardrobe/filter.ts and
// is covered by tests/wardrobe/filter.test.ts; this suite covers the part that
// screen owns — which empty view to render and whether a filter is active — via
// the pure selectors in src/wardrobe/emptyState.ts. M4-2 AC2 (empty-state
// branches) + AC1 (wardrobe refresh view logic, device-free).

function wardrobe(n = 3): FilterableItem[] {
    return Array.from({ length: n }, (_, i) => ({
        id: i + 1,
        name: `Item ${i}`,
        type: 'top',
        color: 'white',
        tags: ['casual'],
    }));
}

describe('emptyStateVariant', () => {
   it('renders "no items yet" when the snapshot itself is empty', () => {
      expect(emptyStateVariant([], [])).toBe('none');
     });

   it('renders an empty filtered grid when items exist but none match', () => {
      const items = wardrobe();
      const visible = applyFilters(items, { category: 'shoes' }, '');
      expect(visible).toHaveLength(0);
      expect(emptyStateVariant(items, visible)).toBe('filtered');
     });

   it('renders the grid (no empty view) when items are visible', () => {
      const items = wardrobe();
      expect(emptyStateVariant(items, items)).toBe('has-items');
     });

   it('prefers the "no items yet" state over a filtered match on an empty snapshot', () => {
       // An empty snapshot with an empty visible list is "none", never "filtered".
      expect(emptyStateVariant([], [])).toBe('none');
     });

   it('derives the filtered variant straight from applyFilters output', () => {
      const items = wardrobe(3);
      const noMatch = applyFilters(items, {}, 'zzzz');
      expect(emptyStateVariant(items, noMatch)).toBe('filtered');
      const match = applyFilters(items, {}, 'Item');
      expect(emptyStateVariant(items, match)).toBe('has-items');
      });
});

describe('hasActiveCriteria', () => {
   it('is false when no facet and no query are active', () => {
      expect(hasActiveCriteria({}, '')).toBe(false);
      expect(hasActiveCriteria({}, '   ')).toBe(false);
      expect(hasActiveCriteria({ color: undefined, category: undefined }, '')).toBe(false);
      });

   it('is true when a category facet is active', () => {
      expect(hasActiveCriteria({ category: 'top' }, '')).toBe(true);
       });

   it('is true when a color facet is active', () => {
      expect(hasActiveCriteria({ color: 'white' }, '')).toBe(true);
      });

   it('is true when a non-blank query is active (whitespace is ignored)', () => {
      expect(hasActiveCriteria({}, 'tee')).toBe(true);
      expect(hasActiveCriteria({}, '  tee ')).toBe(true);
      });
});
