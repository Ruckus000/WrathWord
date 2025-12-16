import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {palette} from '../../../theme/colors';

interface Props {
  winRate: number;
  avgGuesses: number;
}

export function StatCards({winRate, avgGuesses}: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.value}>{winRate}%</Text>
        <Text style={styles.label}>Win Rate</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.value}>{avgGuesses.toFixed(1)}</Text>
        <Text style={styles.label}>Avg Guesses</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  card: {
    flex: 1,
    backgroundColor: palette.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.borderLight,
    padding: 16,
    alignItems: 'center',
  },
  value: {
    fontSize: 22,
    fontWeight: '800',
    color: palette.textPrimary,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: palette.textMuted,
    marginTop: 4,
  },
});
