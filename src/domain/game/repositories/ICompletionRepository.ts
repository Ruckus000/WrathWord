// src/domain/game/repositories/ICompletionRepository.ts

import { ValidLength } from '../value-objects/GameConfig';

/**
 * Interface for tracking daily puzzle completion.
 * Prevents replaying the same daily puzzle.
 */
export interface ICompletionRepository {
  /**
   * Check if the daily puzzle for a given date and length is completed.
   */
  isDailyCompleted(dateISO: string, length: ValidLength): boolean;

  /**
   * Mark the daily puzzle as completed.
   */
  markDailyCompleted(dateISO: string, length: ValidLength): void;

  /**
   * Get all completed dates for a given length.
   */
  getCompletedDates(length: ValidLength): string[];

  /**
   * Clear completion status for a specific date and length (for testing).
   */
  clearCompletion(dateISO: string, length: ValidLength): void;
}
