// Mock modules before imports
jest.mock('../mmkv', () => ({
  kv: {
    getString: jest.fn(),
    set: jest.fn(),
  },
  getJSON: jest.fn(),
  setJSON: jest.fn(),
}));

jest.mock('../userScope', () => ({
  getScopedKey: jest.fn(),
  getCurrentUserId: jest.fn(),
}));

import {getProfile, updatePreferences} from '../profile';
import {getJSON, setJSON} from '../mmkv';
import {getScopedKey, getCurrentUserId} from '../userScope';

const mockGetJSON = getJSON as jest.MockedFunction<typeof getJSON>;
const mockSetJSON = setJSON as jest.MockedFunction<typeof setJSON>;
const mockGetScopedKey = getScopedKey as jest.MockedFunction<typeof getScopedKey>;
const mockGetCurrentUserId = getCurrentUserId as jest.MockedFunction<typeof getCurrentUserId>;

describe('profile preferences', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetScopedKey.mockReturnValue('user.profile.test-user');
    mockGetCurrentUserId.mockReturnValue('test-user');
  });

  describe('default preferences', () => {
    test('new profile has correct defaults', () => {
      mockGetJSON.mockReturnValue(null);

      const profile = getProfile();

      expect(profile.preferences.hapticsEnabled).toBe(true);
      expect(profile.preferences.highContrastEnabled).toBe(false);
      expect(profile.preferences.defaultLength).toBe(5);
      expect(profile.preferences.defaultRows).toBe(6);
      expect(profile.preferences.defaultMode).toBe('daily');
    });
  });

  describe('updatePreferences', () => {
    // Create fresh profile for each test to avoid mutation issues
    const createExistingProfile = () => ({
      id: 'test-id',
      createdAt: Date.now(),
      stats: {},
      preferences: {
        defaultLength: 5,
        defaultRows: 6,
        defaultMode: 'daily' as const,
        hapticsEnabled: true,
        highContrastEnabled: false,
      },
    });

    test('updates hapticsEnabled and persists', () => {
      mockGetJSON.mockReturnValue(createExistingProfile());

      updatePreferences({hapticsEnabled: false});

      expect(mockSetJSON).toHaveBeenCalledWith(
        'user.profile.test-user',
        expect.objectContaining({
          preferences: expect.objectContaining({
            hapticsEnabled: false,
          }),
        })
      );
    });

    test('updates highContrastEnabled and persists', () => {
      mockGetJSON.mockReturnValue(createExistingProfile());

      updatePreferences({highContrastEnabled: true});

      expect(mockSetJSON).toHaveBeenCalledWith(
        'user.profile.test-user',
        expect.objectContaining({
          preferences: expect.objectContaining({
            highContrastEnabled: true,
          }),
        })
      );
    });

    test('partial update preserves other preferences', () => {
      mockGetJSON.mockReturnValue(createExistingProfile());

      updatePreferences({hapticsEnabled: false});

      expect(mockSetJSON).toHaveBeenCalledWith(
        'user.profile.test-user',
        expect.objectContaining({
          preferences: expect.objectContaining({
            hapticsEnabled: false,
            highContrastEnabled: false, // unchanged
            defaultLength: 5, // unchanged
          }),
        })
      );
    });
  });
});
