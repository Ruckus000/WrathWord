import React from 'react';
import {View, Text, StyleSheet, Pressable} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {palette} from '../../theme/colors';
import {Friend} from '../../data/mockFriends';
import {Period} from './SegmentControl';

type Props = {
  friend: Friend;
  rank: number;
  period: Period;
  userPlayedToday: boolean;
  isYou?: boolean;
  isFriend?: boolean;
  onPress: () => void;
};

export default function LeaderboardRow({
  friend,
  rank,
  period,
  userPlayedToday,
  isYou,
  isFriend = false,
  onPress,
}: Props) {
  const isInactive = friend.lastPlayed === 'inactive';
  const playedToday = friend.lastPlayed === 'today';
  const showSpoilerFree = period === 'today' && !userPlayedToday;

  const avatarColors: [string, string] = isYou
    ? [palette.avatarBlueStart, palette.avatarBlueEnd]
    : [palette.avatarPurpleStart, palette.avatarPurpleEnd];

  return (
    <Pressable
      style={[
        styles.row,
        isInactive && styles.rowInactive,
        isYou && styles.rowYou,
        isFriend && styles.rowFriend,
      ]}
      onPress={onPress}>
      {/* Rank */}
      <Text
        style={[
          styles.rank,
          rank === 1 && styles.rankGold,
          rank === 2 && styles.rankSilver,
          rank === 3 && styles.rankBronze,
        ]}>
        {showSpoilerFree ? (playedToday ? '✓' : '–') : rank}
      </Text>

      {/* Avatar */}
      <LinearGradient
        colors={avatarColors}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
        style={styles.avatar}>
        <Text style={styles.avatarText}>{friend.letter}</Text>
      </LinearGradient>

      {/* Info */}
      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={styles.name}>{friend.name}</Text>
          {isYou && <Text style={styles.youBadge}>You</Text>}
        </View>
        <Text
          style={[
            styles.subtitle,
            showSpoilerFree && playedToday && styles.subtitleSuccess,
          ]}>
          {showSpoilerFree
            ? playedToday
              ? 'Completed'
              : 'Not played yet'
            : period === 'today' && friend.todayResult
            ? `Solved in ${friend.todayResult.guesses}`
            : `${friend.stats.played} games · ${friend.stats.avgGuesses} avg`}
        </Text>
      </View>

      {/* Stat */}
      {period === 'alltime' ? (
        <View style={styles.statPill}>
          <Text style={styles.statPillValue}>{friend.stats.winRate}%</Text>
          <Text style={styles.statPillLabel}>Win Rate</Text>
        </View>
      ) : (
        !showSpoilerFree && (
          <View style={styles.streakBadge}>
            <Text style={styles.streakEmoji}>🔥</Text>
            <Text style={styles.streakValue}>{friend.streak}</Text>
          </View>
        )
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    paddingHorizontal: 16,
    gap: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: palette.cardBorder,
  },
  rowInactive: {
    opacity: 0.5,
  },
  rowYou: {
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
    borderLeftWidth: 3,
    borderLeftColor: palette.primary,
    paddingLeft: 13,
  },
  rowFriend: {
    borderLeftWidth: 3,
    borderLeftColor: palette.success,
    paddingLeft: 13,
  },
  rank: {
    width: 28,
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
    color: palette.textDim,
  },
  rankGold: {
    color: palette.gold,
  },
  rankSilver: {
    color: palette.silver,
  },
  rankBronze: {
    color: palette.bronze,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 17,
    fontWeight: '600',
    color: palette.textPrimary,
  },
  info: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  name: {
    fontSize: 15,
    fontWeight: '500',
    color: palette.textPrimary,
  },
  youBadge: {
    fontSize: 10,
    fontWeight: '600',
    color: palette.primary,
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    overflow: 'hidden',
  },
  subtitle: {
    fontSize: 13,
    color: palette.textDim,
    marginTop: 2,
  },
  subtitleSuccess: {
    color: palette.success,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: palette.streakBg,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  streakEmoji: {
    fontSize: 14,
  },
  streakValue: {
    fontSize: 14,
    fontWeight: '700',
    color: palette.streakOrange,
  },
  statPill: {
    alignItems: 'flex-end',
  },
  statPillValue: {
    fontSize: 16,
    fontWeight: '700',
    color: palette.textPrimary,
  },
  statPillLabel: {
    fontSize: 10,
    color: palette.textDim,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
});
