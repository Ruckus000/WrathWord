// __tests__/domain/game/services/GuessEvaluator.test.ts

import { GuessEvaluator } from '../../../../src/domain/game/services/GuessEvaluator';

describe('GuessEvaluator', () => {
  const evaluator = new GuessEvaluator();

  describe('evaluate', () => {
    it('returns Feedback for exact match', () => {
      const feedback = evaluator.evaluate('HELLO', 'HELLO');
      expect(feedback.isWin()).toBe(true);
      expect(feedback.states).toEqual(['correct', 'correct', 'correct', 'correct', 'correct']);
    });

    it('returns Feedback for partial match', () => {
      const feedback = evaluator.evaluate('HELLO', 'HELPS');
      expect(feedback.states).toEqual(['correct', 'correct', 'correct', 'absent', 'absent']);
    });

    it('returns Feedback for no match', () => {
      const feedback = evaluator.evaluate('HELLO', 'FUDGY');
      expect(feedback.isWin()).toBe(false);
      expect(feedback.states).toEqual(['absent', 'absent', 'absent', 'absent', 'absent']);
    });

    it('handles duplicate letters - LEVER vs HELLO', () => {
      const feedback = evaluator.evaluate('HELLO', 'LEVER');
      expect(feedback.states).toEqual(['present', 'correct', 'absent', 'absent', 'absent']);
    });

    it('handles duplicate letters - LLAMA vs HELLO', () => {
      const feedback = evaluator.evaluate('HELLO', 'LLAMA');
      expect(feedback.states).toEqual(['present', 'present', 'absent', 'absent', 'absent']);
    });

    it('handles excess duplicates - LLLAA vs HELLO', () => {
      const feedback = evaluator.evaluate('HELLO', 'LLLAA');
      expect(feedback.states).toEqual(['present', 'absent', 'correct', 'absent', 'absent']);
    });

    it('prioritizes correct over present - ABBEY vs BABES', () => {
      const feedback = evaluator.evaluate('BABES', 'ABBEY');
      expect(feedback.states).toEqual(['present', 'present', 'correct', 'correct', 'absent']);
    });

    it('handles correct match consuming letter - ALLAY vs LLAMA', () => {
      const feedback = evaluator.evaluate('ALLAY', 'LLAMA');
      expect(feedback.states).toEqual(['present', 'correct', 'present', 'absent', 'present']);
    });

    it('is case insensitive', () => {
      const feedback = evaluator.evaluate('HELLO', 'hello');
      expect(feedback.isWin()).toBe(true);
    });

    it('handles mixed case', () => {
      const feedback = evaluator.evaluate('HeLLo', 'hElLO');
      expect(feedback.isWin()).toBe(true);
    });
  });

  describe('integration with Feedback', () => {
    it('returns correct Feedback length', () => {
      expect(evaluator.evaluate('HELLO', 'WORLD').length).toBe(5);
      expect(evaluator.evaluate('TEST', 'BEST').length).toBe(4);
      expect(evaluator.evaluate('APPLES', 'GRAPES').length).toBe(6);
    });

    it('toShareEmoji works correctly', () => {
      const feedback = evaluator.evaluate('CRANE', 'CARTS');
      // C=correct, A=present, R=present, T=absent, S=absent
      expect(feedback.toShareEmoji()).toBe('🟩🟨🟨⬛⬛');
    });

    it('countByState works correctly', () => {
      const feedback = evaluator.evaluate('HELLO', 'HELPS');
      expect(feedback.countByState('correct')).toBe(3);
      expect(feedback.countByState('absent')).toBe(2);
      expect(feedback.countByState('present')).toBe(0);
    });
  });

  describe('edge cases', () => {
    it('handles all same letters', () => {
      const feedback = evaluator.evaluate('AAAAA', 'AAAAA');
      expect(feedback.isWin()).toBe(true);
    });

    it('handles repeated answer letter', () => {
      // Answer: GEESE (E at 1, 2, 4)
      // Guess:  ENEMY (E at 0, 2)
      const feedback = evaluator.evaluate('GEESE', 'ENEMY');
      expect(feedback.states).toEqual(['present', 'absent', 'correct', 'absent', 'absent']);
    });
  });
});
