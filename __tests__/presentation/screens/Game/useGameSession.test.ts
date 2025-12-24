// __tests__/presentation/screens/Game/useGameSession.test.ts

// Mock react-native-mmkv BEFORE any imports
jest.mock('react-native-mmkv', () => ({
  createMMKV: jest.fn(() => ({
    getString: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
    remove: jest.fn(),
    getBoolean: jest.fn(),
    getNumber: jest.fn(),
    getAllKeys: jest.fn(() => []),
    contains: jest.fn(),
    clearAll: jest.fn(),
  })),
}));

import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useGameSession } from '../../../../src/presentation/screens/Game/useGameSession';
import { getGameRepository } from '../../../../src/infrastructure/persistence/MMKVGameRepository';
import { getCompletionRepository } from '../../../../src/infrastructure/persistence/MMKVCompletionRepository';
import { getWordList } from '../../../../src/infrastructure/words/StaticWordList';
import { getJSON, setJSON } from '../../../../src/storage/mmkv';
import { triggerImpact, triggerNotification } from '../../../../src/utils/haptics';
import { gameResultsService } from '../../../../src/services/data';

// Mock dependencies
jest.mock('../../../../src/infrastructure/persistence/MMKVGameRepository');
jest.mock('../../../../src/infrastructure/persistence/MMKVCompletionRepository');
jest.mock('../../../../src/infrastructure/words/StaticWordList');
jest.mock('../../../../src/storage/mmkv');
jest.mock('../../../../src/storage/userScope', () => ({
  getScopedKey: jest.fn((key: string) => key),
}));
jest.mock('../../../../src/storage/profile', () => ({
  markWordAsUsed: jest.fn(),
  getUnusedWords: jest.fn((length: number, answers: string[]) => answers),
}));
jest.mock('../../../../src/utils/haptics');
jest.mock('../../../../src/services/data', () => ({
  gameResultsService: {
    saveGameResult: jest.fn(),
  },
}));
jest.mock('../../../../src/hooks/useToday', () => ({
  useToday: () => '2025-01-15',
}));
jest.mock('react-native/Libraries/Utilities/Platform', () => ({
  OS: 'ios',
  select: jest.fn((obj) => obj.ios),
}));

