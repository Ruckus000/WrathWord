# Task 1.1: TileState Value Object

## Objective
Create the TileState value object with comparison and precedence logic.

## Prerequisites
- ✅ Phase 0 characterization tests all passing

## Files to Create
- `src/domain/game/value-objects/TileState.ts`
- `__tests__/domain/game/value-objects/TileState.test.ts`

## Step 1: Create Directory Structure
```bash
mkdir -p src/domain/game/value-objects
mkdir -p __tests__/domain/game/value-objects
```

## Step 2: Write Tests First

```typescript
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
      expect(TileState.isValid(null as any)).toBe(false);
      expect(TileState.isValid(undefined as any)).toBe(false);
    });
  });
});
```

## Step 3: Run Tests (Should Fail)
```bash
npm test -- --testPathPattern="TileState.test"
```

## Step 4: Implement

```typescript
// src/domain/game/value-objects/TileState.ts

/**
 * TileState represents the evaluation result for a single letter position.
 * 
 * Precedence: correct > present > absent
 * This is used for keyboard state tracking where states only upgrade, never downgrade.
 */
export type TileStateValue = 'correct' | 'present' | 'absent';

const VALID_STATES: readonly TileStateValue[] = ['correct', 'present', 'absent'];

export const TileState = {
  /**
   * Precedence values for comparison.
   * Higher number = higher precedence.
   */
  PRECEDENCE: {
    absent: 0,
    present: 1,
    correct: 2,
  } as const,

  /**
   * Compare two tile states by precedence.
   * Returns positive if a > b, negative if a < b, zero if equal.
   */
  compare(a: TileStateValue, b: TileStateValue): number {
    return this.PRECEDENCE[a] - this.PRECEDENCE[b];
  },

  /**
   * Return the higher precedence state.
   * Used for keyboard state tracking.
   */
  max(a: TileStateValue, b: TileStateValue): TileStateValue {
    return this.compare(a, b) >= 0 ? a : b;
  },

  /**
   * Check if a value is a valid TileState.
   */
  isValid(value: unknown): value is TileStateValue {
    return typeof value === 'string' && VALID_STATES.includes(value as TileStateValue);
  },
} as const;
```

## Step 5: Run Tests (Should Pass)
```bash
npm test -- --testPathPattern="TileState.test"
```

## Step 6: Verify No Regressions
```bash
# Run all characterization tests
npm test -- --testPathPattern="characterization"

# Run full test suite
npm test

# Type check
npx tsc --noEmit
```

## Step 7: Commit
```bash
git add .
git commit -m "feat(domain): add TileState value object

- Add TileStateValue type (correct | present | absent)
- Add PRECEDENCE constants for comparison
- Add compare() for precedence checking
- Add max() for keyboard state tracking
- Add isValid() for runtime validation
- 100% test coverage"
```

## Completion Criteria
- [ ] Test file created and all tests pass
- [ ] Implementation file created
- [ ] All characterization tests still pass
- [ ] No TypeScript errors
- [ ] Changes committed

## Next Task
Update `REFACTOR_PROGRESS.md`:
- Mark Task 1.1 as ✅ Complete
- Update Current Task to 1.2
- Add completion date

Then proceed to Task 1.2 (Feedback value object).
