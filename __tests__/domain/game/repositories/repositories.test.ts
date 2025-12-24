// __tests__/domain/game/repositories/repositories.test.ts

import { IWordList } from '../../../../src/domain/game/repositories/IWordList';
import { IGameRepository, PersistedGameState } from '../../../../src/domain/game/repositories/IGameRepository';
import { ICompletionRepository } from '../../../../src/domain/game/repositories/ICompletionRepository';
import { ValidLength } from '../../../../src/domain/game/value-objects/GameConfig';

describe('Repository Interfaces', () => {
  describe('IWordList', () => {
    it('can be implemented', () => {
      const mockWordList: IWordList = {
        getAnswers: (length: ValidLength) => ['HELLO', 'WORLD'],
        isValidGuess: (word: string, length: ValidLength) => word.length === length,
        getAnswerCount: (length: ValidLength) => 2,
      };

      expect(mockWordList.getAnswers(5)).toEqual(['HELLO', 'WORLD']);
      expect(mockWordList.isValidGuess('HELLO', 5)).toBe(true);
      expect(mockWordList.getAnswerCount(5)).toBe(2);
    });
  });

  describe('IGameRepository', () => {
    it('can be implemented', () => {
      let savedState: PersistedGameState | null = null;

      const mockRepository: IGameRepository = {
        save: (state: PersistedGameState) => {
          savedState = state;
        },
        load: () => savedState,
        clear: () => {
          savedState = null;
        },
        hasSavedGame: () => savedState !== null,
      };

      const testState: PersistedGameState = {
        length: 5,
        maxRows: 6,
        mode: 'daily',
        dateISO: '2025-01-15',
        answer: 'HELLO',
        rows: ['CRANE'],
        feedback: [['absent', 'absent', 'absent', 'absent', 'correct']],
        status: 'playing',
        hintUsed: false,
        hintedCell: null,
        hintedLetter: null,
      };

      expect(mockRepository.hasSavedGame()).toBe(false);
      mockRepository.save(testState);
      expect(mockRepository.hasSavedGame()).toBe(true);
      expect(mockRepository.load()).toEqual(testState);
      mockRepository.clear();
      expect(mockRepository.hasSavedGame()).toBe(false);
    });

    it('PersistedGameState has correct structure', () => {
      const state: PersistedGameState = {
        length: 5,
        maxRows: 6,
        mode: 'daily',
        dateISO: '2025-01-15',
        answer: 'HELLO',
        rows: [],
        feedback: [],
        status: 'playing',
        hintUsed: false,
        hintedCell: null,
        hintedLetter: null,
      };

      expect(state.length).toBe(5);
      expect(state.maxRows).toBe(6);
      expect(state.mode).toBe('daily');
      expect(state.status).toBe('playing');
    });

    it('PersistedGameState supports hint state', () => {
      const stateWithHint: PersistedGameState = {
        length: 5,
        maxRows: 6,
        mode: 'daily',
        dateISO: '2025-01-15',
        answer: 'HELLO',
        rows: ['CRANE'],
        feedback: [['absent', 'absent', 'absent', 'absent', 'correct']],
        status: 'playing',
        hintUsed: true,
        hintedCell: { row: 0, col: 0 },
        hintedLetter: 'H',
      };

      expect(stateWithHint.hintUsed).toBe(true);
      expect(stateWithHint.hintedCell).toEqual({ row: 0, col: 0 });
      expect(stateWithHint.hintedLetter).toBe('H');
    });
  });

  describe('ICompletionRepository', () => {
    it('can be implemented', () => {
      const completions = new Set<string>();

      const mockRepository: ICompletionRepository = {
        isDailyCompleted: (dateISO: string, length: ValidLength) => completions.has(`${dateISO}:${length}`),
        markDailyCompleted: (dateISO: string, length: ValidLength) => {
          completions.add(`${dateISO}:${length}`);
        },
        getCompletedDates: (length: ValidLength) =>
          Array.from(completions)
            .filter((key) => key.endsWith(`:${length}`))
            .map((key) => key.split(':')[0]),
        clearCompletion: (dateISO: string, length: ValidLength) => {
          completions.delete(`${dateISO}:${length}`);
        },
      };

      expect(mockRepository.isDailyCompleted('2025-01-15', 5)).toBe(false);
      mockRepository.markDailyCompleted('2025-01-15', 5);
      expect(mockRepository.isDailyCompleted('2025-01-15', 5)).toBe(true);
      expect(mockRepository.getCompletedDates(5)).toContain('2025-01-15');
      mockRepository.clearCompletion('2025-01-15', 5);
      expect(mockRepository.isDailyCompleted('2025-01-15', 5)).toBe(false);
    });

    it('tracks completions separately by length', () => {
      const completions = new Set<string>();

      const mockRepository: ICompletionRepository = {
        isDailyCompleted: (dateISO: string, length: ValidLength) => completions.has(`${dateISO}:${length}`),
        markDailyCompleted: (dateISO: string, length: ValidLength) => {
          completions.add(`${dateISO}:${length}`);
        },
        getCompletedDates: (length: ValidLength) =>
          Array.from(completions)
            .filter((key) => key.endsWith(`:${length}`))
            .map((key) => key.split(':')[0]),
        clearCompletion: (dateISO: string, length: ValidLength) => {
          completions.delete(`${dateISO}:${length}`);
        },
      };

      mockRepository.markDailyCompleted('2025-01-15', 5);

      expect(mockRepository.isDailyCompleted('2025-01-15', 5)).toBe(true);
      expect(mockRepository.isDailyCompleted('2025-01-15', 4)).toBe(false); // Different length
      expect(mockRepository.isDailyCompleted('2025-01-15', 6)).toBe(false); // Different length
    });
  });
});
