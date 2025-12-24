// src/application/game/UseHintUseCase.ts

import { GameSession } from '../../domain/game/entities/GameSession';
import { HintProvider, HintPosition } from '../../domain/game/services/HintProvider';
import { IGameRepository, PersistedGameState } from '../../domain/game/repositories/IGameRepository';

export type UseHintError = 'already_used' | 'game_over' | 'no_hint_available';

export type UseHintResult =
  | { success: true; session: GameSession; position: HintPosition; letter: string }
  | { success: false; error: UseHintError };

/**
 * UseHintUseCase handles revealing a hint letter.
 *
 * Responsibilities:
 * - Validate hint can be used
 * - Get hint from HintProvider
 * - Update game session with hint
 * - Persist game state
 */
export class UseHintUseCase {
  constructor(
    private readonly gameRepository: IGameRepository,
    private readonly hintProvider: HintProvider,
  ) {}

  /**
   * Execute the use case.
   *
   * @param session Current game session
   * @returns Result with updated session and hint info, or error
   */
  execute(session: GameSession): UseHintResult {
    // Validate: game is not over
    if (session.isGameOver()) {
      return { success: false, error: 'game_over' };
    }

    // Validate: hint not already used
    if (session.hintUsed) {
      return { success: false, error: 'already_used' };
    }

    // Get hint from provider
    const hintResult = this.hintProvider.getHint({
      answer: session.answer,
      currentRow: session.currentRow,
      feedback: session.feedback,
    });

    if (!hintResult.success) {
      return { success: false, error: 'no_hint_available' };
    }

    // Apply hint to session
    const newSession = session.useHint(hintResult.position, hintResult.letter);

    // Persist game state
    this.persistGameState(newSession);

    return {
      success: true,
      session: newSession,
      position: hintResult.position,
      letter: hintResult.letter,
    };
  }

  /**
   * Convert session to persisted state and save.
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
