// Mock modules before imports
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

import {getTileColors} from '../getColors';
import {getProfile} from '../../storage/profile';
import {palette} from '../colors';

const mockGetProfile = getProfile as jest.MockedFunction<typeof getProfile>;

describe('getTileColors', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('returns standard colors when high contrast disabled', () => {
    mockGetProfile.mockReturnValue({
      id: 'test',
      createdAt: Date.now(),
      stats: {},
      preferences: {
        defaultLength: 5,
        defaultRows: 6,
        defaultMode: 'daily',
        hapticsEnabled: true,
        highContrastEnabled: false,
      },
    } as any);

    const colors = getTileColors();

    expect(colors.correct).toBe(palette.correct);
    expect(colors.present).toBe(palette.present);
    expect(colors.absent).toBe(palette.absent);
  });

  test('returns high contrast colors when enabled', () => {
    mockGetProfile.mockReturnValue({
      id: 'test',
      createdAt: Date.now(),
      stats: {},
      preferences: {
        defaultLength: 5,
        defaultRows: 6,
        defaultMode: 'daily',
        hapticsEnabled: true,
        highContrastEnabled: true,
      },
    } as any);

    const colors = getTileColors();

    expect(colors.correct).toBe(palette.correctHighContrast);
    expect(colors.present).toBe(palette.presentHighContrast);
    expect(colors.absent).toBe(palette.absent); // absent doesn't change
  });
});
