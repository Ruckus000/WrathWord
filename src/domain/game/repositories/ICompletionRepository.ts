// src/domain/game/repositories/ICompletionRepository.ts

import { ValidLength } from '../value-objects/GameConfig';

/**
 * Interface for tracking daily puzzle completion.
 * Prevents replaying the same daily puzzle.
 *
 * IMPORTANT: maxRows is part of the completion key because different
 * maxRows configurations produce different words (maxRows is part of the seed).
 */
export interface ICompletionRepository {
  /**
   * Check if the daily puzzle for a given configuration is completed.
   */
  isDailyCompleted(length: ValidLength, maxRows: number, dateISO: string): boolean;

  /**
   * Mark the daily puzzle as completed.
   */
  markDailyCompleted(length: ValidLength, maxRows: number, dateISO: string): void;

  /**
   * Get all completed dates for a given length.
   */
  getCompletedDates(length: ValidLength): string[];

  /**
   * Clear completion status for a specific configuration (for testing).
   */
  clearCompletion(length: ValidLength, maxRows: number, dateISO: string): void;
}
