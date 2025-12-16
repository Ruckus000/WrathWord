// src/storage/dailyCompletion.ts
// Centralized daily completion tracking to prevent replay of completed daily puzzles

import {getJSON, setJSON} from './mmkv';
import {getScopedKey} from './userScope';

/**
 * Generate the storage key for daily completion tracking.
 * Format: daily.{length}x{maxRows}.{dateISO}.completed
 * Uses user-scoped key if logged in, otherwise falls back to base key.
 */
export function getDailyCompletionKey(
  length: number,
  maxRows: number,
  dateISO: string,
): string {
  const baseKey = `daily.${length}x${maxRows}.${dateISO}.completed`;
  return getScopedKey(baseKey) ?? baseKey;
}

/**
 * Check if a daily puzzle has been completed.
 * Returns false on any error (fail-safe for playability).
 */
export function isDailyCompleted(
  length: number,
  maxRows: number,
  dateISO: string,
): boolean {
  try {
    const key = getDailyCompletionKey(length, maxRows, dateISO);
    return getJSON<boolean>(key, false);
  } catch {
    return false;
  }
}

/**
 * Mark a daily puzzle as completed.
 */
export function markDailyCompleted(
  length: number,
  maxRows: number,
  dateISO: string,
): void {
  const key = getDailyCompletionKey(length, maxRows, dateISO);
  setJSON(key, true);
}

/**
 * Backup check: infer completion from game state object.
 * Useful when storage might not have the completion flag but game state does.
 */
export function isDailyCompletedFromGameState(
  gameState: {
    mode?: string;
    dateISO?: string;
    status?: string;
    length?: number;
    maxRows?: number;
  } | null,
  targetDate: string,
  targetLength: number,
  targetMaxRows: number,
): boolean {
  if (!gameState) {
    return false;
  }

  return (
    gameState.mode === 'daily' &&
    gameState.dateISO === targetDate &&
    gameState.length === targetLength &&
    gameState.maxRows === targetMaxRows &&
    (gameState.status === 'won' || gameState.status === 'lost')
  );
}
