// src/application/game/SubmitGuessUseCase.ts

import { GameSession } from '../../domain/game/entities/GameSession';
import { IWordList } from '../../domain/game/repositories/IWordList';
import { IGameRepository, PersistedGameState } from '../../domain/game/repositories/IGameRepository';
import { ICompletionRepository } from '../../domain/game/repositories/ICompletionRepository';
import { ValidLength } from '../../domain/game/value-objects/GameConfig';

export type SubmitGuessError =
  | 'invalid_length'
  | 'incomplete'
  | 'not_in_word_list'
  | 'game_over';

export type SubmitGuessResult =
  | { success: true; session: GameSession; isWin: boolean; isLoss: boolean }
  | { success: false; error: SubmitGuessError };

/**
 * SubmitGuessUseCase handles the business logic of submitting a guess.
 *
 * Responsibilities:
 * - Validate guess (length, completeness, word list)
 * - Submit guess to game session
 * - Persist game state
 * - Mark daily completion on game over
 */
export class SubmitGuessUseCase {
  constructor(
    private readonly wordList: IWordList,
    private readonly gameRepository: IGameRepository,
    private readonly completionRepository: ICompletionRepository,
  ) {}

  /**
   * Execute the use case.
   *
   * @param session Current game session
   * @param guess The word to guess
   * @returns Result with updated session or error
   */
  execute(session: GameSession, guess: string): SubmitGuessResult {
    const expectedLength = session.config.length;

    // Validate: game is not over
    if (session.isGameOver()) {
      return { success: false, error: 'game_over' };
    }

    // Validate: correct length
    if (guess.length !== expectedLength) {
      return { success: false, error: 'invalid_length' };
    }

    // Validate: no incomplete letters (spaces)
    if (guess.includes(' ')) {
      return { success: false, error: 'incomplete' };
    }

    // Validate: in word list
    if (!this.wordList.isValidGuess(guess, expectedLength as ValidLength)) {
      return { success: false, error: 'not_in_word_list' };
    }

    // Submit guess
    const newSession = session.submitGuess(guess);

    // Persist game state
    this.persistGameState(newSession);

    // Handle game completion
    const isWin = newSession.status === 'won';
    const isLoss = newSession.status === 'lost';

    if (newSession.isGameOver() && newSession.config.isDaily()) {
      this.completionRepository.markDailyCompleted(
        newSession.config.length,
        newSession.config.maxRows,
        newSession.config.dateISO,
      );
    }

    return {
      success: true,
      session: newSession,
      isWin,
      isLoss,
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
