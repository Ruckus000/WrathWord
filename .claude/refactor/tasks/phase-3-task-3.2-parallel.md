# Task 3.2: MMKVGameRepository Implementation (PARALLEL)

## Agent Assignment
This task can run in parallel with Tasks 3.1, 3.3, and 3.4.

## Objective
Implement `IGameRepository` interface using MMKV with user-scoped keys.

## Files to Create
- `src/infrastructure/persistence/MMKVGameRepository.ts`
- `__tests__/infrastructure/persistence/MMKVGameRepository.test.ts`

## Interface to Implement
```typescript
// From src/domain/game/repositories/IGameRepository.ts
export interface PersistedGameState {
  length: ValidLength;
  maxRows: number;
  mode: GameMode;
  dateISO: string;
  answer: string;
  rows: string[];
  feedback: TileStateValue[][];
  status: 'playing' | 'won' | 'lost';
  hintUsed: boolean;
  hintedCell: { row: number; col: number } | null;
  hintedLetter: string | null;
}

export interface IGameRepository {
  save(state: PersistedGameState): void;
  load(): PersistedGameState | null;
  clear(): void;
  hasSavedGame(): boolean;
}
```

## Existing Utilities to Use
```typescript
import { getJSON, setJSON, kv } from '../../storage/mmkv';
import { getScopedKey } from '../../storage/userScope';
```

## Implementation

```typescript
// src/infrastructure/persistence/MMKVGameRepository.ts

import { IGameRepository, PersistedGameState } from '../../domain/game/repositories/IGameRepository';
import { getJSON, setJSON, kv } from '../../storage/mmkv';
import { getScopedKey } from '../../storage/userScope';

const GAME_STATE_KEY = 'game.state';

/**
 * MMKVGameRepository implements IGameRepository using MMKV storage.
 * Uses user-scoped keys to isolate data between users.
 */
export class MMKVGameRepository implements IGameRepository {
  /**
   * Get the storage key, scoped to current user if logged in.
   */
  private getKey(): string {
    return getScopedKey(GAME_STATE_KEY) ?? GAME_STATE_KEY;
  }

  /**
   * Save game state to MMKV.
   */
  save(state: PersistedGameState): void {
    const key = this.getKey();
    setJSON(key, state);
  }

  /**
   * Load game state from MMKV.
   * Returns null if no state exists or if data is corrupted.
   */
  load(): PersistedGameState | null {
    const key = this.getKey();
    try {
      const state = getJSON<PersistedGameState | null>(key, null);
      
      // Validate essential fields exist
      if (state && this.isValidState(state)) {
        return state;
      }
      return null;
    } catch {
      // Handle corrupted data gracefully
      return null;
    }
  }

  /**
   * Clear saved game state.
   */
  clear(): void {
    const key = this.getKey();
    kv.delete(key);
  }

  /**
   * Check if there's a saved game.
   */
  hasSavedGame(): boolean {
    return this.load() !== null;
  }

  /**
   * Validate that state has all required fields.
   */
  private isValidState(state: unknown): state is PersistedGameState {
    if (!state || typeof state !== 'object') {
      return false;
    }

    const s = state as Record<string, unknown>;

    return (
      typeof s.length === 'number' &&
      typeof s.maxRows === 'number' &&
      typeof s.mode === 'string' &&
      typeof s.dateISO === 'string' &&
      typeof s.answer === 'string' &&
      Array.isArray(s.rows) &&
      Array.isArray(s.feedback) &&
      typeof s.status === 'string' &&
      typeof s.hintUsed === 'boolean'
    );
  }
}

/**
 * Factory function following project pattern.
 */
let instance: MMKVGameRepository | null = null;

export function getGameRepository(): IGameRepository {
  if (!instance) {
    instance = new MMKVGameRepository();
  }
  return instance;
}
```

## Test File

```typescript
// __tests__/infrastructure/persistence/MMKVGameRepository.test.ts

import { MMKVGameRepository, getGameRepository } from '../../../src/infrastructure/persistence/MMKVGameRepository';
import { PersistedGameState } from '../../../src/domain/game/repositories/IGameRepository';
import { TileStateValue } from '../../../src/domain/game/value-objects/TileState';

// Mock MMKV
jest.mock('../../../src/storage/mmkv', () => {
  const store = new Map<string, string>();
  return {
    kv: {
      delete: jest.fn((key: string) => store.delete(key)),
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
      // Manually set invalid JSON
      const { kv } = require('../../../src/storage/mmkv');
      kv.set('user123.game.state', 'not-valid-json{{{');

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
```

## Verification

```bash
# Create directory
mkdir -p src/infrastructure/persistence
mkdir -p __tests__/infrastructure/persistence

# Run tests
npm test -- --testPathPattern="MMKVGameRepository"

# Type check
npx tsc --noEmit
```

## Completion Criteria
- [ ] `MMKVGameRepository` class implements `IGameRepository`
- [ ] Uses `getScopedKey()` for user isolation
- [ ] Validates state on load (handles corrupted data)
- [ ] Factory function `getGameRepository()` returns singleton
- [ ] All tests pass
- [ ] No TypeScript errors

## Commit Message
```
feat(infrastructure): add MMKVGameRepository implementing IGameRepository
```
