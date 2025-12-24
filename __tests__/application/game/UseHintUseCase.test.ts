// __tests__/application/game/UseHintUseCase.test.ts

import { UseHintUseCase, UseHintResult } from '../../../src/application/game/UseHintUseCase';
import { GameSession } from '../../../src/domain/game/entities/GameSession';
import { GameConfig, ValidLength } from '../../../src/domain/game/value-objects/GameConfig';
import { GuessEvaluator } from '../../../src/domain/game/services/GuessEvaluator';
import { HintProvider } from '../../../src/domain/game/services/HintProvider';
import { IGameRepository, PersistedGameState } from '../../../src/domain/game/repositories/IGameRepository';

describe('UseHintUseCase', () => {
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

  let gameRepo: MockGameRepository;
  let hintProvider: HintProvider;
  let evaluator: GuessEvaluator;
  let useCase: UseHintUseCase;

  function createTestSession(answer: string = 'HELLO'): GameSession {
    const config = GameConfig.create({ length: 5, maxRows: 6, mode: 'daily', dateISO: '2025-01-15' });
    return GameSession.create(config, answer, evaluator);
  }

  beforeEach(() => {
    gameRepo = new MockGameRepository();
    hintProvider = new HintProvider();
    evaluator = new GuessEvaluator();
    useCase = new UseHintUseCase(gameRepo, hintProvider);
  });

  describe('execute', () => {
    it('returns hint for first position on fresh game', () => {
      const session = createTestSession('HELLO');
      const result = useCase.execute(session);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.session.hintUsed).toBe(true);
        expect(result.position).toEqual({ row: 0, col: 0 });
        expect(result.letter).toBe('H');
      }
    });

    it('skips already correct positions', () => {
      const session = createTestSession('HELLO');
      // Make a guess that gets H correct
      const afterGuess = session.submitGuess('HELPS');
      // H, E, L are correct

      const result = useCase.execute(afterGuess);

      expect(result.success).toBe(true);
      if (result.success) {
        // Should skip positions 0, 1, 2 (already correct) and hint position 3
        expect(result.position.col).toBe(3);
        expect(result.letter).toBe('L');
      }
    });

    it('returns error when hint already used', () => {
      const session = createTestSession('HELLO');
      const hintedSession = session.useHint({ row: 0, col: 0 }, 'H');

      const result = useCase.execute(hintedSession);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('already_used');
      }
    });

    it('returns error when game is over (won)', () => {
      const session = createTestSession('HELLO').submitGuess('HELLO');

      const result = useCase.execute(session);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('game_over');
      }
    });

    it('returns error when game is over (lost)', () => {
      let session = createTestSession('HELLO');
      for (let i = 0; i < 6; i++) {
        session = session.submitGuess('CRANE');
      }

      const result = useCase.execute(session);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('game_over');
      }
    });

    it('returns error when no hint available (all correct)', () => {
      // This is an edge case - game should be won if all are correct
      // But we can test the provider behavior
      const session = createTestSession('HELLO').submitGuess('HELLO');

      const result = useCase.execute(session);

      expect(result.success).toBe(false);
      // Either 'game_over' or 'no_hint_available'
    });
  });

  describe('game state persistence', () => {
    it('saves game state after hint is used', () => {
      const session = createTestSession('HELLO');
      useCase.execute(session);

      expect(gameRepo.savedState).not.toBeNull();
      expect(gameRepo.savedState?.hintUsed).toBe(true);
      expect(gameRepo.savedState?.hintedCell).toEqual({ row: 0, col: 0 });
      expect(gameRepo.savedState?.hintedLetter).toBe('H');
    });

    it('does not save state when hint fails', () => {
      const session = createTestSession('HELLO');
      const hintedSession = session.useHint({ row: 0, col: 0 }, 'H');

      useCase.execute(hintedSession);

      expect(gameRepo.savedState).toBeNull();
    });
  });

  describe('hint position calculation', () => {
    it('provides hint at current row', () => {
      const session = createTestSession('HELLO');
      const afterGuess = session.submitGuess('CRANE');

      const result = useCase.execute(afterGuess);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.position.row).toBe(1); // Second row (after 1 guess)
      }
    });

    it('provides hint letter from answer', () => {
      const session = createTestSession('APPLE');
      const result = useCase.execute(session);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.letter).toBe('A');
      }
    });
  });
});
