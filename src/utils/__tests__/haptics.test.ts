// Mock modules before imports
jest.mock('react-native', () => ({
  Platform: {OS: 'ios'},
  Vibration: {vibrate: jest.fn()},
}));

jest.mock('../../storage/mmkv', () => ({
  kv: {
    getString: jest.fn(),
    set: jest.fn(),
  },
  getJSON: jest.fn(),
  setJSON: jest.fn(),
}));

jest.mock('../../storage/userScope', () => ({
  getScopedKey: jest.fn(),
  getCurrentUserId: jest.fn(),
}));

jest.mock('../../storage/profile');

import {Vibration} from 'react-native';
import {triggerImpact, triggerNotification} from '../haptics';
import {getProfile} from '../../storage/profile';

const mockGetProfile = getProfile as jest.MockedFunction<typeof getProfile>;

describe('haptics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('triggerImpact', () => {
    test('vibrates when haptics enabled', () => {
      mockGetProfile.mockReturnValue({
        preferences: {hapticsEnabled: true},
      } as any);

      triggerImpact('Medium');

      expect(Vibration.vibrate).toHaveBeenCalled();
    });

    test('does NOT vibrate when haptics disabled', () => {
      mockGetProfile.mockReturnValue({
        preferences: {hapticsEnabled: false},
      } as any);

      triggerImpact('Medium');

      expect(Vibration.vibrate).not.toHaveBeenCalled();
    });

    test('does NOT vibrate when preference is undefined (defaults to disabled check)', () => {
      mockGetProfile.mockReturnValue({
        preferences: {},
      } as any);

      triggerImpact('Medium');

      // Should not vibrate because hapticsEnabled is falsy
      expect(Vibration.vibrate).not.toHaveBeenCalled();
    });
  });

  describe('triggerNotification', () => {
    test('vibrates for Success when enabled', () => {
      mockGetProfile.mockReturnValue({
        preferences: {hapticsEnabled: true},
      } as any);

      triggerNotification('Success');

      expect(Vibration.vibrate).toHaveBeenCalled();
    });

    test('does NOT vibrate when disabled', () => {
      mockGetProfile.mockReturnValue({
        preferences: {hapticsEnabled: false},
      } as any);

      triggerNotification('Warning');

      expect(Vibration.vibrate).not.toHaveBeenCalled();
    });
  });
});
