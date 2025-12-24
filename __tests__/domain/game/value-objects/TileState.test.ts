// __tests__/domain/game/value-objects/TileState.test.ts

import { TileState, TileStateValue } from '../../../../src/domain/game/value-objects/TileState';

describe('TileState', () => {
  describe('PRECEDENCE', () => {
    it('defines correct > present > absent', () => {
      expect(TileState.PRECEDENCE.correct).toBeGreaterThan(TileState.PRECEDENCE.present);
      expect(TileState.PRECEDENCE.present).toBeGreaterThan(TileState.PRECEDENCE.absent);
    });

    it('has numeric values for all states', () => {
      expect(typeof TileState.PRECEDENCE.correct).toBe('number');
      expect(typeof TileState.PRECEDENCE.present).toBe('number');
      expect(typeof TileState.PRECEDENCE.absent).toBe('number');
    });
  });

  describe('compare', () => {
    it('returns positive when first has higher precedence', () => {
      expect(TileState.compare('correct', 'present')).toBeGreaterThan(0);
      expect(TileState.compare('correct', 'absent')).toBeGreaterThan(0);
      expect(TileState.compare('present', 'absent')).toBeGreaterThan(0);
    });

    it('returns negative when first has lower precedence', () => {
      expect(TileState.compare('present', 'correct')).toBeLessThan(0);
      expect(TileState.compare('absent', 'correct')).toBeLessThan(0);
      expect(TileState.compare('absent', 'present')).toBeLessThan(0);
    });

    it('returns zero when states are equal', () => {
      expect(TileState.compare('correct', 'correct')).toBe(0);
      expect(TileState.compare('present', 'present')).toBe(0);
      expect(TileState.compare('absent', 'absent')).toBe(0);
    });
  });

  describe('max', () => {
    it('returns correct when comparing correct and present', () => {
      expect(TileState.max('correct', 'present')).toBe('correct');
      expect(TileState.max('present', 'correct')).toBe('correct');
    });

    it('returns correct when comparing correct and absent', () => {
      expect(TileState.max('correct', 'absent')).toBe('correct');
      expect(TileState.max('absent', 'correct')).toBe('correct');
    });

    it('returns present when comparing present and absent', () => {
      expect(TileState.max('present', 'absent')).toBe('present');
      expect(TileState.max('absent', 'present')).toBe('present');
    });

    it('returns same state when comparing equal states', () => {
      expect(TileState.max('correct', 'correct')).toBe('correct');
      expect(TileState.max('present', 'present')).toBe('present');
      expect(TileState.max('absent', 'absent')).toBe('absent');
    });
  });

  describe('isValid', () => {
    it('returns true for valid tile states', () => {
      expect(TileState.isValid('correct')).toBe(true);
      expect(TileState.isValid('present')).toBe(true);
      expect(TileState.isValid('absent')).toBe(true);
    });

    it('returns false for invalid values', () => {
      expect(TileState.isValid('invalid')).toBe(false);
      expect(TileState.isValid('')).toBe(false);
      expect(TileState.isValid(null as unknown)).toBe(false);
      expect(TileState.isValid(undefined as unknown)).toBe(false);
    });
  });
});
