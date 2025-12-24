/**
 * Characterization tests for selectDaily
 *
 * These tests document the CURRENT behavior of the daily word selection.
 * They must pass before any refactoring begins and continue passing throughout.
 *
 * CRITICAL: The seed includes dateISO, len, AND maxRows!
 * Seed format: `${dateISO}:${len}:${maxRows}`
 * Changing any of these produces a different word.
 */

import { selectDaily, seededIndex } from '../../src/logic/selectDaily';

describe('selectDaily - characterization', () => {
  // Sample word list for testing
  const testAnswers = ['APPLE', 'BEACH', 'CRANE', 'DOUBT', 'EAGLE', 'FLAME', 'GRAPE', 'HOUSE'];

  describe('determinism', () => {
    it('returns the same word for identical inputs', () => {
      const result1 = selectDaily(5, 6, '2025-01-15', testAnswers);
      const result2 = selectDaily(5, 6, '2025-01-15', testAnswers);
      const result3 = selectDaily(5, 6, '2025-01-15', testAnswers);

      expect(result1).toBe(result2);
      expect(result2).toBe(result3);
    });

    it('is deterministic across multiple calls', () => {
      const results: string[] = [];
      for (let i = 0; i < 10; i++) {
        results.push(selectDaily(5, 6, '2025-01-15', testAnswers));
      }

      expect(new Set(results).size).toBe(1); // All results should be the same
    });
  });

  describe('variation by date', () => {
    it('returns different words for different dates', () => {
      const word1 = selectDaily(5, 6, '2025-01-15', testAnswers);
      const word2 = selectDaily(5, 6, '2025-01-16', testAnswers);
      const word3 = selectDaily(5, 6, '2025-01-17', testAnswers);

      // With a good hash function, different dates should produce different indices
      // Note: There's a small chance of collision, but with 8 words and 3 dates
      // it's very unlikely all 3 would be the same
      expect(word1 === word2 && word2 === word3).toBe(false);
    });

    it('produces varied selection across a week', () => {
      const weekDates = [
        '2025-01-13',
        '2025-01-14',
        '2025-01-15',
        '2025-01-16',
        '2025-01-17',
        '2025-01-18',
        '2025-01-19',
      ];

      const words = weekDates.map((date) => selectDaily(5, 6, date, testAnswers));
      const uniqueWords = new Set(words);

      // Should have variety - not all the same word
      expect(uniqueWords.size).toBeGreaterThan(1);
    });
  });

  describe('variation by maxRows - CRITICAL', () => {
    it('returns different words for different maxRows with same date/length', () => {
      const word6Rows = selectDaily(5, 6, '2025-01-15', testAnswers);
      const word5Rows = selectDaily(5, 5, '2025-01-15', testAnswers);
      const word4Rows = selectDaily(5, 4, '2025-01-15', testAnswers);

      // maxRows is part of the seed, so different maxRows should yield different words
      // Note: There's a theoretical chance of collision, but verify at least some differ
      const uniqueWords = new Set([word6Rows, word5Rows, word4Rows]);
      expect(uniqueWords.size).toBeGreaterThan(1);
    });

    it('maxRows is included in seed string format', () => {
      // This test verifies the seed format: `${dateISO}:${len}:${maxRows}`
      // Two different maxRows values with same date/len should hash differently
      const word1 = selectDaily(5, 6, '2024-12-25', testAnswers);
      const word2 = selectDaily(5, 7, '2024-12-25', testAnswers);

      // If maxRows weren't in the seed, these would be identical
      expect(word1).not.toBe(word2);
    });
  });

  describe('variation by length', () => {
    it('returns different words for different word lengths', () => {
      const word5 = selectDaily(5, 6, '2025-01-15', testAnswers);
      const word4 = selectDaily(4, 6, '2025-01-15', testAnswers);
      const word6 = selectDaily(6, 6, '2025-01-15', testAnswers);

      // Different lengths should produce different indices
      const uniqueWords = new Set([word5, word4, word6]);
      expect(uniqueWords.size).toBeGreaterThan(1);
    });
  });

  describe('seededIndex behavior', () => {
    it('returns index within array bounds', () => {
      const listSizes = [5, 10, 100, 1000];
      const dates = ['2025-01-15', '2025-06-01', '2024-12-31'];

      for (const size of listSizes) {
        for (const date of dates) {
          const idx = seededIndex(`${date}:5:6`, size);
          expect(idx).toBeGreaterThanOrEqual(0);
          expect(idx).toBeLessThan(size);
        }
      }
    });

    it('is deterministic for same seed string', () => {
      const idx1 = seededIndex('test-seed', 100);
      const idx2 = seededIndex('test-seed', 100);
      expect(idx1).toBe(idx2);
    });

    it('produces different indices for different seed strings', () => {
      const idx1 = seededIndex('seed-a', 1000);
      const idx2 = seededIndex('seed-b', 1000);
      expect(idx1).not.toBe(idx2);
    });
  });

  describe('edge cases', () => {
    it('handles single-word answer list', () => {
      const singleWord = ['ALONE'];
      const result = selectDaily(5, 6, '2025-01-15', singleWord);
      expect(result).toBe('ALONE');
    });

    it('handles large answer list', () => {
      const largeList = Array.from({ length: 10000 }, (_, i) => `WORD${i.toString().padStart(5, '0')}`);
      const result = selectDaily(5, 6, '2025-01-15', largeList);
      expect(largeList).toContain(result);
    });
  });
});
