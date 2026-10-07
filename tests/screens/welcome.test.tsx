/**
 * WelcomeScreen integration tests.
 *
 * Dependency rationale: jest-expo + @testing-library/react-native render real
 * RN View/Text/TouchableOpacity trees via react-test-renderer in Jest. Native
 * modules (expo-sqlite, expo-image-picker, expo-file-system) and the router are
 * mocked at the module boundary; pure helpers (continueWelcomeTransition) run real.
 */
import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';

// ── module-level mocks ────────────────────────────────────────────────────────

jest.mock('expo-router', () => ({ router: { replace: jest.fn() } }));

jest.mock('@/store', () => ({
  r: {
    setSeenWelcome: jest.fn().mockResolvedValue(undefined),
    getSetting: jest.fn().mockResolvedValue(undefined),
  },
}));

const mockUseSeenWelcome = jest.fn<boolean | null, []>();
const mockUsePersonPhotoPresence = jest.fn<boolean | null, []>();
jest.mock('@/store/onboarding', () => ({
  useSeenWelcome: () => mockUseSeenWelcome(),
  usePersonPhotoPresence: () => mockUsePersonPhotoPresence(),
}));

jest.mock('@/i18n/useI18n', () => ({
  useI18n: () => ({ t: (k: string) => k }),
}));

jest.mock('@/i18n/LanguageSwitcher', () => {
  const { View } = require('react-native');
  return () => <View testID="lang-switcher" />;
});

// ── imports after mocks ───────────────────────────────────────────────────────
import { router } from 'expo-router';
import { r } from '@/store';
import WelcomeScreen from '../../app/(tabs)/welcome';

const mockRouter = router as jest.Mocked<typeof router>;
const mockR = r as jest.Mocked<typeof r>;

// ── helpers ───────────────────────────────────────────────────────────────────
function renderWelcome(seenWelcome: boolean | null, hasPhoto: boolean | null) {
  mockUseSeenWelcome.mockReturnValue(seenWelcome);
  mockUsePersonPhotoPresence.mockReturnValue(hasPhoto);
  return render(<WelcomeScreen />);
}

// ── tests ─────────────────────────────────────────────────────────────────────

describe('WelcomeScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (mockR.setSeenWelcome as jest.Mock).mockResolvedValue(undefined);
  });

  it('renders the title and orientation steps', () => {
    const { getByText } = renderWelcome(false, null);
    expect(getByText('welcome.title')).toBeTruthy();
    expect(getByText('welcome.step1.title')).toBeTruthy();
    expect(getByText('welcome.step4.title')).toBeTruthy();
  });

  it('shows Continue button on first run (seenWelcome = false)', () => {
    const { getByText } = renderWelcome(false, null);
    expect(getByText('welcome.continue')).toBeTruthy();
  });

  it('hides Continue button for a returning user (seenWelcome = true)', () => {
    const { queryByText } = renderWelcome(true, null);
    expect(queryByText('welcome.continue')).toBeNull();
  });

  it('hides Continue button while still loading (seenWelcome = null)', () => {
    const { queryByText } = renderWelcome(null, null);
    expect(queryByText('welcome.continue')).toBeNull();
  });

  it('routes to /me when no body photo is set on continue', async () => {
    const { getByText } = renderWelcome(false, false);
    await act(async () => {
      fireEvent.press(getByText('welcome.continue'));
    });
    await waitFor(() => {
      expect(mockR.setSeenWelcome).toHaveBeenCalledTimes(1);
      expect(mockRouter.replace).toHaveBeenCalledWith('/me');
    });
  });

  it('routes to /wardrobe when body photo exists on continue', async () => {
    const { getByText } = renderWelcome(false, true);
    await act(async () => {
      fireEvent.press(getByText('welcome.continue'));
    });
    await waitFor(() => {
      expect(mockR.setSeenWelcome).toHaveBeenCalledTimes(1);
      expect(mockRouter.replace).toHaveBeenCalledWith('/wardrobe');
    });
  });
});
