// __tests__/composition/GameModule.test.ts

import { GameModule, getGameModule, resetGameModule } from '../../src/composition/GameModule';
import { GuessEvaluator } from '../../src/domain/game/services/GuessEvaluator';

// Mock infrastructure
jest.mock('../../src/infrastructure/persistence/MMKVGameRepository', () => ({
  getGameRepository: jest.fn(() => ({
    load: jest.fn(),
    save: jest.fn(),
    clear: jest.fn(),
    hasSavedGame: jest.fn(),
  })),
}));

jest.mock('../../src/infrastructure/persistence/MMKVCompletionRepository', () => ({
  getCompletionRepository: jest.fn(() => ({
    isDailyCompleted: jest.fn(),
    markDailyCompleted: jest.fn(),
    getCompletedDates: jest.fn(),
    clearCompletion: jest.fn(),
  })),
}));

jest.mock('../../src/infrastructure/words/StaticWordList', () => ({
  getWordList: jest.fn(() => ({
    getAnswers: jest.fn(() => ['crane', 'slate']),
    isValidGuess: jest.fn(() => true),
    getAnswerCount: jest.fn(() => 2),
  })),
}));

jest.mock('../../src/infrastructure/auth/SessionManager', () => ({
  getSessionManager: jest.fn(() => ({
    getSession: jest.fn(),
    getValidToken: jest.fn(),
    addSessionListener: jest.fn(),
    removeSessionListener: jest.fn(),
  })),
}));

describe('GameModule', () => {
  beforeEach(() => {
    resetGameModule();
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('creates module with production dependencies', () => {
      const module = GameModule.create();

      expect(module).toBeInstanceOf(GameModule);
    });
  });

  describe('createWithDependencies', () => {
    it('allows custom dependencies for testing', () => {
      const mockEvaluator = new GuessEvaluator();
      const module = GameModule.createWithDependencies({
        evaluator: mockEvaluator,
      });

      expect(module.getEvaluator()).toBe(mockEvaluator);
    });

    it('falls back to defaults for missing dependencies', () => {
      const module = GameModule.createWithDependencies({});

      expect(module.getEvaluator()).toBeInstanceOf(GuessEvaluator);
    });
  });

  describe('domain services', () => {
    it('returns GuessEvaluator', () => {
      const module = GameModule.create();

      expect(module.getEvaluator()).toBeInstanceOf(GuessEvaluator);
    });

    it('returns WordSelector', () => {
      const module = GameModule.create();

      expect(module.getWordSelector()).toBeDefined();
    });

    it('returns HintProvider', () => {
      const module = GameModule.create();

      expect(module.getHintProvider()).toBeDefined();
    });
  });

  describe('repositories', () => {
    it('returns GameRepository', () => {
      const module = GameModule.create();

      expect(module.getGameRepository()).toBeDefined();
      expect(module.getGameRepository().load).toBeDefined();
    });

    it('returns CompletionRepository', () => {
      const module = GameModule.create();

      expect(module.getCompletionRepository()).toBeDefined();
      expect(module.getCompletionRepository().isDailyCompleted).toBeDefined();
    });

    it('returns WordList', () => {
      const module = GameModule.create();

      expect(module.getWordList()).toBeDefined();
      expect(module.getWordList().getAnswers).toBeDefined();
    });
  });

  describe('use cases', () => {
    it('creates StartGameUseCase', () => {
      const module = GameModule.create();
      const useCase = module.getStartGameUseCase();

      expect(useCase).toBeDefined();
      expect(useCase.execute).toBeDefined();
    });

    it('creates SubmitGuessUseCase', () => {
      const module = GameModule.create();
      const useCase = module.getSubmitGuessUseCase();

      expect(useCase).toBeDefined();
      expect(useCase.execute).toBeDefined();
    });

    it('creates UseHintUseCase', () => {
      const module = GameModule.create();
      const useCase = module.getUseHintUseCase();

      expect(useCase).toBeDefined();
      expect(useCase.execute).toBeDefined();
    });

    it('creates AbandonGameUseCase', () => {
      const module = GameModule.create();
      const useCase = module.getAbandonGameUseCase();

      expect(useCase).toBeDefined();
      expect(useCase.execute).toBeDefined();
    });
  });

  describe('getGameModule singleton', () => {
    it('returns same instance on multiple calls', () => {
      const module1 = getGameModule();
      const module2 = getGameModule();

      expect(module1).toBe(module2);
    });

    it('returns new instance after reset', () => {
      const module1 = getGameModule();
      resetGameModule();
      const module2 = getGameModule();

      expect(module1).not.toBe(module2);
    });
  });
});
