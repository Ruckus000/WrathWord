// __tests__/infrastructure/persistence/MMKVGameRepository.test.ts

import { MMKVGameRepository, getGameRepository } from '../../../src/infrastructure/persistence/MMKVGameRepository';
import { PersistedGameState } from '../../../src/domain/game/repositories/IGameRepository';
import { TileStateValue } from '../../../src/domain/game/value-objects/TileState';

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
    __getStore: () => store,
  };
});

// Mock userScope
jest.mock('../../../src/storage/userScope', () => ({
  getScopedKey: jest.fn((baseKey: string) => `user123.${baseKey}`),
}));

describe('MMKVGameRepository', () => {
  let repository: MMKVGameRepository;

  const validGameState: PersistedGameState = {
    length: 5,
    maxRows: 6,
    mode: 'daily',
    dateISO: '2025-01-15',
    answer: 'HELLO',
    rows: ['CRANE', 'SLATE'],
    feedback: [
      ['absent', 'absent', 'absent', 'absent', 'present'] as TileStateValue[],
      ['absent', 'absent', 'absent', 'absent', 'present'] as TileStateValue[],
    ],
    status: 'playing',
    hintUsed: false,
    hintedCell: null,
    hintedLetter: null,
  };

  beforeEach(() => {
    // Clear mock storage
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (require('../../../src/storage/mmkv') as any).__clearStore();
    repository = new MMKVGameRepository();
  });

  describe('save', () => {
    it('saves game state to MMKV', () => {
      repository.save(validGameState);

      const loaded = repository.load();
      expect(loaded).toEqual(validGameState);
    });

    it('overwrites previous state', () => {
      repository.save(validGameState);

      const newState = { ...validGameState, rows: ['CRANE', 'SLATE', 'TRACE'] };
      repository.save(newState);

      const loaded = repository.load();
      expect(loaded?.rows).toEqual(['CRANE', 'SLATE', 'TRACE']);
    });
  });

  describe('load', () => {
    it('returns null when no state saved', () => {
      expect(repository.load()).toBeNull();
    });

    it('returns saved state', () => {
      repository.save(validGameState);
      expect(repository.load()).toEqual(validGameState);
    });

    it('returns null for corrupted data', () => {
      // The getJSON mock will throw, and load should return null
      const mockGetJSON = require('../../../src/storage/mmkv').getJSON;
      mockGetJSON.mockImplementationOnce(() => {
        throw new Error('Invalid JSON');
      });

      expect(repository.load()).toBeNull();
    });

    it('validates state has required fields', () => {
      const { setJSON } = require('../../../src/storage/mmkv');

      // Save incomplete state directly
      setJSON('user123.game.state', { length: 5 }); // Missing required fields

      expect(repository.load()).toBeNull();
    });
  });

  describe('clear', () => {
    it('removes saved state', () => {
      repository.save(validGameState);
      expect(repository.hasSavedGame()).toBe(true);

      repository.clear();
      expect(repository.hasSavedGame()).toBe(false);
      expect(repository.load()).toBeNull();
    });

    it('succeeds even when no state exists', () => {
      expect(() => repository.clear()).not.toThrow();
    });
  });

  describe('hasSavedGame', () => {
    it('returns false when no state saved', () => {
      expect(repository.hasSavedGame()).toBe(false);
    });

    it('returns true when state is saved', () => {
      repository.save(validGameState);
      expect(repository.hasSavedGame()).toBe(true);
    });

    it('returns false after clear', () => {
      repository.save(validGameState);
      repository.clear();
      expect(repository.hasSavedGame()).toBe(false);
    });
  });

  describe('user scoping', () => {
    it('uses scoped key from userScope', () => {
      const { getScopedKey } = require('../../../src/storage/userScope');

      repository.save(validGameState);

      expect(getScopedKey).toHaveBeenCalledWith('game.state');
    });
  });

  describe('state with hint', () => {
    it('persists hint state correctly', () => {
      const stateWithHint: PersistedGameState = {
        ...validGameState,
        hintUsed: true,
        hintedCell: { row: 0, col: 2 },
        hintedLetter: 'L',
      };

      repository.save(stateWithHint);
      const loaded = repository.load();

      expect(loaded?.hintUsed).toBe(true);
      expect(loaded?.hintedCell).toEqual({ row: 0, col: 2 });
      expect(loaded?.hintedLetter).toBe('L');
    });
  });

  describe('getGameRepository factory', () => {
    it('returns singleton instance', () => {
      const instance1 = getGameRepository();
      const instance2 = getGameRepository();
      expect(instance1).toBe(instance2);
    });
  });
});
