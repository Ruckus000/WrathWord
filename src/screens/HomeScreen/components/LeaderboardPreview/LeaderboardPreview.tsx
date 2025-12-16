import React from 'react';
import {View, Text, Pressable, StyleSheet} from 'react-native';
import {palette} from '../../../../theme/colors';
import {LeaderboardEntry} from '../../types';
import {LeaderboardRow} from './LeaderboardRow';

interface Props {
  type: 'friends' | 'global';
  entries: LeaderboardEntry[];
  onPress: () => void;
}

export function LeaderboardPreview({type, entries, onPress}: Props) {
  const hasEntries = entries.length > 0;

  return (
    <Pressable
      onPress={onPress}
      style={({pressed}) => [
        styles.container,
        pressed && styles.containerPressed,
      ]}
      accessibilityLabel="Today's leaderboard, tap to view full leaderboard"
      accessibilityRole="button">
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Today's Leaderboard</Text>
      </View>

      {/* Entries */}
      {hasEntries ? (
        <View style={styles.entries}>
          {entries.map(entry => (
            <LeaderboardRow key={entry.id} entry={entry} />
          ))}
        </View>
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            {type === 'friends'
              ? 'Be the first to play today!'
              : 'No results yet today'}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: palette.bg,
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
  },
  containerPressed: {
    opacity: 0.8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  title: {
    fontSize: 11,
    fontWeight: '600',
    color: palette.textMuted,
  },
  entries: {
    gap: 8,
  },
  emptyContainer: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: palette.textDim,
    fontStyle: 'italic',
  },
});
