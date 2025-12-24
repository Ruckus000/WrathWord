// src/domain/game/services/GuessEvaluator.ts

import { Feedback } from '../value-objects/Feedback';
import { TileStateValue } from '../value-objects/TileState';

/**
 * GuessEvaluator implements the Wordle two-pass algorithm.
 *
 * Pass 1: Mark exact position matches as 'correct', count remaining letters
 * Pass 2: Mark 'present' letters only if remaining count > 0
 */
export class GuessEvaluator {
  /**
   * Evaluate a guess against the answer.
   * Returns a Feedback value object with the evaluation results.
   */
  evaluate(answer: string, guess: string): Feedback {
    // Normalize to lowercase for case-insensitive comparison
    const ans = answer.toLowerCase();
    const gss = guess.toLowerCase();
    const n = ans.length;
    const res: TileStateValue[] = Array(n).fill('absent');
    const remaining: Record<string, number> = {};

    // First pass: mark correct positions
    for (let i = 0; i < n; i++) {
      if (gss[i] === ans[i]) {
        res[i] = 'correct';
      } else {
        remaining[ans[i]] = (remaining[ans[i]] || 0) + 1;
      }
    }

    // Second pass: mark present letters
    for (let i = 0; i < n; i++) {
      if (res[i] === 'correct') continue;
      const ch = gss[i];
      if (remaining[ch] > 0) {
        res[i] = 'present';
        remaining[ch]--;
      }
    }

    return Feedback.from(res);
  }
}