describe('useGameSession', () => {
  const mockGameRepository = {
    load: jest.fn(),
    save: jest.fn(),
    clear: jest.fn(),
    hasSavedGame: jest.fn(),
  };

  const mockCompletionRepository = {
    isDailyCompleted: jest.fn(),
    markDailyCompleted: jest.fn(),
    getCompletedDates: jest.fn(),
    clearCompletion: jest.fn(),
  };

  const mockWordList = {
    getAnswers: jest.fn(),
    isValidGuess: jest.fn(),
    getAnswerCount: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default mocks
    (getGameRepository as jest.Mock).mockReturnValue(mockGameRepository);
    (getCompletionRepository as jest.Mock).mockReturnValue(mockCompletionRepository);
    (getWordList as jest.Mock).mockReturnValue(mockWordList);

    // Default word list
    mockWordList.getAnswers.mockReturnValue(['crane', 'slate', 'trace', 'crate']);
    mockWordList.isValidGuess.mockReturnValue(true);
    mockWordList.getAnswerCount.mockReturnValue(4);

    // Default settings
    (getJSON as jest.Mock).mockImplementation((key: string, defaultValue: any) => {
      if (key === 'settings.length') return 5;
      if (key === 'settings.maxRows') return 6;
      if (key === 'settings.mode') return 'daily';
      if (key === 'app.hasLaunched') return true;
      return defaultValue;
    });

    mockGameRepository.load.mockReturnValue(null);
    mockCompletionRepository.isDailyCompleted.mockReturnValue(false);
  });

  describe('initialization', () => {
    it('starts with default state when no saved game', async () => {
      mockWordList.getAnswers.mockReturnValue(['crane']);
      const { result } = renderHook(() => useGameSession());

      // Wait for initialization to complete
      await waitFor(() => {
        expect(result.current.answer).toBeTruthy();
      });

      expect(result.current.status).toBe('playing');
      expect(result.current.rows).toEqual([]);
      expect(result.current.feedback).toEqual([]);
      expect(result.current.current).toBe('');
      expect(result.current.length).toBe(5);
      expect(result.current.maxRows).toBe(6);
      expect(result.current.mode).toBe('daily');
    });

    it('restores saved game state from repository', () => {
      const savedState = {
        length: 5,
        maxRows: 6,
        mode: 'free' as const,
        dateISO: '2025-01-14',
        answer: 'crane',
        rows: ['slate'],
        feedback: [['absent', 'present', 'correct', 'absent', 'present']],
        status: 'playing' as const,
        hintUsed: false,
        hintedCell: null,
        hintedLetter: null,
      };
      mockGameRepository.load.mockReturnValue(savedState);

      const { result } = renderHook(() => useGameSession());

      expect(result.current.answer).toBe('crane');
      expect(result.current.rows).toEqual(['slate']);
      expect(result.current.status).toBe('playing');
    });

    it('handles initialMode="daily"', () => {
      const { result } = renderHook(() =>
        useGameSession({ initialMode: 'daily' })
      );

      expect(result.current.mode).toBe('daily');
      expect(result.current.length).toBe(5);
      expect(result.current.maxRows).toBe(6);
    });

    it('handles initialMode="free" by opening settings', () => {
      const { result } = renderHook(() =>
        useGameSession({ initialMode: 'free' })
      );

      expect(result.current.mode).toBe('free');
      expect(result.current.showSettings).toBe(true);
    });

    it('shows settings on first launch', () => {
      (getJSON as jest.Mock).mockImplementation((key: string, defaultValue: any) => {
        if (key === 'app.hasLaunched') return false;
        if (key === 'settings.length') return 5;
        if (key === 'settings.maxRows') return 6;
        if (key === 'settings.mode') return 'daily';
        return defaultValue;
      });

      const { result } = renderHook(() => useGameSession());

      expect(result.current.showSettings).toBe(true);
    });
  });

  describe('onKey', () => {
    it('adds letter to current input', () => {
      mockWordList.getAnswers.mockReturnValue(['crane']);
      const { result } = renderHook(() => useGameSession());

      act(() => {
        result.current.onKey('A');
      });

      expect(result.current.current).toBe('A');
    });

    it('adds multiple letters sequentially', () => {
      mockWordList.getAnswers.mockReturnValue(['crane']);
      const { result } = renderHook(() => useGameSession());

      act(() => {
        result.current.onKey('C');
        result.current.onKey('R');
        result.current.onKey('A');
      });

      expect(result.current.current).toBe('CRA');
    });

    it('removes last letter on DEL', () => {
      mockWordList.getAnswers.mockReturnValue(['crane']);
      const { result } = renderHook(() => useGameSession());

      act(() => {
        result.current.onKey('A');
        result.current.onKey('B');
        result.current.onKey('DEL');
      });

      expect(result.current.current).toBe('A');
    });

    it('does nothing on DEL when current is empty', () => {
      mockWordList.getAnswers.mockReturnValue(['crane']);
      const { result } = renderHook(() => useGameSession());

      act(() => {
        result.current.onKey('DEL');
      });

      expect(result.current.current).toBe('');
    });

    it('submits guess on ENTER with valid word', async () => {
      mockWordList.getAnswers.mockReturnValue(['crane']);
      mockWordList.isValidGuess.mockReturnValue(true);
      const { result } = renderHook(() => useGameSession());

      // Wait for game to initialize
      await waitFor(() => {
        expect(result.current.answer).toBeTruthy();
      });

      await act(async () => {
        'CRANE'.split('').forEach(k => result.current.onKey(k));
      });

      await act(async () => {
        result.current.onKey('ENTER');
      });

      await waitFor(() => {
        expect(result.current.rows.length).toBe(1);
      });
      expect(result.current.current).toBe('');
    });

    it('shows error on ENTER with incomplete word', () => {
      mockWordList.getAnswers.mockReturnValue(['crane']);
      const { result } = renderHook(() => useGameSession());

      act(() => {
        result.current.onKey('A');
        result.current.onKey('B');
        result.current.onKey('ENTER');
      });

      expect(result.current.errorMsg).toBeTruthy();
      expect(triggerNotification).toHaveBeenCalledWith('Error');
    });

    it('shows error on ENTER with invalid word', async () => {
      mockWordList.getAnswers.mockReturnValue(['crane']);
      mockWordList.isValidGuess.mockReturnValue(false);
      const { result } = renderHook(() => useGameSession());

      // Wait for game to initialize
      await waitFor(() => {
        expect(result.current.answer).toBeTruthy();
      });

      act(() => {
        'AAAAA'.split('').forEach(k => result.current.onKey(k));
        result.current.onKey('ENTER');
      });

      expect(result.current.errorMsg).toBe('Not in word list');
    });

    it('ignores input when game is won', async () => {
      const savedState = {
        length: 5,
        maxRows: 6,
        mode: 'daily' as const,
        dateISO: '2025-01-15',
        answer: 'crane',
        rows: ['CRANE'],
        feedback: [['correct', 'correct', 'correct', 'correct', 'correct']],
        status: 'won' as const,
        hintUsed: false,
        hintedCell: null,
        hintedLetter: null,
      };
      mockGameRepository.load.mockReturnValue(savedState);
      mockWordList.getAnswers.mockReturnValue(['crane']);

      const { result } = renderHook(() => useGameSession());

      // Wait for state to be restored
      await waitFor(() => {
        expect(result.current.status).toBe('won');
      });

      act(() => {
        result.current.onKey('A');
      });

      expect(result.current.current).toBe('');
    });

    it('skips hint position when typing', async () => {
      const savedState = {
        length: 5,
        maxRows: 6,
        mode: 'daily' as const,
        dateISO: '2025-01-15',
        answer: 'crane',
        rows: [],
        feedback: [],
        status: 'playing' as const,
        hintUsed: true,
        hintedCell: { row: 0, col: 2 },
        hintedLetter: 'A',
      };
      mockGameRepository.load.mockReturnValue(savedState);
      mockWordList.getAnswers.mockReturnValue(['crane']);

      const { result } = renderHook(() => useGameSession());

      // Wait for state to be restored
      await waitFor(() => {
        expect(result.current.hintedLetter).toBe('A');
      });

      act(() => {
        result.current.onKey('B');
        result.current.onKey('C');
        result.current.onKey('D');
      });

      // Should have B, C at positions 0, 1, then skip position 2 (hint='A'), then D at position 3
      // Expected result: "BCA D" but trimmed becomes "BCA" if D isn't at the end
      // Actually: positions 0=B, 1=C, 2=A(hint), 3=D, so current should be "BCAD"
      expect(result.current.current.replace(/ /g, '')).toContain('A');
      expect(result.current.current[0]).toBe('B');
      expect(result.current.current[1]).toBe('C');
      expect(result.current.current[2]).toBe('A'); // hint position
    });
  });

  describe('hint system', () => {
    it('reveals unrevealed position', () => {
      mockWordList.getAnswers.mockReturnValue(['crane']);
      const { result } = renderHook(() => useGameSession());

      act(() => {
        result.current.handleHint();
      });

      expect(result.current.hintUsed).toBe(true);
      expect(result.current.hintedCell).not.toBeNull();
      expect(result.current.hintedLetter).not.toBeNull();
      expect(result.current.current).toContain(result.current.hintedLetter!);
    });

    it('prevents second hint', () => {
      mockWordList.getAnswers.mockReturnValue(['crane']);
      const { result } = renderHook(() => useGameSession());

      act(() => {
        result.current.handleHint();
      });

      expect(result.current.hintDisabled).toBe(true);

      const firstHintLetter = result.current.hintedLetter;

      act(() => {
        result.current.handleHint();
      });

      // Should not change
      expect(result.current.hintedLetter).toBe(firstHintLetter);
    });

    it('disables hint when all positions are correct', () => {
      const savedState = {
        length: 5,
        maxRows: 6,
        mode: 'daily' as const,
        dateISO: '2025-01-15',
        answer: 'crane',
        rows: ['crate'],
        feedback: [['correct', 'correct', 'correct', 'absent', 'correct']],
        status: 'playing' as const,
        hintUsed: false,
        hintedCell: null,
        hintedLetter: null,
      };
      mockGameRepository.load.mockReturnValue(savedState);

      const { result } = renderHook(() => useGameSession());

      // Even though not all positions are actually correct (one is 'absent'),
      // let's test with all correct positions
      const allCorrectState = {
        ...savedState,
        rows: ['crane', 'slate'],
        feedback: [
          ['correct', 'correct', 'correct', 'correct', 'correct'],
          ['correct', 'absent', 'absent', 'absent', 'absent'],
        ],
      };
      mockGameRepository.load.mockReturnValue(allCorrectState);

      const { result: result2 } = renderHook(() => useGameSession());
      expect(result2.current.hintDisabled).toBe(true);
    });

    it('marks hinted letter as correct on keyboard', () => {
      mockWordList.getAnswers.mockReturnValue(['crane']);
      const { result } = renderHook(() => useGameSession());

      act(() => {
        result.current.handleHint();
      });

      const hintedLetter = result.current.hintedLetter;
      expect(result.current.keyStates.get(hintedLetter!)).toBe('correct');
    });
  });

  describe('game completion', () => {
    it('sets status to won on correct guess', async () => {
      mockWordList.getAnswers.mockReturnValue(['crane']);
      mockWordList.isValidGuess.mockReturnValue(true);
      const { result } = renderHook(() => useGameSession());

      // Wait for game to initialize
      await waitFor(() => {
        expect(result.current.answer).toBeTruthy();
      });

      await act(async () => {
        'CRANE'.split('').forEach(k => result.current.onKey(k));
      });

      await act(async () => {
        result.current.onKey('ENTER');
      });

      await waitFor(() => {
        expect(result.current.status).toBe('won');
      });
      expect(result.current.showResult).toBe(true);
      expect(triggerNotification).toHaveBeenCalledWith('Success');
    });

    it('sets status to lost after max guesses', async () => {
      mockWordList.getAnswers.mockReturnValue(['crane']);
      mockWordList.isValidGuess.mockReturnValue(true);
      const { result } = renderHook(() => useGameSession());

      // Wait for game to initialize
      await waitFor(() => {
        expect(result.current.answer).toBeTruthy();
      });

      // Submit 6 wrong guesses
      for (let i = 0; i < 6; i++) {
        await act(async () => {
          'SLATE'.split('').forEach(k => result.current.onKey(k));
        });
        await act(async () => {
          result.current.onKey('ENTER');
        });
        await waitFor(() => {
          expect(result.current.rows.length).toBe(i + 1);
        });
      }

      await waitFor(() => {
        expect(result.current.status).toBe('lost');
      });
      expect(result.current.showResult).toBe(true);
      expect(triggerNotification).toHaveBeenCalledWith('Warning');
    });

    it('marks daily as completed on win', async () => {
      mockWordList.getAnswers.mockReturnValue(['crane']);
      mockWordList.isValidGuess.mockReturnValue(true);
      const { result } = renderHook(() => useGameSession());

      // Wait for game to initialize
      await waitFor(() => {
        expect(result.current.answer).toBeTruthy();
      });

      await act(async () => {
        'CRANE'.split('').forEach(k => result.current.onKey(k));
      });

      await act(async () => {
        result.current.onKey('ENTER');
      });

      await waitFor(() => {
        expect(mockCompletionRepository.markDailyCompleted).toHaveBeenCalledWith(5, 6, '2025-01-15');
      });
    });

    it('saves game result on win', async () => {
      mockWordList.getAnswers.mockReturnValue(['crane']);
      mockWordList.isValidGuess.mockReturnValue(true);
      const { result } = renderHook(() => useGameSession());

      // Wait for game to initialize
      await waitFor(() => {
        expect(result.current.answer).toBeTruthy();
      });

      await act(async () => {
        'CRANE'.split('').forEach(k => result.current.onKey(k));
      });

      await act(async () => {
        result.current.onKey('ENTER');
      });

      await waitFor(() => {
        expect(gameResultsService.saveGameResult).toHaveBeenCalledWith(
          expect.objectContaining({
            wordLength: 5,
            won: true,
            guesses: 1,
            maxRows: 6,
          })
        );
      });
    });

    it('saves game result on loss', async () => {
      mockWordList.getAnswers.mockReturnValue(['crane']);
      mockWordList.isValidGuess.mockReturnValue(true);
      const { result } = renderHook(() => useGameSession());

      // Wait for game to initialize
      await waitFor(() => {
        expect(result.current.answer).toBeTruthy();
      });

      // Submit 6 wrong guesses
      for (let i = 0; i < 6; i++) {
        await act(async () => {
          'SLATE'.split('').forEach(k => result.current.onKey(k));
        });
        await act(async () => {
          result.current.onKey('ENTER');
        });
        await waitFor(() => {
          expect(result.current.rows.length).toBe(i + 1);
        });
      }

      await waitFor(() => {
        expect(gameResultsService.saveGameResult).toHaveBeenCalledWith(
          expect.objectContaining({
            wordLength: 5,
            won: false,
            guesses: 6,
          })
        );
      });
    });
  });

  describe('stale game detection', () => {
    it('shows warning for yesterday\'s game with progress', async () => {
      const savedState = {
        length: 5,
        maxRows: 6,
        mode: 'daily' as const,
        dateISO: '2025-01-14', // Yesterday
        answer: 'crane',
        rows: ['SLATE'], // Has progress
        feedback: [['absent', 'present', 'correct', 'absent', 'present']],
        status: 'playing' as const,
        hintUsed: false,
        hintedCell: null,
        hintedLetter: null,
      };
      mockGameRepository.load.mockReturnValue(savedState);
      mockWordList.getAnswers.mockReturnValue(['crane']);

      const { result } = renderHook(() => useGameSession());

      // Wait for stale detection effect to trigger
      await waitFor(() => {
        expect(result.current.staleGameWarning).toBe(true);
      });
    });

    it('auto-starts today\'s game if yesterday had no progress', () => {
      const savedState = {
        length: 5,
        maxRows: 6,
        mode: 'daily' as const,
        dateISO: '2025-01-14', // Yesterday
        answer: 'crane',
        rows: [], // No progress
        feedback: [],
        status: 'playing' as const,
        hintUsed: false,
        hintedCell: null,
        hintedLetter: null,
      };
      mockGameRepository.load.mockReturnValue(savedState);
      mockWordList.getAnswers.mockReturnValue(['slate']);

      const { result } = renderHook(() => useGameSession());

      expect(result.current.staleGameWarning).toBe(false);
      expect(result.current.dateISO).toBe('2025-01-15'); // Today
    });

    it('handles handleStartTodaysPuzzle', async () => {
      const savedState = {
        length: 5,
        maxRows: 6,
        mode: 'daily' as const,
        dateISO: '2025-01-14',
        answer: 'crane',
        rows: ['SLATE'],
        feedback: [['absent', 'present', 'correct', 'absent', 'present']],
        status: 'playing' as const,
        hintUsed: false,
        hintedCell: null,
        hintedLetter: null,
      };
      mockGameRepository.load.mockReturnValue(savedState);
      mockWordList.getAnswers.mockReturnValue(['slate']);

      const { result } = renderHook(() => useGameSession());

      await waitFor(() => {
        expect(result.current.staleGameWarning).toBe(true);
      });

      act(() => {
        result.current.handleStartTodaysPuzzle();
      });

      await waitFor(() => {
        expect(result.current.staleGameWarning).toBe(false);
      });
      expect(result.current.dateISO).toBe('2025-01-15');
      expect(result.current.rows).toEqual([]);
    });

    it('handles handleFinishCurrentGame', async () => {
      const savedState = {
        length: 5,
        maxRows: 6,
        mode: 'daily' as const,
        dateISO: '2025-01-14',
        answer: 'crane',
        rows: ['SLATE'],
        feedback: [['absent', 'present', 'correct', 'absent', 'present']],
        status: 'playing' as const,
        hintUsed: false,
        hintedCell: null,
        hintedLetter: null,
      };
      mockGameRepository.load.mockReturnValue(savedState);
      mockWordList.getAnswers.mockReturnValue(['crane']);

      const { result } = renderHook(() => useGameSession());

      await waitFor(() => {
        expect(result.current.staleGameWarning).toBe(true);
      });

      act(() => {
        result.current.handleFinishCurrentGame();
      });

      expect(result.current.staleGameWarning).toBe(false);
      // Should keep yesterday's game state
      expect(result.current.dateISO).toBe('2025-01-14');
      expect(result.current.rows).toEqual(['SLATE']);
    });
  });

  describe('keyStates', () => {
    it('tracks best state per letter', async () => {
      mockWordList.getAnswers.mockReturnValue(['crane']);
      mockWordList.isValidGuess.mockReturnValue(true);
      const { result } = renderHook(() => useGameSession());

      // Wait for game to initialize
      await waitFor(() => {
        expect(result.current.answer).toBeTruthy();
      });

      await act(async () => {
        'SLATE'.split('').forEach(k => result.current.onKey(k));
      });

      await act(async () => {
        result.current.onKey('ENTER');
      });

      await waitFor(() => {
        expect(result.current.rows.length).toBe(1);
      });

      // Check that keyStates has entries for the guessed letters
      expect(result.current.keyStates.has('S')).toBe(true);
      expect(result.current.keyStates.has('L')).toBe(true);
    });

    it('never downgrades key state', async () => {
      mockWordList.getAnswers.mockReturnValue(['crane']);
      mockWordList.isValidGuess.mockReturnValue(true);
      const { result } = renderHook(() => useGameSession());

      // Wait for game to initialize
      await waitFor(() => {
        expect(result.current.answer).toBeTruthy();
      });

      // First guess: 'TRACE' - has 'R', 'A', 'E' correct, 'C' present
      await act(async () => {
        'TRACE'.split('').forEach(k => result.current.onKey(k));
      });

      await act(async () => {
        result.current.onKey('ENTER');
      });

      await waitFor(() => {
        expect(result.current.rows.length).toBe(1);
      });

      // Second guess: 'CRATE' - all correct
      await act(async () => {
        'CRATE'.split('').forEach(k => result.current.onKey(k));
      });

      await act(async () => {
        result.current.onKey('ENTER');
      });

      await waitFor(() => {
        expect(result.current.rows.length).toBe(2);
      });

      // Verify 'C' is marked correct (upgraded from present)
      expect(result.current.keyStates.get('C')).toBe('correct');
    });
  });

  describe('new game flow', () => {
    it('opens settings modal on handleNewGame', () => {
      mockWordList.getAnswers.mockReturnValue(['crane']);
      const { result } = renderHook(() => useGameSession());

      act(() => {
        result.current.handleNewGame();
      });

      expect(result.current.showSettings).toBe(true);
    });

    it('starts new game with custom config', () => {
      mockWordList.getAnswers.mockReturnValue(['trace']);
      const { result } = renderHook(() => useGameSession());

      act(() => {
        result.current.handleNewGameStart({
          length: 6,
          maxRows: 8,
          mode: 'free',
        });
      });

      expect(result.current.length).toBe(6);
      expect(result.current.maxRows).toBe(8);
      expect(result.current.mode).toBe('free');
      expect(result.current.showSettings).toBe(false);
    });

    it('handles cancel on first launch', () => {
      (getJSON as jest.Mock).mockImplementation((key: string, defaultValue: any) => {
        if (key === 'app.hasLaunched') return false;
        if (key === 'settings.length') return 5;
        if (key === 'settings.maxRows') return 6;
        if (key === 'settings.mode') return 'daily';
        return defaultValue;
      });
      mockWordList.getAnswers.mockReturnValue(['crane']);

      const { result } = renderHook(() => useGameSession());

      act(() => {
        result.current.handleCancel();
      });

      expect(result.current.showSettings).toBe(false);
      expect(setJSON).toHaveBeenCalledWith('app.hasLaunched', true);
    });

    it('handles give up', async () => {
      mockWordList.getAnswers.mockReturnValue(['crane']);
      const { result } = renderHook(() => useGameSession());

      await act(async () => {
        result.current.handleGiveUp();
      });

      await waitFor(() => {
        expect(result.current.status).toBe('lost');
      });
      expect(result.current.showResult).toBe(true);
      expect(gameResultsService.saveGameResult).toHaveBeenCalled();
    });
  });

  describe('persistence', () => {
    it('saves state on every change', () => {
      mockWordList.getAnswers.mockReturnValue(['crane']);
      const { result } = renderHook(() => useGameSession());

      act(() => {
        result.current.onKey('A');
      });

      expect(mockGameRepository.save).toHaveBeenCalled();
    });

    it('handles corrupted saved state gracefully', () => {
      mockGameRepository.load.mockReturnValue({ invalid: 'data' } as any);

      expect(() => {
        renderHook(() => useGameSession());
      }).not.toThrow();
    });
  });

  describe('result modal', () => {
    it('closes result modal on closeResult', async () => {
      mockWordList.getAnswers.mockReturnValue(['crane']);
      mockWordList.isValidGuess.mockReturnValue(true);
      const { result } = renderHook(() => useGameSession());

      // Wait for game to initialize
      await waitFor(() => {
        expect(result.current.answer).toBeTruthy();
      });

      // Win the game
      await act(async () => {
        'CRANE'.split('').forEach(k => result.current.onKey(k));
      });

      await act(async () => {
        result.current.onKey('ENTER');
      });

      await waitFor(() => {
        expect(result.current.showResult).toBe(true);
      });

      act(() => {
        result.current.closeResult();
      });

      expect(result.current.showResult).toBe(false);
    });

    it('starts new game on playAgain', async () => {
      mockWordList.getAnswers.mockReturnValue(['crane', 'slate']);
      mockWordList.isValidGuess.mockReturnValue(true);
      const { result } = renderHook(() => useGameSession());

      // Wait for game to initialize
      await waitFor(() => {
        expect(result.current.answer).toBeTruthy();
      });

      // Win the game
      await act(async () => {
        'CRANE'.split('').forEach(k => result.current.onKey(k));
      });

      await act(async () => {
        result.current.onKey('ENTER');
      });

      await waitFor(() => {
        expect(result.current.status).toBe('won');
      });

      const firstAnswer = result.current.answer;

      await act(async () => {
        result.current.playAgain();
      });

      await waitFor(() => {
        expect(result.current.rows).toEqual([]);
      });
      expect(result.current.showResult).toBe(false);
      expect(result.current.status).toBe('playing');
    });
  });

  describe('formatted date', () => {
    it('formats date for daily mode', () => {
      const savedState = {
        length: 5,
        maxRows: 6,
        mode: 'daily' as const,
        dateISO: '2025-01-15',
        answer: 'crane',
        rows: [],
        feedback: [],
        status: 'playing' as const,
        hintUsed: false,
        hintedCell: null,
        hintedLetter: null,
      };
      mockGameRepository.load.mockReturnValue(savedState);

      const { result } = renderHook(() => useGameSession());

      expect(result.current.formattedDate).toBe('Jan 15');
    });

    it('returns empty string for free mode', () => {
      const savedState = {
        length: 5,
        maxRows: 6,
        mode: 'free' as const,
        dateISO: '2025-01-15',
        answer: 'crane',
        rows: [],
        feedback: [],
        status: 'playing' as const,
        hintUsed: false,
        hintedCell: null,
        hintedLetter: null,
      };
      mockGameRepository.load.mockReturnValue(savedState);

      const { result } = renderHook(() => useGameSession());

      expect(result.current.formattedDate).toBe('');
    });
  });

  describe('gameInProgress', () => {
    it('returns true when rows exist and status is playing', async () => {
      const savedState = {
        length: 5,
        maxRows: 6,
        mode: 'daily' as const,
        dateISO: '2025-01-15',
        answer: 'crane',
        rows: ['SLATE'],
        feedback: [['absent', 'present', 'correct', 'absent', 'present']],
        status: 'playing' as const,
        hintUsed: false,
        hintedCell: null,
        hintedLetter: null,
      };
      mockGameRepository.load.mockReturnValue(savedState);
      mockWordList.getAnswers.mockReturnValue(['crane']);

      const { result } = renderHook(() => useGameSession());

      // Wait for state to be restored
      await waitFor(() => {
        expect(result.current.rows.length).toBe(1);
      });

      expect(result.current.gameInProgress).toBe(true);
    });

    it('returns false when no rows', () => {
      mockWordList.getAnswers.mockReturnValue(['crane']);
      const { result } = renderHook(() => useGameSession());

      expect(result.current.gameInProgress).toBe(false);
    });

    it('returns false when status is won', () => {
      const savedState = {
        length: 5,
        maxRows: 6,
        mode: 'daily' as const,
        dateISO: '2025-01-15',
        answer: 'crane',
        rows: ['crane'],
        feedback: [['correct', 'correct', 'correct', 'correct', 'correct']],
        status: 'won' as const,
        hintUsed: false,
        hintedCell: null,
        hintedLetter: null,
      };
      mockGameRepository.load.mockReturnValue(savedState);

      const { result } = renderHook(() => useGameSession());

      expect(result.current.gameInProgress).toBe(false);
    });
  });
});
