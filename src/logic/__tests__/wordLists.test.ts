// src/logic/__tests__/wordLists.test.ts
import answers4 from '../words/answers-4.json';
import allowed4 from '../words/allowed-4.json';
import answers5 from '../words/answers-5.json';
import allowed5 from '../words/allowed-5.json';
import answers6 from '../words/answers-6.json';
import allowed6 from '../words/allowed-6.json';

describe('Word Lists Validation', () => {
  describe('answers are subsets of allowed', () => {
    test('length 4', () => {
      const allowedSet = new Set(allowed4);
      answers4.forEach((word: string) => {
        expect(allowedSet.has(word)).toBe(true);
      });
    });

    test('length 5', () => {
      const allowedSet = new Set(allowed5);
      answers5.forEach((word: string) => {
        expect(allowedSet.has(word)).toBe(true);
      });
    });

    test('length 6', () => {
      const allowedSet = new Set(allowed6);
      answers6.forEach((word: string) => {
        expect(allowedSet.has(word)).toBe(true);
      });
    });
  });

  describe('all words are lowercase', () => {
    test('all answers are lowercase', () => {
      const allAnswers = [...answers4, ...answers5, ...answers6];
      allAnswers.forEach((word: string) => {
        expect(word).toBe(word.toLowerCase());
      });
    });

    test('all allowed are lowercase', () => {
      const allAllowed = [...allowed4, ...allowed5, ...allowed6];
      allAllowed.forEach((word: string) => {
        expect(word).toBe(word.toLowerCase());
      });
    });
  });

  describe('all words have correct length', () => {
    test('length 4', () => {
      answers4.forEach((word: string) => expect(word.length).toBe(4));
      allowed4.forEach((word: string) => expect(word.length).toBe(4));
    });

    test('length 5', () => {
      answers5.forEach((word: string) => expect(word.length).toBe(5));
      allowed5.forEach((word: string) => expect(word.length).toBe(5));
    });

    test('length 6', () => {
      answers6.forEach((word: string) => expect(word.length).toBe(6));
      allowed6.forEach((word: string) => expect(word.length).toBe(6));
    });
  });

  describe('word lists are not empty', () => {
    test('all lengths have answers', () => {
      expect(answers4.length).toBeGreaterThan(0);
      expect(answers5.length).toBeGreaterThan(0);
      expect(answers6.length).toBeGreaterThan(0);
    });

    test('all lengths have allowed words', () => {
      expect(allowed4.length).toBeGreaterThan(0);
      expect(allowed5.length).toBeGreaterThan(0);
      expect(allowed6.length).toBeGreaterThan(0);
    });
  });

  describe('word list sizes', () => {
    test('allowed lists are larger than or equal to answers', () => {
      expect(allowed4.length).toBeGreaterThanOrEqual(answers4.length);
      expect(allowed5.length).toBeGreaterThanOrEqual(answers5.length);
      expect(allowed6.length).toBeGreaterThanOrEqual(answers6.length);
    });
  });
});
