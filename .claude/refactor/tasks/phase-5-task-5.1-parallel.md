# Task 5.1: Dependency Injection Wiring (PARALLEL - Wave 1)

## Agent Assignment
This task runs in **parallel with Tasks 5.2 and 5.5**.
No dependencies on other Phase 5 tasks.

## Objective
Create a composition root that wires all dependencies together, making it easy to swap implementations for testing.

## Files to Create
- `src/composition/GameModule.ts`
- `src/composition/index.ts`
- `__tests__/composition/GameModule.test.ts`

## Why DI Wiring?

Currently, dependencies are created inline:
```typescript
// In useGameSession.ts
const gameRepository = useMemo(() => getGameRepository(), []);
const completionRepository = useMemo(() => getCompletionRepository(), []);
const wordList = useMemo(() => getWordList(), []);
const evaluator = useMemo(() => new GuessEvaluator(), []);
```

This works but:
1. Hard to swap implementations for testing
2. Dependencies scattered across files
3. No single source of truth for wiring

## Implementation

### GameModule.ts

```typescript
// src/composition/GameModule.ts

import { GuessEvaluator } from '../domain/game/services/GuessEvaluator';
import { WordSelector } from '../domain/game/services/WordSelector';
import { HintProvider } from '../domain/game/services/HintProvider';

import { StartGameUseCase } from '../application/game/StartGameUseCase';
import { SubmitGuessUseCase } from '../application/game/SubmitGuessUseCase';
import { UseHintUseCase } from '../application/game/UseHintUseCase';
import { AbandonGameUseCase } from '../application/game/AbandonGameUseCase';

import { getGameRepository, IGameRepository } from '../infrastructure/persistence/MMKVGameRepository';
import { getCompletionRepository, ICompletionRepository } from '../infrastructure/persistence/MMKVCompletionRepository';
import { getWordList, IWordList } from '../infrastructure/words/StaticWordList';
import { getSessionManager, SessionManager } from '../infrastructure/auth/SessionManager';

/**
 * GameModule is the composition root for the Game bounded context.
 * It wires together all dependencies and provides factories for use cases.
 * 
 * Usage:
 *   const module = GameModule.create();
 *   const startGame = module.getStartGameUseCase();
 */
export class GameModule {
  private constructor(
    private readonly gameRepository: IGameRepository,
    private readonly completionRepository: ICompletionRepository,
    private readonly wordList: IWordList,
    private readonly evaluator: GuessEvaluator,
    private readonly wordSelector: WordSelector,
    private readonly hintProvider: HintProvider,
    private readonly sessionManager: SessionManager,
  ) {}

  /**
   * Create a GameModule with production dependencies.
   */
  static create(): GameModule {
    return new GameModule(
      getGameRepository(),
      getCompletionRepository(),
      getWordList(),
      new GuessEvaluator(),
      new WordSelector(),
      new HintProvider(),
      getSessionManager(),
    );
  }

  /**
   * Create a GameModule with custom dependencies (for testing).
   */
  static createWithDependencies(deps: {
    gameRepository?: IGameRepository;
    completionRepository?: ICompletionRepository;
    wordList?: IWordList;
    evaluator?: GuessEvaluator;
    wordSelector?: WordSelector;
    hintProvider?: HintProvider;
    sessionManager?: SessionManager;
  }): GameModule {
    return new GameModule(
      deps.gameRepository ?? getGameRepository(),
      deps.completionRepository ?? getCompletionRepository(),
      deps.wordList ?? getWordList(),
      deps.evaluator ?? new GuessEvaluator(),
      deps.wordSelector ?? new WordSelector(),
      deps.hintProvider ?? new HintProvider(),
      deps.sessionManager ?? getSessionManager(),
    );
  }

  // === Domain Services ===

  getEvaluator(): GuessEvaluator {
    return this.evaluator;
  }

  getWordSelector(): WordSelector {
    return this.wordSelector;
  }

  getHintProvider(): HintProvider {
    return this.hintProvider;
  }

  // === Repositories ===

  getGameRepository(): IGameRepository {
    return this.gameRepository;
  }

  getCompletionRepository(): ICompletionRepository {
    return this.completionRepository;
  }

  getWordList(): IWordList {
    return this.wordList;
  }

  // === Use Cases ===

  getStartGameUseCase(): StartGameUseCase {
    return new StartGameUseCase(
      this.gameRepository,
      this.completionRepository,
      this.wordList,
      this.wordSelector,
    );
  }

  getSubmitGuessUseCase(): SubmitGuessUseCase {
    return new SubmitGuessUseCase(
      this.gameRepository,
      this.completionRepository,
      this.wordList,
      this.evaluator,
    );
  }

  getUseHintUseCase(): UseHintUseCase {
    return new UseHintUseCase(
      this.gameRepository,
      this.hintProvider,
    );
  }

  getAbandonGameUseCase(): AbandonGameUseCase {
    return new AbandonGameUseCase(
      this.gameRepository,
      this.completionRepository,
    );
  }
}

// Singleton instance for convenience
let defaultModule: GameModule | null = null;

export function getGameModule(): GameModule {
  if (!defaultModule) {
    defaultModule = GameModule.create();
  }
  return defaultModule;
}

// Reset for testing
export function resetGameModule(): void {
  defaultModule = null;
}
```

### Index Export

```typescript
// src/composition/index.ts

export { GameModule, getGameModule, resetGameModule } from './GameModule';
```

## Test File

```typescript
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
```

## Verification

```bash
# Create directories
mkdir -p src/composition
mkdir -p __tests__/composition

# Run tests
npm test -- --testPathPattern="GameModule"

# Type check
npx tsc --noEmit
```

## Completion Criteria
- [ ] `GameModule` class created with all dependencies
- [ ] `create()` factory for production
- [ ] `createWithDependencies()` for testing
- [ ] All use case factories implemented
- [ ] Singleton pattern with `getGameModule()` and `resetGameModule()`
- [ ] Comprehensive test coverage
- [ ] No TypeScript errors
- [ ] Tests pass

## Commit Message
```
feat(composition): add GameModule as composition root for DI
```
