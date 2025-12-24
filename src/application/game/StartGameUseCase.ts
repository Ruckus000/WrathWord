// src/application/game/StartGameUseCase.ts

import { GameSession, HintCell } from '../../domain/game/entities/GameSession';
import { GameConfig, ValidLength } from '../../domain/game/value-objects/GameConfig';
import { Feedback } from '../../domain/game/value-objects/Feedback';
import { TileStateValue } from '../../domain/game/value-objects/TileState';
import { GuessEvaluator } from '../../domain/game/services/GuessEvaluator';
import { WordSelector } from '../../domain/game/services/WordSelector';
import { IWordList } from '../../domain/game/repositories/IWordList';
import { IGameRepository, PersistedGameState } from '../../domain/game/repositories/IGameRepository';
import { ICompletionRepository } from '../../domain/game/repositories/ICompletionRepository';

export type StartGameResult =
  | { type: 'new_game'; session: GameSession }
  | { type: 'restored'; session: GameSession }
  | { type: 'stale_game'; staleSession: GameSession; newSession: GameSession }
  | { type: 'already_completed' };

/**
 * StartGameUseCase handles starting or restoring a game session.
 *
 * Responsibilities:
 * - Check for saved game state
 * - Detect stale daily games
 * - Restore or create new game session
 * - Check daily completion status
 */
export class StartGameUseCase {
  constructor(
    private readonly wordList: IWordList,
    private readonly gameRepository: IGameRepository,
    private readonly completionRepository: ICompletionRepository,
    private readonly wordSelector: WordSelector,
    private readonly evaluator: GuessEvaluator,
  ) {}

  /**
   * Execute the use case.
   *
   * @param config The game configuration for the session
   * @returns Result indicating what happened
   */
  execute(config: GameConfig): StartGameResult {
    // Check if daily is already completed
    if (config.isDaily() && this.completionRepository.isDailyCompleted(config.length, config.maxRows, config.dateISO)) {
      return { type: 'already_completed' };
    }

    // Check for saved game
    const savedState = this.gameRepository.load();

    if (savedState) {
      // Check if saved game matches requested config
      if (this.isConfigMatch(savedState, config)) {
        // Check for stale daily game
        if (config.isDaily() && savedState.dateISO !== config.dateISO) {
          return this.handleStaleGame(savedState, config);
        }

        // Restore saved game
        const session = this.restoreSession(savedState);
        return { type: 'restored', session };
      }
      // Config mismatch - start new game
    }

    // Start new game
    const session = this.createNewSession(config);
    this.persistGameState(session);
    return { type: 'new_game', session };
  }

  /**
   * Check if saved state matches the requested config.
   */
  private isConfigMatch(saved: PersistedGameState, config: GameConfig): boolean {
    return (
      saved.length === config.length &&
      saved.maxRows === config.maxRows &&
      saved.mode === config.mode
    );
  }

  /**
   * Handle a stale daily game.
   */
  private handleStaleGame(saved: PersistedGameState, config: GameConfig): StartGameResult {
    const hasProgress = saved.rows.length > 0;

    if (!hasProgress) {
      // No progress - silently start new game
      const session = this.createNewSession(config);
      this.persistGameState(session);
      return { type: 'new_game', session };
    }

    // Has progress - return both sessions for UI to decide
    const staleSession = this.restoreSession(saved);
    const newSession = this.createNewSession(config);

    return {
      type: 'stale_game',
      staleSession,
      newSession,
    };
  }

  /**
   * Create a new game session with a word from the selector.
   */
  private createNewSession(config: GameConfig): GameSession {
    const word = this.wordSelector.selectWord(config);
    return GameSession.create(config, word, this.evaluator);
  }

  /**
   * Restore a game session from persisted state.
   */
  private restoreSession(saved: PersistedGameState): GameSession {
    const config = GameConfig.create({
      length: saved.length,
      maxRows: saved.maxRows,
      mode: saved.mode,
      dateISO: saved.dateISO,
    });

    // Create base session
    let session = GameSession.create(config, saved.answer, this.evaluator);

    // Replay guesses to restore state
    for (const guess of saved.rows) {
      session = session.submitGuess(guess);
    }

    // Restore hint state if used
    if (saved.hintUsed && saved.hintedCell && saved.hintedLetter) {
      // We need to restore hint state - but session already has guesses
      // Hint should have been used before guesses, so we need a different approach
      // For now, create fresh session with hint
      session = this.restoreWithHint(config, saved);
    }

    return session;
  }

  /**
   * Restore session with hint state.
   */
  private restoreWithHint(config: GameConfig, saved: PersistedGameState): GameSession {
    let session = GameSession.create(config, saved.answer, this.evaluator);

    // Apply hint first if it was used
    if (saved.hintUsed && saved.hintedCell && saved.hintedLetter) {
      session = session.useHint(saved.hintedCell, saved.hintedLetter);
    }

    // Then replay guesses
    for (const guess of saved.rows) {
      session = session.submitGuess(guess);
    }

    return session;
  }

  /**
   * Persist game state.
   */
  private persistGameState(session: GameSession): void {
    const state: PersistedGameState = {
      length: session.config.length,
      maxRows: session.config.maxRows,
      mode: session.config.mode,
      dateISO: session.config.dateISO,
      answer: session.answer,
      rows: session.guesses,
      feedback: session.feedback.map(fb => fb.states),
      status: session.status,
      hintUsed: session.hintUsed,
      hintedCell: session.hintedCell,
      hintedLetter: session.hintedLetter,
    };

    this.gameRepository.save(state);
  }
}
