// src/domain/game/services/WordSelector.ts

import { GameConfig } from '../value-objects/GameConfig';
import { IWordList } from '../repositories/IWordList';

/**
 * Mulberry32 PRNG - produces deterministic random numbers from a seed.
 */
function mulberry32(seed: number): () => number {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Generate a seeded index from a string seed.
 * Uses FNV-1a hash to convert string to number.
 */
function seededIndex(seedStr: string, max: number): number {
  let h = 2166136261;
  for (let i = 0; i < seedStr.length; i++) {
    h ^= seedStr.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const rnd = mulberry32(h >>> 0)();
  return Math.floor(rnd * max);
}

/**
 * WordSelector selects a word deterministically based on game configuration.
 *
 * Uses GameConfig.toSeedString() to generate a deterministic seed that
 * includes dateISO, length, and maxRows (CRITICAL: maxRows is part of seed!).
 */
export class WordSelector {
  constructor(private readonly wordList: IWordList) {}

  /**
   * Select a word based on the game configuration.
   * Same config always produces same word.
   */
  selectWord(config: GameConfig): string {
    const answers = this.wordList.getAnswers(config.length);
    const seedString = config.toSeedString();
    const idx = seededIndex(seedString, answers.length);
    return answers[idx];
  }
}
