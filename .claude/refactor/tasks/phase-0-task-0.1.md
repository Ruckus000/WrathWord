# Task 0.1: evaluateGuess Characterization Tests

## Objective
Create characterization tests that document the CURRENT behavior of `evaluateGuess()`. These tests will protect against regressions during refactoring.

## Files to Create
- `__tests__/characterization/evaluateGuess.characterization.test.ts`

## Test Code (Copy Exactly)

```typescript
// __tests__/characterization/evaluateGuess.characterization.test.ts

import { evaluateGuess, TileState } from '../../src/logic/evaluateGuess';

/**
 * CHARACTERIZATION TESTS
 * 
 * These tests document the CURRENT behavior of evaluateGuess.
 * They were written BEFORE refactoring to ensure behavior is preserved.
 * 
 * If a test fails after refactoring:
 * 1. The refactoring broke something (fix the code), OR
 * 2. The old behavior was a bug (update test with justification comment)
 */
describe('evaluateGuess - characterization', () => {
  describe('exact matches', () => {
    it('marks all positions correct when guess matches answer', () => {
      expect(evaluateGuess('apple', 'apple')).toEqual([
        'correct', 'correct', 'correct', 'correct', 'correct'
      ]);
    });

    it('marks all positions absent when no letters match', () => {
      expect(evaluateGuess('apple', 'truth')).toEqual([
        'absent', 'absent', 'absent', 'absent', 'absent'
      ]);
    });
  });

  describe('duplicate letter handling', () => {
    it('handles duplicate in guess, single in answer - LEVER vs HELLO', () => {
      // Answer: LEVER, Guess: HELLO
      // H=absent (not in LEVER)
      // E=present (E is in LEVER at position 1, not position 1 of guess)
      // L=correct (L at position 2 matches)
      // L=absent (only one L in LEVER, already used by correct match)
      // O=absent (not in LEVER)
      expect(evaluateGuess('lever', 'hello')).toEqual([
        'absent', 'present', 'correct', 'absent', 'absent'
      ]);
    });

    it('handles duplicate in answer, duplicate in guess - LLAMA vs HELLO', () => {
      // Answer: LLAMA, Guess: HELLO
      // H=absent (not in LLAMA)
      // E=absent (not in LLAMA)
      // L=present (L is in LLAMA, but not at position 2)
      // L=present (second L, LLAMA has 2 L's)
      // O=absent (not in LLAMA)
      expect(evaluateGuess('llama', 'hello')).toEqual([
        'absent', 'absent', 'present', 'present', 'absent'
      ]);
    });

    it('prioritizes correct over present - ABBEY vs BABES', () => {
      // Answer: ABBEY, Guess: BABES
      // B=present (B is at position 2 in ABBEY, not 0)
      // A=present (A is at position 0 in ABBEY, not 1)
      // B=correct (B matches at position 2)
      // E=correct (E matches at position 3)
      // S=absent (not in ABBEY)
      expect(evaluateGuess('abbey', 'babes')).toEqual([
        'present', 'present', 'correct', 'correct', 'absent'
      ]);
    });

    it('handles triple letters - answer has 1, guess has 3', () => {
      // Answer: ABCDE, Guess: AAAAA
      // Only first A is correct, rest are absent (only 1 A in answer)
      expect(evaluateGuess('abcde', 'aaaaa')).toEqual([
        'correct', 'absent', 'absent', 'absent', 'absent'
      ]);
    });
  });

  describe('case insensitivity', () => {
    it('handles lowercase answer, uppercase guess', () => {
      expect(evaluateGuess('apple', 'APPLE')).toEqual([
        'correct', 'correct', 'correct', 'correct', 'correct'
      ]);
    });

    it('handles uppercase answer, lowercase guess', () => {
      expect(evaluateGuess('APPLE', 'apple')).toEqual([
        'correct', 'correct', 'correct', 'correct', 'correct'
      ]);
    });

    it('handles mixed case', () => {
      expect(evaluateGuess('ApPlE', 'aPpLe')).toEqual([
        'correct', 'correct', 'correct', 'correct', 'correct'
      ]);
    });
  });

  describe('different word lengths', () => {
    it('handles 4-letter words', () => {
      expect(evaluateGuess('test', 'test')).toEqual([
        'correct', 'correct', 'correct', 'correct'
      ]);
    });

    it('handles 6-letter words', () => {
      expect(evaluateGuess('grapes', 'grapes')).toEqual([
        'correct', 'correct', 'correct', 'correct', 'correct', 'correct'
      ]);
    });
  });

  describe('all present but wrong positions', () => {
    it('marks all present when letters are scrambled - anagram case', () => {
      // CRANE vs NACRE (anagram)
      // All letters present but different positions
      // Depends on exact positions - let's check a simpler case
      expect(evaluateGuess('abcde', 'eabcd')).toEqual([
        'present', 'present', 'present', 'present', 'present'
      ]);
    });
  });
});
```

## Verification Commands

```bash
# Create the test directory if needed
mkdir -p __tests__/characterization

# Run the characterization test
npm test -- --testPathPattern="evaluateGuess.characterization"

# Verify no TypeScript errors
npx tsc --noEmit
```

## Expected Result
All tests should PASS - they're documenting existing behavior.

## Completion Criteria
- [ ] Test file created at correct path
- [ ] All tests pass (green)
- [ ] No TypeScript errors
- [ ] Committed with message: `test(characterization): add evaluateGuess behavior tests`

## Next Task
After completing this task, update `REFACTOR_PROGRESS.md` and proceed to Task 0.2.
