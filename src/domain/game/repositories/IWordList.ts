// src/domain/game/repositories/IWordList.ts

import { ValidLength } from '../value-objects/GameConfig';

/**
 * Interface for accessing word lists.
 * Implementations may be static (in-memory) or dynamic.
 */
export interface IWordList {
  /**
   * Get the list of valid answer words for a given length.
   */
  getAnswers(length: ValidLength): string[];

  /**
   * Check if a word is a valid guess (in allowed list) for a given length.
   */
  isValidGuess(word: string, length: ValidLength): boolean;

  /**
   * Get count of available answers for a given length.
   */
  getAnswerCount(length: ValidLength): number;
}
