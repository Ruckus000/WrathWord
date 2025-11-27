import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {palette} from '../../theme/colors';
import {Friend, MOCK_USER} from '../../data/mockFriends';
import {Period} from './SegmentControl';
import LeaderboardRow from './LeaderboardRow';

type Props = {
  period: Period;
  userPlayedToday: boolean;
  friends: Friend[];
  userRank: number;
  onFriendPress: (friend: Friend) => void;
};

export default function Leaderboard({
  period,
  userPlayedToday,
  friends,
  userRank,
  onFriendPress,
}: Props) {
  // Sort friends based on period
  const sortedFriends = [...friends].sort((a, b) => {
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

    for (const friend of sortedFriends) {
      // Insert user at their rank position
      if (!userInserted && currentRank >= userRank && userPlayedToday) {
        list.push({type: 'user', rank: userRank});
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
            ? 'Friends Playing'
            : period === 'alltime'
            ? 'All Time Rankings'
            : 'Leaderboard'}
        </Text>
        <Text style={styles.metric}>{getMetricLabel()}</Text>
      </View>

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
              onPress={() => onFriendPress(entry.friend!)}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
    marginBottom: 12,
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    color: palette.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metric: {
    fontSize: 12,
    color: palette.textDim,
  },
  list: {
    backgroundColor: palette.card,
    borderRadius: 16,
    overflow: 'hidden',
  },
});
