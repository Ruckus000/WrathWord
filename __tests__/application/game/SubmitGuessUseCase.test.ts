// __tests__/application/game/SubmitGuessUseCase.test.ts

import { SubmitGuessUseCase, SubmitGuessResult, SubmitGuessError } from '../../../src/application/game/SubmitGuessUseCase';
import { GameSession } from '../../../src/domain/game/entities/GameSession';
import { GameConfig, ValidLength } from '../../../src/domain/game/value-objects/GameConfig';
import { GuessEvaluator } from '../../../src/domain/game/services/GuessEvaluator';
import { IWordList } from '../../../src/domain/game/repositories/IWordList';
import { IGameRepository, PersistedGameState } from '../../../src/domain/game/repositories/IGameRepository';
import { ICompletionRepository } from '../../../src/domain/game/repositories/ICompletionRepository';

describe('SubmitGuessUseCase', () => {
  // Mock implementations
  class MockWordList implements IWordList {
    private validGuesses = new Set(['crane', 'hello', 'helps', 'world', 'fudgy', 'slate']);

    getAnswers(length: ValidLength): string[] {
      return ['hello', 'world', 'crane'];
    }

    isValidGuess(word: string, length: ValidLength): boolean {
      return this.validGuesses.has(word.toLowerCase());
    }

    getAnswerCount(length: ValidLength): number {
      return 3;
    }
  }

  class MockGameRepository implements IGameRepository {
    savedState: PersistedGameState | null = null;

    save(state: PersistedGameState): void {
      this.savedState = state;
    }

    load(): PersistedGameState | null {
      return this.savedState;
    }

    clear(): void {
      this.savedState = null;
    }

    hasSavedGame(): boolean {
      return this.savedState !== null;
    }
  }

  class MockCompletionRepository implements ICompletionRepository {
    private completed = new Map<string, boolean>();

    private makeKey(length: ValidLength, maxRows: number, dateISO: string): string {
      return `${length}:${maxRows}:${dateISO}`;
    }

    isDailyCompleted(length: ValidLength, maxRows: number, dateISO: string): boolean {
      return this.completed.get(this.makeKey(length, maxRows, dateISO)) ?? false;
    }

    markDailyCompleted(length: ValidLength, maxRows: number, dateISO: string): void {
      this.completed.set(this.makeKey(length, maxRows, dateISO), true);
    }

    getCompletedDates(length: ValidLength): string[] {
      return [];
    }

    clearCompletion(length: ValidLength, maxRows: number, dateISO: string): void {
      this.completed.delete(this.makeKey(length, maxRows, dateISO));
    }
  }

  let wordList: MockWordList;
  let gameRepo: MockGameRepository;
  let completionRepo: MockCompletionRepository;
  let evaluator: GuessEvaluator;
  let useCase: SubmitGuessUseCase;

  function createTestSession(answer: string = 'HELLO'): GameSession {
    const config = GameConfig.create({ length: 5, maxRows: 6, mode: 'daily', dateISO: '2025-01-15' });
    return GameSession.create(config, answer, evaluator);
  }

  beforeEach(() => {
    wordList = new MockWordList();
    gameRepo = new MockGameRepository();
    completionRepo = new MockCompletionRepository();
    evaluator = new GuessEvaluator();
    useCase = new SubmitGuessUseCase(wordList, gameRepo, completionRepo);
  });

  describe('execute', () => {
    it('returns updated session on valid guess', () => {
      const session = createTestSession();
      const result = useCase.execute(session, 'CRANE');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.session.guesses).toEqual(['CRANE']);
        expect(result.session.currentRow).toBe(1);
      }
    });

    it('returns error for guess not in word list', () => {
      const session = createTestSession();
      const result = useCase.execute(session, 'ZZZZZ');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('not_in_word_list');
      }
    });

    it('returns error for wrong length guess', () => {
      const session = createTestSession();
      const result = useCase.execute(session, 'HI');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('invalid_length');
      }
    });

    it('returns error for empty guess', () => {
      const session = createTestSession();
      const result = useCase.execute(session, '');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('invalid_length');
      }
    });

    it('returns error for guess with incomplete letters', () => {
      const session = createTestSession();
      const result = useCase.execute(session, 'HE  O');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('incomplete');
      }
    });

    it('returns error when game is already over', () => {
      const session = createTestSession('HELLO').submitGuess('HELLO');
      const result = useCase.execute(session, 'CRANE');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('game_over');
      }
    });

    it('is case insensitive for word list lookup', () => {
      const session = createTestSession();
      const result = useCase.execute(session, 'crane');

      expect(result.success).toBe(true);
    });
  });

  describe('game state persistence', () => {
    it('saves game state after successful guess', () => {
      const session = createTestSession();
      useCase.execute(session, 'CRANE');

      expect(gameRepo.savedState).not.toBeNull();
      expect(gameRepo.savedState?.rows).toEqual(['CRANE']);
    });

    it('does not save state on invalid guess', () => {
      const session = createTestSession();
      useCase.execute(session, 'ZZZZZ');

      expect(gameRepo.savedState).toBeNull();
    });
  });

  describe('daily completion tracking', () => {
    it('marks daily as completed on win', () => {
      const session = createTestSession('HELLO');
      useCase.execute(session, 'HELLO');

      expect(completionRepo.isDailyCompleted(5, 6, '2025-01-15')).toBe(true);
    });

    it('marks daily as completed on loss', () => {
      let session = createTestSession('HELLO');

      // Make 5 wrong guesses first
      for (let i = 0; i < 5; i++) {
        const result = useCase.execute(session, 'CRANE');
        if (result.success) {
          session = result.session;
        }
      }

      // 6th guess (loss)
      useCase.execute(session, 'WORLD');

      expect(completionRepo.isDailyCompleted(5, 6, '2025-01-15')).toBe(true);
    });

    it('does not mark completion for free play mode', () => {
      const config = GameConfig.create({ length: 5, maxRows: 6, mode: 'free', dateISO: '2025-01-15' });
      const session = GameSession.create(config, 'HELLO', evaluator);

      useCase.execute(session, 'HELLO');

      expect(completionRepo.isDailyCompleted(5, 6, '2025-01-15')).toBe(false);
    });

    it('does not mark completion on intermediate guess', () => {
      const session = createTestSession();
      useCase.execute(session, 'CRANE');

      expect(completionRepo.isDailyCompleted(5, 6, '2025-01-15')).toBe(false);
    });
  });

  describe('win detection', () => {
    it('result indicates win when guess matches answer', () => {
      const session = createTestSession('HELLO');
      const result = useCase.execute(session, 'HELLO');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.session.status).toBe('won');
        expect(result.isWin).toBe(true);
        expect(result.isLoss).toBe(false);
      }
    });

    it('result indicates loss on max guesses', () => {
      let session = createTestSession('HELLO');

      // Make 5 wrong guesses
      for (let i = 0; i < 5; i++) {
        const res = useCase.execute(session, 'CRANE');
        if (res.success) {
          session = res.session;
        }
      }

      // 6th wrong guess
      const result = useCase.execute(session, 'WORLD');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.session.status).toBe('lost');
        expect(result.isWin).toBe(false);
        expect(result.isLoss).toBe(true);
      }
    });

    it('result indicates neither win nor loss on intermediate guess', () => {
      const session = createTestSession();
      const result = useCase.execute(session, 'CRANE');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.session.status).toBe('playing');
        expect(result.isWin).toBe(false);
        expect(result.isLoss).toBe(false);
      }
    });
  });

  describe('feedback included in result', () => {
    it('includes feedback for the submitted guess', () => {
      const session = createTestSession('HELLO');
      const result = useCase.execute(session, 'HELPS');

      expect(result.success).toBe(true);
      if (result.success) {
        const lastFeedback = result.session.feedback[result.session.feedback.length - 1];
        // H=correct, E=correct, L=correct, P=absent, S=absent
        expect(lastFeedback.states).toEqual(['correct', 'correct', 'correct', 'absent', 'absent']);
      }
    });
  });
});
