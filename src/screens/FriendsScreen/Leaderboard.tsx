import React, {useEffect, useState, useCallback} from 'react';
import {View, Text, StyleSheet, ScrollView, ActivityIndicator, Pressable} from 'react-native';
import {palette} from '../../theme/colors';
import {Friend} from '../../data/mockFriends';
import {friendsService} from '../../services/data';
import {useUserTodayResult, useUserStats} from '../../hooks';
import {useAuth} from '../../contexts/AuthContext';
import {withTimeout, DEFAULT_TIMEOUT} from '../../services/utils/timeout';
import {Period} from './SegmentControl';
import ScopeToggle, {Scope} from './ScopeToggle';
import LeaderboardRow from './LeaderboardRow';

type Props = {
  period: Period;
  scope: Scope;
  onScopeChange: (scope: Scope) => void;
  userPlayedToday: boolean;
  friends: Friend[];
  userRank: number;
  onFriendPress: (friend: Friend) => void;
  friendsLoading?: boolean;
  friendsError?: string | null;
  onRetryFriends?: () => void;
};

export default function Leaderboard({
  period,
  scope,
  onScopeChange,
  userPlayedToday,
  friends,
  userRank,
  onFriendPress,
  friendsLoading = false,
  friendsError = null,
  onRetryFriends,
}: Props) {
  const [globalUsers, setGlobalUsers] = useState<Friend[]>([]);
  const [loadingGlobal, setLoadingGlobal] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [globalLoaded, setGlobalLoaded] = useState(false);

  // Get real user data
  const {user} = useAuth();
  const userTodayResult = useUserTodayResult();
  const userStats = useUserStats();

  const loadGlobalLeaderboard = useCallback(async () => {
    setLoadingGlobal(true);
    setGlobalError(null);
    try {
      // Use stale-while-revalidate pattern
      // If cached data exists, it returns immediately
      // Fresh data callback updates state when API responds
      const data = await withTimeout(
        friendsService.getGlobalLeaderboard(50, freshData => {
          // Called when fresh data arrives (background refresh)
          setGlobalUsers(freshData);
        }),
        DEFAULT_TIMEOUT,
        'Loading leaderboard timed out',
      );
      setGlobalUsers(data);
      setGlobalLoaded(true);
    } catch (err) {
      console.error('Failed to load global leaderboard:', err);
      setGlobalError(
        err instanceof Error ? err.message : 'Failed to load leaderboard',
      );
    } finally {
      setLoadingGlobal(false);
    }
  }, []);

  // Load global leaderboard when scope changes to global
  useEffect(() => {
    if (scope === 'global' && !globalLoaded && !loadingGlobal) {
      loadGlobalLeaderboard();
    }
  }, [scope, globalLoaded, loadingGlobal, loadGlobalLeaderboard]);

  // Determine data source and user rank based on scope
  const users = scope === 'friends' ? friends : globalUsers;
  // Calculate global rank based on position in leaderboard
  const userId = user?.id ?? 'current-user';
  const globalRankIndex = globalUsers.findIndex(u => u.id === userId);
  const currentUserRank = scope === 'friends' ? userRank : (globalRankIndex >= 0 ? globalRankIndex + 1 : globalUsers.length + 1);

  // Sort users based on period
  const sortedUsers = [...users].sort((a, b) => {
    if (period === 'today') {
      const aGuesses = a.todayResult?.guesses ?? 999;
      const bGuesses = b.todayResult?.guesses ?? 999;
      return aGuesses - bGuesses;
    } else {
      return b.stats.winRate - a.stats.winRate;
    }
  });

  // Build leaderboard with user inserted at correct position
  type LeaderboardEntry = {
    type: 'user' | 'friend';
    friend?: Friend;
    rank: number;
  };

  const buildLeaderboard = (): LeaderboardEntry[] => {
    const list: LeaderboardEntry[] = [];
    let userInserted = false;
    let currentRank = 1;

    for (const friend of sortedUsers) {
      // Insert user at their rank position
      if (!userInserted && currentRank >= currentUserRank && userPlayedToday) {
        list.push({type: 'user', rank: currentUserRank});
        userInserted = true;
        currentRank++;
      }

      list.push({
        type: 'friend',
        friend,
        rank: currentRank,
      });
      currentRank++;
    }

    // If user hasn't been inserted yet, add at end
    if (!userInserted && userPlayedToday) {
      list.push({type: 'user', rank: currentRank});
    }

    return list;
  };

  const leaderboard = buildLeaderboard();

  const getMetricLabel = () => {
    if (period === 'alltime') return 'Win Rate';
    if (period === 'week') return 'Avg. Guesses';
    return 'Streak';
  };

  // Create a "friend" object for the user to pass to LeaderboardRow
  const userAsFriend: Friend = {
    id: userId,
    name: user?.displayName ?? user?.username ?? 'You',
    letter: (user?.displayName ?? user?.username ?? 'Y')[0].toUpperCase(),
    friendCode: user?.friendCode ?? '',
    streak: userStats.currentStreak,
    lastPlayed: userPlayedToday ? 'today' : 'inactive',
    todayResult: userTodayResult
      ? {
          won: userTodayResult.won,
          guesses: userTodayResult.guesses,
          feedback: userTodayResult.feedback,
        }
      : undefined,
    stats: {
      played: userStats.played,
      won: userStats.won,
      winRate: userStats.winRate,
      avgGuesses: userStats.avgGuesses,
      maxStreak: userStats.maxStreak,
    },
    h2h: {yourWins: 0, theirWins: 0},
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {period === 'today' && !userPlayedToday
            ? scope === 'friends'
              ? 'Friends Playing'
              : 'Global Players'
            : period === 'alltime'
            ? scope === 'friends'
              ? 'All Time Rankings'
              : 'Global Rankings'
            : scope === 'friends'
            ? 'Leaderboard'
            : 'Global Leaderboard'}
        </Text>
        <ScopeToggle selected={scope} onSelect={onScopeChange} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        {/* Loading state */}
        {((scope === 'global' && loadingGlobal) || (scope === 'friends' && friendsLoading)) ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={palette.primary} />
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        ) : /* Error state */ ((scope === 'global' && globalError) || (scope === 'friends' && friendsError)) ? (
          <View style={styles.loadingContainer}>
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>
                {scope === 'global' ? globalError : friendsError}
              </Text>
              <Pressable
                style={styles.retryButton}
                onPress={scope === 'global' ? loadGlobalLeaderboard : onRetryFriends}>
                <Text style={styles.retryText}>Retry</Text>
              </Pressable>
            </View>
          </View>
        ) : /* Empty state */ leaderboard.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>
              {scope === 'friends' ? 'No Friends Yet' : 'No Players Found'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {scope === 'friends'
                ? 'Add friends to compete with them!'
                : 'Be the first to play today!'}
            </Text>
          </View>
        ) : (
        <View style={styles.list}>
          {leaderboard.map((entry, idx) => {
            if (entry.type === 'user') {
              return (
                <LeaderboardRow
                  key="you"
                  friend={userAsFriend}
                  rank={entry.rank}
                  period={period}
                  userPlayedToday={userPlayedToday}
                  isYou
                  isFriend={false}
                  onPress={() => {}}
                />
              );
            }
            return (
              <LeaderboardRow
                key={entry.friend!.id}
                friend={entry.friend!}
                rank={entry.rank}
                period={period}
                userPlayedToday={userPlayedToday}
                isFriend={
                  scope === 'global' &&
                  friends.some(f => f.id === entry.friend!.id)
                }
                onPress={() => onFriendPress(entry.friend!)}
              />
            );
          })}
        </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
    marginBottom: 12,
    gap: 8,
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    color: palette.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    flex: 1,
  },
  metric: {
    fontSize: 12,
    color: palette.textDim,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  list: {
    backgroundColor: palette.card,
    borderRadius: 16,
    overflow: 'hidden',
  },
  loadingContainer: {
    backgroundColor: palette.card,
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: palette.textMuted,
    marginTop: 8,
  },
  emptyContainer: {
    backgroundColor: palette.card,
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: palette.textPrimary,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: palette.textMuted,
    textAlign: 'center',
  },
  errorContainer: {
    alignItems: 'center',
    gap: 12,
  },
  errorText: {
    fontSize: 14,
    color: palette.textMuted,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: palette.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    fontSize: 14,
    fontWeight: '600',
    color: palette.textPrimary,
  },
});
