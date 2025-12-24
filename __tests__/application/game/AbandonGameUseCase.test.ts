// __tests__/application/game/AbandonGameUseCase.test.ts

import { AbandonGameUseCase, AbandonGameResult } from '../../../src/application/game/AbandonGameUseCase';
import { GameSession } from '../../../src/domain/game/entities/GameSession';
import { GameConfig, ValidLength } from '../../../src/domain/game/value-objects/GameConfig';
import { GuessEvaluator } from '../../../src/domain/game/services/GuessEvaluator';
import { IGameRepository, PersistedGameState } from '../../../src/domain/game/repositories/IGameRepository';

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

  let gameRepo: MockGameRepository;
  let evaluator: GuessEvaluator;
  let useCase: AbandonGameUseCase;

  function createTestSession(answer: string = 'HELLO'): GameSession {
    const config = GameConfig.create({ length: 5, maxRows: 6, mode: 'daily', dateISO: '2025-01-15' });
    return GameSession.create(config, answer, evaluator);
  }

  beforeEach(() => {
    gameRepo = new MockGameRepository();
    evaluator = new GuessEvaluator();
    useCase = new AbandonGameUseCase(gameRepo);
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

  describe('abandon stale game scenario', () => {
    it('can be used to discard stale game before starting new', () => {
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
      if (result.success && result.abandonedGame) {
        expect(result.abandonedGame.guessCount).toBe(3);
      }
    });
  });

  describe('free play abandonment', () => {
    it('works the same for free play games', () => {
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
    });
  });
});
