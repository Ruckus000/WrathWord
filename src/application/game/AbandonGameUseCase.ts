// src/application/game/AbandonGameUseCase.ts

import { IGameRepository } from '../../domain/game/repositories/IGameRepository';
import { ICompletionRepository } from '../../domain/game/repositories/ICompletionRepository';
import { GameMode, ValidLength } from '../../domain/game/value-objects/GameConfig';

export interface AbandonedGameInfo {
  guessCount: number;
  hintWasUsed: boolean;
  mode: GameMode;
  dateISO: string;
  length: ValidLength;
  maxRows: number;
}

export type AbandonGameResult = {
  success: true;
  abandonedGame: AbandonedGameInfo | null;
};

/**
 * AbandonGameUseCase handles abandoning/discarding the current game.
 *
 * Responsibilities:
 * - Mark daily games as completed (prevents replay)
 * - Clear saved game state from repository
 * - Return info about the abandoned game (for analytics/logging)
 */
export class AbandonGameUseCase {
  constructor(
    private readonly gameRepository: IGameRepository,
    private readonly completionRepository: ICompletionRepository,
  ) {}

  /**
   * Execute the use case.
   *
   * @returns Result with info about the abandoned game (if any)
   */
  execute(): AbandonGameResult {
    // Get current game info before clearing
    const savedState = this.gameRepository.load();

    let abandonedGame: AbandonedGameInfo | null = null;

    if (savedState) {
      abandonedGame = {
        guessCount: savedState.rows.length,
        hintWasUsed: savedState.hintUsed,
        mode: savedState.mode,
        dateISO: savedState.dateISO,
        length: savedState.length,
        maxRows: savedState.maxRows,
      };

      // CRITICAL: Mark daily games as completed to prevent replay
      if (savedState.mode === 'daily') {
        this.completionRepository.markDailyCompleted(
          savedState.length,
          savedState.maxRows,
          savedState.dateISO,
        );
      }
    }

    // Clear the saved game
    this.gameRepository.clear();

    return {
      success: true,
      abandonedGame,
    };
  }
}
