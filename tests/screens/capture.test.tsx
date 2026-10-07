/**
 * CaptureScreen integration tests.
 *
 * Covers: initial capture UI (photo button, hint chips), review step with and
 * without background removal, finalize paths (use cutout / keep original),
 * and permission denial / cancel (no save, no navigation).
 *
 * Mock pattern: each jest.mock factory creates its own jest.fn() instances so no
 * outer-scope variable is referenced (babel-jest-hoist only hoists declarations, not
 * chained initializers, making outer-scope references unreliable). References are
 * obtained via import after the mocks are registered.
 */
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';

// ── module-level mocks ────────────────────────────────────────────────────────

jest.mock('expo-router', () => ({ router: { replace: jest.fn() } }));

jest.mock('@/store', () => ({
  r: { insertItem: jest.fn() },
}));

jest.mock('@/capture', () => ({
  useCapture: jest.fn().mockReturnValue({ cameraAvailable: false, takePhoto: jest.fn() }),
  processCaptureImage: jest.fn(),
  discardImage: jest.fn(),
  resolveReviewChoice: jest.fn(),
}));

jest.mock('@/capture/FilePickerButton', () => {
  const { TouchableOpacity, Text } = require('react-native');
  function FilePickerButtonMock({ children, onPick, disabled }: any) {
    return (
      <TouchableOpacity testID="file-picker" disabled={disabled} onPress={() => onPick('blob:///test-uri')}>
        <Text>{children}</Text>
      </TouchableOpacity>
    );
  }
  return FilePickerButtonMock;
});

jest.mock('@/i18n/useI18n', () => ({
  useI18n: () => ({ t: (k: string) => k }),
}));

// ── imports: get references to mock instances via the mocked modules ──────────
import { router } from 'expo-router';
import { r } from '@/store';
import * as captureModule from '@/capture';
import CaptureScreen from '../../app/capture';

const mockRouter = router as jest.Mocked<typeof router>;
const mockInsertItem = r.insertItem as jest.Mock;
const mockUseCapture = captureModule.useCapture as jest.Mock;
const mockProcessCapture = captureModule.processCaptureImage as jest.Mock;
const mockDiscardImage = captureModule.discardImage as jest.Mock;
const mockResolveReviewChoice = captureModule.resolveReviewChoice as jest.Mock;

// ── tests ─────────────────────────────────────────────────────────────────────

