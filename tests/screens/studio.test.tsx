/**
 * StudioScreen integration tests.
 *
 * Covers: manual-mode banner (shown + dismiss), status text, error notice
 * surface after a failed save, notice dismiss, and the save/share button.
 *
 * The screen is the most complex in the app (Reanimated shared values,
 * PanResponder, async pose estimation, export pipeline), so tests focus on
 * observable UI state rather than implementation details.
 *
 * Reanimated: fully manual mock in tests/screens/__mocks__/react-native-reanimated.js —
 * avoids the worklet runner that the official /mock entry requires.
 */
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';

// ── module-level mocks ────────────────────────────────────────────────────────

jest.mock('expo-router', () => ({
  useLocalSearchParams: jest.fn().mockReturnValue({}),
  router: { replace: jest.fn() },
}));

jest.mock('@/store', () => ({
  r: {
    getSetting: jest.fn(),
    getItem: jest.fn(),
    listItems: jest.fn(),
    listStoreItems: jest.fn(),
  },
}));

jest.mock('@/store/onboarding', () => ({
  PERSON_PHOTO_KEY: 'person_photo_uri',
  usePersonPhoto: jest.fn().mockReturnValue(null),
  usePersonPhotoPresence: jest.fn().mockReturnValue(false),
  useSeenWelcome: jest.fn().mockReturnValue(true),
  useOnboarding: jest.fn().mockReturnValue(false),
}));

jest.mock('@/navigation/routes', () => ({
  parseItemId: jest.fn().mockReturnValue(null),
  studioHref: jest.fn().mockReturnValue('/studio'),
  exitTo: jest.fn().mockReturnValue('/wardrobe'),
  WARDROBE_HREF: '/wardrobe',
  CAPTURE_HREF: '/capture',
}));

jest.mock('@/pose', () => ({
  createPoseProvider: jest.fn().mockReturnValue({}),
  safeEstimate: jest.fn().mockResolvedValue([]),
  autoTransformFor: jest.fn().mockReturnValue({
    x: 0.5, y: 0.5, scale: 0.5, rotation: 0, opacity: 1,
  }),
  IDENTITY_TRANSFORM: { x: 0.5, y: 0.5, scale: 0.5, rotation: 0, opacity: 1 },
}));

jest.mock('@/composer/share', () => ({
  persistLook: jest.fn(),
  shareLook: jest.fn(),
  reopenTransform: jest.fn().mockReturnValue({ x: 0.5, y: 0.5, scale: 0.5, rotation: 0, opacity: 1 }),
  shareKindFor: jest.fn().mockReturnValue('saved'),
  deleteLook: jest.fn(),
}));

jest.mock('@/composer/notice', () => ({
  noticeForShare: jest.fn().mockReturnValue({ kind: 'info', text: 'Look saved.' }),
  EXPORT_ERROR_NOTICE: { kind: 'error', text: 'Export failed — try again.' },
  canShareRow: jest.fn().mockReturnValue(false),
}));

jest.mock('@/composer', () => ({
  autoTransformFor: jest.fn().mockReturnValue({
    x: 0.5, y: 0.5, scale: 0.5, rotation: 0, opacity: 1,
  }),
  clampTransform: (t: unknown) => t,
  IDENTITY_TRANSFORM: { x: 0.5, y: 0.5, scale: 0.5, rotation: 0, opacity: 1 },
  SCALE_MIN: 0.1,
  SCALE_MAX: 2.0,
  ROTATION_MIN: -180,
  ROTATION_MAX: 180,
}));

jest.mock('@/studio/bodySource', () => ({
  resolveBodySource: (_uri: unknown, sample: unknown) => sample,
}));

// Slider: named export — shape must match `export function Slider`.
jest.mock('@/studio/Slider', () => ({
  Slider: ({ label }: { label: string }) => {
    const { View } = require('react-native');
    return <View testID={`slider-${label}`} />;
  },
  sliderStyles: {},
}));

