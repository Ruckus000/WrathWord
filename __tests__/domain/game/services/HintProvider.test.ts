// __tests__/domain/game/services/HintProvider.test.ts

import { HintProvider, HintResult } from '../../../../src/domain/game/services/HintProvider';
import { Feedback } from '../../../../src/domain/game/value-objects/Feedback';

describe('HintProvider', () => {
  const hintProvider = new HintProvider();

  describe('getHint', () => {
    it('returns a hint for first unfilled position when no guesses', () => {
      const result = hintProvider.getHint({
        answer: 'HELLO',
        currentRow: 0,
        feedback: [],
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.position.row).toBe(0);
        expect(result.position.col).toBeGreaterThanOrEqual(0);
        expect(result.position.col).toBeLessThan(5);
        expect(result.letter).toBe('HELLO'[result.position.col]);
      }
    });

    it('skips positions that are already correct', () => {
      // Feedback shows position 0 is correct
      const feedback = [Feedback.from(['correct', 'absent', 'absent', 'absent', 'absent'])];

      const result = hintProvider.getHint({
        answer: 'HELLO',
        currentRow: 1,
        feedback,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        // Should not hint position 0 since it's already correct
        expect(result.position.col).not.toBe(0);
        expect(result.letter).toBe('HELLO'[result.position.col]);
      }
    });

    it('skips multiple correct positions', () => {
      // Positions 0 and 2 are correct
      const feedback = [Feedback.from(['correct', 'absent', 'correct', 'absent', 'absent'])];

      const result = hintProvider.getHint({
        answer: 'HELLO',
        currentRow: 1,
        feedback,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.position.col).not.toBe(0);
        expect(result.position.col).not.toBe(2);
      }
    });

    it('returns failure when all positions are correct', () => {
      // All positions are correct (game should be won)
      const feedback = [Feedback.from(['correct', 'correct', 'correct', 'correct', 'correct'])];

      const result = hintProvider.getHint({
        answer: 'HELLO',
        currentRow: 1,
        feedback,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.reason).toContain('no positions');
      }
    });

    it('considers all previous guesses for correct positions', () => {
      // First guess: position 0 correct
      // Second guess: position 2 correct
      const feedback = [
        Feedback.from(['correct', 'absent', 'absent', 'absent', 'absent']),
        Feedback.from(['correct', 'absent', 'correct', 'absent', 'absent']),
      ];

      const result = hintProvider.getHint({
        answer: 'HELLO',
        currentRow: 2,
        feedback,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        // Should skip positions 0 and 2
        expect([1, 3, 4]).toContain(result.position.col);
      }
    });

    it('returns hint for current row', () => {
      const result = hintProvider.getHint({
        answer: 'HELLO',
        currentRow: 3,
        feedback: [],
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.position.row).toBe(3);
      }
    });
  });

  describe('hint letter', () => {
    it('returns correct letter from answer', () => {
      const result = hintProvider.getHint({
        answer: 'APPLE',
        currentRow: 0,
        feedback: [],
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const expectedLetter = 'APPLE'[result.position.col];
        expect(result.letter).toBe(expectedLetter);
      }
    });

    it('handles different word lengths', () => {
      const result4 = hintProvider.getHint({
        answer: 'TEST',
        currentRow: 0,
        feedback: [],
      });

      const result6 = hintProvider.getHint({
        answer: 'GRAPES',
        currentRow: 0,
        feedback: [],
      });

      expect(result4.success).toBe(true);
      expect(result6.success).toBe(true);
      if (result4.success) {
        expect(result4.position.col).toBeLessThan(4);
      }
      if (result6.success) {
        expect(result6.position.col).toBeLessThan(6);
      }
    });
  });

  describe('deterministic selection', () => {
    it('selects first available position', () => {
      // With no correct positions, should select position 0
      const result = hintProvider.getHint({
        answer: 'HELLO',
        currentRow: 0,
        feedback: [],
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.position.col).toBe(0);
      }
    });

    it('selects next available when first is correct', () => {
      const feedback = [Feedback.from(['correct', 'absent', 'absent', 'absent', 'absent'])];

      const result = hintProvider.getHint({
        answer: 'HELLO',
        currentRow: 1,
        feedback,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.position.col).toBe(1); // First non-correct position
      }
    });
  });
});
