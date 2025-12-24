// src/domain/game/value-objects/Feedback.ts

import { TileStateValue } from './TileState';

const EMOJI_MAP: Record<TileStateValue, string> = {
  correct: '🟩',
  present: '🟨',
  absent: '⬛',
};

/**
 * Feedback represents the evaluation result for a complete guess.
 * Immutable value object containing tile states for each position.
 */
export class Feedback {
  private readonly _states: readonly TileStateValue[];

  private constructor(states: TileStateValue[]) {
    this._states = Object.freeze([...states]);
    Object.freeze(this);
  }

  /**
   * Create a Feedback from an array of tile states.
   * Creates a defensive copy of the input array.
   */
  static from(states: TileStateValue[]): Feedback {
    return new Feedback(states);
  }

  /**
   * Get all tile states (returns defensive copy).
   */
  get states(): TileStateValue[] {
    return [...this._states];
  }

  /**
   * Get the number of positions.
   */
  get length(): number {
    return this._states.length;
  }

  /**
   * Get state at specific index.
   */
  at(index: number): TileStateValue | undefined {
    if (index < 0 || index >= this._states.length) {
      return undefined;
    }
    return this._states[index];
  }

  /**
   * Check if this feedback represents a win (all correct).
   */
  isWin(): boolean {
    return this._states.every((state) => state === 'correct');
  }

  /**
   * Convert to emoji string for sharing.
   */
  toShareEmoji(): string {
    return this._states.map((state) => EMOJI_MAP[state]).join('');
  }

  /**
   * Count occurrences of a specific state.
   */
  countByState(state: TileStateValue): number {
    return this._states.filter((s) => s === state).length;
  }
}
