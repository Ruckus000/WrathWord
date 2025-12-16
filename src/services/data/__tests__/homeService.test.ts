// Mock all dependencies BEFORE imports
jest.mock('../../../storage/mmkv', () => ({
  kv: {
    getString: jest.fn(),
    set: jest.fn(),
  },
  getJSON: jest.fn(),
  setJSON: jest.fn(),
}));

jest.mock('../../../storage/userScope', () => ({
  getScopedKey: jest.fn(),
  getCurrentUserId: jest.fn(),
}));

jest.mock('../../../storage/dailyCompletion', () => ({
  markDailyCompleted: jest.fn(),
  isDailyCompleted: jest.fn(),
  getDailyCompletionKey: jest.fn(),
}));

jest.mock('../../../storage/profile', () => ({
  recordGameResult: jest.fn(),
  getProfile: jest.fn(),
  saveProfile: jest.fn(),
}));

jest.mock('../gameResultsService', () => ({
  gameResultsService: {
    saveGameResult: jest.fn(),
    getRecentGames: jest.fn(),
    getGamesForDate: jest.fn(),
  },
}));

import {
  getGameStateKey,
  getHomeGameSummary,
  abandonGame,
  clearGameState,
} from '../homeService';
import {getJSON, setJSON} from '../../../storage/mmkv';
import {getScopedKey} from '../../../storage/userScope';
import {markDailyCompleted} from '../../../storage/dailyCompletion';
import {recordGameResult} from '../../../storage/profile';
import {gameResultsService} from '../gameResultsService';
import {HomeGameSummary} from '../../../screens/HomeScreen/types';
import {TileState} from '../../../logic/evaluateGuess';

const mockGetJSON = getJSON as jest.MockedFunction<typeof getJSON>;
const mockSetJSON = setJSON as jest.MockedFunction<typeof setJSON>;
const mockGetScopedKey = getScopedKey as jest.MockedFunction<typeof getScopedKey>;
const mockMarkDailyCompleted = markDailyCompleted as jest.MockedFunction<
  typeof markDailyCompleted
>;
const mockRecordGameResult = recordGameResult as jest.MockedFunction<
  typeof recordGameResult
>;
const mockSaveGameResult = gameResultsService.saveGameResult as jest.MockedFunction<
  typeof gameResultsService.saveGameResult
>;

