// src/application/game/AbandonGameUseCase.ts

import { IGameRepository } from '../../domain/game/repositories/IGameRepository';
import { GameMode } from '../../domain/game/value-objects/GameConfig';

export interface AbandonedGameInfo {
  guessCount: number;
  hintWasUsed: boolean;
  mode: GameMode;
  dateISO: string;
}

export type AbandonGameResult = {
  success: true;
  abandonedGame: AbandonedGameInfo | null;
};

/**
 * AbandonGameUseCase handles abandoning/discarding the current game.
 *
 * Responsibilities:
 * - Clear saved game state from repository
 * - Return info about the abandoned game (for analytics/logging)
 */
export class AbandonGameUseCase {
  constructor(
    private readonly gameRepository: IGameRepository,
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
      };
    }

    // Clear the saved game
    this.gameRepository.clear();

    return {
      success: true,
      abandonedGame,
    };
  }
}
