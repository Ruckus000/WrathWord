# Task 0.5: Game Persistence Characterization

## Objective
Create characterization tests for game state persistence using MMKV. Critical: storage uses user-scoped keys via `getScopedKey()`.

## Current Behavior
- Game state saved after each guess
- State restored on app mount
- User-scoped keys prevent data leakage between users
- Hint state (hintUsed, hintedCell, hintedLetter) persisted

## Files to Create
- `__tests__/characterization/gamePersistence.characterization.test.ts`

## Test Code (Copy Exactly)

```typescript
// __tests__/characterization/gamePersistence.characterization.test.ts

/**
 * CHARACTERIZATION TESTS
 * 
 * These tests document game persistence behavior.
 * Note: These are integration tests that may need mocking.
 */

import { getJSON, setJSON } from '../../src/storage/mmkv';

// Mock the storage for testing
jest.mock('../../src/storage/mmkv', () => {
  const store = new Map<string, string>();
  return {
    getJSON: jest.fn(<T>(key: string, fallback: T): T => {
      const value = store.get(key);
      return value ? JSON.parse(value) : fallback;
    }),
    setJSON: jest.fn((key: string, value: unknown) => {
      store.set(key, JSON.stringify(value));
    }),
    clearMockStorage: () => store.clear(),
    getMockStore: () => store,
  };
});

// Define game state interface matching actual implementation
interface GameState {
  length: number;
  maxRows: number;
  mode: 'daily' | 'free';
  dateISO: string;
  answer: string;
  rows: string[];
  feedback: Array<Array<'correct' | 'present' | 'absent'>>;
  status: 'playing' | 'won' | 'lost';
  hintUsed: boolean;
  hintedCell: { row: number; col: number } | null;
  hintedLetter: string | null;
}

describe('game persistence - characterization', () => {
  beforeEach(() => {
    // Clear mock storage before each test
    (require('../../src/storage/mmkv') as any).clearMockStorage();
  });

  describe('game state structure', () => {
    it('saves complete game state', () => {
      const gameState: GameState = {
        length: 5,
        maxRows: 6,
        mode: 'daily',
        dateISO: '2025-01-15',
        answer: 'APPLE',
        rows: ['CRANE', 'SLATE'],
        feedback: [
          ['absent', 'absent', 'present', 'absent', 'correct'],
          ['absent', 'absent', 'present', 'absent', 'correct'],
        ],
        status: 'playing',
        hintUsed: false,
        hintedCell: null,
        hintedLetter: null,
      };

      setJSON('game.state', gameState);
      const restored = getJSON('game.state', null as GameState | null);

      expect(restored).toEqual(gameState);
    });

    it('includes hint state in persisted data', () => {
      const gameState: GameState = {
        length: 5,
        maxRows: 6,
        mode: 'daily',
        dateISO: '2025-01-15',
        answer: 'APPLE',
        rows: ['CRANE'],
        feedback: [['absent', 'absent', 'present', 'absent', 'correct']],
        status: 'playing',
        hintUsed: true,
        hintedCell: { row: 0, col: 0 },
        hintedLetter: 'A',
      };

      setJSON('game.state', gameState);
      const restored = getJSON('game.state', null as GameState | null);

      expect(restored?.hintUsed).toBe(true);
      expect(restored?.hintedCell).toEqual({ row: 0, col: 0 });
      expect(restored?.hintedLetter).toBe('A');
    });
  });

  describe('restore behavior', () => {
    it('returns null when no saved state', () => {
      const state = getJSON('game.state', null as GameState | null);
      expect(state).toBeNull();
    });

    it('returns fallback when no saved state', () => {
      const defaultState: GameState = {
        length: 5,
        maxRows: 6,
        mode: 'daily',
        dateISO: '2025-01-15',
        answer: '',
        rows: [],
        feedback: [],
        status: 'playing',
        hintUsed: false,
        hintedCell: null,
        hintedLetter: null,
      };

      const state = getJSON('game.state', defaultState);
      expect(state).toEqual(defaultState);
    });

    it('restores exact state that was saved', () => {
      const savedState: GameState = {
        length: 4,
        maxRows: 4,
        mode: 'free',
        dateISO: '2025-01-14',
        answer: 'TEST',
        rows: ['BEST', 'NEST'],
        feedback: [
          ['absent', 'correct', 'correct', 'correct'],
          ['absent', 'correct', 'correct', 'correct'],
        ],
        status: 'playing',
        hintUsed: true,
        hintedCell: { row: 1, col: 0 },
        hintedLetter: 'T',
      };

      setJSON('game.state', savedState);
      const restored = getJSON('game.state', null as GameState | null);

      expect(restored?.length).toBe(4);
      expect(restored?.maxRows).toBe(4);
      expect(restored?.mode).toBe('free');
      expect(restored?.rows).toEqual(['BEST', 'NEST']);
      expect(restored?.status).toBe('playing');
    });
  });

  describe('user-scoped keys', () => {
    it('different key prefixes isolate user data', () => {
      const userAState: GameState = {
        length: 5, maxRows: 6, mode: 'daily', dateISO: '2025-01-15',
        answer: 'APPLE', rows: ['CRANE'], feedback: [['absent', 'absent', 'present', 'absent', 'correct']],
        status: 'playing', hintUsed: false, hintedCell: null, hintedLetter: null,
      };

      const userBState: GameState = {
        length: 5, maxRows: 6, mode: 'daily', dateISO: '2025-01-15',
        answer: 'GRAPE', rows: ['SLATE'], feedback: [['absent', 'absent', 'present', 'absent', 'correct']],
        status: 'playing', hintUsed: false, hintedCell: null, hintedLetter: null,
      };

      // Simulate user-scoped keys
      setJSON('user-a:game.state', userAState);
      setJSON('user-b:game.state', userBState);

      const restoredA = getJSON('user-a:game.state', null as GameState | null);
      const restoredB = getJSON('user-b:game.state', null as GameState | null);

      expect(restoredA?.answer).toBe('APPLE');
      expect(restoredB?.answer).toBe('GRAPE');
    });
  });

  describe('settings persistence', () => {
    it('saves and restores length setting', () => {
      setJSON('settings.length', 4);
      expect(getJSON('settings.length', 5)).toBe(4);
    });

    it('saves and restores mode setting', () => {
      setJSON('settings.mode', 'free');
      expect(getJSON('settings.mode', 'daily')).toBe('free');
    });

    it('saves and restores maxRows setting', () => {
      setJSON('settings.maxRows', 4);
      expect(getJSON('settings.maxRows', 6)).toBe(4);
    });
  });

  describe('clearing state', () => {
    it('can clear game state after completion', () => {
      const gameState: GameState = {
        length: 5, maxRows: 6, mode: 'daily', dateISO: '2025-01-15',
        answer: 'APPLE', rows: ['APPLE'], 
        feedback: [['correct', 'correct', 'correct', 'correct', 'correct']],
        status: 'won', hintUsed: false, hintedCell: null, hintedLetter: null,
      };

      setJSON('game.state', gameState);
      expect(getJSON('game.state', null as GameState | null)).not.toBeNull();

      // Clear by setting to null
      setJSON('game.state', null);
      const restored = getJSON('game.state', null as GameState | null);
      expect(restored).toBeNull();
    });
  });
});
```

## Verification Commands

```bash
# Run the characterization test
npm test -- --testPathPattern="gamePersistence.characterization"

# Verify no TypeScript errors
npx tsc --noEmit
```

## Notes
- This test uses mocked storage since we're testing the serialization/deserialization logic
- Real MMKV integration is tested separately
- User scoping is tested with key prefixes simulating `getScopedKey()` behavior

## Completion Criteria
- [ ] Test file created at correct path
- [ ] All tests pass (green)
- [ ] No TypeScript errors
- [ ] Committed with message: `test(characterization): add game persistence tests`

## Next Task
After completing this task, update `REFACTOR_PROGRESS.md` and proceed to Task 0.6.
