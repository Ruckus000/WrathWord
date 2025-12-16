// src/storage/__tests__/dailyCompletion.test.ts
import {
  getDailyCompletionKey,
  isDailyCompleted,
  markDailyCompleted,
  isDailyCompletedFromGameState,
} from '../dailyCompletion';
import {kv} from '../mmkv';

// Mock the storage
jest.mock('../mmkv', () => ({
  kv: {
    getString: jest.fn(),
    set: jest.fn(),
  },
  getJSON: jest.fn(),
  setJSON: jest.fn(),
}));

// Mock userScope to return null (no user logged in) by default
jest.mock('../userScope', () => ({
  getScopedKey: jest.fn(() => null),
}));

const mockGetJSON = require('../mmkv').getJSON;
const mockSetJSON = require('../mmkv').setJSON;
const mockGetScopedKey = require('../userScope').getScopedKey;

describe('dailyCompletion', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getDailyCompletionKey', () => {
    test('generates correct key format without user', () => {
      mockGetScopedKey.mockReturnValue(null);
      const key = getDailyCompletionKey(5, 6, '2024-01-15');
      expect(key).toBe('daily.5x6.2024-01-15.completed');
    });

    test('uses scoped key when user is logged in', () => {
      mockGetScopedKey.mockReturnValue('daily.5x6.2024-01-15.completed.user123');
      const key = getDailyCompletionKey(5, 6, '2024-01-15');
      expect(key).toBe('daily.5x6.2024-01-15.completed.user123');
    });

    test('handles different length and maxRows', () => {
      mockGetScopedKey.mockReturnValue(null);
      expect(getDailyCompletionKey(2, 4, '2024-12-25')).toBe('daily.2x4.2024-12-25.completed');
      expect(getDailyCompletionKey(6, 8, '2024-06-15')).toBe('daily.6x8.2024-06-15.completed');
    });
  });

  describe('isDailyCompleted', () => {
    test('returns false when not completed', () => {
      mockGetJSON.mockReturnValue(false);
      expect(isDailyCompleted(5, 6, '2024-01-15')).toBe(false);
    });

    test('returns true when completed', () => {
      mockGetJSON.mockReturnValue(true);
      expect(isDailyCompleted(5, 6, '2024-01-15')).toBe(true);
    });

    test('returns false on storage error (fail-safe)', () => {
      mockGetJSON.mockImplementation(() => {
        throw new Error('Storage error');
      });
      expect(isDailyCompleted(5, 6, '2024-01-15')).toBe(false);
    });

    test('different configs are tracked independently', () => {
      mockGetJSON.mockImplementation((key: string) => {
        if (key === 'daily.5x6.2024-01-15.completed') return true;
        if (key === 'daily.5x6.2024-01-16.completed') return false;
        if (key === 'daily.4x5.2024-01-15.completed') return false;
        return false;
      });

      expect(isDailyCompleted(5, 6, '2024-01-15')).toBe(true);
      expect(isDailyCompleted(5, 6, '2024-01-16')).toBe(false);
      expect(isDailyCompleted(4, 5, '2024-01-15')).toBe(false);
    });
  });

  describe('markDailyCompleted', () => {
    test('saves completion flag', () => {
      mockGetScopedKey.mockReturnValue(null);
      markDailyCompleted(5, 6, '2024-01-15');
      expect(mockSetJSON).toHaveBeenCalledWith('daily.5x6.2024-01-15.completed', true);
    });

    test('uses scoped key when user is logged in', () => {
      mockGetScopedKey.mockReturnValue('daily.5x6.2024-01-15.completed.user123');
      markDailyCompleted(5, 6, '2024-01-15');
      expect(mockSetJSON).toHaveBeenCalledWith('daily.5x6.2024-01-15.completed.user123', true);
    });
  });

  describe('isDailyCompletedFromGameState', () => {
    test('returns true for won daily matching all criteria', () => {
      const gameState = {
        mode: 'daily',
        dateISO: '2024-01-15',
        status: 'won',
        length: 5,
        maxRows: 6,
      };
      expect(isDailyCompletedFromGameState(gameState, '2024-01-15', 5, 6)).toBe(true);
    });

    test('returns true for lost daily', () => {
      const gameState = {
        mode: 'daily',
        dateISO: '2024-01-15',
        status: 'lost',
        length: 5,
        maxRows: 6,
      };
      expect(isDailyCompletedFromGameState(gameState, '2024-01-15', 5, 6)).toBe(true);
    });

    test('returns false for free mode', () => {
      const gameState = {
        mode: 'free',
        dateISO: '2024-01-15',
        status: 'won',
        length: 5,
        maxRows: 6,
      };
      expect(isDailyCompletedFromGameState(gameState, '2024-01-15', 5, 6)).toBe(false);
    });

    test('returns false for different date', () => {
      const gameState = {
        mode: 'daily',
        dateISO: '2024-01-14',
        status: 'won',
        length: 5,
        maxRows: 6,
      };
      expect(isDailyCompletedFromGameState(gameState, '2024-01-15', 5, 6)).toBe(false);
    });

    test('returns false for different length', () => {
      const gameState = {
        mode: 'daily',
        dateISO: '2024-01-15',
        status: 'won',
        length: 4,
        maxRows: 6,
      };
      expect(isDailyCompletedFromGameState(gameState, '2024-01-15', 5, 6)).toBe(false);
    });

    test('returns false for different maxRows', () => {
      const gameState = {
        mode: 'daily',
        dateISO: '2024-01-15',
        status: 'won',
        length: 5,
        maxRows: 5,
      };
      expect(isDailyCompletedFromGameState(gameState, '2024-01-15', 5, 6)).toBe(false);
    });

    test('returns false for playing status', () => {
      const gameState = {
        mode: 'daily',
        dateISO: '2024-01-15',
        status: 'playing',
        length: 5,
        maxRows: 6,
      };
      expect(isDailyCompletedFromGameState(gameState, '2024-01-15', 5, 6)).toBe(false);
    });

    test('returns false for null state', () => {
      expect(isDailyCompletedFromGameState(null, '2024-01-15', 5, 6)).toBe(false);
    });

    test('handles partial game state', () => {
      expect(isDailyCompletedFromGameState({}, '2024-01-15', 5, 6)).toBe(false);
      expect(isDailyCompletedFromGameState({mode: 'daily'}, '2024-01-15', 5, 6)).toBe(false);
    });
  });
});
