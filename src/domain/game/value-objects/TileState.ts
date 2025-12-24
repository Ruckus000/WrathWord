// src/domain/game/value-objects/TileState.ts

/**
 * TileState represents the evaluation result for a single letter position.
 *
 * Precedence: correct > present > absent
 * This is used for keyboard state tracking where states only upgrade, never downgrade.
 */
export type TileStateValue = 'correct' | 'present' | 'absent';

const VALID_STATES: readonly TileStateValue[] = ['correct', 'present', 'absent'];

export const TileState = {
  /**
   * Precedence values for comparison.
   * Higher number = higher precedence.
   */
  PRECEDENCE: {
    absent: 0,
    present: 1,
    correct: 2,
  } as const,

  /**
   * Compare two tile states by precedence.
   * Returns positive if a > b, negative if a < b, zero if equal.
   */
  compare(a: TileStateValue, b: TileStateValue): number {
    return this.PRECEDENCE[a] - this.PRECEDENCE[b];
  },

  /**
   * Return the higher precedence state.
   * Used for keyboard state tracking.
   */
  max(a: TileStateValue, b: TileStateValue): TileStateValue {
    return this.compare(a, b) >= 0 ? a : b;
  },

  /**
   * Check if a value is a valid TileState.
   */
  isValid(value: unknown): value is TileStateValue {
    return typeof value === 'string' && VALID_STATES.includes(value as TileStateValue);
  },
} as const;
