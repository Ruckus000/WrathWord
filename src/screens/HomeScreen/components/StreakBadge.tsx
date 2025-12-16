import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {palette} from '../../../theme/colors';

interface Props {
  streak: number;
}

export function StreakBadge({streak}: Props) {
  if (streak === 0) {
    return null;
  }

  return (
    <View style={styles.badge} accessibilityLabel={`${streak} day streak`}>
      <Text style={styles.emoji}>🔥</Text>
      <Text style={styles.count}>{streak}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.streakBg,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(251, 146, 60, 0.2)',
    gap: 6,
  },
  emoji: {
    fontSize: 16,
  },
  count: {
    fontSize: 18,
    fontWeight: '700',
    color: palette.streakOrange,
  },
});
