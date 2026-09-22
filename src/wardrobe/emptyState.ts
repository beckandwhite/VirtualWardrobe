import type { FilterableItem, FilterCriteria } from './filter';

// The wardrobe's empty-state selection, extracted so it unit-tests without
// react-native. `app/(tabs)/wardrobe.tsx` renders one of three flat-list empty
// states from the snapshot + the active filter/search:
//   - `none`     → the snapshot itself is empty: "No items yet…".
//   - `filtered` → items exist but the current facets/query match none:
//                 "Nothing matches your filters." (+ Clear / Add affordances).
//   - `has-items`→ something is visible: the grid, no empty view.
// `items.length === 0` takes priority over `visible.length === 0`, exactly the
// order the JSX tests. M4-2 / D29.4.
export type EmptyStateVariant = 'none' | 'filtered' | 'has-items';

export function emptyStateVariant(
    items: readonly FilterableItem[],
    visible: readonly FilterableItem[],
): EmptyStateVariant {
    if (items.length === 0) return 'none';
    if (visible.length === 0) return 'filtered';
    return 'has-items';
}

// Whether any facet/search is active — drives the "N of M" result count and the
// "Clear filters" affordance. Mirrors `hasActive` in the screen. Pure so the
// empty-state suite can assert the branch without a UI.
export function hasActiveCriteria(
    criteria: FilterCriteria,
    query: string,
): boolean {
    return Boolean(criteria.category || criteria.color || query.trim());
}
