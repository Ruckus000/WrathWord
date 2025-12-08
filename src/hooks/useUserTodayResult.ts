// src/hooks/useUserTodayResult.ts
// Hook to get the current user's game result for today

import {useState, useEffect} from 'react';
import {getJSON} from '../storage/mmkv';
import {getScopedKey} from '../storage/userScope';
import {TileState} from '../logic/evaluateGuess';

const GAME_STATE_BASE_KEY = 'game.state';

interface GameState {
  dateISO: string;
  status: 'playing' | 'won' | 'lost';
  rows: string[];
  feedback: TileState[][];
}

export interface UserTodayResult {
  played: boolean;
  won: boolean;
  guesses: number;
  feedback: TileState[][];
}

function getGameStateKey(): string {
  const scopedKey = getScopedKey(GAME_STATE_BASE_KEY);
  return scopedKey ?? GAME_STATE_BASE_KEY;
}

/**
 * Hook to get the current user's game result for today.
 * Returns null if the user hasn't played or completed today's game.
 */
export function useUserTodayResult(): UserTodayResult | null {
  const [result, setResult] = useState<UserTodayResult | null>(null);

  useEffect(() => {
    const checkResult = () => {
      const today = new Date().toISOString().slice(0, 10);
      const gameState = getJSON<GameState | null>(getGameStateKey(), null);

      if (!gameState) {
        setResult(null);
        return;
      }

      // Only return result if game is from today and completed
      if (
        gameState.dateISO === today &&
        (gameState.status === 'won' || gameState.status === 'lost')
      ) {
        setResult({
          played: true,
          won: gameState.status === 'won',
          guesses: gameState.rows?.length ?? 0,
          feedback: gameState.feedback ?? [],
        });
      } else {
        setResult(null);
      }
    };

    checkResult();

    // Re-check periodically in case the game state changes
    const interval = setInterval(checkResult, 1000);

    return () => clearInterval(interval);
  }, []);

  return result;
}

/**
 * Non-hook version for use outside of React components
 */
export function getUserTodayResult(): UserTodayResult | null {
  const today = new Date().toISOString().slice(0, 10);
  const gameState = getJSON<GameState | null>(getGameStateKey(), null);

  if (!gameState) {
    return null;
  }

  if (
    gameState.dateISO === today &&
    (gameState.status === 'won' || gameState.status === 'lost')
  ) {
    return {
      played: true,
      won: gameState.status === 'won',
      guesses: gameState.rows?.length ?? 0,
      feedback: gameState.feedback ?? [],
    };
  }

  return null;
}
