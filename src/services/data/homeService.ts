/**
 * Home Service
 *
 * Encapsulates data operations for the HomeScreen.
 * Provides game state access and abandon game functionality.
 */

import {getJSON, setJSON} from '../../storage/mmkv';
import {getScopedKey} from '../../storage/userScope';
import {markDailyCompleted} from '../../storage/dailyCompletion';
import {gameResultsService} from './gameResultsService';
import {recordGameResult} from '../../storage/profile';
import {HomeGameSummary} from '../../screens/HomeScreen/types';
import {TileState} from '../../logic/evaluateGuess';

const GAME_STATE_BASE_KEY = 'game.state';

/**
 * Full game state structure as stored in MMKV
 * This matches what GameScreen saves
 */
interface StoredGameState {
  length: number;
  maxRows: number;
  mode: 'daily' | 'free';
  dateISO: string;
  answer: string;
  rows: string[];
  feedback: TileState[][];
  current: string;
  status: 'playing' | 'won' | 'lost';
  hintUsed: boolean;
  hintedCell: {row: number; col: number} | null;
  hintedLetter: string | null;
}

/**
 * Get the scoped storage key for game state
 */
export function getGameStateKey(): string {
  const scopedKey = getScopedKey(GAME_STATE_BASE_KEY);
  return scopedKey ?? GAME_STATE_BASE_KEY;
}

/**
 * Get the current game state summary for HomeScreen display
 * Returns null if no game state exists
 */
export function getHomeGameSummary(): HomeGameSummary | null {
  const key = getGameStateKey();
  const state = getJSON<StoredGameState | null>(key, null);

  if (!state) {
    return null;
  }

  return {
    mode: state.mode,
    status: state.status,
    length: state.length,
    maxRows: state.maxRows,
    dateISO: state.dateISO,
    guessesUsed: state.rows?.length ?? 0,
    feedback: state.feedback ?? [],
  };
}

/**
 * Clear the current game state
 */
export function clearGameState(): void {
  const key = getGameStateKey();
  setJSON(key, null);
}

/**
 * Abandon the current game
 * - Records a loss
 * - Marks daily as completed (if applicable)
 * - Clears game state
 */
export async function abandonGame(
  gameSummary: HomeGameSummary,
): Promise<void> {
  // Record as loss in local stats
  recordGameResult({
    length: gameSummary.length,
    won: false,
    guesses: gameSummary.guessesUsed,
    maxRows: gameSummary.maxRows,
    date: gameSummary.dateISO,
  });

  // Also save to cloud via gameResultsService
  try {
    await gameResultsService.saveGameResult({
      wordLength: gameSummary.length,
      won: false,
      guesses: gameSummary.guessesUsed,
      maxRows: gameSummary.maxRows,
      date: gameSummary.dateISO,
      feedback: gameSummary.feedback,
    });
  } catch (err) {
    // Fail silently - local save is already done
    console.warn('[homeService] Cloud save failed during abandon:', err);
  }

  // Mark daily as completed if applicable
  if (gameSummary.mode === 'daily') {
    markDailyCompleted(
      gameSummary.length,
      gameSummary.maxRows,
      gameSummary.dateISO,
    );
  }

  // Clear game state
  clearGameState();
}
