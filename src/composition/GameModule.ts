// src/composition/GameModule.ts

import { GuessEvaluator } from '../domain/game/services/GuessEvaluator';
import { WordSelector } from '../domain/game/services/WordSelector';
import { HintProvider } from '../domain/game/services/HintProvider';

import { StartGameUseCase } from '../application/game/StartGameUseCase';
import { SubmitGuessUseCase } from '../application/game/SubmitGuessUseCase';
import { UseHintUseCase } from '../application/game/UseHintUseCase';
import { AbandonGameUseCase } from '../application/game/AbandonGameUseCase';

import { IGameRepository } from '../domain/game/repositories/IGameRepository';
import { ICompletionRepository } from '../domain/game/repositories/ICompletionRepository';
import { IWordList } from '../domain/game/repositories/IWordList';
import { getGameRepository } from '../infrastructure/persistence/MMKVGameRepository';
import { getCompletionRepository } from '../infrastructure/persistence/MMKVCompletionRepository';
import { getWordList } from '../infrastructure/words/StaticWordList';
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
    const wordList = getWordList();
    return new GameModule(
      getGameRepository(),
      getCompletionRepository(),
      wordList,
      new GuessEvaluator(),
      new WordSelector(wordList),
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
    const wordList = deps.wordList ?? getWordList();
    return new GameModule(
      deps.gameRepository ?? getGameRepository(),
      deps.completionRepository ?? getCompletionRepository(),
      wordList,
      deps.evaluator ?? new GuessEvaluator(),
      deps.wordSelector ?? new WordSelector(wordList),
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
      this.wordList,
      this.gameRepository,
      this.completionRepository,
      this.wordSelector,
      this.evaluator,
    );
  }

  getSubmitGuessUseCase(): SubmitGuessUseCase {
    return new SubmitGuessUseCase(
      this.wordList,
      this.gameRepository,
      this.completionRepository,
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
