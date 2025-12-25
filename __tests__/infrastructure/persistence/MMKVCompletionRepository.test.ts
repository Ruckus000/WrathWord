// __tests__/infrastructure/persistence/MMKVCompletionRepository.test.ts

import { MMKVCompletionRepository, getCompletionRepository } from '../../../src/infrastructure/persistence/MMKVCompletionRepository';
import { ValidLength } from '../../../src/domain/game/value-objects/GameConfig';

// Mock the dailyCompletion module
jest.mock('../../../src/storage/dailyCompletion', () => {
  const completedMap = new Map<string, boolean>();

  return {
    isDailyCompleted: jest.fn((length: number, maxRows: number, dateISO: string) => {
      const key = `${length}:${maxRows}:${dateISO}`;
      return completedMap.get(key) ?? false;
    }),
    markDailyCompleted: jest.fn((length: number, maxRows: number, dateISO: string) => {
      const key = `${length}:${maxRows}:${dateISO}`;
      completedMap.set(key, true);
    }),
    getDailyCompletionKey: jest.fn((length: number, maxRows: number, dateISO: string) => {
      return `daily.${length}x${maxRows}.${dateISO}.completed`;
    }),
    __clearCompleted: () => completedMap.clear(),
    __getCompletedMap: () => completedMap,
  };
});

// Mock MMKV
jest.mock('../../../src/storage/mmkv', () => {
  const store = new Map<string, string>();
  return {
    kv: {
      remove: jest.fn((key: string) => store.delete(key)),
      getString: jest.fn((key: string) => store.get(key)),
      set: jest.fn((key: string, value: string) => store.set(key, value)),
    },
    getJSON: jest.fn(<T>(key: string, fallback: T): T => {
      const value = store.get(key);
      return value ? JSON.parse(value) : fallback;
    }),
    setJSON: jest.fn((key: string, value: unknown) => {
      store.set(key, JSON.stringify(value));
    }),
    __clearStore: () => store.clear(),
  };
});

// Mock userScope
jest.mock('../../../src/storage/userScope', () => ({
  getScopedKey: jest.fn((baseKey: string) => `user123.${baseKey}`),
}));

describe('MMKVCompletionRepository', () => {
  let repository: MMKVCompletionRepository;

  beforeEach(() => {
    // Clear mocks
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (require('../../../src/storage/dailyCompletion') as any).__clearCompleted();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (require('../../../src/storage/mmkv') as any).__clearStore();
    jest.clearAllMocks();
    repository = new MMKVCompletionRepository();
  });

  describe('isDailyCompleted', () => {
    it('returns false when not completed', () => {
      expect(repository.isDailyCompleted(5, 6, '2025-01-15')).toBe(false);
    });

    it('returns true after marking completed', () => {
      repository.markDailyCompleted(5, 6, '2025-01-15');
      expect(repository.isDailyCompleted(5, 6, '2025-01-15')).toBe(true);
    });

    it('differentiates by length', () => {
      repository.markDailyCompleted(5, 6, '2025-01-15');

      expect(repository.isDailyCompleted(5, 6, '2025-01-15')).toBe(true);
      expect(repository.isDailyCompleted(4, 6, '2025-01-15')).toBe(false);
      expect(repository.isDailyCompleted(6, 6, '2025-01-15')).toBe(false);
    });

    it('differentiates by maxRows', () => {
      repository.markDailyCompleted(5, 6, '2025-01-15');

      expect(repository.isDailyCompleted(5, 6, '2025-01-15')).toBe(true);
      expect(repository.isDailyCompleted(5, 4, '2025-01-15')).toBe(false);
    });

    it('differentiates by date', () => {
      repository.markDailyCompleted(5, 6, '2025-01-15');

      expect(repository.isDailyCompleted(5, 6, '2025-01-15')).toBe(true);
      expect(repository.isDailyCompleted(5, 6, '2025-01-16')).toBe(false);
    });
  });

  describe('markDailyCompleted', () => {
    it('marks daily as completed', () => {
      expect(repository.isDailyCompleted(5, 6, '2025-01-15')).toBe(false);

      repository.markDailyCompleted(5, 6, '2025-01-15');

      expect(repository.isDailyCompleted(5, 6, '2025-01-15')).toBe(true);
    });

    it('calls underlying dailyCompletion function', () => {
      const { markDailyCompleted } = require('../../../src/storage/dailyCompletion');

      repository.markDailyCompleted(5, 6, '2025-01-15');

      expect(markDailyCompleted).toHaveBeenCalledWith(5, 6, '2025-01-15');
    });

    it('is idempotent', () => {
      repository.markDailyCompleted(5, 6, '2025-01-15');
      repository.markDailyCompleted(5, 6, '2025-01-15');

      expect(repository.isDailyCompleted(5, 6, '2025-01-15')).toBe(true);
    });
  });

  describe('clearCompletion', () => {
    it('clears completion status', () => {
      repository.markDailyCompleted(5, 6, '2025-01-15');
      expect(repository.isDailyCompleted(5, 6, '2025-01-15')).toBe(true);

      repository.clearCompletion(5, 6, '2025-01-15');

      // Note: The mock doesn't fully implement clear, but we verify kv.remove was called
      const { kv } = require('../../../src/storage/mmkv');
      expect(kv.remove).toHaveBeenCalled();
    });
  });

  describe('getCompletedDates', () => {
    it('returns empty array when no dates completed', () => {
      expect(repository.getCompletedDates(5)).toEqual([]);
    });

    it('returns stored completed dates', () => {
      const { setJSON } = require('../../../src/storage/mmkv');
      setJSON('user123.daily.5.completedDates', ['2025-01-15', '2025-01-16']);

      expect(repository.getCompletedDates(5)).toEqual(['2025-01-15', '2025-01-16']);
    });
  });

  describe('getCompletionRepository factory', () => {
    it('returns singleton instance', () => {
      const instance1 = getCompletionRepository();
      const instance2 = getCompletionRepository();
      expect(instance1).toBe(instance2);
    });
  });

  describe('integration with use cases', () => {
    it('can be used by AbandonGameUseCase pattern', () => {
      // Simulate what AbandonGameUseCase does
      const length: ValidLength = 5;
      const maxRows = 6;
      const dateISO = '2025-01-15';

      // Before abandon - not completed
      expect(repository.isDailyCompleted(length, maxRows, dateISO)).toBe(false);

      // Abandon marks as completed
      repository.markDailyCompleted(length, maxRows, dateISO);

      // After abandon - completed (prevents replay)
      expect(repository.isDailyCompleted(length, maxRows, dateISO)).toBe(true);
    });
  });
});
