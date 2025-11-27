import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {palette} from '../../theme/colors';

type Props = {
  userRank: number;
  totalFriends: number;
};

function getOrdinalSuffix(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

export default function WeekCard({userRank, totalFriends}: Props) {
  return (
    <LinearGradient
      colors={['rgba(34, 197, 94, 0.08)', 'rgba(59, 130, 246, 0.08)']}
      start={{x: 0, y: 0}}
      end={{x: 1, y: 1}}
      style={styles.card}>
      <View style={styles.header}>
        <View style={styles.label}>
          <View style={styles.dot} />
          <Text style={styles.labelText}>This Week</Text>
        </View>
      </View>
      <View style={styles.position}>
        <Text style={styles.positionRank}>
          {userRank}
          <Text style={styles.positionSup}>{getOrdinalSuffix(userRank)}</Text>
        </Text>
        <Text style={styles.positionLabel}>of {totalFriends} friends</Text>
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
    borderColor: 'rgba(34, 197, 94, 0.2)',
    padding: 20,
    overflow: 'hidden',
  },
  header: {
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
    backgroundColor: palette.success,
    borderRadius: 4,
  },
  labelText: {
    fontSize: 12,
    fontWeight: '600',
    color: palette.success,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
});
