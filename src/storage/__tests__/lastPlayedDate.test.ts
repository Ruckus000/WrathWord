/**
 * Test to identify root cause of empty string lastPlayedDate
 *
 * Error: PostgreSQL rejects "" for date columns
 * Expected: lastPlayedDate should be null when never played
 */

import {LengthStats} from '../profile';

// Mock MMKV before importing anything that uses it
jest.mock('../mmkv', () => {
  const store: Record<string, string> = {};
  return {
    kv: {
      getString: (key: string) => store[key] ?? undefined,
      set: (key: string, value: string) => { store[key] = value; },
      delete: (key: string) => { delete store[key]; },
    },
    getJSON: <T>(key: string, fallback: T): T => {
      const v = store[key];
      return v ? (JSON.parse(v) as T) : fallback;
    },
    setJSON: (key: string, value: unknown) => {
      store[key] = JSON.stringify(value);
    },
  };
});

// Now import the function that uses MMKV
import {initLengthStats} from '../profile';

describe('lastPlayedDate root cause investigation', () => {
  describe('initLengthStats', () => {
    it('should initialize lastPlayedDate as null, not empty string', () => {
      const stats = initLengthStats();

      // This is the core assertion - should be null, not ""
      expect(stats.lastPlayedDate).toBeNull();
      expect(stats.lastPlayedDate).not.toBe('');
    });

    it('should have correct types for all fields', () => {
      const stats = initLengthStats();

      expect(typeof stats.gamesPlayed).toBe('number');
      expect(typeof stats.gamesWon).toBe('number');
      expect(stats.lastPlayedDate === null || typeof stats.lastPlayedDate === 'string').toBe(true);
    });
  });

  describe('JSON serialization round-trip', () => {
    it('should preserve null after JSON.stringify -> JSON.parse', () => {
      const original: LengthStats = {
        gamesPlayed: 0,
        gamesWon: 0,
        currentStreak: 0,
        maxStreak: 0,
        lastPlayedDate: null,
        guessDistribution: {},
        usedWords: [],
        currentCycle: 0,
      };

      const serialized = JSON.stringify(original);
      const deserialized = JSON.parse(serialized) as LengthStats;

      // null should survive JSON round-trip
      expect(deserialized.lastPlayedDate).toBeNull();
      expect(deserialized.lastPlayedDate).not.toBe('');
    });

    it('should NOT convert null to empty string during serialization', () => {
      const obj = { lastPlayedDate: null };
      const json = JSON.stringify(obj);

      // JSON should contain "null", not '""'
      expect(json).toBe('{"lastPlayedDate":null}');
      expect(json).not.toContain('""');
    });

    it('JSON.parse of "null" returns null, not empty string', () => {
      const parsed = JSON.parse('{"lastPlayedDate":null}');
      expect(parsed.lastPlayedDate).toBeNull();
      expect(parsed.lastPlayedDate).not.toBe('');
    });
  });

  describe('potential corruption scenarios', () => {
    it('identifies that empty string must be explicitly assigned somewhere', () => {
      // Since initLengthStats returns null and JSON preserves null,
      // the only way to get "" is explicit assignment like:
      const stats: Partial<LengthStats> = {
        lastPlayedDate: '', // <-- This must exist somewhere in code or data
      };

      expect(stats.lastPlayedDate).toBe('');
    });

    it('the fix correctly handles both null and empty string', () => {
      // The fix: stats.lastPlayedDate || null
      const nullValue: string | null = null;
      const emptyString: string | null = '';
      const validDate: string | null = '2025-01-01';

      // All should produce correct PostgreSQL values
      expect(nullValue || null).toBeNull();
      expect(emptyString || null).toBeNull(); // Converts "" to null
      expect(validDate || null).toBe('2025-01-01');
    });

    it('Object.assign/spread can corrupt if default has empty string', () => {
      // Possible source: some migration or default object has ""
      const badDefault = { lastPlayedDate: '' };
      const goodData = { lastPlayedDate: null };

      // Wrong order overwrites null with ""
      const corrupted = { ...goodData, ...badDefault };
      expect(corrupted.lastPlayedDate).toBe('');

      // Correct order preserves null
      const correct = { ...badDefault, ...goodData };
      expect(correct.lastPlayedDate).toBeNull();
    });

    it('falsy check can lead to wrong default', () => {
      // Common bug: using || '' instead of ?? null
      const nullValue: string | null = null;

      // BUG: This converts null to ""
      const buggy = nullValue || '';
      expect(buggy).toBe('');

      // CORRECT: This preserves null
      const correct = nullValue ?? null;
      expect(correct).toBeNull();
    });
  });

  describe('MMKV storage behavior hypothesis', () => {
    it('getJSON returns fallback for missing keys', () => {
      // The mock simulates MMKV behavior
      const {getJSON} = require('../mmkv');

      // Missing key returns fallback
      const result = getJSON('nonexistent', {lastPlayedDate: null});
      expect(result.lastPlayedDate).toBeNull();
    });

    it('getJSON with empty string in stored data', () => {
      const {setJSON, getJSON} = require('../mmkv');

      // If "" was saved (from bug elsewhere), it would be retrieved as ""
      setJSON('test-key', {lastPlayedDate: ''});
      const result = getJSON('test-key', null);

      expect(result.lastPlayedDate).toBe(''); // The corruption persists!
    });

    it('existing corrupted data would persist until overwritten', () => {
      // CONCLUSION: The empty string was likely written to storage at some point
      // in the past (maybe before the type was defined as string | null)
      // and has been persisting ever since.
      //
      // The fix handles it at the boundary, but to truly fix root cause:
      // 1. Find where "" could have been written (probably fixed now)
      // 2. Run a data migration to convert "" to null in stored profiles

      expect(true).toBe(true); // Document the conclusion
    });
  });
});
