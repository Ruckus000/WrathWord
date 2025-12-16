/**
 * useHomeScreenData Hook
 *
 * Aggregates all data needed for the HomeScreen:
 * - User stats (streak, win rate, avg guesses)
 * - Game state (in progress, completed, not started)
 * - Leaderboard preview (friends or global)
 */

import {useState, useEffect, useCallback, useMemo} from 'react';
import {useAuth} from '../contexts/AuthContext';
import {useUserStats} from './useUserStats';
import {useToday} from './useToday';
import {friendsService} from '../services/data/friendsService';
import {
  getHomeGameSummary,
  abandonGame as abandonGameService,
} from '../services/data/homeService';
import {isDailyCompleted} from '../storage/dailyCompletion';
import {
  HomeScreenState,
  HomeGameSummary,
  LeaderboardEntry,
} from '../screens/HomeScreen/types';
import {Friend} from '../data/mockFriends';

const FRIEND_THRESHOLD = 3;

export interface HomeScreenData {
  // Screen state
  screenState: HomeScreenState;
  gameSummary: HomeGameSummary | null;

  // Stats
  streak: number;
  winRate: number;
  avgGuesses: number;
  gamesPlayed: number;

  // Leaderboard
  leaderboardType: 'friends' | 'global';
  leaderboardEntries: LeaderboardEntry[];

  // Error handling
  error: Error | null;
  isOffline: boolean;

  // Actions
  refresh: () => Promise<void>;
  abandonGame: () => Promise<void>;
}

/**
 * Hook to fetch and manage all HomeScreen data
 */
export function useHomeScreenData(): HomeScreenData {
  const {user, accessToken} = useAuth();
  const userStats = useUserStats();

  // Data state
  const [isLoading, setIsLoading] = useState(true);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [globalUsers, setGlobalUsers] = useState<Friend[]>([]);
  const [gameSummary, setGameSummary] = useState<HomeGameSummary | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Today's date for completion checks - updates on foreground and midnight
  const today = useToday();

  // Determine screen state
  const screenState = useMemo((): HomeScreenState => {
    if (isLoading) {
      return 'loading';
    }

    // Check for in-progress game
    if (gameSummary?.status === 'playing') {
      return 'in_progress';
    }

    // Check if today's daily is completed
    // 1. Via game summary (won/lost today)
    if (
      gameSummary &&
      gameSummary.mode === 'daily' &&
      gameSummary.dateISO === today &&
      (gameSummary.status === 'won' || gameSummary.status === 'lost')
    ) {
      return 'completed';
    }

    // 2. Via completion storage (for default 5x6 daily)
    if (isDailyCompleted(5, 6, today)) {
      return 'completed';
    }

    return 'not_started';
  }, [isLoading, gameSummary, today]);

  // Determine leaderboard type based on friend count
  const leaderboardType = useMemo(
    () => (friends.length >= FRIEND_THRESHOLD ? 'friends' : 'global'),
    [friends.length],
  );

  // Build leaderboard entries (top 2 + current user)
  const leaderboardEntries = useMemo((): LeaderboardEntry[] => {
    const source = leaderboardType === 'friends' ? friends : globalUsers;

    // Filter to users who played today and sort by guesses
    const todayPlayers = source
      .filter(u => u.todayResult)
      .sort(
        (a, b) =>
          (a.todayResult?.guesses ?? 99) - (b.todayResult?.guesses ?? 99),
      );

    // Get top 2 players
    const entries: LeaderboardEntry[] = todayPlayers
      .slice(0, 2)
      .map((u, idx) => ({
        id: u.id,
        name: u.name,
        letter: u.letter,
        guesses: u.todayResult?.guesses ?? null,
        isUser: false,
        rank: idx + 1,
      }));

    // Determine if current user played today
    const userPlayed =
      gameSummary?.status === 'won' || gameSummary?.status === 'lost';
    const userGuesses = userPlayed ? gameSummary?.guessesUsed : null;

    // Calculate user's rank
    let userRank: number | null = null;
    if (userPlayed && userGuesses !== null) {
      userRank =
        todayPlayers.filter(u => (u.todayResult?.guesses ?? 99) < userGuesses)
          .length + 1;
    }

    // Add current user entry
    const userEntry: LeaderboardEntry = {
      id: 'current-user',
      name: 'You',
      letter: user?.displayName?.charAt(0).toUpperCase() ?? 'Y',
      guesses: userGuesses,
      isUser: true,
      rank: userRank ?? entries.length + 1,
    };

    // Check if user is already in top 2
    const userInTop2 = userRank !== null && userRank <= 2;

    if (userInTop2) {
      // Insert user at their rank position
      entries.splice(userRank! - 1, 0, userEntry);
      // Re-rank everyone after
      entries.forEach((e, i) => {
        e.rank = i + 1;
      });
      return entries.slice(0, 3);
    } else {
      // User not in top 2, add at end
      entries.push(userEntry);
      return entries.slice(0, 3);
    }
  }, [friends, globalUsers, leaderboardType, gameSummary, user]);

  // Fetch all data
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Load game state from storage (synchronous)
      const savedGameSummary = getHomeGameSummary();
      setGameSummary(savedGameSummary);

      // Fetch friends list
      const friendsData = await friendsService.getFriends(
        undefined, // onFreshData - we'll handle refresh manually
        user?.id,
        accessToken ?? undefined,
      );
      setFriends(friendsData);

      // If few friends, also fetch global leaderboard
      if (friendsData.length < FRIEND_THRESHOLD) {
        const globalData = await friendsService.getGlobalLeaderboard(
          10,
          undefined,
          user?.id,
          accessToken ?? undefined,
        );
        setGlobalUsers(globalData);
      }
    } catch (err) {
      console.error('[useHomeScreenData] Failed to fetch:', err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, accessToken]);

  // Initial fetch and refresh on key change
  useEffect(() => {
    fetchData();
  }, [fetchData, refreshKey]);

  // Refresh function
  const refresh = useCallback(async () => {
    setRefreshKey(k => k + 1);
  }, []);

  // Abandon game action
  const abandonGame = useCallback(async () => {
    if (!gameSummary) {
      return;
    }

    await abandonGameService(gameSummary);

    // Refresh data to update screen state
    setGameSummary(null);
    setRefreshKey(k => k + 1);
  }, [gameSummary]);

  // Determine if offline based on error
  const isOffline = useMemo(() => {
    if (!error) return false;
    const msg = error.message?.toLowerCase() ?? '';
    return msg.includes('network') || msg.includes('fetch') || msg.includes('timeout');
  }, [error]);

  return {
    screenState,
    gameSummary,
    streak: userStats.currentStreak,
    winRate: userStats.winRate,
    avgGuesses: userStats.avgGuesses,
    gamesPlayed: userStats.played,
    leaderboardType,
    leaderboardEntries,
    error,
    isOffline,
    refresh,
    abandonGame,
  };
}
