import React, {useEffect, useState, useCallback} from 'react';
import {View, Text, StyleSheet, ScrollView, ActivityIndicator, Pressable} from 'react-native';
import {palette} from '../../theme/colors';
import {logger} from '../../utils/logger';
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
  accessToken?: string | null;
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
  accessToken = null,
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
    const currentUserId = user?.id;
    if (!currentUserId) {
      logger.log('[Leaderboard] loadGlobalLeaderboard: No userId, skipping');
      return;
    }
    setLoadingGlobal(true);
    setGlobalError(null);
    try {
      // Use stale-while-revalidate pattern
      // If cached data exists, it returns immediately
      // Fresh data callback updates state when API responds
      // Pass userId and accessToken for direct API calls (bypasses Supabase JS client)
      // TODO: RPC should guarantee user inclusion regardless of limit
      // Proper fix: UNION user's row in get_leaderboard RPC
      const data = await withTimeout(
        friendsService.getGlobalLeaderboard(200, freshData => {
          // Called when fresh data arrives (background refresh)
          setGlobalUsers(freshData);
        }, currentUserId, accessToken ?? undefined),
        DEFAULT_TIMEOUT,
        'Loading leaderboard timed out',
      );
      setGlobalUsers(data);
      setGlobalLoaded(true);
    } catch (err) {
      logger.error('Failed to load global leaderboard:', err);
      setGlobalError(
        err instanceof Error ? err.message : 'Failed to load leaderboard',
      );
    } finally {
      setLoadingGlobal(false);
    }
  }, [user?.id, accessToken]);

  // Load global leaderboard when scope changes to global
  useEffect(() => {
    if (scope === 'global' && !globalLoaded && !loadingGlobal && user?.id) {
      loadGlobalLeaderboard();
    }
  }, [scope, globalLoaded, loadingGlobal, loadGlobalLeaderboard, user?.id]);

  // Determine data source based on scope
  const users = scope === 'friends' ? friends : globalUsers;
  const userId = user?.id ?? 'current-user';

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

  // Discriminated union for leaderboard entries
  type LeaderboardEntry =
    | {type: 'player'; friend: Friend; rank: number; isYou?: boolean}
    | {type: 'separator'; hiddenCount: number};

  // Calculate user rank client-side from sorted array
  const userIndexInSorted = sortedUsers.findIndex(u => u.id === userId);
  const calculatedUserRank =
    userIndexInSorted >= 0
      ? userIndexInSorted + 1
      : sortedUsers.length + 1; // User at end if not in list

  // Use passed userRank for friends scope, calculated for global
  const effectiveUserRank =
    scope === 'friends' ? userRank : calculatedUserRank;

  // Build flat leaderboard (current behavior - show all)
  const buildFlatLeaderboard = (): LeaderboardEntry[] => {
    const list: LeaderboardEntry[] = [];
    let userInserted = false;
    let currentRank = 1;

    for (const friend of sortedUsers) {
      // Insert user at their rank position
      if (!userInserted && currentRank >= effectiveUserRank && userPlayedToday) {
        list.push({type: 'player', friend: userAsFriend, rank: effectiveUserRank, isYou: true});
        userInserted = true;
        currentRank++;
      }

      list.push({
        type: 'player',
        friend,
        rank: currentRank,
      });
      currentRank++;
    }

    // If user hasn't been inserted yet, add at end
    if (!userInserted && userPlayedToday) {
      list.push({type: 'player', friend: userAsFriend, rank: currentRank, isYou: true});
    }

    return list;
  };

  // Build top 10 leaderboard (for when user is in top 7)
  const buildTop10Leaderboard = (): LeaderboardEntry[] => {
    const list: LeaderboardEntry[] = [];
    let userInserted = false;
    let currentRank = 1;

    // Only take first 10 entries
    const top10 = sortedUsers.slice(0, 10);

    for (const friend of top10) {
      // Insert user at their rank position
      if (!userInserted && currentRank >= effectiveUserRank && userPlayedToday) {
        list.push({type: 'player', friend: userAsFriend, rank: effectiveUserRank, isYou: true});
        userInserted = true;
        currentRank++;
      }

      if (list.length >= 10) break;

      list.push({
        type: 'player',
        friend,
        rank: currentRank,
      });
      currentRank++;
    }

    // If user hasn't been inserted yet and should be in top 10
    if (!userInserted && userPlayedToday && effectiveUserRank <= 10) {
      list.push({type: 'player', friend: userAsFriend, rank: effectiveUserRank, isYou: true});
    }

    return list.slice(0, 10);
  };

  // Build condensed leaderboard (top 5 + separator + user context)
  const buildCondensedLeaderboard = (): LeaderboardEntry[] => {
    const list: LeaderboardEntry[] = [];

    // Add top 5
    for (let i = 0; i < Math.min(5, sortedUsers.length); i++) {
      list.push({
        type: 'player',
        friend: sortedUsers[i],
        rank: i + 1,
      });
    }

    // Calculate hidden count (players between rank 5 and user's neighbor above)
    // User rank 8+ means user's neighbor above is at rank-1
    // Hidden = (userRank - 1) - 5 - 1 = userRank - 7
    const hiddenCount = effectiveUserRank - 7;

    if (hiddenCount > 0) {
      list.push({type: 'separator', hiddenCount});
    }

    // Add user context: neighbor above, user, neighbor below
    // Neighbor above is at rank-1 (index rank-2 in sortedUsers since user isn't in array)
    const neighborAboveIndex = effectiveUserRank - 2; // -1 for rank-to-index, -1 for user not in array
    const neighborBelowIndex = effectiveUserRank - 1; // user's rank position in sortedUsers (since user not in array)

    // Add neighbor above if exists and not already shown in top 5
    if (neighborAboveIndex >= 5 && neighborAboveIndex < sortedUsers.length) {
      list.push({
        type: 'player',
        friend: sortedUsers[neighborAboveIndex],
        rank: effectiveUserRank - 1,
      });
    }

    // Add user
    if (userPlayedToday) {
      list.push({type: 'player', friend: userAsFriend, rank: effectiveUserRank, isYou: true});
    }

    // Add neighbor below if exists
    if (neighborBelowIndex < sortedUsers.length) {
      list.push({
        type: 'player',
        friend: sortedUsers[neighborBelowIndex],
        rank: effectiveUserRank + 1,
      });
    }

    return list;
  };

  // Main build function with condensed view logic
  const buildLeaderboard = (): LeaderboardEntry[] => {
    const totalPlayers = sortedUsers.length + (userPlayedToday ? 1 : 0);

    // Rule: Always show all for friends scope (list is small)
    if (scope === 'friends') {
      return buildFlatLeaderboard();
    }

    // Rule: Show all if ≤ 10 players
    if (totalPlayers <= 10) {
      return buildFlatLeaderboard();
    }

    // Rule: User in top 7 → show top 10
    if (effectiveUserRank <= 7) {
      return buildTop10Leaderboard();
    }

    // Rule: User rank 8+ → condensed view
    return buildCondensedLeaderboard();
  };

  const leaderboard = buildLeaderboard();

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
              {scope === 'friends' ? 'No Friends Yet' : 'No Rankings Yet'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {scope === 'friends'
                ? 'Add friends using their friend code to compete!'
                : 'Play at least 5 games to appear on the leaderboard!'}
            </Text>
          </View>
        ) : (
        <View style={styles.list}>
          {leaderboard.map((entry, idx) => {
            if (entry.type === 'separator') {
              return (
                <View key="separator" style={styles.separator}>
                  <View style={styles.separatorLine} />
                  <Text style={styles.separatorText}>
                    {entry.hiddenCount} more players
                  </Text>
                  <View style={styles.separatorLine} />
                </View>
              );
            }

            // entry.type === 'player'
            return (
              <LeaderboardRow
                key={entry.isYou ? 'you' : entry.friend.id}
                friend={entry.friend}
                rank={entry.rank}
                period={period}
                userPlayedToday={userPlayedToday}
                isYou={entry.isYou}
                isFriend={
                  !entry.isYou &&
                  scope === 'global' &&
                  friends.some(f => f.id === entry.friend.id)
                }
                onPress={() =>
                  entry.isYou ? {} : onFriendPress(entry.friend)
                }
                scope={scope}
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
  separator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: palette.cardBorder,
  },
  separatorText: {
    fontSize: 12,
    color: palette.textDim,
  },
});
