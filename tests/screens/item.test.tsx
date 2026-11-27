/**
 * ItemScreen integration tests (RNTL).
 *
 * Covers the nine acceptance criteria of #109:
 *   - initial render seeds the form (type/colour via the save payload, tags via the
 *     input value);
 *   - the category and colour pickers update the form (asserted through the resulting
 *     upsertItem payload, since the active chip/swatch is style-only and not queryable
 *     in RNTL);
 *   - save generates a thumbnail and upserts, then navigates back (and to the wardrobe
 *     on a deep-link with no history);
 *   - a save error shows a notice and does NOT navigate;
 *   - delete shows a confirmation dialog; confirm cascades the item (deleteItem) and
 *     navigates, cancel dismisses without touching the store;
 *   - a route id that resolves to no item renders the not-found view (no crash);
 *   - a changed id re-seeds the form.
 *
 * Boundaries mocked at the module level (no SQLite): `@/store` (useItem, upsertItem,
 * deleteItem, makeThumbnail) and `expo-router`. The pure `@/navigation/routes`
 * helpers (parseItemId, exitTo) run for real so the canonical-id and exit-decision
 * logic is exercised. The TryOn cascade lives in the store layer (repo.deleteItem),
 * so deleteItem is mocked at that boundary and the screen is asserted to call it.
 *
 * Mock pattern follows capture.test.tsx: each jest.mock factory creates its own
 * jest.fn() so no outer-scope variable is referenced (babel jest-hoist only hoists
 * declarations, not chained initializers). References are obtained via import.
 */
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import type { Item } from '@/store';

// ── module-level mocks ────────────────────────────────────────────────────────

jest.mock('expo-router', () => ({
  useLocalSearchParams: jest.fn(),
  router: { back: jest.fn(), replace: jest.fn(), canGoBack: jest.fn() },
}));

jest.mock('@/store', () => ({
  useItem: jest.fn(),
  upsertItem: jest.fn(),
  deleteItem: jest.fn(),
  makeThumbnail: jest.fn(),
}));

jest.mock('@/i18n/useI18n', () => ({
  useI18n: () => ({ t: (k: string) => k }),
}));

// ── imports: references via the mocked modules ────────────────────────────────
import { useLocalSearchParams, router } from 'expo-router';
import { useItem, upsertItem, deleteItem, makeThumbnail } from '@/store';
import ItemScreen from '../../app/item';

const mockUseParams = useLocalSearchParams as jest.Mock;
const mockRouter = router as jest.Mocked<typeof router>;
const mockUseItem = useItem as jest.Mock;
const mockUpsert = upsertItem as jest.Mock;
const mockDelete = deleteItem as jest.Mock;
const mockMakeThumb = makeThumbnail as jest.Mock;

// ── helpers ───────────────────────────────────────────────────────────────────

