/**
 * MeScreen integration tests.
 *
 * Covers: photo present/absent states, successful photo pick, cancelled pick,
 * failed external link with visible error text.
 */
import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';

// ── module-level mocks ────────────────────────────────────────────────────────

const PERSON_PHOTO_KEY = 'person_photo_uri';
jest.mock('@/store', () => ({
  r: { setSetting: jest.fn().mockResolvedValue(undefined) },
}));

const mockUsePersonPhoto = jest.fn<string | null, [number?]>();
jest.mock('@/store/onboarding', () => ({
  PERSON_PHOTO_KEY: 'person_photo_uri',
  usePersonPhoto: (k?: number) => mockUsePersonPhoto(k),
}));

const mockTakePhoto = jest.fn();
jest.mock('@/capture/useCapture', () => ({
  useCapture: () => ({ takePhoto: mockTakePhoto }),
}));

jest.mock('expo-linking', () => ({
  canOpenURL: jest.fn().mockResolvedValue(true),
  openURL: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/i18n/useI18n', () => ({
  useI18n: () => ({ t: (k: string) => k }),
}));
jest.mock('@/i18n/LanguageSwitcher', () => {
  const { View } = require('react-native');
  return () => <View testID="lang-switcher" />;
});

// ── imports after mocks ───────────────────────────────────────────────────────
import * as Linking from 'expo-linking';
import { r } from '@/store';
import MeScreen from '../../app/(tabs)/me';

const mockR = r as jest.Mocked<typeof r>;
const mockLinking = Linking as jest.Mocked<typeof Linking>;

// ── helpers ───────────────────────────────────────────────────────────────────
function renderMe(photoUri: string | null = null) {
  mockUsePersonPhoto.mockReturnValue(photoUri);
  return render(<MeScreen />);
}

// ── tests ─────────────────────────────────────────────────────────────────────

describe('MeScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (mockLinking.canOpenURL as jest.Mock).mockResolvedValue(true);
    (mockLinking.openURL as jest.Mock).mockResolvedValue(undefined);
  });

  it('shows empty-photo placeholder when no photo is set', () => {
    const { getByText, queryByRole } = renderMe(null);
    expect(getByText('me.photo.empty')).toBeTruthy();
    expect(queryByRole('image')).toBeNull();
  });

  it('hides the empty placeholder and shows "Change photo" when a URI is persisted', () => {
    const { queryByText, getByText } = renderMe('file:///photo.jpg');
    expect(queryByText('me.photo.empty')).toBeNull();
    // 'me.photo.change' only renders when photo is truthy (the button label switches).
    expect(getByText('me.photo.change')).toBeTruthy();
  });

  it('shows "Set photo" label when no photo is set', () => {
    const { getByText } = renderMe(null);
    expect(getByText('me.photo.set')).toBeTruthy();
  });

  it('shows "Change photo" label when a photo exists', () => {
    const { getByText } = renderMe('file:///photo.jpg');
    expect(getByText('me.photo.change')).toBeTruthy();
  });

  it('persists the URI returned by takePhoto', async () => {
    mockTakePhoto.mockResolvedValue({ uri: 'file:///new.jpg', source: 'library' });
    const { getByText } = renderMe(null);
    await act(async () => {
      fireEvent.press(getByText('me.photo.set'));
    });
    await waitFor(() => {
      expect(mockR.setSetting).toHaveBeenCalledWith(PERSON_PHOTO_KEY, 'file:///new.jpg');
    });
  });

  it('does not persist when takePhoto is cancelled (returns null)', async () => {
    mockTakePhoto.mockResolvedValue(null);
    const { getByText } = renderMe(null);
    await act(async () => {
      fireEvent.press(getByText('me.photo.set'));
    });
    // No store call expected even after settling.
    await new Promise((r) => setTimeout(r, 50));
    expect(mockR.setSetting).not.toHaveBeenCalled();
  });

  it('shows link error text when a feedback link cannot open', async () => {
    (mockLinking.canOpenURL as jest.Mock).mockResolvedValue(false);
    const { getAllByRole, getByText } = renderMe(null);
    // Press any feedback link (About — first one in the FEEDBACK_ACTIONS list).
    const links = getAllByRole('link');
    await act(async () => {
      fireEvent.press(links[0]);
    });
    await waitFor(() => {
      expect(getByText('me.feedback.openFailed')).toBeTruthy();
    });
  });
});
