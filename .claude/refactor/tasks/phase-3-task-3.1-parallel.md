# Task 3.1: StaticWordList Implementation (PARALLEL)

## Agent Assignment
This task can run in parallel with Tasks 3.2, 3.3, and 3.4.

## Objective
Implement `IWordList` interface using static JSON word lists with O(1) lookup.

## Files to Create
- `src/infrastructure/words/StaticWordList.ts`
- `__tests__/infrastructure/words/StaticWordList.test.ts`

## Interface to Implement
```typescript
// From src/domain/game/repositories/IWordList.ts
export interface IWordList {
  getAnswers(length: ValidLength): string[];
  isValidGuess(word: string, length: ValidLength): boolean;
  getAnswerCount(length: ValidLength): number;
}
```

## Implementation

```typescript
// src/infrastructure/words/StaticWordList.ts

import { IWordList } from '../../domain/game/repositories/IWordList';
import { ValidLength } from '../../domain/game/value-objects/GameConfig';

// Import word lists statically
import answers4 from '../../logic/words/answers-4.json';
import answers5 from '../../logic/words/answers-5.json';
import answers6 from '../../logic/words/answers-6.json';
import allowed4 from '../../logic/words/allowed-4.json';
import allowed5 from '../../logic/words/allowed-5.json';
import allowed6 from '../../logic/words/allowed-6.json';

/**
 * StaticWordList implements IWordList using bundled JSON word lists.
 * Uses Set for O(1) validity checks.
 */
export class StaticWordList implements IWordList {
  private readonly answersMap: Map<ValidLength, string[]>;
  private readonly allowedSets: Map<ValidLength, Set<string>>;

  constructor() {
    // Initialize answers map
    this.answersMap = new Map([
      [4, answers4 as string[]],
      [5, answers5 as string[]],
      [6, answers6 as string[]],
    ]);

    // Initialize allowed sets for O(1) lookup
    this.allowedSets = new Map([
      [4, new Set((allowed4 as string[]).map(w => w.toLowerCase()))],
      [5, new Set((allowed5 as string[]).map(w => w.toLowerCase()))],
      [6, new Set((allowed6 as string[]).map(w => w.toLowerCase()))],
    ]);
  }

  /**
   * Get all answer words for a given length.
   */
  getAnswers(length: ValidLength): string[] {
    const answers = this.answersMap.get(length);
    if (!answers) {
      throw new Error(`No answers available for length ${length}`);
    }
    return [...answers]; // Return copy to prevent mutation
  }

  /**
   * Check if a word is a valid guess (O(1) lookup).
   */
  isValidGuess(word: string, length: ValidLength): boolean {
    const allowedSet = this.allowedSets.get(length);
    if (!allowedSet) {
      return false;
    }
    return allowedSet.has(word.toLowerCase());
  }

  /**
   * Get the count of available answers for a given length.
   */
  getAnswerCount(length: ValidLength): number {
    const answers = this.answersMap.get(length);
    return answers?.length ?? 0;
  }
}

/**
 * Factory function following project pattern.
 */
let instance: StaticWordList | null = null;

export function getWordList(): IWordList {
  if (!instance) {
    instance = new StaticWordList();
  }
  return instance;
}
```

## Test File

