// src/infrastructure/persistence/MMKVCompletionRepository.ts

import { ICompletionRepository } from '../../domain/game/repositories/ICompletionRepository';
import { ValidLength } from '../../domain/game/value-objects/GameConfig';
import {
  isDailyCompleted as checkCompleted,
  markDailyCompleted as markCompleted,
  getDailyCompletionKey,
} from '../../storage/dailyCompletion';
import { kv, getJSON } from '../../storage/mmkv';
import { getScopedKey } from '../../storage/userScope';

/**
 * MMKVCompletionRepository implements ICompletionRepository.
 * Wraps existing dailyCompletion.ts functions for domain layer usage.
 */
export class MMKVCompletionRepository implements ICompletionRepository {
  /**
   * Check if a daily puzzle is completed.
   */
  isDailyCompleted(length: ValidLength, maxRows: number, dateISO: string): boolean {
    return checkCompleted(length, maxRows, dateISO);
  }

  /**
   * Mark a daily puzzle as completed.
   */
  markDailyCompleted(length: ValidLength, maxRows: number, dateISO: string): void {
    markCompleted(length, maxRows, dateISO);
  }

  /**
   * Get all completed dates for a given length.
   * Note: This requires scanning storage keys, which is expensive.
   * Consider caching if called frequently.
   */
  getCompletedDates(length: ValidLength): string[] {
    // Get the completed dates index, or scan storage
    const indexKey = getScopedKey(`daily.${length}.completedDates`) ?? `daily.${length}.completedDates`;
    const dates = getJSON<string[]>(indexKey, []);
    return dates;
  }

  /**
   * Clear completion status for testing purposes.
   */
  clearCompletion(length: ValidLength, maxRows: number, dateISO: string): void {
    const key = getDailyCompletionKey(length, maxRows, dateISO);
    kv.remove(key);
  }
}

/**
 * Factory function following project pattern.
 */
let instance: MMKVCompletionRepository | null = null;

export function getCompletionRepository(): ICompletionRepository {
  if (!instance) {
    instance = new MMKVCompletionRepository();
  }
  return instance;
}
