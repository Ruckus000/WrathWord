# Task 0.2: selectDaily Characterization Tests

## Objective
Create characterization tests for `selectDaily()`. CRITICAL: The function signature includes `maxRows` which affects word selection.

## Current Signature (VERIFY THIS)
```typescript
// src/logic/selectDaily.ts
export function selectDaily(
  len: number,
  maxRows: number,  // CRITICAL: This affects the seed
  dateISO: string,
  answers: string[]
): string
```

## Files to Create
- `__tests__/characterization/selectDaily.characterization.test.ts`

## Test Code (Copy Exactly)

```typescript
// __tests__/characterization/selectDaily.characterization.test.ts

import { selectDaily, seededIndex } from '../../src/logic/selectDaily';

/**
 * CHARACTERIZATION TESTS
 * 
 * These tests document the CURRENT behavior of selectDaily.
 * CRITICAL: maxRows is part of the seed calculation.
 */
describe('selectDaily - characterization', () => {
  const testWords = ['apple', 'grape', 'lemon', 'melon', 'peach', 'mango', 'berry', 'cherry', 'plum', 'kiwi'];

  describe('determinism', () => {
    it('returns same word for identical inputs', () => {
      const word1 = selectDaily(5, 6, '2025-01-15', testWords);
      const word2 = selectDaily(5, 6, '2025-01-15', testWords);
      expect(word1).toBe(word2);
    });

    it('is deterministic across multiple calls', () => {
      const results: string[] = [];
      for (let i = 0; i < 10; i++) {
        results.push(selectDaily(5, 6, '2025-01-15', testWords));
      }
      // All results should be the same
      expect(new Set(results).size).toBe(1);
    });
  });

  describe('variation by date', () => {
    it('returns different word for different dates', () => {
      const word1 = selectDaily(5, 6, '2025-01-15', testWords);
      const word2 = selectDaily(5, 6, '2025-01-16', testWords);
      expect(word1).not.toBe(word2);
    });

    it('cycles through words over many dates', () => {
      const words = new Set<string>();
      for (let day = 1; day <= 30; day++) {
        const dateISO = `2025-01-${String(day).padStart(2, '0')}`;
        words.add(selectDaily(5, 6, dateISO, testWords));
      }
      // Should hit multiple different words over 30 days
      expect(words.size).toBeGreaterThan(1);
    });
  });

  describe('variation by maxRows - CRITICAL', () => {
    it('returns different word for different maxRows on same date', () => {
      // This is CRITICAL - different puzzle configurations get different words
      const word6Rows = selectDaily(5, 6, '2025-01-15', testWords);
      const word4Rows = selectDaily(5, 4, '2025-01-15', testWords);
      expect(word6Rows).not.toBe(word4Rows);
    });

    it('maxRows affects seed calculation', () => {
      // Verify multiple maxRows values produce different results
      const words = new Set<string>();
      for (let rows = 1; rows <= 10; rows++) {
        words.add(selectDaily(5, rows, '2025-01-15', testWords));
      }
      // Should have some variation (not all same word)
      expect(words.size).toBeGreaterThan(1);
    });
  });

  describe('variation by length', () => {
    it('returns different word for different lengths on same date', () => {
      const word5 = selectDaily(5, 6, '2025-01-15', testWords);
      const word4 = selectDaily(4, 6, '2025-01-15', testWords);
      expect(word5).not.toBe(word4);
    });
  });

  describe('index bounds', () => {
    it('always returns a word from the input array', () => {
      // Test many dates to ensure index is always valid
      for (let month = 1; month <= 12; month++) {
        for (let day = 1; day <= 28; day++) {
          const dateISO = `2025-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const word = selectDaily(5, 6, dateISO, testWords);
          expect(testWords).toContain(word);
        }
      }
    });

    it('handles small word lists', () => {
      const smallList = ['only', 'two'];
      const word = selectDaily(4, 6, '2025-01-15', smallList);
      expect(smallList).toContain(word);
    });

    it('handles single word list', () => {
      const singleWord = ['alone'];
      const word = selectDaily(5, 6, '2025-01-15', singleWord);
      expect(word).toBe('alone');
    });
  });

  describe('seededIndex helper', () => {
    it('produces consistent results for same seed', () => {
      const idx1 = seededIndex('test-seed', 100);
      const idx2 = seededIndex('test-seed', 100);
      expect(idx1).toBe(idx2);
    });

    it('produces different results for different seeds', () => {
      const idx1 = seededIndex('seed-a', 100);
      const idx2 = seededIndex('seed-b', 100);
      expect(idx1).not.toBe(idx2);
    });

    it('respects max bound', () => {
      for (let i = 0; i < 100; i++) {
        const idx = seededIndex(`test-${i}`, 10);
        expect(idx).toBeGreaterThanOrEqual(0);
        expect(idx).toBeLessThan(10);
      }
    });
  });
});
```

## Verification Commands

```bash
# Run the characterization test
npm test -- --testPathPattern="selectDaily.characterization"

# Verify no TypeScript errors
npx tsc --noEmit
```

## Expected Result
All tests should PASS - they're documenting existing behavior.

## Completion Criteria
- [ ] Test file created at correct path
- [ ] All tests pass (green)
- [ ] Verified that maxRows affects word selection
- [ ] No TypeScript errors
- [ ] Committed with message: `test(characterization): add selectDaily behavior tests`

## Next Task
After completing this task, update `REFACTOR_PROGRESS.md` and proceed to Task 0.3.