// FilePickerButton: named export — shape must match `export function FilePickerButton`.
jest.mock('@/capture/FilePickerButton', () => ({
  FilePickerButton: ({ children, onPick }: any) => {
    const { TouchableOpacity, Text } = require('react-native');
    return (
      <TouchableOpacity onPress={() => onPick && onPick('file:///body.jpg')}>
        <Text>{children}</Text>
      </TouchableOpacity>
    );
  },
}));

jest.mock('@/i18n/useI18n', () => ({
  useI18n: () => ({ t: (k: string) => k }),
}));

// ── imports: references via mocked modules ────────────────────────────────────
import { r } from '@/store';
import * as poseModule from '@/pose';
import * as shareModule from '@/composer/share';
import StudioScreen from '../../app/(tabs)/studio';

const mockR = r as jest.Mocked<typeof r>;
const mockSafeEstimate = poseModule.safeEstimate as jest.Mock;
const mockPersistLook = shareModule.persistLook as jest.Mock;

const STUB_GARMENT_ITEM = {
  id: 1,
  type: 'top' as const,
  name: 'Test Shirt',
  imagePath: 'file:///shirt.jpg',
};

// ── tests ─────────────────────────────────────────────────────────────────────

describe('StudioScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (mockR.getSetting as jest.Mock).mockResolvedValue(null);
    (mockR.getItem as jest.Mock).mockResolvedValue(undefined);
    (mockR.listItems as jest.Mock).mockResolvedValue([]);
    (mockR.listStoreItems as jest.Mock).mockResolvedValue([]);
    mockSafeEstimate.mockResolvedValue([]);
    mockPersistLook.mockResolvedValue({ id: 99 });
  });

  it('shows the manual-mode banner on mount when no keypoints are detected', () => {
    // Banner initial state is open=true, dismissed=false — visible before any async work.
    const { getByText } = render(<StudioScreen />);
    expect(getByText('studio.banner.manual')).toBeTruthy();
  });

  it('dismisses the manual banner when the dismiss button is pressed', () => {
    const { getByText, queryByText } = render(<StudioScreen />);
    expect(getByText('studio.banner.manual')).toBeTruthy();
    fireEvent.press(getByText('common.dismiss'));
    expect(queryByText('studio.banner.manual')).toBeNull();
  });

  it('shows the manual status text when autoPlaced is false', () => {
    // autoPlaced starts false (no keypoints yet) → manual status shown immediately.
    const { getByText } = render(<StudioScreen />);
    expect(getByText('studio.status.manual')).toBeTruthy();
  });

  it('shows the save/share button', () => {
    const { getByText } = render(<StudioScreen />);
    expect(getByText('studio.saveShare')).toBeTruthy();
  });

  it('shows an error notice when export/save fails', async () => {
    // Need a garment so persist() doesn't early-return null.
    (mockR.listItems as jest.Mock).mockResolvedValue([STUB_GARMENT_ITEM]);
    mockPersistLook.mockRejectedValue(new Error('disk full'));
    const { getByText } = render(<StudioScreen />);
    // Wait until the pose effect fires (proxy for garment being loaded).
    await waitFor(() => expect(mockSafeEstimate).toHaveBeenCalled());
    fireEvent.press(getByText('studio.saveShare'));
    await waitFor(() => {
      expect(getByText('Export failed — try again.')).toBeTruthy();
    });
  });

  it('dismisses the error notice when × is pressed', async () => {
    (mockR.listItems as jest.Mock).mockResolvedValue([STUB_GARMENT_ITEM]);
    mockPersistLook.mockRejectedValue(new Error('fail'));
    const { getByText, queryByText } = render(<StudioScreen />);
    await waitFor(() => expect(mockSafeEstimate).toHaveBeenCalled());
    fireEvent.press(getByText('studio.saveShare'));
    await waitFor(() => expect(getByText('Export failed — try again.')).toBeTruthy());
    fireEvent.press(getByText('×'));
    expect(queryByText('Export failed — try again.')).toBeNull();
  });
});