```typescript
// __tests__/infrastructure/words/StaticWordList.test.ts

import { StaticWordList, getWordList } from '../../../src/infrastructure/words/StaticWordList';
import { ValidLength } from '../../../src/domain/game/value-objects/GameConfig';

describe('StaticWordList', () => {
  let wordList: StaticWordList;

  beforeEach(() => {
    wordList = new StaticWordList();
  });

  describe('getAnswers', () => {
    it('returns answers for length 4', () => {
      const answers = wordList.getAnswers(4);
      expect(Array.isArray(answers)).toBe(true);
      expect(answers.length).toBeGreaterThan(0);
      expect(answers.every(w => w.length === 4)).toBe(true);
    });

    it('returns answers for length 5', () => {
      const answers = wordList.getAnswers(5);
      expect(Array.isArray(answers)).toBe(true);
      expect(answers.length).toBeGreaterThan(0);
      expect(answers.every(w => w.length === 5)).toBe(true);
    });

    it('returns answers for length 6', () => {
      const answers = wordList.getAnswers(6);
      expect(Array.isArray(answers)).toBe(true);
      expect(answers.length).toBeGreaterThan(0);
      expect(answers.every(w => w.length === 6)).toBe(true);
    });

    it('returns a copy (not the original array)', () => {
      const answers1 = wordList.getAnswers(5);
      const answers2 = wordList.getAnswers(5);
      expect(answers1).not.toBe(answers2);
      expect(answers1).toEqual(answers2);
    });
  });

  describe('isValidGuess', () => {
    it('returns true for valid words', () => {
      const answers = wordList.getAnswers(5);
      const firstAnswer = answers[0];
      expect(wordList.isValidGuess(firstAnswer, 5)).toBe(true);
    });

    it('returns false for invalid words', () => {
      expect(wordList.isValidGuess('zzzzz', 5)).toBe(false);
      expect(wordList.isValidGuess('xxxxx', 5)).toBe(false);
    });

    it('is case insensitive', () => {
      const answers = wordList.getAnswers(5);
      const firstAnswer = answers[0];
      expect(wordList.isValidGuess(firstAnswer.toUpperCase(), 5)).toBe(true);
      expect(wordList.isValidGuess(firstAnswer.toLowerCase(), 5)).toBe(true);
    });

    it('returns false for wrong length', () => {
      const answers4 = wordList.getAnswers(4);
      const fourLetterWord = answers4[0];
      // A 4-letter word should not be valid for length 5
      expect(wordList.isValidGuess(fourLetterWord, 5 as ValidLength)).toBe(false);
    });
  });

  describe('getAnswerCount', () => {
    it('returns count for each valid length', () => {
      expect(wordList.getAnswerCount(4)).toBeGreaterThan(0);
      expect(wordList.getAnswerCount(5)).toBeGreaterThan(0);
      expect(wordList.getAnswerCount(6)).toBeGreaterThan(0);
    });

    it('matches actual array length', () => {
      expect(wordList.getAnswerCount(5)).toBe(wordList.getAnswers(5).length);
    });
  });

  describe('getWordList factory', () => {
    it('returns an IWordList instance', () => {
      const instance = getWordList();
      expect(instance).toBeDefined();
      expect(typeof instance.getAnswers).toBe('function');
      expect(typeof instance.isValidGuess).toBe('function');
    });

    it('returns singleton instance', () => {
      const instance1 = getWordList();
      const instance2 = getWordList();
      expect(instance1).toBe(instance2);
    });
  });

  describe('O(1) lookup performance', () => {
    it('isValidGuess uses Set for fast lookup', () => {
      // This is a smoke test - if it used array.includes() on large lists,
      // this would be noticeably slow for many calls
      const start = Date.now();
      for (let i = 0; i < 10000; i++) {
        wordList.isValidGuess('crane', 5);
      }
      const elapsed = Date.now() - start;
      // 10000 O(1) lookups should complete in well under 100ms
      expect(elapsed).toBeLessThan(100);
    });
  });
});
```

## Verification

```bash
# Create directories
mkdir -p src/infrastructure/words
mkdir -p __tests__/infrastructure/words

# Run tests
npm test -- --testPathPattern="StaticWordList"

# Type check
npx tsc --noEmit
```

## Completion Criteria
- [ ] `StaticWordList` class implements `IWordList`
- [ ] Uses `Set` for O(1) validity checks
- [ ] Factory function `getWordList()` returns singleton
- [ ] All tests pass
- [ ] No TypeScript errors

## Commit Message
```
feat(infrastructure): add StaticWordList implementing IWordList
```