function makeItem(overrides: Partial<Item> = {}): Item {
  return {
    id: 1,
    type: 'top',
    name: 'Test Top',
    color: 'black',
    tags: [],
    imagePath: 'file:///raw.jpg',
    thumbnailPath: null,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

function renderWith(item: Item | null, opts: { loading?: boolean } = {}) {
  mockUseItem.mockReturnValue({
    item,
    loading: opts.loading ?? false,
    error: null,
    reload: jest.fn(),
  });
  return render(<ItemScreen />);
}

// ── tests ─────────────────────────────────────────────────────────────────────

describe('ItemScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Re-establish sensible defaults after clearAllMocks wipes call records.
    mockUseParams.mockReturnValue({ id: '1' });
    mockRouter.canGoBack.mockReturnValue(true);
    mockMakeThumb.mockResolvedValue('file:///thumb.png');
    mockUpsert.mockResolvedValue(undefined);
    mockDelete.mockResolvedValue(undefined);
  });

  // ── loading / not-found views ────────────────────────────────────────────────

  it('shows the loading hint while the item is being fetched', () => {
    const { getByText } = renderWith(null, { loading: true });
    expect(getByText('common.loading')).toBeTruthy();
  });

  it('renders a not-found state (no crash) when the id resolves to no item', () => {
    const { getByText, queryByText } = renderWith(null, { loading: false });
    expect(getByText('item.notFound')).toBeTruthy();
    // The edit form is not rendered in the not-found view.
    expect(queryByText('category.top')).toBeNull();
    expect(queryByText('common.save')).toBeNull();
  });

  it('navigates home from the not-found view via the back button (deep link, no history)', async () => {
    // A deep-linked /item with no history replaces to the canonical wardrobe.
    mockRouter.canGoBack.mockReturnValue(false);
    const { getByText } = renderWith(null, { loading: false });
    fireEvent.press(getByText('common.back'));
    expect(mockRouter.replace).toHaveBeenCalledWith('/wardrobe');
    expect(mockRouter.back).not.toHaveBeenCalled();
  });

  // ── initial render: seeded data ────────────────────────────────────────────────

  it('seeds the tags input from the item on load', () => {
    const item = makeItem({ id: 7, type: 'dress', color: 'green', tags: ['wool', 'warm'] });
    const { getByDisplayValue } = renderWith(item);
    // The seed sets tagsText = item.tags.join(', ').
    expect(getByDisplayValue('wool, warm')).toBeTruthy();
  });

  it('persists the seeded type and colour when saved without picker interaction', async () => {
    // No chip/swatch is pressed: the saved type/colour must come from the seed.
    const item = makeItem({ id: 7, type: 'dress', color: 'green', tags: ['wool'] });
    const { getByText } = renderWith(item);
    fireEvent.press(getByText('common.save'));
    await waitFor(() => expect(mockUpsert).toHaveBeenCalled());
    const [id, patch] = mockUpsert.mock.calls[0];
    expect(id).toBe(7);
    expect(patch.type).toBe('dress');
    expect(patch.color).toBe('green');
    expect(patch.tags).toEqual(['wool']);
  });

  // ── pickers update the form ────────────────────────────────────────────────────

  it('updates the form when a category chip is selected', async () => {
    const item = makeItem({ id: 1, type: 'top' });
    const { getByText } = renderWith(item);
    // Override the seeded 'top' by choosing 'shoes'.
    fireEvent.press(getByText('category.shoes'));
    fireEvent.press(getByText('common.save'));
    await waitFor(() => expect(mockUpsert).toHaveBeenCalled());
    expect(mockUpsert.mock.calls[0][1].type).toBe('shoes');
  });

  it('updates the form when a colour swatch is selected', async () => {
    const item = makeItem({ id: 1, type: 'top', color: 'black' });
    const { getByText, getByLabelText } = renderWith(item);
    // Override the seeded 'black' by choosing 'blue'.
    fireEvent.press(getByLabelText('color.blue'));
    fireEvent.press(getByText('common.save'));
    await waitFor(() => expect(mockUpsert).toHaveBeenCalled());
    expect(mockUpsert.mock.calls[0][1].color).toBe('blue');
  });

  // ── save: thumbnail + upsert + navigate ────────────────────────────────────────

  it('generates a thumbnail and upserts, then navigates back on success', async () => {
    const item = makeItem({ id: 3, type: 'top', color: 'red', tags: ['a', 'b'] });
    const { getByText } = renderWith(item);
    fireEvent.press(getByText('common.save'));
    await waitFor(() => expect(mockUpsert).toHaveBeenCalled());
    // The thumbnail is generated from the full-res image path…
    expect(mockMakeThumb).toHaveBeenCalledWith('file:///raw.jpg');
    // …and the upsert carries the generated thumbnail path.
    expect(mockUpsert).toHaveBeenCalledWith(
      3,
      expect.objectContaining({
        type: 'top',
        color: 'red',
        tags: ['a', 'b'],
        thumbnailPath: 'file:///thumb.png',
      }),
    );
    // There is history, so we pop back.
    expect(mockRouter.back).toHaveBeenCalledTimes(1);
    expect(mockRouter.replace).not.toHaveBeenCalled();
  });

  it('replaces to the wardrobe when saved with no navigation history', async () => {
    const item = makeItem({ id: 3 });
    mockRouter.canGoBack.mockReturnValue(false); // deep-linked, nothing behind us
    const { getByText } = renderWith(item);
    fireEvent.press(getByText('common.save'));
    await waitFor(() => expect(mockUpsert).toHaveBeenCalled());
    expect(mockRouter.replace).toHaveBeenCalledWith('/wardrobe');
    expect(mockRouter.back).not.toHaveBeenCalled();
  });

  // ── save error: notice + no navigation ─────────────────────────────────────────

  it('shows an error notice and does not navigate when a save fails', async () => {
    const item = makeItem({ id: 3 });
    mockUpsert.mockRejectedValue(new Error('disk full'));
    const { getByText, queryByText } = renderWith(item);
    fireEvent.press(getByText('common.save'));
    await waitFor(() => expect(getByText('item.action.failed')).toBeTruthy());
    // The store was reached, but the failure surfaced as a notice, not a navigation.
    expect(mockRouter.back).not.toHaveBeenCalled();
    expect(mockRouter.replace).not.toHaveBeenCalled();
    // The form is still on screen (not navigated away).
    expect(getByText('common.save')).toBeTruthy();
    expect(queryByText('item.notFound')).toBeNull();
  });

  // ── delete: confirmation dialog ────────────────────────────────────────────────

  it('shows a confirmation dialog and deletes + navigates on confirm', async () => {
    const item = makeItem({ id: 5 });
    const { getByText, queryByText } = renderWith(item);

    // First tap arms the confirmation; nothing is deleted yet.
    fireEvent.press(getByText('common.delete'));
    expect(getByText('common.dismiss')).toBeTruthy(); // confirm bar is visible
    expect(mockDelete).not.toHaveBeenCalled();
    expect(mockRouter.back).not.toHaveBeenCalled();

    // Confirm (the "Delete" button now shown in the confirm bar) cascades + navigates.
    fireEvent.press(getByText('common.delete'));
    await waitFor(() => expect(mockDelete).toHaveBeenCalled());
    expect(mockDelete).toHaveBeenCalledWith(5);
    expect(mockRouter.back).toHaveBeenCalledTimes(1);
    // The confirm bar is gone after the delete resolves.
    expect(queryByText('common.dismiss')).toBeNull();
  });

  it('shows an error notice and does not navigate when a delete fails', async () => {
    const item = makeItem({ id: 5 });
    mockDelete.mockRejectedValue(new Error('disk full'));
    const { getByText, queryByText } = renderWith(item);
    // Arm, then confirm; the delete rejects.
    fireEvent.press(getByText('common.delete'));
    fireEvent.press(getByText('common.delete'));
    await waitFor(() => expect(getByText('item.action.failed')).toBeTruthy());
    // The failure surfaced as a notice, not a navigation; the trigger is restored.
    expect(mockRouter.back).not.toHaveBeenCalled();
    expect(mockRouter.replace).not.toHaveBeenCalled();
    expect(getByText('common.delete')).toBeTruthy();
    expect(queryByText('item.notFound')).toBeNull();
  });

  it('dismisses the confirmation without deleting when cancelled', async () => {
    const item = makeItem({ id: 5 });
    const { getByText, queryByText } = renderWith(item);

    // Arm, then cancel.
    fireEvent.press(getByText('common.delete'));
    expect(getByText('common.dismiss')).toBeTruthy();
    fireEvent.press(getByText('common.dismiss'));

    // Dialog dismissed, the item is unchanged, and we never navigated.
    expect(queryByText('common.dismiss')).toBeNull();
    expect(mockDelete).not.toHaveBeenCalled();
    expect(mockRouter.back).not.toHaveBeenCalled();
    // The delete trigger is restored.
    expect(getByText('common.delete')).toBeTruthy();
  });

  // ── id change re-seeds the form ────────────────────────────────────────────────

  it('re-seeds the form when the id resolves to a different item', async () => {
    const itemA = makeItem({ id: 1, type: 'top', color: 'black', tags: ['a'] });
    const itemB = makeItem({ id: 2, type: 'shoes', color: 'blue', tags: ['b', 'c'] });
    const { getByText, getByDisplayValue, queryByDisplayValue, rerender } = renderWith(itemA);

    // Seeded to item A.
    expect(getByDisplayValue('a')).toBeTruthy();

    // The route id now resolves to a different item (B); the form must re-seed.
    mockUseItem.mockReturnValue({ item: itemB, loading: false, error: null, reload: jest.fn() });
    rerender(<ItemScreen />);

    // Tags re-seeded to B (the observable field); the old value is gone.
    expect(getByDisplayValue('b, c')).toBeTruthy();
    expect(queryByDisplayValue('a')).toBeNull();

    // Type/colour re-seed too — proven via the save payload (no picker interaction).
    fireEvent.press(getByText('common.save'));
    await waitFor(() => expect(mockUpsert).toHaveBeenCalled());
    expect(mockUpsert.mock.calls[0][1].type).toBe('shoes');
    expect(mockUpsert.mock.calls[0][1].color).toBe('blue');
    expect(mockUpsert.mock.calls[0][1].tags).toEqual(['b', 'c']);
  });
});
