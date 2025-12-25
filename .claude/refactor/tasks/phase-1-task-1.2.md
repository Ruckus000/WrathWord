# Task 1.2: Feedback Value Object

## Objective
Create the Feedback value object that encapsulates a row of tile states.

## Prerequisites
- ✅ Task 1.1 (TileState) complete

## Files to Create
- `src/domain/game/value-objects/Feedback.ts`
- `__tests__/domain/game/value-objects/Feedback.test.ts`

## Step 1: Write Tests First

```typescript
// __tests__/domain/game/value-objects/Feedback.test.ts

import { Feedback } from '../../../../src/domain/game/value-objects/Feedback';
import { TileStateValue } from '../../../../src/domain/game/value-objects/TileState';

describe('Feedback', () => {
  describe('creation', () => {
    it('creates from tile states array', () => {
      const states: TileStateValue[] = ['correct', 'present', 'absent'];
      const feedback = Feedback.from(states);
      expect(feedback.states).toEqual(states);
    });

    it('creates defensive copy of input array', () => {
      const states: TileStateValue[] = ['correct', 'present', 'absent'];
      const feedback = Feedback.from(states);
      states[0] = 'absent'; // Mutate original
      expect(feedback.states[0]).toBe('correct'); // Feedback unchanged
    });

    it('returns defensive copy from states getter', () => {
      const feedback = Feedback.from(['correct', 'present', 'absent']);
      const states1 = feedback.states;
      const states2 = feedback.states;
      expect(states1).not.toBe(states2); // Different instances
      expect(states1).toEqual(states2); // Same content
    });

    it('is immutable', () => {
      const feedback = Feedback.from(['correct', 'present', 'absent']);
      expect(Object.isFrozen(feedback)).toBe(true);
    });
  });

  describe('length', () => {
    it('returns number of states', () => {
      expect(Feedback.from(['correct', 'present', 'absent']).length).toBe(3);
      expect(Feedback.from(['correct', 'correct', 'correct', 'correct']).length).toBe(4);
      expect(Feedback.from(['absent', 'absent', 'absent', 'absent', 'absent']).length).toBe(5);
    });
  });

  describe('isWin', () => {
    it('returns true when all states are correct', () => {
      expect(Feedback.from(['correct', 'correct', 'correct']).isWin()).toBe(true);
      expect(Feedback.from(['correct', 'correct', 'correct', 'correct', 'correct']).isWin()).toBe(true);
    });

    it('returns false when any state is present', () => {
      expect(Feedback.from(['correct', 'present', 'correct']).isWin()).toBe(false);
    });

    it('returns false when any state is absent', () => {
      expect(Feedback.from(['correct', 'absent', 'correct']).isWin()).toBe(false);
    });

    it('returns false when all states are absent', () => {
      expect(Feedback.from(['absent', 'absent', 'absent']).isWin()).toBe(false);
    });

    it('returns false when mixed states', () => {
      expect(Feedback.from(['correct', 'present', 'absent', 'correct', 'present']).isWin()).toBe(false);
    });
  });

  describe('toShareEmoji', () => {
    it('maps correct to green square', () => {
      expect(Feedback.from(['correct']).toShareEmoji()).toBe('🟩');
    });

    it('maps present to yellow square', () => {
      expect(Feedback.from(['present']).toShareEmoji()).toBe('🟨');
    });

    it('maps absent to black square', () => {
      expect(Feedback.from(['absent']).toShareEmoji()).toBe('⬛');
    });

    it('generates correct sequence for mixed feedback', () => {
      expect(Feedback.from(['correct', 'present', 'absent', 'correct', 'present']).toShareEmoji())
        .toBe('🟩🟨⬛🟩🟨');
    });

    it('generates all green for win', () => {
      expect(Feedback.from(['correct', 'correct', 'correct', 'correct', 'correct']).toShareEmoji())
        .toBe('🟩🟩🟩🟩🟩');
    });
  });

  describe('at', () => {
    it('returns state at index', () => {
      const feedback = Feedback.from(['correct', 'present', 'absent']);
      expect(feedback.at(0)).toBe('correct');
      expect(feedback.at(1)).toBe('present');
      expect(feedback.at(2)).toBe('absent');
    });

    it('returns undefined for out of bounds index', () => {
      const feedback = Feedback.from(['correct', 'present', 'absent']);
      expect(feedback.at(3)).toBeUndefined();
      expect(feedback.at(-1)).toBeUndefined();
    });
  });

  describe('countByState', () => {
    it('counts correct states', () => {
      expect(Feedback.from(['correct', 'correct', 'absent', 'present', 'correct']).countByState('correct')).toBe(3);
    });

    it('counts present states', () => {
      expect(Feedback.from(['correct', 'present', 'absent', 'present', 'correct']).countByState('present')).toBe(2);
    });

    it('counts absent states', () => {
      expect(Feedback.from(['absent', 'absent', 'absent', 'present', 'correct']).countByState('absent')).toBe(3);
    });

    it('returns 0 when state not present', () => {
      expect(Feedback.from(['correct', 'correct', 'correct']).countByState('absent')).toBe(0);
    });
  });
});
```

