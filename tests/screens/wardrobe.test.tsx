/**
 * WardrobeScreen integration tests.
 *
 * Covers: empty state, non-empty item list, category filter toggle, search
 * filtering, "Clear filters" in the filtered-empty state.
 */
import React from 'react';
import {
  render,
  fireEvent,
} from '@testing-library/react-native';
import type { Item } from '@/store';

// ── module-level mocks ────────────────────────────────────────────────────────

const mockUseItems = jest.fn();
jest.mock('@/store', () => ({
  useItems: () => mockUseItems(),
}));

const mockPush = jest.fn();
jest.mock('@/navigation/useGuardedPush', () => ({
  useGuardedPush: () => mockPush,
}));

jest.mock('@/i18n/useI18n', () => ({
  useI18n: () => ({ t: (k: string, p?: Record<string, string | number>) => {
    if (p && 'visible' in p) return `${p.visible} of ${p.total}`;
    return k;
  } }),
}));

// CatalogSection is a heavy async component; replace it with a no-op in unit tests.
jest.mock('@/catalog/CatalogSection', () => {
  const { View } = require('react-native');
  function CatalogSectionMock() { return <View testID="catalog-section" />; }
  return CatalogSectionMock;
});

// ── imports after mocks ───────────────────────────────────────────────────────
import WardrobeScreen from '../../app/(tabs)/wardrobe';

// ── helpers ───────────────────────────────────────────────────────────────────
function makeItem(id: number, name: string, category = 'top', color = 'black'): Item {
  return {
    id,
    name,
    type: category as Item['type'],
    color,
    tags: [],
    imagePath: `file:///${id}.jpg`,
    thumbnailPath: null,
    createdAt: new Date().toISOString(),
  };
}

function renderWardrobe(items: Item[] = [], loading = false) {
  mockUseItems.mockReturnValue({ items, loading, error: null, reload: jest.fn() });
  return render(<WardrobeScreen />);
}

// ── tests ─────────────────────────────────────────────────────────────────────

describe('WardrobeScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows the empty state when the wardrobe is empty', () => {
    const { getByText } = renderWardrobe([]);
    expect(getByText('wardrobe.empty')).toBeTruthy();
  });

  it('renders item names in the grid', () => {
    const items = [makeItem(1, 'Blue Jeans'), makeItem(2, 'White Tee')];
    const { getByText } = renderWardrobe(items);
    expect(getByText('Blue Jeans')).toBeTruthy();
    expect(getByText('White Tee')).toBeTruthy();
  });

  it('toggles a category chip and shows filtered-empty state when nothing matches', () => {
    // One 'bottom' item; pressing the 'top' chip should leave zero visible.
    const items = [makeItem(1, 'Black Pants', 'bottom')];
    const { getByText } = renderWardrobe(items);
    fireEvent.press(getByText('category.top'));
    expect(getByText('wardrobe.emptyFiltered')).toBeTruthy();
  });

  it('clears filters via the "Clear filters" button', () => {
    const items = [makeItem(1, 'Black Pants', 'bottom')];
    const { getByText, queryByText } = renderWardrobe(items);
    // Apply a filter that matches nothing.
    fireEvent.press(getByText('category.top'));
    expect(getByText('wardrobe.emptyFiltered')).toBeTruthy();
    // Clear the filter.
    fireEvent.press(getByText('wardrobe.clearFilters'));
    expect(queryByText('wardrobe.emptyFiltered')).toBeNull();
    expect(getByText('Black Pants')).toBeTruthy();
  });

  it('filters by search query and hides non-matching items', () => {
    const items = [makeItem(1, 'Blue Jeans'), makeItem(2, 'Red Dress')];
    const { getByText, queryByText, getByPlaceholderText } = renderWardrobe(items);
    fireEvent.changeText(getByPlaceholderText('wardrobe.search'), 'jeans');
    expect(getByText('Blue Jeans')).toBeTruthy();
    expect(queryByText('Red Dress')).toBeNull();
  });

  it('shows the count badge when a filter is active', () => {
    const items = [
      makeItem(1, 'Blue Jeans', 'bottom'),
      makeItem(2, 'Red Dress', 'dress'),
    ];
    const { getByText } = renderWardrobe(items);
    fireEvent.press(getByText('category.dress'));
    // Our i18n mock formats the count as "N of M".
    expect(getByText('1 of 2')).toBeTruthy();
  });

  it('navigates to capture screen when the FAB is pressed', () => {
    const { getAllByRole } = renderWardrobe([]);
    // The FAB has accessibilityLabel = 'wardrobe.addItem'.
    const fab = getAllByRole('button', { name: 'wardrobe.addItem' })[0];
    fireEvent.press(fab);
    expect(mockPush).toHaveBeenCalledWith('/capture');
  });
});
