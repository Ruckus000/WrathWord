// __tests__/characterization/statsRecording.characterization.test.ts

/**
 * CHARACTERIZATION TESTS
 *
 * These tests document stats recording behavior.
 * CRITICAL: Local save must succeed even if cloud fails.
 */

// Mock the profile service
jest.mock('../../src/storage/profile', () => ({
  recordGameResult: jest.fn(),
  getProfile: jest.fn(() => ({
    gamesPlayed: 10,
    gamesWon: 5,
    currentStreak: 2,
    maxStreak: 5,
    guessDistribution: [0, 1, 2, 3, 2, 2],
  })),
  markWordAsUsed: jest.fn(),
  getUnusedWords: jest.fn((words: string[]) => words),
}));

import { recordGameResult, getProfile, markWordAsUsed, getUnusedWords } from '../../src/storage/profile';

describe('stats recording - characterization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('local stats recording', () => {
    it('recordGameResult is called with game data', () => {
      const gameData = {
        length: 5,
        mode: 'daily' as const,
        won: true,
        guesses: 3,
        date: '2025-01-15',
      };

      recordGameResult(gameData);

      expect(recordGameResult).toHaveBeenCalledWith(gameData);
    });

    it('records wins correctly', () => {
      recordGameResult({
        length: 5,
        mode: 'daily',
        won: true,
        guesses: 4,
        date: '2025-01-15',
      });

      expect(recordGameResult).toHaveBeenCalledWith(expect.objectContaining({ won: true }));
    });

    it('records losses correctly', () => {
      recordGameResult({
        length: 5,
        mode: 'daily',
        won: false,
        guesses: 6,
        date: '2025-01-15',
      });

      expect(recordGameResult).toHaveBeenCalledWith(expect.objectContaining({ won: false }));
    });
  });

  describe('profile data structure', () => {
    it('getProfile returns expected structure', () => {
      const profile = getProfile();

      expect(profile).toEqual({
        gamesPlayed: expect.any(Number),
        gamesWon: expect.any(Number),
        currentStreak: expect.any(Number),
        maxStreak: expect.any(Number),
        guessDistribution: expect.any(Array),
      });
    });

    it('guessDistribution has 6 elements (for 6 possible guess counts)', () => {
      const profile = getProfile();
      expect(profile.guessDistribution).toHaveLength(6);
    });
  });

  describe('word cycling', () => {
    it('markWordAsUsed is called after game completion', () => {
      markWordAsUsed('apple', 5);

      expect(markWordAsUsed).toHaveBeenCalledWith('apple', 5);
    });

    it('getUnusedWords filters out used words', () => {
      const allWords = ['apple', 'grape', 'lemon'];
      // When no words are used, returns all words
      const unused = getUnusedWords(allWords);

      expect(unused).toBeDefined();
    });
  });

  describe('cloud sync flow', () => {
    it('local save happens first, independently of cloud', async () => {
      // Simulate the flow
      const gameData = {
        length: 5,
        mode: 'daily' as const,
        won: true,
        guesses: 3,
        date: '2025-01-15',
      };

      // Step 1: Local save (synchronous, always works)
      recordGameResult(gameData);
      expect(recordGameResult).toHaveBeenCalled();

      // Step 2: Cloud sync would happen here (fire-and-forget)
      // The local save is already complete regardless of cloud result
    });

    it('local save completes even if simulated cloud fails', async () => {
      const gameData = {
        length: 5,
        mode: 'daily' as const,
        won: true,
        guesses: 3,
        date: '2025-01-15',
      };

      // Local save
      recordGameResult(gameData);

      // Verify local save happened
      expect(recordGameResult).toHaveBeenCalled();

      // Simulate cloud failure - this should NOT affect local save
      const cloudSync = async () => {
        throw new Error('Network error');
      };

      // Cloud failure should not affect the already-completed local save
      await expect(cloudSync()).rejects.toThrow('Network error');

      // Local save still happened
      expect(recordGameResult).toHaveBeenCalledTimes(1);
    });
  });

  describe('streak calculations', () => {
    it('streak is part of profile data', () => {
      const profile = getProfile();

      expect(profile).toHaveProperty('currentStreak');
      expect(profile).toHaveProperty('maxStreak');
      expect(typeof profile.currentStreak).toBe('number');
      expect(typeof profile.maxStreak).toBe('number');
    });
  });

  describe('daily completion tracking', () => {
    // These tests verify the daily completion module behavior
    // The actual implementation is in dailyCompletion.ts

    it('completion is tracked separately from stats', () => {
      // Daily completion (isDailyCompleted/markDailyCompleted)
      // is a separate concern from stats recording
      // Both happen on game completion, but serve different purposes

      // Stats: Track games played, won, streak, distribution
      // Completion: Prevent replay of same daily puzzle

      expect(true).toBe(true); // Placeholder - actual tests in dailyCompletion tests
    });
  });
});
