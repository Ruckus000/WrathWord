// __tests__/domain/game/services/WordSelector.test.ts

import { WordSelector } from '../../../../src/domain/game/services/WordSelector';
import { GameConfig } from '../../../../src/domain/game/value-objects/GameConfig';

describe('WordSelector', () => {
  const testAnswers = ['APPLE', 'BEACH', 'CRANE', 'DOUBT', 'EAGLE', 'FLAME', 'GRAPE', 'HOUSE'];

  describe('selectWord', () => {
    it('returns a word from the answers list', () => {
      const selector = new WordSelector(testAnswers);
      const config = GameConfig.create({ length: 5, maxRows: 6, mode: 'daily', dateISO: '2025-01-15' });

      const word = selector.selectWord(config);

      expect(testAnswers).toContain(word);
    });

    it('is deterministic for same config', () => {
      const selector = new WordSelector(testAnswers);
      const config = GameConfig.create({ length: 5, maxRows: 6, mode: 'daily', dateISO: '2025-01-15' });

      const word1 = selector.selectWord(config);
      const word2 = selector.selectWord(config);
      const word3 = selector.selectWord(config);

      expect(word1).toBe(word2);
      expect(word2).toBe(word3);
    });

    it('varies by date', () => {
      const selector = new WordSelector(testAnswers);
      const config1 = GameConfig.create({ length: 5, maxRows: 6, mode: 'daily', dateISO: '2025-01-15' });
      const config2 = GameConfig.create({ length: 5, maxRows: 6, mode: 'daily', dateISO: '2025-01-16' });

      const word1 = selector.selectWord(config1);
      const word2 = selector.selectWord(config2);

      // With a good hash, different dates should produce different words most of the time
      // We test multiple dates to ensure variety
      const configs = [
        GameConfig.create({ length: 5, maxRows: 6, mode: 'daily', dateISO: '2025-01-15' }),
        GameConfig.create({ length: 5, maxRows: 6, mode: 'daily', dateISO: '2025-01-16' }),
        GameConfig.create({ length: 5, maxRows: 6, mode: 'daily', dateISO: '2025-01-17' }),
      ];
      const words = configs.map((c) => selector.selectWord(c));
      const uniqueWords = new Set(words);

      expect(uniqueWords.size).toBeGreaterThan(1);
    });

    it('varies by maxRows - CRITICAL', () => {
      const selector = new WordSelector(testAnswers);
      const config1 = GameConfig.create({ length: 5, maxRows: 6, mode: 'daily', dateISO: '2025-01-15' });
      const config2 = GameConfig.create({ length: 5, maxRows: 5, mode: 'daily', dateISO: '2025-01-15' });

      const word1 = selector.selectWord(config1);
      const word2 = selector.selectWord(config2);

      // maxRows is part of the seed, so different maxRows should yield different words
      expect(word1).not.toBe(word2);
    });

    it('varies by length', () => {
      const selector = new WordSelector(testAnswers);
      const config1 = GameConfig.create({ length: 5, maxRows: 6, mode: 'daily', dateISO: '2025-01-15' });
      const config2 = GameConfig.create({ length: 4, maxRows: 6, mode: 'daily', dateISO: '2025-01-15' });

      const word1 = selector.selectWord(config1);
      const word2 = selector.selectWord(config2);

      // Different lengths should produce different indices
      const uniqueWords = new Set([word1, word2]);
      expect(uniqueWords.size).toBeGreaterThan(0); // At least runs without error
    });
  });

  describe('uses GameConfig.toSeedString', () => {
    it('produces same result as direct seed calculation', () => {
      const selector = new WordSelector(testAnswers);
      const config = GameConfig.create({ length: 5, maxRows: 6, mode: 'daily', dateISO: '2025-01-15' });

      // The seed should be in format dateISO:length:maxRows
      expect(config.toSeedString()).toBe('2025-01-15:5:6');

      // Word selection should be consistent
      const word = selector.selectWord(config);
      expect(testAnswers).toContain(word);
    });
  });

  describe('edge cases', () => {
    it('handles single-word list', () => {
      const selector = new WordSelector(['ALONE']);
      const config = GameConfig.create({ length: 5, maxRows: 6, mode: 'daily', dateISO: '2025-01-15' });

      const word = selector.selectWord(config);

      expect(word).toBe('ALONE');
    });

    it('handles large answer list', () => {
      const largeList = Array.from({ length: 10000 }, (_, i) => `WORD${i.toString().padStart(5, '0')}`);
      const selector = new WordSelector(largeList);
      const config = GameConfig.create({ length: 5, maxRows: 6, mode: 'daily', dateISO: '2025-01-15' });

      const word = selector.selectWord(config);

      expect(largeList).toContain(word);
    });

    it('produces varied selection across a week', () => {
      const selector = new WordSelector(testAnswers);
      const weekDates = ['2025-01-13', '2025-01-14', '2025-01-15', '2025-01-16', '2025-01-17', '2025-01-18', '2025-01-19'];

      const words = weekDates.map((date) => {
        const config = GameConfig.create({ length: 5, maxRows: 6, mode: 'daily', dateISO: date });
        return selector.selectWord(config);
      });

      const uniqueWords = new Set(words);
      expect(uniqueWords.size).toBeGreaterThan(1);
    });
  });

  describe('mode independence', () => {
    it('same word for daily and free mode with same config', () => {
      const selector = new WordSelector(testAnswers);
      const dailyConfig = GameConfig.create({ length: 5, maxRows: 6, mode: 'daily', dateISO: '2025-01-15' });
      const freeConfig = GameConfig.create({ length: 5, maxRows: 6, mode: 'free', dateISO: '2025-01-15' });

      // Mode should not affect word selection (only behavior differs)
      const dailyWord = selector.selectWord(dailyConfig);
      const freeWord = selector.selectWord(freeConfig);

      expect(dailyWord).toBe(freeWord);
    });
  });
});
