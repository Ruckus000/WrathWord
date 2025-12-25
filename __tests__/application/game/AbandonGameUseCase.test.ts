// __tests__/application/game/AbandonGameUseCase.test.ts

import { AbandonGameUseCase, AbandonGameResult } from '../../../src/application/game/AbandonGameUseCase';
import { GameSession } from '../../../src/domain/game/entities/GameSession';
import { GameConfig, ValidLength } from '../../../src/domain/game/value-objects/GameConfig';
import { GuessEvaluator } from '../../../src/domain/game/services/GuessEvaluator';
import { IGameRepository, PersistedGameState } from '../../../src/domain/game/repositories/IGameRepository';
import { ICompletionRepository } from '../../../src/domain/game/repositories/ICompletionRepository';

describe('AbandonGameUseCase', () => {
  class MockGameRepository implements IGameRepository {
    savedState: PersistedGameState | null = null;
    clearCalled = false;

    save(state: PersistedGameState): void {
      this.savedState = state;
    }

    load(): PersistedGameState | null {
      return this.savedState;
    }

    clear(): void {
      this.savedState = null;
      this.clearCalled = true;
    }

    hasSavedGame(): boolean {
      return this.savedState !== null;
    }
  }

  class MockCompletionRepository implements ICompletionRepository {
    private completed = new Map<string, boolean>();
    markDailyCompletedCalled = false;
    lastCompletedConfig: { length: ValidLength; maxRows: number; dateISO: string } | null = null;

    private makeKey(length: ValidLength, maxRows: number, dateISO: string): string {
      return `${length}:${maxRows}:${dateISO}`;
    }

    isDailyCompleted(length: ValidLength, maxRows: number, dateISO: string): boolean {
      return this.completed.get(this.makeKey(length, maxRows, dateISO)) ?? false;
    }

    markDailyCompleted(length: ValidLength, maxRows: number, dateISO: string): void {
      this.completed.set(this.makeKey(length, maxRows, dateISO), true);
      this.markDailyCompletedCalled = true;
      this.lastCompletedConfig = { length, maxRows, dateISO };
    }

    getCompletedDates(length: ValidLength): string[] {
      return [];
    }

    clearCompletion(length: ValidLength, maxRows: number, dateISO: string): void {
      this.completed.delete(this.makeKey(length, maxRows, dateISO));
    }
  }

  let gameRepo: MockGameRepository;
  let completionRepo: MockCompletionRepository;
  let evaluator: GuessEvaluator;
  let useCase: AbandonGameUseCase;

  function createTestSession(answer: string = 'HELLO'): GameSession {
    const config = GameConfig.create({ length: 5, maxRows: 6, mode: 'daily', dateISO: '2025-01-15' });
    return GameSession.create(config, answer, evaluator);
  }

  beforeEach(() => {
    gameRepo = new MockGameRepository();
    completionRepo = new MockCompletionRepository();
    evaluator = new GuessEvaluator();
    useCase = new AbandonGameUseCase(gameRepo, completionRepo);
  });

  describe('execute', () => {
    it('clears game state from repository', () => {
      // First save a game
      const session = createTestSession();
      gameRepo.save({
        length: 5,
        maxRows: 6,
        mode: 'daily',
        dateISO: '2025-01-15',
        answer: 'HELLO',
        rows: ['CRANE'],
        feedback: [['absent', 'absent', 'absent', 'absent', 'present']],
        status: 'playing',
        hintUsed: false,
        hintedCell: null,
        hintedLetter: null,
      });

      expect(gameRepo.hasSavedGame()).toBe(true);

      const result = useCase.execute();

      expect(result.success).toBe(true);
      expect(gameRepo.clearCalled).toBe(true);
      expect(gameRepo.hasSavedGame()).toBe(false);
    });

    it('succeeds even when no game is saved', () => {
      expect(gameRepo.hasSavedGame()).toBe(false);

      const result = useCase.execute();

      expect(result.success).toBe(true);
      expect(gameRepo.clearCalled).toBe(true);
    });

    it('returns info about abandoned game when one exists', () => {
      gameRepo.save({
        length: 5,
        maxRows: 6,
        mode: 'daily',
        dateISO: '2025-01-15',
        answer: 'HELLO',
        rows: ['CRANE', 'SLATE'],
        feedback: [
          ['absent', 'absent', 'absent', 'absent', 'present'],
          ['absent', 'absent', 'absent', 'absent', 'present'],
        ],
        status: 'playing',
        hintUsed: true,
        hintedCell: { row: 0, col: 0 },
        hintedLetter: 'H',
      });

      const result = useCase.execute();

      expect(result.success).toBe(true);
      if (result.success && result.abandonedGame) {
        expect(result.abandonedGame.guessCount).toBe(2);
        expect(result.abandonedGame.hintWasUsed).toBe(true);
        expect(result.abandonedGame.mode).toBe('daily');
        expect(result.abandonedGame.dateISO).toBe('2025-01-15');
        expect(result.abandonedGame.length).toBe(5);
        expect(result.abandonedGame.maxRows).toBe(6);
      }
    });

    it('returns null abandonedGame when no game was saved', () => {
      const result = useCase.execute();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.abandonedGame).toBeNull();
      }
    });
  });

  describe('daily completion marking - CRITICAL', () => {
    it('marks daily game as completed when abandoned', () => {
      gameRepo.save({
        length: 5,
        maxRows: 6,
        mode: 'daily',
        dateISO: '2025-01-15',
        answer: 'HELLO',
        rows: ['CRANE'],
        feedback: [['absent', 'absent', 'absent', 'absent', 'present']],
        status: 'playing',
        hintUsed: false,
        hintedCell: null,
        hintedLetter: null,
      });

      useCase.execute();

      expect(completionRepo.markDailyCompletedCalled).toBe(true);
      expect(completionRepo.lastCompletedConfig).toEqual({
        length: 5,
        maxRows: 6,
        dateISO: '2025-01-15',
      });
    });

    it('does NOT mark free play games as completed', () => {
      gameRepo.save({
        length: 5,
        maxRows: 6,
        mode: 'free',
        dateISO: '2025-01-15',
        answer: 'HELLO',
        rows: ['CRANE'],
        feedback: [['absent', 'absent', 'absent', 'absent', 'present']],
        status: 'playing',
        hintUsed: false,
        hintedCell: null,
        hintedLetter: null,
      });

      useCase.execute();

      expect(completionRepo.markDailyCompletedCalled).toBe(false);
    });

    it('prevents replay after abandoning daily', () => {
      gameRepo.save({
        length: 5,
        maxRows: 6,
        mode: 'daily',
        dateISO: '2025-01-15',
        answer: 'HELLO',
        rows: ['CRANE'],
        feedback: [['absent', 'absent', 'absent', 'absent', 'present']],
        status: 'playing',
        hintUsed: false,
        hintedCell: null,
        hintedLetter: null,
      });

      useCase.execute();

      // After abandoning, the daily should be marked as completed
      expect(completionRepo.isDailyCompleted(5, 6, '2025-01-15')).toBe(true);
    });
  });

  describe('abandon stale game scenario', () => {
    it('marks stale daily game as completed when abandoned', () => {
      // User has stale game from yesterday
      gameRepo.save({
        length: 5,
        maxRows: 6,
        mode: 'daily',
        dateISO: '2025-01-14', // Yesterday
        answer: 'WORLD',
        rows: ['CRANE', 'SLATE', 'TRACE'],
        feedback: [
          ['absent', 'absent', 'absent', 'absent', 'absent'],
          ['absent', 'absent', 'absent', 'absent', 'absent'],
          ['absent', 'absent', 'absent', 'absent', 'absent'],
        ],
        status: 'playing',
        hintUsed: false,
        hintedCell: null,
        hintedLetter: null,
      });

      const result = useCase.execute();

      expect(result.success).toBe(true);
      expect(gameRepo.hasSavedGame()).toBe(false);
      // Stale daily from yesterday is now marked as completed for that date
      expect(completionRepo.isDailyCompleted(5, 6, '2025-01-14')).toBe(true);
    });
  });

  describe('free play abandonment', () => {
    it('works the same for free play games but without completion marking', () => {
      gameRepo.save({
        length: 5,
        maxRows: 6,
        mode: 'free',
        dateISO: '2025-01-15',
        answer: 'APPLE',
        rows: ['CRANE'],
        feedback: [['absent', 'absent', 'present', 'absent', 'present']],
        status: 'playing',
        hintUsed: false,
        hintedCell: null,
        hintedLetter: null,
      });

      const result = useCase.execute();

      expect(result.success).toBe(true);
      if (result.success && result.abandonedGame) {
        expect(result.abandonedGame.mode).toBe('free');
      }
      expect(completionRepo.markDailyCompletedCalled).toBe(false);
    });
  });
});
