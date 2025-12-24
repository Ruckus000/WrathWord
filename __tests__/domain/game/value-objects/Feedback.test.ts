// __tests__/domain/game/value-objects/Feedback.test.ts

import { Feedback } from '../../../../src/domain/game/value-objects/Feedback';
import { TileStateValue } from '../../../../src/domain/game/value-objects/TileState';

describe('Feedback', () => {
  describe('creation', () => {
    it('creates from tile states array', () => {
      const states: TileStateValue[] = ['correct', 'present', 'absent'];
      const feedback = Feedback.from(states);
      expect(feedback.states).toEqual(states);
    });

    it('creates defensive copy of input array', () => {
      const states: TileStateValue[] = ['correct', 'present', 'absent'];
      const feedback = Feedback.from(states);
      states[0] = 'absent'; // Mutate original
      expect(feedback.states[0]).toBe('correct'); // Feedback unchanged
    });

    it('returns defensive copy from states getter', () => {
      const feedback = Feedback.from(['correct', 'present', 'absent']);
      const states1 = feedback.states;
      const states2 = feedback.states;
      expect(states1).not.toBe(states2); // Different instances
      expect(states1).toEqual(states2); // Same content
    });

    it('is immutable', () => {
      const feedback = Feedback.from(['correct', 'present', 'absent']);
      expect(Object.isFrozen(feedback)).toBe(true);
    });
  });

  describe('length', () => {
    it('returns number of states', () => {
      expect(Feedback.from(['correct', 'present', 'absent']).length).toBe(3);
      expect(Feedback.from(['correct', 'correct', 'correct', 'correct']).length).toBe(4);
      expect(Feedback.from(['absent', 'absent', 'absent', 'absent', 'absent']).length).toBe(5);
    });
  });

  describe('isWin', () => {
    it('returns true when all states are correct', () => {
      expect(Feedback.from(['correct', 'correct', 'correct']).isWin()).toBe(true);
      expect(Feedback.from(['correct', 'correct', 'correct', 'correct', 'correct']).isWin()).toBe(true);
    });

    it('returns false when any state is present', () => {
      expect(Feedback.from(['correct', 'present', 'correct']).isWin()).toBe(false);
    });

    it('returns false when any state is absent', () => {
      expect(Feedback.from(['correct', 'absent', 'correct']).isWin()).toBe(false);
    });

    it('returns false when all states are absent', () => {
      expect(Feedback.from(['absent', 'absent', 'absent']).isWin()).toBe(false);
    });

    it('returns false when mixed states', () => {
      expect(Feedback.from(['correct', 'present', 'absent', 'correct', 'present']).isWin()).toBe(false);
    });
  });

  describe('toShareEmoji', () => {
    it('maps correct to green square', () => {
      expect(Feedback.from(['correct']).toShareEmoji()).toBe('🟩');
    });

    it('maps present to yellow square', () => {
      expect(Feedback.from(['present']).toShareEmoji()).toBe('🟨');
    });

    it('maps absent to black square', () => {
      expect(Feedback.from(['absent']).toShareEmoji()).toBe('⬛');
    });

    it('generates correct sequence for mixed feedback', () => {
      expect(Feedback.from(['correct', 'present', 'absent', 'correct', 'present']).toShareEmoji()).toBe(
        '🟩🟨⬛🟩🟨'
      );
    });

    it('generates all green for win', () => {
      expect(Feedback.from(['correct', 'correct', 'correct', 'correct', 'correct']).toShareEmoji()).toBe(
        '🟩🟩🟩🟩🟩'
      );
    });
  });

  describe('at', () => {
    it('returns state at index', () => {
      const feedback = Feedback.from(['correct', 'present', 'absent']);
      expect(feedback.at(0)).toBe('correct');
      expect(feedback.at(1)).toBe('present');
      expect(feedback.at(2)).toBe('absent');
    });

    it('returns undefined for out of bounds index', () => {
      const feedback = Feedback.from(['correct', 'present', 'absent']);
      expect(feedback.at(3)).toBeUndefined();
      expect(feedback.at(-1)).toBeUndefined();
    });
  });

  describe('countByState', () => {
    it('counts correct states', () => {
      expect(Feedback.from(['correct', 'correct', 'absent', 'present', 'correct']).countByState('correct')).toBe(3);
    });

    it('counts present states', () => {
      expect(Feedback.from(['correct', 'present', 'absent', 'present', 'correct']).countByState('present')).toBe(2);
    });

    it('counts absent states', () => {
      expect(Feedback.from(['absent', 'absent', 'absent', 'present', 'correct']).countByState('absent')).toBe(3);
    });

    it('returns 0 when state not present', () => {
      expect(Feedback.from(['correct', 'correct', 'correct']).countByState('absent')).toBe(0);
    });
  });
});