describe('CaptureScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset to sensible defaults after clearAllMocks wipes call records.
    mockUseCapture.mockReturnValue({ cameraAvailable: false, takePhoto: jest.fn() });
    mockProcessCapture.mockResolvedValue({ uri: 'file:///raw.jpg', removed: false });
    mockResolveReviewChoice.mockReturnValue({ keptUri: 'file:///raw.jpg', discardUri: null });
    mockInsertItem.mockResolvedValue({ id: 42 });
  });

  // ── initial state ──────────────────────────────────────────────────────────

  it('renders the title', () => {
    const { getByText } = render(<CaptureScreen />);
    expect(getByText('capture.title')).toBeTruthy();
  });

  it('renders hint type chips', () => {
    const { getByText } = render(<CaptureScreen />);
    expect(getByText('top')).toBeTruthy();
    expect(getByText('shoes')).toBeTruthy();
  });

  it('toggles a hint chip on press and deselects on second press', () => {
    const { getByText } = render(<CaptureScreen />);
    const chip = getByText('top');
    fireEvent.press(chip);
    fireEvent.press(chip);
    expect(getByText('top')).toBeTruthy();
  });

  // ── capture → review state ─────────────────────────────────────────────────

  it('enters review state after a capture with no bg removal', async () => {
    const mockTakePhoto = jest.fn().mockResolvedValue({ uri: 'file:///raw.jpg', source: 'library' });
    mockUseCapture.mockReturnValue({ cameraAvailable: false, takePhoto: mockTakePhoto });
    mockProcessCapture.mockResolvedValue({ uri: 'file:///raw.jpg', removed: false });
    const { getByText } = render(<CaptureScreen />);
    fireEvent.press(getByText('capture.photo'));
    await waitFor(() => {
      expect(getByText('capture.bg.failed')).toBeTruthy();
      expect(getByText('capture.bg.keepOriginal')).toBeTruthy();
    });
    expect(() => getByText('capture.bg.useCutout')).toThrow();
  });

  it('shows "Use cutout" when background was successfully removed', async () => {
    const mockTakePhoto = jest.fn().mockResolvedValue({ uri: 'file:///raw.jpg', source: 'library' });
    mockUseCapture.mockReturnValue({ cameraAvailable: false, takePhoto: mockTakePhoto });
    mockProcessCapture.mockResolvedValue({ uri: 'file:///cutout.png', removed: true });
    const { getByText } = render(<CaptureScreen />);
    fireEvent.press(getByText('capture.photo'));
    await waitFor(() => {
      expect(getByText('capture.bg.removed')).toBeTruthy();
      expect(getByText('capture.bg.useCutout')).toBeTruthy();
      expect(getByText('capture.bg.keepOriginal')).toBeTruthy();
    });
  });

  // ── cancel / denial ────────────────────────────────────────────────────────

  it('stays on the capture screen when takePhoto is cancelled', async () => {
    const mockTakePhoto = jest.fn().mockResolvedValue(null);
    mockUseCapture.mockReturnValue({ cameraAvailable: false, takePhoto: mockTakePhoto });
    const { getByText, queryByText } = render(<CaptureScreen />);
    fireEvent.press(getByText('capture.photo'));
    await new Promise((r) => setTimeout(r, 50));
    expect(queryByText('capture.bg.keepOriginal')).toBeNull();
    expect(getByText('capture.photo')).toBeTruthy();
    expect(mockInsertItem).not.toHaveBeenCalled();
  });

  // ── finalize (review → save + navigate) ───────────────────────────────────

  it('saves item and navigates after keeping the original', async () => {
    const mockTakePhoto = jest.fn().mockResolvedValue({ uri: 'file:///raw.jpg', source: 'library' });
    mockUseCapture.mockReturnValue({ cameraAvailable: false, takePhoto: mockTakePhoto });
    mockProcessCapture.mockResolvedValue({ uri: 'file:///raw.jpg', removed: false });
    mockResolveReviewChoice.mockReturnValue({ keptUri: 'file:///raw.jpg', discardUri: null });
    const { getByText } = render(<CaptureScreen />);
    fireEvent.press(getByText('capture.photo'));
    await waitFor(() => expect(getByText('capture.bg.keepOriginal')).toBeTruthy());
    fireEvent.press(getByText('capture.bg.keepOriginal'));
    await waitFor(() => expect(mockInsertItem).toHaveBeenCalledTimes(1));
    expect(mockRouter.replace).toHaveBeenCalledWith('/wardrobe');
  });

  it('saves the cutout URI when "Use cutout" is chosen', async () => {
    const mockTakePhoto = jest.fn().mockResolvedValue({ uri: 'file:///raw.jpg', source: 'library' });
    mockUseCapture.mockReturnValue({ cameraAvailable: false, takePhoto: mockTakePhoto });
    mockProcessCapture.mockResolvedValue({ uri: 'file:///cutout.png', removed: true });
    mockResolveReviewChoice.mockReturnValue({ keptUri: 'file:///cutout.png', discardUri: 'file:///raw.jpg' });
    const { getByText } = render(<CaptureScreen />);
    fireEvent.press(getByText('capture.photo'));
    await waitFor(() => expect(getByText('capture.bg.useCutout')).toBeTruthy());
    fireEvent.press(getByText('capture.bg.useCutout'));
    await waitFor(() => expect(mockInsertItem).toHaveBeenCalledTimes(1));
    const inserted = mockInsertItem.mock.calls[0][0];
    expect(inserted.imagePath).toBe('file:///cutout.png');
  });
});
