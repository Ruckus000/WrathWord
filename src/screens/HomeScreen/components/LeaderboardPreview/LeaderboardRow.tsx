import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {palette} from '../../../../theme/colors';
import {LeaderboardEntry} from '../../types';

interface Props {
  entry: LeaderboardEntry;
}

function getRankColor(rank: number): string {
  switch (rank) {
    case 1:
      return palette.gold;
    case 2:
      return palette.silver;
    case 3:
      return palette.bronze;
    default:
      return palette.textMuted;
  }
}

export function LeaderboardRow({entry}: Props) {
  const rankColor = getRankColor(entry.rank);
  const hasPlayed = entry.guesses !== null;

  return (
    <View
      style={[
        styles.row,
        entry.isUser && hasPlayed && styles.userRowHighlight,
        entry.isUser && !hasPlayed && styles.userRowDimmed,
      ]}
      accessibilityLabel={`Rank ${entry.rank}, ${entry.name}, ${
        hasPlayed ? `${entry.guesses} guesses` : 'Not played'
      }`}>
      {/* Rank */}
      <View style={styles.rankContainer}>
        {entry.rank <= 3 && hasPlayed ? (
          <Text style={[styles.rank, {color: rankColor}]}>#{entry.rank}</Text>
        ) : (
          <Text style={styles.rankDash}>—</Text>
        )}
      </View>

      {/* Avatar */}
      <LinearGradient
        colors={
          entry.isUser
            ? [palette.avatarBlueStart, palette.avatarBlueEnd]
            : [palette.avatarPurpleStart, palette.avatarPurpleEnd]
        }
        style={styles.avatar}>
        <Text style={styles.avatarText}>{entry.letter}</Text>
      </LinearGradient>

      {/* Name */}
      <View style={styles.nameContainer}>
        <Text style={[styles.name, entry.isUser && styles.userName]}>
          {entry.name}
        </Text>
        {entry.isUser && <View style={styles.youBadge} />}
      </View>

      {/* Guesses */}
      <Text style={[styles.guesses, !hasPlayed && styles.notPlayed]}>
        {hasPlayed ? `${entry.guesses} guesses` : 'Not played'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  userRowHighlight: {
    backgroundColor: 'rgba(99, 102, 241, 0.08)',
    borderRadius: 8,
    marginHorizontal: -4,
    paddingHorizontal: 8,
  },
  userRowDimmed: {
    opacity: 0.5,
  },
  rankContainer: {
    width: 20,
    alignItems: 'center',
  },
  rank: {
    fontSize: 13,
    fontWeight: '700',
  },
  rankDash: {
    fontSize: 13,
    color: palette.textDim,
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  avatarText: {
    fontSize: 13,
    fontWeight: '700',
    color: palette.textPrimary,
  },
  nameContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 10,
  },
  name: {
    fontSize: 13,
    fontWeight: '500',
    color: palette.textPrimary,
  },
  userName: {
    fontWeight: '600',
  },
  youBadge: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: palette.gradientStart,
    marginLeft: 6,
  },
  guesses: {
    fontSize: 12,
    color: palette.textMuted,
  },
  notPlayed: {
    fontStyle: 'italic',
    color: palette.textDim,
  },
});
