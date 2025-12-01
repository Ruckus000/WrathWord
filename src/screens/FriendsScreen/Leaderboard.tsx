import React from 'react';
import {View, Text, StyleSheet, ScrollView} from 'react-native';
import {palette} from '../../theme/colors';
import {Friend, MOCK_USER} from '../../data/mockFriends';
import {MOCK_GLOBAL_USERS, getUserGlobalRank} from '../../data/mockGlobalUsers';
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
};

export default function Leaderboard({
  period,
  scope,
  onScopeChange,
  userPlayedToday,
  friends,
  userRank,
  onFriendPress,
}: Props) {
  // Determine data source and user rank based on scope
  const users = scope === 'friends' ? friends : MOCK_GLOBAL_USERS;
  const currentUserRank = scope === 'friends' ? userRank : getUserGlobalRank();

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
    id: MOCK_USER.id,
    name: MOCK_USER.name,
    letter: MOCK_USER.letter,
    streak: MOCK_USER.streak,
    lastPlayed: 'today',
    todayResult: MOCK_USER.todayResult,
    stats: MOCK_USER.stats,
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
});
