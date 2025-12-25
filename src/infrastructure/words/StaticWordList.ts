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
