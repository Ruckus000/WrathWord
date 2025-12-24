/**
 * Characterization tests for evaluateGuess
 *
 * These tests document the CURRENT behavior of the evaluateGuess function.
 * They must pass before any refactoring begins and continue passing throughout.
 *
 * The evaluateGuess function implements Wordle's two-pass algorithm:
 * Pass 1: Mark exact position matches as 'correct', count remaining letters
 * Pass 2: Mark 'present' letters only if remaining count > 0
 */

import { evaluateGuess, TileState } from '../../src/logic/evaluateGuess';

describe('evaluateGuess - characterization', () => {
  describe('exact matches', () => {
    it('marks exact position matches as correct', () => {
      const result = evaluateGuess('HELLO', 'HELLO');
      expect(result).toEqual(['correct', 'correct', 'correct', 'correct', 'correct']);
    });

    it('marks partial exact matches as correct', () => {
      const result = evaluateGuess('HELLO', 'HELPS');
      // H, E, L match exactly; P and S don't exist
      expect(result).toEqual(['correct', 'correct', 'correct', 'absent', 'absent']);
    });
  });

  describe('duplicate letter handling', () => {
    it('handles LEVER vs HELLO - E appears twice in guess, once in answer', () => {
      // Answer: HELLO (one E at position 1)
      // Guess:  LEVER (E at position 1 and 3)
      // E[1] matches exactly -> correct
      // E[3] has no remaining E's -> absent
      // L[0] is in HELLO (positions 2,3) -> present
      const result = evaluateGuess('HELLO', 'LEVER');
      expect(result).toEqual(['present', 'correct', 'absent', 'absent', 'absent']);
    });

    it('handles LLAMA vs HELLO - L appears twice in guess, twice in answer', () => {
      // Answer: HELLO (L at positions 2, 3)
      // Guess:  LLAMA (L at positions 0, 1)
      // No exact matches, so remaining = {H:1, E:1, L:2, O:1}
      // L[0]: remaining L = 2 > 0 -> present, remaining L = 1
      // L[1]: remaining L = 1 > 0 -> present, remaining L = 0
      const result = evaluateGuess('HELLO', 'LLAMA');
      expect(result).toEqual(['present', 'present', 'absent', 'absent', 'absent']);
    });

    it('handles excess duplicate letters - three L guess vs two L answer', () => {
      // Answer: HELLO (L at positions 2, 3)
      // Guess:  LLLAA (L at positions 0, 1, 2)
      // L[2] matches exactly -> correct
      // remaining = {H:1, E:1, L:1, O:1} (one L remaining after L[2] match)
      // L[0]: remaining L = 1 > 0 -> present, remaining L = 0
      // L[1]: remaining L = 0, not > 0 -> absent
      const result = evaluateGuess('HELLO', 'LLLAA');
      expect(result).toEqual(['present', 'absent', 'correct', 'absent', 'absent']);
    });
  });

  describe('correct over present prioritization', () => {
    it('prioritizes correct over present - ABBEY vs BABES', () => {
      // Answer: BABES (B at 0, A at 1, B at 2, E at 3, S at 4)
      // Guess:  ABBEY (A at 0, B at 1, B at 2, E at 3, Y at 4)
      // Pass 1: B[2] and E[3] match exactly
      // remaining = {B:1, A:1, S:1}
      // Pass 2: A[0] -> present (remaining A), B[1] -> present (remaining B from pos 0)
      const result = evaluateGuess('BABES', 'ABBEY');
      expect(result).toEqual(['present', 'present', 'correct', 'correct', 'absent']);
    });

    it('handles correct match consuming a letter needed elsewhere - ALLAY vs LLAMA', () => {
      // Answer: ALLAY (A at 0, L at 1, L at 2, A at 3, Y at 4)
      // Guess:  LLAMA (L at 0, L at 1, A at 2, M at 3, A at 4)
      // Pass 1: L[1] matches exactly
      // remaining = {A:2, L:1, Y:1}
      // Pass 2: L[0] -> present (one L remaining from pos 2)
      //         A[2] -> present, A[4] -> present
      const result = evaluateGuess('ALLAY', 'LLAMA');
      expect(result).toEqual(['present', 'correct', 'present', 'absent', 'present']);
    });
  });

  describe('case insensitivity', () => {
    it('treats uppercase and lowercase as equivalent', () => {
      const result = evaluateGuess('HELLO', 'hello');
      expect(result).toEqual(['correct', 'correct', 'correct', 'correct', 'correct']);
    });

    it('handles mixed case in both answer and guess', () => {
      const result = evaluateGuess('HeLLo', 'hElLO');
      expect(result).toEqual(['correct', 'correct', 'correct', 'correct', 'correct']);
    });
  });

  describe('all absent letters', () => {
    it('marks all letters as absent when none match', () => {
      const result = evaluateGuess('HELLO', 'FUDGY');
      expect(result).toEqual(['absent', 'absent', 'absent', 'absent', 'absent']);
    });
  });

  describe('present letters (wrong position)', () => {
    it('marks letters in wrong position as present', () => {
      // Answer: HELLO, Guess: OLEHS
      // O is at position 4 in answer, position 0 in guess -> present
      // L is at positions 2,3 in answer, position 1 in guess -> present
      // E is at position 1 in answer, position 2 in guess -> present
      // H is at position 0 in answer, position 3 in guess -> present
      // S not in HELLO -> absent
      const result = evaluateGuess('HELLO', 'OLEHS');
      expect(result).toEqual(['present', 'present', 'present', 'present', 'absent']);
    });
  });

  describe('mixed results', () => {
    it('handles a mix of correct, present, and absent', () => {
      // Answer: CRANE
      // Guess:  CARTS
      // C[0] -> correct
      // A[1] in CRANE at position 2 -> present
      // R[2] in CRANE at position 1 -> present
      // T[3] not in CRANE -> absent
      // S[4] not in CRANE -> absent
      const result = evaluateGuess('CRANE', 'CARTS');
      expect(result).toEqual(['correct', 'present', 'present', 'absent', 'absent']);
    });

    it('handles word with repeated letters in answer', () => {
      // Answer: GEESE (E at 1, 2, 4; G at 0; S at 3)
      // Guess:  EERIE (E at 0, 1, 3, 4; R at 2; I... wait EERIE is 5 letters)
      // Guess:  ENEMY (E at 0, 2; N at 1; M at 3; Y at 4)
      // E[0] not at position 0 in GEESE, but E exists -> present
      // N[1] not in GEESE -> absent
      // E[2] matches GEESE[2] -> correct
      // M[3] not in GEESE -> absent
      // Y[4] not in GEESE -> absent
      // Wait, how many E's? GEESE has 3 E's at 1,2,4. ENEMY has 2 E's at 0,2.
      // After E[2] matches, remaining E's = 2 (at positions 1 and 4)
      // E[0] -> present (consumes one remaining E)
      const result = evaluateGuess('GEESE', 'ENEMY');
      expect(result).toEqual(['present', 'absent', 'correct', 'absent', 'absent']);
    });
  });
});
