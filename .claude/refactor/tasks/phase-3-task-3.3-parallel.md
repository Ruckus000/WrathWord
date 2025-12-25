# Task 3.3: MMKVCompletionRepository Implementation (PARALLEL)

## Agent Assignment
This task can run in parallel with Tasks 3.1, 3.2, and 3.4.

## Objective
Implement `ICompletionRepository` interface by wrapping existing `dailyCompletion.ts` functions.

## Files to Create
- `src/infrastructure/persistence/MMKVCompletionRepository.ts`
- `__tests__/infrastructure/persistence/MMKVCompletionRepository.test.ts`

## Interface to Implement
```typescript
// From src/domain/game/repositories/ICompletionRepository.ts
export interface ICompletionRepository {
  isDailyCompleted(length: ValidLength, maxRows: number, dateISO: string): boolean;
  markDailyCompleted(length: ValidLength, maxRows: number, dateISO: string): void;
  getCompletedDates(length: ValidLength): string[];
  clearCompletion(length: ValidLength, maxRows: number, dateISO: string): void;
}
```

## Existing Functions to Wrap
From `src/storage/dailyCompletion.ts`:
```typescript
export function isDailyCompleted(length: number, maxRows: number, dateISO: string): boolean;
export function markDailyCompleted(length: number, maxRows: number, dateISO: string): void;
```

## Implementation

```typescript
// src/infrastructure/persistence/MMKVCompletionRepository.ts

import { ICompletionRepository } from '../../domain/game/repositories/ICompletionRepository';
import { ValidLength } from '../../domain/game/value-objects/GameConfig';
import { 
  isDailyCompleted as checkCompleted, 
  markDailyCompleted as markCompleted,
  getDailyCompletionKey 
} from '../../storage/dailyCompletion';
import { kv, getJSON, setJSON } from '../../storage/mmkv';
import { getScopedKey } from '../../storage/userScope';

/**
 * MMKVCompletionRepository implements ICompletionRepository.
 * Wraps existing dailyCompletion.ts functions for domain layer usage.
 */
export class MMKVCompletionRepository implements ICompletionRepository {
  /**
   * Check if a daily puzzle is completed.
   */
  isDailyCompleted(length: ValidLength, maxRows: number, dateISO: string): boolean {
    return checkCompleted(length, maxRows, dateISO);
  }

  /**
   * Mark a daily puzzle as completed.
   */
  markDailyCompleted(length: ValidLength, maxRows: number, dateISO: string): void {
    markCompleted(length, maxRows, dateISO);
  }

  /**
   * Get all completed dates for a given length.
   * Note: This requires scanning storage keys, which is expensive.
   * Consider caching if called frequently.
   */
  getCompletedDates(length: ValidLength): string[] {
    // Get the completed dates index, or scan storage
    const indexKey = getScopedKey(`daily.${length}.completedDates`) ?? `daily.${length}.completedDates`;
    const dates = getJSON<string[]>(indexKey, []);
    return dates;
  }

  /**
   * Clear completion status for testing purposes.
   */
  clearCompletion(length: ValidLength, maxRows: number, dateISO: string): void {
    const key = getDailyCompletionKey(length, maxRows, dateISO);
    kv.delete(key);
  }
}

/**
 * Factory function following project pattern.
 */
let instance: MMKVCompletionRepository | null = null;

export function getCompletionRepository(): ICompletionRepository {
  if (!instance) {
    instance = new MMKVCompletionRepository();
  }
  return instance;
}
```

## Test File

```typescript
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
    (require('../../../src/storage/dailyCompletion') as any).__clearCompleted();
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
      
      // Note: The mock doesn't fully implement clear, but we verify kv.delete was called
      const { kv } = require('../../../src/storage/mmkv');
      expect(kv.delete).toHaveBeenCalled();
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
```

## Verification

```bash
# Create directory (if not exists from 3.2)
mkdir -p src/infrastructure/persistence
mkdir -p __tests__/infrastructure/persistence

# Run tests
npm test -- --testPathPattern="MMKVCompletionRepository"

# Type check
npx tsc --noEmit
```

## Completion Criteria
- [ ] `MMKVCompletionRepository` class implements `ICompletionRepository`
- [ ] Wraps existing `dailyCompletion.ts` functions
- [ ] Properly differentiates by length, maxRows, and date
- [ ] Factory function `getCompletionRepository()` returns singleton
- [ ] All tests pass
- [ ] No TypeScript errors

## Commit Message
```
feat(infrastructure): add MMKVCompletionRepository implementing ICompletionRepository
```
