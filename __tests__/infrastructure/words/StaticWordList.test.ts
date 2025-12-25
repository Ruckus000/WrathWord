// __tests__/infrastructure/words/StaticWordList.test.ts

import { StaticWordList, getWordList } from '../../../src/infrastructure/words/StaticWordList';
import { ValidLength } from '../../../src/domain/game/value-objects/GameConfig';

describe('StaticWordList', () => {
  let wordList: StaticWordList;

  beforeEach(() => {
    wordList = new StaticWordList();
  });

  describe('getAnswers', () => {
    it('returns answers for length 4', () => {
      const answers = wordList.getAnswers(4);
      expect(Array.isArray(answers)).toBe(true);
      expect(answers.length).toBeGreaterThan(0);
      expect(answers.every(w => w.length === 4)).toBe(true);
    });

    it('returns answers for length 5', () => {
      const answers = wordList.getAnswers(5);
      expect(Array.isArray(answers)).toBe(true);
      expect(answers.length).toBeGreaterThan(0);
      expect(answers.every(w => w.length === 5)).toBe(true);
    });

    it('returns answers for length 6', () => {
      const answers = wordList.getAnswers(6);
      expect(Array.isArray(answers)).toBe(true);
      expect(answers.length).toBeGreaterThan(0);
      expect(answers.every(w => w.length === 6)).toBe(true);
    });

    it('returns a copy (not the original array)', () => {
      const answers1 = wordList.getAnswers(5);
      const answers2 = wordList.getAnswers(5);
      expect(answers1).not.toBe(answers2);
      expect(answers1).toEqual(answers2);
    });
  });

  describe('isValidGuess', () => {
    it('returns true for valid words', () => {
      const answers = wordList.getAnswers(5);
      const firstAnswer = answers[0];
      expect(wordList.isValidGuess(firstAnswer, 5)).toBe(true);
    });

    it('returns false for invalid words', () => {
      expect(wordList.isValidGuess('zzzzz', 5)).toBe(false);
      expect(wordList.isValidGuess('xxxxx', 5)).toBe(false);
    });

    it('is case insensitive', () => {
      const answers = wordList.getAnswers(5);
      const firstAnswer = answers[0];
      expect(wordList.isValidGuess(firstAnswer.toUpperCase(), 5)).toBe(true);
      expect(wordList.isValidGuess(firstAnswer.toLowerCase(), 5)).toBe(true);
    });

    it('returns false for wrong length', () => {
      const answers4 = wordList.getAnswers(4);
      const fourLetterWord = answers4[0];
      // A 4-letter word should not be valid for length 5
      expect(wordList.isValidGuess(fourLetterWord, 5 as ValidLength)).toBe(false);
    });
  });

  describe('getAnswerCount', () => {
    it('returns count for each valid length', () => {
      expect(wordList.getAnswerCount(4)).toBeGreaterThan(0);
      expect(wordList.getAnswerCount(5)).toBeGreaterThan(0);
      expect(wordList.getAnswerCount(6)).toBeGreaterThan(0);
    });

    it('matches actual array length', () => {
      expect(wordList.getAnswerCount(5)).toBe(wordList.getAnswers(5).length);
    });
  });

  describe('getWordList factory', () => {
    it('returns an IWordList instance', () => {
      const instance = getWordList();
      expect(instance).toBeDefined();
      expect(typeof instance.getAnswers).toBe('function');
      expect(typeof instance.isValidGuess).toBe('function');
    });

    it('returns singleton instance', () => {
      const instance1 = getWordList();
      const instance2 = getWordList();
      expect(instance1).toBe(instance2);
    });
  });

  describe('O(1) lookup performance', () => {
    it('isValidGuess uses Set for fast lookup', () => {
      // This is a smoke test - if it used array.includes() on large lists,
      // this would be noticeably slow for many calls
      const start = Date.now();
      for (let i = 0; i < 10000; i++) {
        wordList.isValidGuess('crane', 5);
      }
      const elapsed = Date.now() - start;
      // 10000 O(1) lookups should complete in well under 100ms
      expect(elapsed).toBeLessThan(100);
    });
  });
});