describe('homeService', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  describe('getGameStateKey', () => {
    it('should return scoped key when user is authenticated', () => {
      // Arrange
      const userId = 'user-123';
      const scopedKey = `game.state.${userId}`;
      mockGetScopedKey.mockReturnValue(scopedKey);

      // Act
      const result = getGameStateKey();

      // Assert
      expect(mockGetScopedKey).toHaveBeenCalledWith('game.state');
      expect(result).toBe(scopedKey);
    });

    it('should fall back to base key when no user is authenticated', () => {
      // Arrange
      mockGetScopedKey.mockReturnValue(null);

      // Act
      const result = getGameStateKey();

      // Assert
      expect(mockGetScopedKey).toHaveBeenCalledWith('game.state');
      expect(result).toBe('game.state');
    });
  });

  describe('getHomeGameSummary', () => {
    it('should return null when no game state exists', () => {
      // Arrange
      mockGetScopedKey.mockReturnValue('game.state.user-123');
      mockGetJSON.mockReturnValue(null);

      // Act
      const result = getHomeGameSummary();

      // Assert
      expect(result).toBeNull();
      expect(mockGetJSON).toHaveBeenCalledWith('game.state.user-123', null);
    });

    it('should correctly transform stored state to HomeGameSummary with playing status', () => {
      // Arrange
      mockGetScopedKey.mockReturnValue('game.state');
      const storedState = {
        length: 5,
        maxRows: 6,
        mode: 'daily' as const,
        dateISO: '2025-12-13',
        answer: 'WORDS',
        rows: ['SWORD', 'WORLD'],
        feedback: [
          ['present', 'correct', 'absent', 'correct', 'correct'] as TileState[],
          ['correct', 'correct', 'correct', 'absent', 'correct'] as TileState[],
        ],
        current: 'WO',
        status: 'playing' as const,
        hintUsed: false,
        hintedCell: null,
        hintedLetter: null,
      };
      mockGetJSON.mockReturnValue(storedState);

      // Act
      const result = getHomeGameSummary();

      // Assert
      expect(result).toEqual({
        mode: 'daily',
        status: 'playing',
        length: 5,
        maxRows: 6,
        dateISO: '2025-12-13',
        guessesUsed: 2, // Derived from rows.length
        feedback: storedState.feedback,
      });
    });

    it('should correctly derive guessesUsed from rows.length for won game', () => {
      // Arrange
      mockGetScopedKey.mockReturnValue('game.state');
      const storedState = {
        length: 6,
        maxRows: 6,
        mode: 'free' as const,
        dateISO: '2025-12-13',
        answer: 'WONDER',
        rows: ['TESTED', 'WONDER'],
        feedback: [
          ['absent', 'correct', 'absent', 'absent', 'present', 'absent'] as TileState[],
          ['correct', 'correct', 'correct', 'correct', 'correct', 'correct'] as TileState[],
        ],
        current: '',
        status: 'won' as const,
        hintUsed: true,
        hintedCell: {row: 0, col: 1},
        hintedLetter: 'O',
      };
      mockGetJSON.mockReturnValue(storedState);

      // Act
      const result = getHomeGameSummary();

      // Assert
      expect(result).not.toBeNull();
      expect(result!.guessesUsed).toBe(2); // rows.length = 2
      expect(result!.status).toBe('won');
    });

    it('should handle empty rows array correctly', () => {
      // Arrange
      mockGetScopedKey.mockReturnValue('game.state');
      const storedState = {
        length: 4,
        maxRows: 6,
        mode: 'daily' as const,
        dateISO: '2025-12-13',
        answer: 'TEST',
        rows: [],
        feedback: [],
        current: '',
        status: 'playing' as const,
        hintUsed: false,
        hintedCell: null,
        hintedLetter: null,
      };
      mockGetJSON.mockReturnValue(storedState);

      // Act
      const result = getHomeGameSummary();

      // Assert
      expect(result).not.toBeNull();
      expect(result!.guessesUsed).toBe(0); // No guesses yet
    });

    it('should handle missing rows field with fallback to 0', () => {
      // Arrange
      mockGetScopedKey.mockReturnValue('game.state');
      const storedState = {
        length: 5,
        maxRows: 6,
        mode: 'free' as const,
        dateISO: '2025-12-13',
        answer: 'TESTS',
        // rows field is missing
        feedback: [],
        current: '',
        status: 'playing' as const,
        hintUsed: false,
        hintedCell: null,
        hintedLetter: null,
      };
      mockGetJSON.mockReturnValue(storedState);

      // Act
      const result = getHomeGameSummary();

      // Assert
      expect(result).not.toBeNull();
      expect(result!.guessesUsed).toBe(0); // Falls back to 0
    });

    it('should handle missing feedback field with fallback to empty array', () => {
      // Arrange
      mockGetScopedKey.mockReturnValue('game.state');
      const storedState = {
        length: 5,
        maxRows: 6,
        mode: 'daily' as const,
        dateISO: '2025-12-13',
        answer: 'TESTS',
        rows: ['BENCH'],
        // feedback field is missing
        current: '',
        status: 'playing' as const,
        hintUsed: false,
        hintedCell: null,
        hintedLetter: null,
      };
      mockGetJSON.mockReturnValue(storedState);

      // Act
      const result = getHomeGameSummary();

      // Assert
      expect(result).not.toBeNull();
      expect(result!.feedback).toEqual([]); // Falls back to empty array
    });

    it('should correctly transform lost game state', () => {
      // Arrange
      mockGetScopedKey.mockReturnValue('game.state');
      const storedState = {
        length: 5,
        maxRows: 6,
        mode: 'daily' as const,
        dateISO: '2025-12-13',
        answer: 'WORDS',
        rows: ['SWORD', 'WORLD', 'TESTS', 'BENCH', 'CRANE', 'SLANT'],
        feedback: [
          ['present', 'correct', 'absent', 'correct', 'correct'] as TileState[],
          ['correct', 'correct', 'correct', 'absent', 'correct'] as TileState[],
          ['absent', 'absent', 'absent', 'absent', 'present'] as TileState[],
          ['absent', 'absent', 'absent', 'absent', 'absent'] as TileState[],
          ['absent', 'absent', 'absent', 'absent', 'absent'] as TileState[],
          ['present', 'absent', 'absent', 'absent', 'absent'] as TileState[],
        ],
        current: '',
        status: 'lost' as const,
        hintUsed: false,
        hintedCell: null,
        hintedLetter: null,
      };
      mockGetJSON.mockReturnValue(storedState);

      // Act
      const result = getHomeGameSummary();

      // Assert
      expect(result).not.toBeNull();
      expect(result!.status).toBe('lost');
      expect(result!.guessesUsed).toBe(6); // All 6 rows used
    });
  });

  describe('clearGameState', () => {
    it('should clear game state by setting key to null', () => {
      // Arrange
      mockGetScopedKey.mockReturnValue('game.state.user-123');

      // Act
      clearGameState();

      // Assert
      expect(mockSetJSON).toHaveBeenCalledWith('game.state.user-123', null);
    });

    it('should use base key when no user is authenticated', () => {
      // Arrange
      mockGetScopedKey.mockReturnValue(null);

      // Act
      clearGameState();

      // Assert
      expect(mockSetJSON).toHaveBeenCalledWith('game.state', null);
    });
  });

  describe('abandonGame', () => {
    const createDailyGameSummary = (): HomeGameSummary => ({
      mode: 'daily',
      status: 'playing',
      length: 5,
      maxRows: 6,
      dateISO: '2025-12-13',
      guessesUsed: 3,
      feedback: [
        ['present', 'correct', 'absent', 'correct', 'correct'] as TileState[],
        ['correct', 'correct', 'correct', 'absent', 'correct'] as TileState[],
        ['absent', 'absent', 'absent', 'absent', 'present'] as TileState[],
      ],
    });

    const createFreeGameSummary = (): HomeGameSummary => ({
      mode: 'free',
      status: 'playing',
      length: 6,
      maxRows: 6,
      dateISO: '2025-12-13',
      guessesUsed: 2,
      feedback: [
        ['present', 'correct', 'absent', 'correct', 'correct', 'absent'] as TileState[],
        ['correct', 'correct', 'correct', 'absent', 'correct', 'present'] as TileState[],
      ],
    });

    beforeEach(() => {
      mockGetScopedKey.mockReturnValue('game.state.user-123');
      mockSaveGameResult.mockResolvedValue();
    });

    it('should record loss via local recordGameResult', async () => {
      // Arrange
      const gameSummary = createDailyGameSummary();

      // Act
      await abandonGame(gameSummary);

      // Assert
      expect(mockRecordGameResult).toHaveBeenCalledWith({
        length: 5,
        won: false,
        guesses: 3,
        maxRows: 6,
        date: '2025-12-13',
      });
    });

    it('should save game result to cloud via gameResultsService', async () => {
      // Arrange
      const gameSummary = createDailyGameSummary();

      // Act
      await abandonGame(gameSummary);

      // Assert
      expect(mockSaveGameResult).toHaveBeenCalledWith({
        wordLength: 5,
        won: false,
        guesses: 3,
        maxRows: 6,
        date: '2025-12-13',
        feedback: gameSummary.feedback,
      });
    });

    it('should mark daily as completed when mode is daily', async () => {
      // Arrange
      const gameSummary = createDailyGameSummary();

      // Act
      await abandonGame(gameSummary);

      // Assert
      expect(mockMarkDailyCompleted).toHaveBeenCalledWith(5, 6, '2025-12-13');
    });

    it('should not mark daily as completed when mode is free', async () => {
      // Arrange
      const gameSummary = createFreeGameSummary();

      // Act
      await abandonGame(gameSummary);

      // Assert
      expect(mockMarkDailyCompleted).not.toHaveBeenCalled();
    });

    it('should clear game state after abandoning', async () => {
      // Arrange
      const gameSummary = createDailyGameSummary();

      // Act
      await abandonGame(gameSummary);

      // Assert
      expect(mockSetJSON).toHaveBeenCalledWith('game.state.user-123', null);
    });

    it('should handle cloud save failure gracefully and continue', async () => {
      // Arrange
      const gameSummary = createDailyGameSummary();
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      mockSaveGameResult.mockRejectedValue(new Error('Network error'));

      // Act
      await abandonGame(gameSummary);

      // Assert
      // Should still record locally
      expect(mockRecordGameResult).toHaveBeenCalled();
      // Should still mark daily completed
      expect(mockMarkDailyCompleted).toHaveBeenCalled();
      // Should still clear game state
      expect(mockSetJSON).toHaveBeenCalledWith('game.state.user-123', null);
      // Should log warning
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[homeService] Cloud save failed during abandon:',
        expect.any(Error),
      );

      consoleWarnSpy.mockRestore();
    });

    it('should complete all steps in correct order', async () => {
      // Arrange
      const gameSummary = createDailyGameSummary();
      const callOrder: string[] = [];

      mockRecordGameResult.mockImplementation(() => {
        callOrder.push('recordLocal');
      });
      mockSaveGameResult.mockImplementation(async () => {
        callOrder.push('saveCloud');
      });
      mockMarkDailyCompleted.mockImplementation(() => {
        callOrder.push('markDaily');
      });
      mockSetJSON.mockImplementation(() => {
        callOrder.push('clearState');
      });

      // Act
      await abandonGame(gameSummary);

      // Assert
      expect(callOrder).toEqual([
        'recordLocal',
        'saveCloud',
        'markDaily',
        'clearState',
      ]);
    });

    it('should handle game with zero guesses', async () => {
      // Arrange
      const gameSummary: HomeGameSummary = {
        mode: 'daily',
        status: 'playing',
        length: 4,
        maxRows: 6,
        dateISO: '2025-12-13',
        guessesUsed: 0,
        feedback: [],
      };

      // Act
      await abandonGame(gameSummary);

      // Assert
      expect(mockRecordGameResult).toHaveBeenCalledWith({
        length: 4,
        won: false,
        guesses: 0,
        maxRows: 6,
        date: '2025-12-13',
      });
      expect(mockSaveGameResult).toHaveBeenCalledWith({
        wordLength: 4,
        won: false,
        guesses: 0,
        maxRows: 6,
        date: '2025-12-13',
        feedback: [],
      });
    });

    it('should handle different word lengths correctly', async () => {
      // Arrange - 4-letter word
      const gameSummary4: HomeGameSummary = {
        mode: 'free',
        status: 'playing',
        length: 4,
        maxRows: 6,
        dateISO: '2025-12-13',
        guessesUsed: 1,
        feedback: [['absent', 'absent', 'absent', 'absent'] as TileState[]],
      };

      // Act
      await abandonGame(gameSummary4);

      // Assert
      expect(mockRecordGameResult).toHaveBeenCalledWith(
        expect.objectContaining({length: 4}),
      );
      expect(mockSaveGameResult).toHaveBeenCalledWith(
        expect.objectContaining({wordLength: 4}),
      );

      // Reset mocks
      jest.clearAllMocks();

      // Arrange - 6-letter word
      const gameSummary6: HomeGameSummary = {
        mode: 'daily',
        status: 'playing',
        length: 6,
        maxRows: 6,
        dateISO: '2025-12-13',
        guessesUsed: 4,
        feedback: [
          ['absent', 'absent', 'absent', 'absent', 'absent', 'absent'] as TileState[],
          ['absent', 'absent', 'absent', 'absent', 'absent', 'absent'] as TileState[],
          ['absent', 'absent', 'absent', 'absent', 'absent', 'absent'] as TileState[],
          ['absent', 'absent', 'absent', 'absent', 'absent', 'absent'] as TileState[],
        ],
      };

      // Act
      await abandonGame(gameSummary6);

      // Assert
      expect(mockRecordGameResult).toHaveBeenCalledWith(
        expect.objectContaining({length: 6}),
      );
      expect(mockSaveGameResult).toHaveBeenCalledWith(
        expect.objectContaining({wordLength: 6}),
      );
    });

    it('should handle different maxRows configurations', async () => {
      // Arrange
      const gameSummary: HomeGameSummary = {
        mode: 'daily',
        status: 'playing',
        length: 5,
        maxRows: 8, // Non-standard maxRows
        dateISO: '2025-12-13',
        guessesUsed: 5,
        feedback: [],
      };

      // Act
      await abandonGame(gameSummary);

      // Assert
      expect(mockRecordGameResult).toHaveBeenCalledWith(
        expect.objectContaining({maxRows: 8}),
      );
      expect(mockSaveGameResult).toHaveBeenCalledWith(
        expect.objectContaining({maxRows: 8}),
      );
      expect(mockMarkDailyCompleted).toHaveBeenCalledWith(5, 8, '2025-12-13');
    });
  });
});
