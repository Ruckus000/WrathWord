import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {palette} from '../../theme/colors';

type Props = {
  userRank: number;
  totalFriends: number;
  winRate: number;
  avgGuesses: number;
};

function getOrdinalSuffix(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

export default function AllTimeCard({
  userRank,
  totalFriends,
  winRate,
  avgGuesses,
}: Props) {
  return (
    <LinearGradient
      colors={['rgba(59, 130, 246, 0.08)', 'rgba(139, 92, 246, 0.08)']}
      start={{x: 0, y: 0}}
      end={{x: 1, y: 1}}
      style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.label}>
          <View style={styles.dot} />
          <Text style={styles.labelText}>Your Ranking</Text>
        </View>
        <Text style={styles.date}>All Time</Text>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.position}>
          <Text style={styles.positionRank}>
            {userRank}
            <Text style={styles.positionSup}>{getOrdinalSuffix(userRank)}</Text>
          </Text>
          <Text style={styles.positionLabel}>of {totalFriends} friends</Text>
        </View>

        <View style={styles.stats}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{winRate}%</Text>
            <Text style={styles.statLabel}>Win Rate</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{avgGuesses}</Text>
            <Text style={styles.statLabel}>Avg. Guesses</Text>
          </View>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginBottom: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
    padding: 20,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  label: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    backgroundColor: palette.primary,
    borderRadius: 4,
  },
  labelText: {
    fontSize: 12,
    fontWeight: '600',
    color: palette.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  date: {
    fontSize: 13,
    color: palette.textDim,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  position: {
    alignItems: 'flex-start',
  },
  positionRank: {
    fontSize: 28,
    fontWeight: '800',
    color: palette.textPrimary,
    lineHeight: 28,
  },
  positionSup: {
    fontSize: 14,
    fontWeight: '600',
    color: palette.textMuted,
  },
  positionLabel: {
    fontSize: 11,
    color: palette.textDim,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  stats: {
    flex: 1,
    paddingLeft: 24,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: palette.textPrimary,
  },
  statLabel: {
    fontSize: 12,
    color: palette.textDim,
  },
});
