// __tests__/domain/game/usecases/StartGameUseCase.test.ts

import { StartGameUseCase, StartGameResult } from '../../../../src/domain/game/usecases/StartGameUseCase';
import { GameSession } from '../../../../src/domain/game/entities/GameSession';
import { GameConfig, ValidLength, GameMode } from '../../../../src/domain/game/value-objects/GameConfig';
import { GuessEvaluator } from '../../../../src/domain/game/services/GuessEvaluator';
import { WordSelector } from '../../../../src/domain/game/services/WordSelector';
import { IWordList } from '../../../../src/domain/game/repositories/IWordList';
import { IGameRepository, PersistedGameState } from '../../../../src/domain/game/repositories/IGameRepository';
import { ICompletionRepository } from '../../../../src/domain/game/repositories/ICompletionRepository';
import { TileStateValue } from '../../../../src/domain/game/value-objects/TileState';

describe('StartGameUseCase', () => {
  // Mock implementations
  class MockWordList implements IWordList {
    private answers = ['hello', 'world', 'crane', 'slate', 'apple'];

    getAnswers(length: ValidLength): string[] {
      return this.answers;
    }

    isValidGuess(word: string, length: ValidLength): boolean {
      return true;
    }

    getAnswerCount(length: ValidLength): number {
      return this.answers.length;
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
    private completed = new Map<string, Set<ValidLength>>();

    isDailyCompleted(dateISO: string, length: ValidLength): boolean {
      return this.completed.get(dateISO)?.has(length) ?? false;
    }

    markDailyCompleted(dateISO: string, length: ValidLength): void {
      if (!this.completed.has(dateISO)) {
        this.completed.set(dateISO, new Set());
      }
      this.completed.get(dateISO)!.add(length);
    }

    getCompletedDates(length: ValidLength): string[] {
      return [];
    }

    clearCompletion(dateISO: string, length: ValidLength): void {
      this.completed.get(dateISO)?.delete(length);
    }
  }

  let wordList: MockWordList;
  let gameRepo: MockGameRepository;
  let completionRepo: MockCompletionRepository;
  let wordSelector: WordSelector;
  let evaluator: GuessEvaluator;
  let useCase: StartGameUseCase;

  const today = '2025-01-15';
  const yesterday = '2025-01-14';

  beforeEach(() => {
    wordList = new MockWordList();
    gameRepo = new MockGameRepository();
    completionRepo = new MockCompletionRepository();
    wordSelector = new WordSelector(wordList.getAnswers(5));
    evaluator = new GuessEvaluator();
    useCase = new StartGameUseCase(wordList, gameRepo, completionRepo, wordSelector, evaluator);
  });

  describe('starting a new game', () => {
    it('creates new game session when no saved game', () => {
      const config = GameConfig.create({ length: 5, maxRows: 6, mode: 'daily', dateISO: today });
      const result = useCase.execute(config);

      expect(result.type).toBe('new_game');
      expect(result.session).toBeDefined();
      expect(result.session.status).toBe('playing');
      expect(result.session.currentRow).toBe(0);
    });

    it('creates game with deterministic word from config', () => {
      const config = GameConfig.create({ length: 5, maxRows: 6, mode: 'daily', dateISO: today });
      const result1 = useCase.execute(config);
      const result2 = useCase.execute(config);

      // Same config should produce same word
      expect(result1.session.answer).toBe(result2.session.answer);
    });

    it('different dates produce different words', () => {
      const config1 = GameConfig.create({ length: 5, maxRows: 6, mode: 'daily', dateISO: today });
      const config2 = GameConfig.create({ length: 5, maxRows: 6, mode: 'daily', dateISO: yesterday });

      const result1 = useCase.execute(config1);
      const result2 = useCase.execute(config2);

      expect(result1.session.answer).not.toBe(result2.session.answer);
    });
  });

  describe('restoring saved game', () => {
    it('restores saved game from same day', () => {
      // Save a game state
      gameRepo.savedState = {
        length: 5,
        maxRows: 6,
        mode: 'daily',
        dateISO: today,
        answer: 'HELLO',
        rows: ['CRANE', 'SLATE'],
        feedback: [
          ['absent', 'absent', 'absent', 'absent', 'present'],
          ['absent', 'absent', 'absent', 'absent', 'present'],
        ],
        status: 'playing',
        hintUsed: false,
        hintedCell: null,
        hintedLetter: null,
      };

      const config = GameConfig.create({ length: 5, maxRows: 6, mode: 'daily', dateISO: today });
      const result = useCase.execute(config);

      expect(result.type).toBe('restored');
      expect(result.session.guesses).toEqual(['CRANE', 'SLATE']);
      expect(result.session.currentRow).toBe(2);
    });

    it('restores hint state from saved game', () => {
      gameRepo.savedState = {
        length: 5,
        maxRows: 6,
        mode: 'daily',
        dateISO: today,
        answer: 'HELLO',
        rows: [],
        feedback: [],
        status: 'playing',
        hintUsed: true,
        hintedCell: { row: 0, col: 0 },
        hintedLetter: 'H',
      };

      const config = GameConfig.create({ length: 5, maxRows: 6, mode: 'daily', dateISO: today });
      const result = useCase.execute(config);

      expect(result.session.hintUsed).toBe(true);
      expect(result.session.hintedCell).toEqual({ row: 0, col: 0 });
      expect(result.session.hintedLetter).toBe('H');
    });
  });

  describe('stale game detection', () => {
    it('detects stale daily game from yesterday with progress', () => {
      gameRepo.savedState = {
        length: 5,
        maxRows: 6,
        mode: 'daily',
        dateISO: yesterday,
        answer: 'WORLD',
        rows: ['CRANE'],
        feedback: [['absent', 'absent', 'absent', 'absent', 'absent']],
        status: 'playing',
        hintUsed: false,
        hintedCell: null,
        hintedLetter: null,
      };

      const config = GameConfig.create({ length: 5, maxRows: 6, mode: 'daily', dateISO: today });
      const result = useCase.execute(config);

      expect(result.type).toBe('stale_game');
      if (result.type === 'stale_game') {
        expect(result.staleSession.guesses).toEqual(['CRANE']);
        expect(result.newSession).toBeDefined();
        expect(result.newSession.config.dateISO).toBe(today);
      }
    });

    it('silently starts new game when stale daily has no progress', () => {
      gameRepo.savedState = {
        length: 5,
        maxRows: 6,
        mode: 'daily',
        dateISO: yesterday,
        answer: 'WORLD',
        rows: [],
        feedback: [],
        status: 'playing',
        hintUsed: false,
        hintedCell: null,
        hintedLetter: null,
      };

      const config = GameConfig.create({ length: 5, maxRows: 6, mode: 'daily', dateISO: today });
      const result = useCase.execute(config);

      expect(result.type).toBe('new_game');
      expect(result.session.config.dateISO).toBe(today);
    });

    it('does NOT flag free play games as stale', () => {
      gameRepo.savedState = {
        length: 5,
        maxRows: 6,
        mode: 'free',
        dateISO: yesterday,
        answer: 'WORLD',
        rows: ['CRANE', 'SLATE'],
        feedback: [
          ['absent', 'absent', 'absent', 'absent', 'absent'],
          ['absent', 'absent', 'absent', 'absent', 'absent'],
        ],
        status: 'playing',
        hintUsed: false,
        hintedCell: null,
        hintedLetter: null,
      };

      const config = GameConfig.create({ length: 5, maxRows: 6, mode: 'free', dateISO: today });
      const result = useCase.execute(config);

      expect(result.type).toBe('restored');
      expect(result.session.guesses).toEqual(['CRANE', 'SLATE']);
    });
  });

  describe('already completed daily', () => {
    it('indicates when daily is already completed', () => {
      completionRepo.markDailyCompleted(today, 5);

      const config = GameConfig.create({ length: 5, maxRows: 6, mode: 'daily', dateISO: today });
      const result = useCase.execute(config);

      expect(result.type).toBe('already_completed');
    });

    it('allows starting free play even if daily is completed', () => {
      completionRepo.markDailyCompleted(today, 5);

      const config = GameConfig.create({ length: 5, maxRows: 6, mode: 'free', dateISO: today });
      const result = useCase.execute(config);

      expect(result.type).toBe('new_game');
    });
  });

  describe('config mismatch handling', () => {
    it('starts new game when saved game has different length', () => {
      gameRepo.savedState = {
        length: 4,  // Different from requested 5
        maxRows: 6,
        mode: 'daily',
        dateISO: today,
        answer: 'WORD',
        rows: ['CRANE'],
        feedback: [['absent', 'absent', 'absent', 'absent']],
        status: 'playing',
        hintUsed: false,
        hintedCell: null,
        hintedLetter: null,
      };

      const config = GameConfig.create({ length: 5, maxRows: 6, mode: 'daily', dateISO: today });
      const result = useCase.execute(config);

      expect(result.type).toBe('new_game');
      expect(result.session.config.length).toBe(5);
    });

    it('starts new game when saved game has different mode', () => {
      gameRepo.savedState = {
        length: 5,
        maxRows: 6,
        mode: 'free',  // Different from requested daily
        dateISO: today,
        answer: 'HELLO',
        rows: ['CRANE'],
        feedback: [['absent', 'absent', 'absent', 'absent', 'absent']],
        status: 'playing',
        hintUsed: false,
        hintedCell: null,
        hintedLetter: null,
      };

      const config = GameConfig.create({ length: 5, maxRows: 6, mode: 'daily', dateISO: today });
      const result = useCase.execute(config);

      // When modes differ, start fresh
      expect(result.type).toBe('new_game');
    });
  });

  describe('game state saving', () => {
    it('saves new game state to repository', () => {
      const config = GameConfig.create({ length: 5, maxRows: 6, mode: 'daily', dateISO: today });
      useCase.execute(config);

      expect(gameRepo.savedState).not.toBeNull();
      expect(gameRepo.savedState?.dateISO).toBe(today);
    });
  });
});
