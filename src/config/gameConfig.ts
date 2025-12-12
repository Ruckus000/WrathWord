// src/config/gameConfig.ts
// Centralized game configuration constants

/**
 * Valid word lengths supported by the game.
 * Used throughout the app for UI selectors, validation, and storage.
 */
export const VALID_LENGTHS = [4, 5, 6] as const;

/**
 * Default word length for new games and settings migration.
 */
export const DEFAULT_LENGTH = 5;

/**
 * Default number of guesses allowed.
 */
export const DEFAULT_MAX_ROWS = 6;

/**
 * Type for valid word lengths (4 | 5 | 6).
 */
export type ValidLength = (typeof VALID_LENGTHS)[number];

/**
 * Check if a number is a valid word length.
 */
export function isValidLength(length: number): length is ValidLength {
  return VALID_LENGTHS.includes(length as ValidLength);
}
