// src/hooks/useUserStats.ts
// Hook to get the current user's overall statistics

import {useState, useEffect} from 'react';
import {getTotalStats} from '../storage/profile';

export interface UserStats {
  played: number;
  won: number;
  winRate: number;
  currentStreak: number;
  maxStreak: number;
  avgGuesses: number;
}

/**
 * Hook to get the current user's overall statistics.
 */
export function useUserStats(): UserStats {
  const [stats, setStats] = useState<UserStats>(() => {
    const totalStats = getTotalStats();
    return {
      played: totalStats.played,
      won: totalStats.won,
      winRate: totalStats.winRate,
      currentStreak: totalStats.currentStreak,
      maxStreak: totalStats.maxStreak,
      avgGuesses: calculateAvgGuesses(totalStats.guessDistribution, totalStats.won),
    };
  });

  useEffect(() => {
    const refreshStats = () => {
      const totalStats = getTotalStats();
      setStats({
        played: totalStats.played,
        won: totalStats.won,
        winRate: totalStats.winRate,
        currentStreak: totalStats.currentStreak,
        maxStreak: totalStats.maxStreak,
        avgGuesses: calculateAvgGuesses(totalStats.guessDistribution, totalStats.won),
      });
    };

    // Refresh periodically to catch updates (30 seconds to reduce battery drain)
    const interval = setInterval(refreshStats, 30000);

    return () => clearInterval(interval);
  }, []);

  return stats;
}

/**
 * Calculate average guesses from the actual guess distribution data.
 * This gives the real average number of guesses per winning game.
 */
function calculateAvgGuesses(
  guessDistribution: {[guesses: number]: number},
  gamesWon: number,
): number {
  if (gamesWon === 0) {
    return 0;
  }

  // Sum up (guesses * count) for each entry in distribution
  const totalGuesses = Object.entries(guessDistribution).reduce(
    (sum, [guesses, count]) => sum + parseInt(guesses, 10) * count,
    0,
  );

  // Return average rounded to 1 decimal place
  return Math.round((totalGuesses / gamesWon) * 10) / 10;
}

/**
 * Non-hook version for use outside of React components
 */
export function getUserStats(): UserStats {
  const totalStats = getTotalStats();
  return {
    played: totalStats.played,
    won: totalStats.won,
    winRate: totalStats.winRate,
    currentStreak: totalStats.currentStreak,
    maxStreak: totalStats.maxStreak,
    avgGuesses: calculateAvgGuesses(totalStats.guessDistribution, totalStats.won),
  };
}
