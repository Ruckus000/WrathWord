// __tests__/domain/game/value-objects/GameConfig.test.ts

import { GameConfig, GameMode } from '../../../../src/domain/game/value-objects/GameConfig';

describe('GameConfig', () => {
  describe('creation', () => {
    it('creates with valid parameters', () => {
      const config = GameConfig.create({ length: 5, maxRows: 6, mode: 'daily', dateISO: '2025-01-15' });
      expect(config.length).toBe(5);
      expect(config.maxRows).toBe(6);
      expect(config.mode).toBe('daily');
      expect(config.dateISO).toBe('2025-01-15');
    });

    it('creates with 4-letter length', () => {
      const config = GameConfig.create({ length: 4, maxRows: 4, mode: 'free', dateISO: '2025-01-15' });
      expect(config.length).toBe(4);
    });

    it('creates with 6-letter length', () => {
      const config = GameConfig.create({ length: 6, maxRows: 6, mode: 'daily', dateISO: '2025-01-15' });
      expect(config.length).toBe(6);
    });

    it('is immutable', () => {
      const config = GameConfig.create({ length: 5, maxRows: 6, mode: 'daily', dateISO: '2025-01-15' });
      expect(Object.isFrozen(config)).toBe(true);
    });
  });

  describe('validation', () => {
    it('throws for invalid length (3)', () => {
      expect(() =>
        GameConfig.create({ length: 3, maxRows: 6, mode: 'daily', dateISO: '2025-01-15' })
      ).toThrow('Invalid word length');
    });

    it('throws for invalid length (7)', () => {
      expect(() =>
        GameConfig.create({ length: 7, maxRows: 6, mode: 'daily', dateISO: '2025-01-15' })
      ).toThrow('Invalid word length');
    });

    it('throws for negative maxRows', () => {
      expect(() =>
        GameConfig.create({ length: 5, maxRows: -1, mode: 'daily', dateISO: '2025-01-15' })
      ).toThrow('maxRows must be positive');
    });

    it('throws for zero maxRows', () => {
      expect(() =>
        GameConfig.create({ length: 5, maxRows: 0, mode: 'daily', dateISO: '2025-01-15' })
      ).toThrow('maxRows must be positive');
    });

    it('throws for invalid mode', () => {
      expect(() =>
        GameConfig.create({ length: 5, maxRows: 6, mode: 'invalid' as GameMode, dateISO: '2025-01-15' })
      ).toThrow('Invalid game mode');
    });

    it('throws for empty dateISO', () => {
      expect(() => GameConfig.create({ length: 5, maxRows: 6, mode: 'daily', dateISO: '' })).toThrow(
        'dateISO is required'
      );
    });
  });

  describe('toSeedString', () => {
    it('generates seed in format dateISO:length:maxRows', () => {
      const config = GameConfig.create({ length: 5, maxRows: 6, mode: 'daily', dateISO: '2025-01-15' });
      expect(config.toSeedString()).toBe('2025-01-15:5:6');
    });

    it('varies by date', () => {
      const config1 = GameConfig.create({ length: 5, maxRows: 6, mode: 'daily', dateISO: '2025-01-15' });
      const config2 = GameConfig.create({ length: 5, maxRows: 6, mode: 'daily', dateISO: '2025-01-16' });
      expect(config1.toSeedString()).not.toBe(config2.toSeedString());
    });

    it('varies by length', () => {
      const config1 = GameConfig.create({ length: 5, maxRows: 6, mode: 'daily', dateISO: '2025-01-15' });
      const config2 = GameConfig.create({ length: 4, maxRows: 6, mode: 'daily', dateISO: '2025-01-15' });
      expect(config1.toSeedString()).not.toBe(config2.toSeedString());
    });

    it('varies by maxRows - CRITICAL', () => {
      const config1 = GameConfig.create({ length: 5, maxRows: 6, mode: 'daily', dateISO: '2025-01-15' });
      const config2 = GameConfig.create({ length: 5, maxRows: 5, mode: 'daily', dateISO: '2025-01-15' });
      expect(config1.toSeedString()).not.toBe(config2.toSeedString());
    });

    it('does not include mode in seed (mode is for behavior, not word selection)', () => {
      const dailyConfig = GameConfig.create({ length: 5, maxRows: 6, mode: 'daily', dateISO: '2025-01-15' });
      const freeConfig = GameConfig.create({ length: 5, maxRows: 6, mode: 'free', dateISO: '2025-01-15' });
      expect(dailyConfig.toSeedString()).toBe(freeConfig.toSeedString());
    });
  });

  describe('isDaily', () => {
    it('returns true for daily mode', () => {
      const config = GameConfig.create({ length: 5, maxRows: 6, mode: 'daily', dateISO: '2025-01-15' });
      expect(config.isDaily()).toBe(true);
    });

    it('returns false for free mode', () => {
      const config = GameConfig.create({ length: 5, maxRows: 6, mode: 'free', dateISO: '2025-01-15' });
      expect(config.isDaily()).toBe(false);
    });
  });

  describe('isFreePlay', () => {
    it('returns true for free mode', () => {
      const config = GameConfig.create({ length: 5, maxRows: 6, mode: 'free', dateISO: '2025-01-15' });
      expect(config.isFreePlay()).toBe(true);
    });

    it('returns false for daily mode', () => {
      const config = GameConfig.create({ length: 5, maxRows: 6, mode: 'daily', dateISO: '2025-01-15' });
      expect(config.isFreePlay()).toBe(false);
    });
  });

  describe('defaults', () => {
    it('creates default config', () => {
      const today = new Date().toISOString().split('T')[0];
      const config = GameConfig.createDefault(today);
      expect(config.length).toBe(5);
      expect(config.maxRows).toBe(6);
      expect(config.mode).toBe('daily');
      expect(config.dateISO).toBe(today);
    });
  });

  describe('VALID_LENGTHS', () => {
    it('exposes valid lengths constant', () => {
      expect(GameConfig.VALID_LENGTHS).toEqual([4, 5, 6]);
    });

    it('VALID_LENGTHS is frozen', () => {
      expect(Object.isFrozen(GameConfig.VALID_LENGTHS)).toBe(true);
    });
  });

  describe('isValidLength', () => {
    it('returns true for valid lengths', () => {
      expect(GameConfig.isValidLength(4)).toBe(true);
      expect(GameConfig.isValidLength(5)).toBe(true);
      expect(GameConfig.isValidLength(6)).toBe(true);
    });

    it('returns false for invalid lengths', () => {
      expect(GameConfig.isValidLength(3)).toBe(false);
      expect(GameConfig.isValidLength(7)).toBe(false);
      expect(GameConfig.isValidLength(0)).toBe(false);
      expect(GameConfig.isValidLength(-1)).toBe(false);
    });
  });
});