## Step 2: Run Tests (Should Fail)
```bash
npm test -- --testPathPattern="Feedback.test"
```

## Step 3: Implement

```typescript
// src/domain/game/value-objects/Feedback.ts

import { TileStateValue } from './TileState';

const EMOJI_MAP: Record<TileStateValue, string> = {
  correct: '🟩',
  present: '🟨',
  absent: '⬛',
};

/**
 * Feedback represents the evaluation result for a complete guess.
 * Immutable value object containing tile states for each position.
 */
export class Feedback {
  private readonly _states: readonly TileStateValue[];

  private constructor(states: TileStateValue[]) {
    this._states = Object.freeze([...states]);
    Object.freeze(this);
  }

  /**
   * Create a Feedback from an array of tile states.
   * Creates a defensive copy of the input array.
   */
  static from(states: TileStateValue[]): Feedback {
    return new Feedback(states);
  }

  /**
   * Get all tile states (returns defensive copy).
   */
  get states(): TileStateValue[] {
    return [...this._states];
  }

  /**
   * Get the number of positions.
   */
  get length(): number {
    return this._states.length;
  }

  /**
   * Get state at specific index.
   */
  at(index: number): TileStateValue | undefined {
    if (index < 0 || index >= this._states.length) {
      return undefined;
    }
    return this._states[index];
  }

  /**
   * Check if this feedback represents a win (all correct).
   */
  isWin(): boolean {
    return this._states.every(state => state === 'correct');
  }

  /**
   * Convert to emoji string for sharing.
   */
  toShareEmoji(): string {
    return this._states.map(state => EMOJI_MAP[state]).join('');
  }

  /**
   * Count occurrences of a specific state.
   */
  countByState(state: TileStateValue): number {
    return this._states.filter(s => s === state).length;
  }
}
```

## Step 4: Run Tests (Should Pass)
```bash
npm test -- --testPathPattern="Feedback.test"
```

## Step 5: Verify No Regressions
```bash
npm test -- --testPathPattern="characterization"
npm test
npx tsc --noEmit
```

## Step 6: Commit
```bash
git add .
git commit -m "feat(domain): add Feedback value object

- Immutable container for tile states array
- isWin() detects all-correct feedback
- toShareEmoji() for share text generation
- at() and countByState() helpers
- Defensive copying prevents mutation
- 100% test coverage"
```

## Completion Criteria
- [ ] All tests pass
- [ ] Characterization tests still pass
- [ ] No TypeScript errors
- [ ] Changes committed

## Next Task
Update `REFACTOR_PROGRESS.md` and proceed to Task 1.3 (GameConfig).
