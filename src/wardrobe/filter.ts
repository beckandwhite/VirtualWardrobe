// M1-3: pure wardrobe filter + search over an in-memory item snapshot.
// Kept framework-free (no react-native / expo imports) so it unit-tests in node
// the same way `autoBox.ts` does. `Item` from the store is a structural superset
// of `FilterableItem`, so `filterItems`/`searchItems` accept `Item[]` directly.

export interface FilterableItem {
    id: number;
    name: string;
    type: string;
    color: string;
    tags: string[];
}

// Active facet filters. Empty string / undefined means "off" (match everything).
export interface FilterCriteria {
    category?: string;
    color?: string;
}

// Narrow an item list by active facets (AND semantics between category and color).
export function filterItems<T extends FilterableItem>(
    items: readonly T[],
    criteria: FilterCriteria = {},
): T[] {
    const { category, color } = criteria;
    return items.filter((it) => {
        if (category && it.type !== category) return false;
        if (color && it.color !== color) return false;
         return true;
        });
}

// Case-insensitive free-text search over name + tags.
export function searchItems<T extends FilterableItem>(items: readonly T[], query: string): T[] {
    const q = query.trim().toLowerCase();
    if (!q) return [...items];
    return items.filter((it) => {
        if (it.name.toLowerCase().includes(q)) return true;
          return it.tags.some((t) => t.toLowerCase().includes(q));
        });
}

// Facets + free text together: filter first, then search (AND of both groups).
export function applyFilters<T extends FilterableItem>(
    items: readonly T[],
    criteria: FilterCriteria,
    query: string,
): T[] {
    return searchItems(filterItems(items, criteria), query);
}
