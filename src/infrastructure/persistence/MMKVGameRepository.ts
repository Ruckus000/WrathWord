// src/infrastructure/persistence/MMKVGameRepository.ts

import { IGameRepository, PersistedGameState } from '../../domain/game/repositories/IGameRepository';
import { getJSON, setJSON, kv } from '../../storage/mmkv';
import { getScopedKey } from '../../storage/userScope';

const GAME_STATE_KEY = 'game.state';

/**
 * MMKVGameRepository implements IGameRepository using MMKV storage.
 * Uses user-scoped keys to isolate data between users.
 */
export class MMKVGameRepository implements IGameRepository {
  /**
   * Get the storage key, scoped to current user if logged in.
   */
  private getKey(): string {
    return getScopedKey(GAME_STATE_KEY) ?? GAME_STATE_KEY;
  }

  /**
   * Save game state to MMKV.
   */
  save(state: PersistedGameState): void {
    const key = this.getKey();
    setJSON(key, state);
  }

  /**
   * Load game state from MMKV.
   * Returns null if no state exists or if data is corrupted.
   */
  load(): PersistedGameState | null {
    const key = this.getKey();
    try {
      const state = getJSON<PersistedGameState | null>(key, null);

      // Validate essential fields exist
      if (state && this.isValidState(state)) {
        return state;
      }
      return null;
    } catch {
      // Handle corrupted data gracefully
      return null;
    }
  }

  /**
   * Clear saved game state.
   */
  clear(): void {
    const key = this.getKey();
    kv.remove(key);
  }

  /**
   * Check if there's a saved game.
   */
  hasSavedGame(): boolean {
    return this.load() !== null;
  }

  /**
   * Validate that state has all required fields.
   */
  private isValidState(state: unknown): state is PersistedGameState {
    if (!state || typeof state !== 'object') {
      return false;
    }

    const s = state as Record<string, unknown>;

    return (
      typeof s.length === 'number' &&
      typeof s.maxRows === 'number' &&
      typeof s.mode === 'string' &&
      typeof s.dateISO === 'string' &&
      typeof s.answer === 'string' &&
      Array.isArray(s.rows) &&
      Array.isArray(s.feedback) &&
      typeof s.status === 'string' &&
      typeof s.hintUsed === 'boolean'
    );
  }
}

/**
 * Factory function following project pattern.
 */
let instance: MMKVGameRepository | null = null;

export function getGameRepository(): IGameRepository {
  if (!instance) {
    instance = new MMKVGameRepository();
  }
  return instance;
}
