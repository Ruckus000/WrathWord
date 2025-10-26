// src/logic/__tests__/wordLists.test.ts
import answers2 from '../words/answers-2.json';
import allowed2 from '../words/allowed-2.json';
import answers3 from '../words/answers-3.json';
import allowed3 from '../words/allowed-3.json';
import answers4 from '../words/answers-4.json';
import allowed4 from '../words/allowed-4.json';
import answers5 from '../words/answers-5.json';
import allowed5 from '../words/allowed-5.json';
import answers6 from '../words/answers-6.json';
import allowed6 from '../words/allowed-6.json';

describe('Word Lists Validation', () => {
  describe('answers are subsets of allowed', () => {
    test('length 2', () => {
      const allowedSet = new Set(allowed2);
      answers2.forEach((word: string) => {
        expect(allowedSet.has(word)).toBe(true);
      });
    });

    test('length 3', () => {
      const allowedSet = new Set(allowed3);
      answers3.forEach((word: string) => {
        expect(allowedSet.has(word)).toBe(true);
      });
    });

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
      const allAnswers = [...answers2, ...answers3, ...answers4, ...answers5, ...answers6];
      allAnswers.forEach((word: string) => {
        expect(word).toBe(word.toLowerCase());
      });
    });

    test('all allowed are lowercase', () => {
      const allAllowed = [...allowed2, ...allowed3, ...allowed4, ...allowed5, ...allowed6];
      allAllowed.forEach((word: string) => {
        expect(word).toBe(word.toLowerCase());
      });
    });
  });

  describe('all words have correct length', () => {
    test('length 2', () => {
      answers2.forEach((word: string) => expect(word.length).toBe(2));
      allowed2.forEach((word: string) => expect(word.length).toBe(2));
    });

    test('length 3', () => {
      answers3.forEach((word: string) => expect(word.length).toBe(3));
      allowed3.forEach((word: string) => expect(word.length).toBe(3));
    });

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
      expect(answers2.length).toBeGreaterThan(0);
      expect(answers3.length).toBeGreaterThan(0);
      expect(answers4.length).toBeGreaterThan(0);
      expect(answers5.length).toBeGreaterThan(0);
      expect(answers6.length).toBeGreaterThan(0);
    });

    test('all lengths have allowed words', () => {
      expect(allowed2.length).toBeGreaterThan(0);
      expect(allowed3.length).toBeGreaterThan(0);
      expect(allowed4.length).toBeGreaterThan(0);
      expect(allowed5.length).toBeGreaterThan(0);
      expect(allowed6.length).toBeGreaterThan(0);
    });
  });

  describe('word list sizes', () => {
    test('allowed lists are larger than or equal to answers', () => {
      expect(allowed2.length).toBeGreaterThanOrEqual(answers2.length);
      expect(allowed3.length).toBeGreaterThanOrEqual(answers3.length);
      expect(allowed4.length).toBeGreaterThanOrEqual(answers4.length);
      expect(allowed5.length).toBeGreaterThanOrEqual(answers5.length);
      expect(allowed6.length).toBeGreaterThanOrEqual(answers6.length);
    });
  });
});
