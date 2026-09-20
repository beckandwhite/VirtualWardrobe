import {
   filterItems,
   searchItems,
   applyFilters,
   type FilterableItem,
} from '../../src/wardrobe/filter';

// Fixture wardrobe. `Item` from the store is a structural superset of
// `FilterableItem`, so these plain objects double as store rows.
function fixture(): FilterableItem[] {
   return [
      { id: 1, name: 'Classic White Tee', type: 'top', color: 'white', tags: ['casual', 'summer'] },
      { id: 2, name: 'Denim Jacket', type: 'outerwear', color: 'blue', tags: ['casual'] },
      { id: 3, name: 'Black Chinos', type: 'bottom', color: 'black', tags: ['formal'] },
      { id: 4, name: 'Summer Dress', type: 'dress', color: 'red', tags: ['formal', 'summer'] },
      { id: 5, name: 'Leather Boots', type: 'shoes', color: 'brown', tags: ['formal', 'casual'] },
      { id: 6, name: 'Sneakers', type: 'shoes', color: 'white', tags: ['casual', 'sport'] },
   ];
}

describe('filterItems', () => {
   it('returns the whole list when no criteria are set', () => {
      expect(filterItems(fixture(), {})).toHaveLength(6);
      expect(filterItems(fixture())).toHaveLength(6);
   });

   it('narrows by category', () => {
      const out = filterItems(fixture(), { category: 'top' });
      expect(out).toHaveLength(1);
      expect(out[0].id).toBe(1);
   });

   it('narrows by color', () => {
      const out = filterItems(fixture(), { color: 'white' });
      expect(out.map((i) => i.id).sort()).toEqual([1, 6]);
   });

   it('combines category + color with AND semantics', () => {
      const out = filterItems(fixture(), { category: 'shoes', color: 'white' });
      expect(out).toHaveLength(1);
      expect(out[0].id).toBe(6);
   });

   it('returns nothing when no item matches', () => {
      expect(filterItems(fixture(), { category: 'top', color: 'black' })).toHaveLength(0);
   });
});

describe('searchItems', () => {
   it('matches on name and tags, case-insensitively', () => {
      const byName = searchItems(fixture(), 'denim');
      expect(byName.map((i) => i.id)).toEqual([2]);

      const byTag = searchItems(fixture(), 'FORMAL');
      expect(byTag.map((i) => i.id).sort()).toEqual([3, 4, 5]);
   });

   it('returns everything for an empty/whitespace query', () => {
      expect(searchItems(fixture(), '')).toHaveLength(6);
      expect(searchItems(fixture(), '   ')).toHaveLength(6);
   });

   it('returns nothing when nothing matches', () => {
      expect(searchItems(fixture(), 'zzzz')).toHaveLength(0);
   });
});

describe('applyFilters', () => {
   it('ANDs facets with free text (filter then search)', () => {
      const out = applyFilters(fixture(), { category: 'shoes' }, 'casual');
      expect(out.map((i) => i.id)).toEqual([5, 6]);
    });

   it('clearing filters + search shows the full wardrobe again', () => {
      expect(applyFilters(fixture(), {}, '')).toHaveLength(6);
   });
});
