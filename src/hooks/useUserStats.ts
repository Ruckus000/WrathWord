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
      ...totalStats,
      avgGuesses: calculateAvgGuesses(totalStats),
    };
  });

  useEffect(() => {
    const refreshStats = () => {
      const totalStats = getTotalStats();
      setStats({
        ...totalStats,
        avgGuesses: calculateAvgGuesses(totalStats),
      });
    };

    // Refresh periodically to catch updates
    const interval = setInterval(refreshStats, 1000);

    return () => clearInterval(interval);
  }, []);

  return stats;
}

/**
 * Calculate average guesses from total stats.
 * This is a rough estimate based on win rate.
 */
function calculateAvgGuesses(stats: {played: number; won: number}): number {
  if (stats.won === 0) {
    return 0;
  }
  // This is a placeholder - for accurate avgGuesses we'd need
  // to track total guesses across all games
  // For now, estimate based on win rate (higher win rate = fewer guesses)
  const winRate = stats.played > 0 ? stats.won / stats.played : 0;
  // Rough estimate: 3.5 average for good players, up to 5 for lower win rates
  return Math.round((5 - winRate * 1.5) * 10) / 10;
}

/**
 * Non-hook version for use outside of React components
 */
export function getUserStats(): UserStats {
  const totalStats = getTotalStats();
  return {
    ...totalStats,
    avgGuesses: calculateAvgGuesses(totalStats),
  };
}
