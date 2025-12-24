// src/domain/game/services/HintProvider.ts

import { Feedback } from '../value-objects/Feedback';

export interface HintPosition {
  row: number;
  col: number;
}

export type HintResult =
  | { success: true; position: HintPosition; letter: string }
  | { success: false; reason: string };

export interface HintContext {
  answer: string;
  currentRow: number;
  feedback: Feedback[];
}

/**
 * HintProvider determines which position to reveal as a hint.
 *
 * Strategy: Select the first position that is not already marked as 'correct'
 * across all previous guesses.
 */
export class HintProvider {
  /**
   * Get a hint for the current game state.
   * Returns the first position that hasn't been guessed correctly yet.
   */
  getHint(context: HintContext): HintResult {
    const { answer, currentRow, feedback } = context;
    const wordLength = answer.length;

    // Find all positions that are already correct
    const correctPositions = new Set<number>();

    for (const fb of feedback) {
      for (let col = 0; col < fb.length; col++) {
        if (fb.at(col) === 'correct') {
          correctPositions.add(col);
        }
      }
    }

    // Find the first position that is not correct
    for (let col = 0; col < wordLength; col++) {
      if (!correctPositions.has(col)) {
        return {
          success: true,
          position: { row: currentRow, col },
          letter: answer[col],
        };
      }
    }

    // All positions are correct - no hint available
    return {
      success: false,
      reason: 'All positions are already correct - no positions available for hint',
    };
  }
}
