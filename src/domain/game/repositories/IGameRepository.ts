// src/domain/game/repositories/IGameRepository.ts

import { TileStateValue } from '../value-objects/TileState';
import { GameMode, ValidLength } from '../value-objects/GameConfig';

/**
 * Persisted game state structure.
 */
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

/**
 * Interface for persisting game state.
 * Implementations handle the actual storage mechanism (MMKV, AsyncStorage, etc.)
 */
export interface IGameRepository {
  /**
   * Save the current game state.
   */
  save(state: PersistedGameState): void;

  /**
   * Load the saved game state.
   * Returns null if no state is saved.
   */
  load(): PersistedGameState | null;

  /**
   * Clear the saved game state.
   */
  clear(): void;

  /**
   * Check if there is a saved game.
   */
  hasSavedGame(): boolean;
}
