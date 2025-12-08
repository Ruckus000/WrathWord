// src/hooks/useUserPlayedToday.ts
// Hook to check if the current user has played and completed a game today

import {useState, useEffect} from 'react';
import {getJSON} from '../storage/mmkv';
import {getScopedKey} from '../storage/userScope';

const GAME_STATE_BASE_KEY = 'game.state';

interface GameState {
  dateISO: string;
  status: 'playing' | 'won' | 'lost';
}

function getGameStateKey(): string {
  const scopedKey = getScopedKey(GAME_STATE_BASE_KEY);
  return scopedKey ?? GAME_STATE_BASE_KEY;
}

/**
 * Hook to check if the current user has played and completed today's game.
 * Returns true if the user has won or lost a game today.
 */
export function useUserPlayedToday(): boolean {
  const [playedToday, setPlayedToday] = useState<boolean>(false);

  useEffect(() => {
    const checkPlayedToday = () => {
      const today = new Date().toISOString().slice(0, 10);
      const gameState = getJSON<GameState | null>(getGameStateKey(), null);

      if (!gameState) {
        setPlayedToday(false);
        return;
      }

      // User played today if game state exists for today's date
      // AND game is in 'won' or 'lost' status (completed)
      const hasPlayedToday =
        gameState.dateISO === today &&
        (gameState.status === 'won' || gameState.status === 'lost');

      setPlayedToday(hasPlayedToday);
    };

    checkPlayedToday();

    // Re-check periodically in case the game state changes
    // This is useful when the user completes a game while on another screen
    const interval = setInterval(checkPlayedToday, 1000);

    return () => clearInterval(interval);
  }, []);

  return playedToday;
}

/**
 * Non-hook version for use outside of React components
 */
export function hasUserPlayedToday(): boolean {
  const today = new Date().toISOString().slice(0, 10);
  const gameState = getJSON<GameState | null>(getGameStateKey(), null);

  if (!gameState) {
    return false;
  }

  return (
    gameState.dateISO === today &&
    (gameState.status === 'won' || gameState.status === 'lost')
  );
}
