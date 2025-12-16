import React from 'react';
import {View, Text, Pressable, StyleSheet} from 'react-native';
import {palette} from '../../../theme/colors';

interface Props {
  message?: string;
  onRetry: () => void;
}

export function ErrorCard({message, onRetry}: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>😔</Text>
      <Text style={styles.title}>Something went wrong</Text>
      <Text style={styles.message}>
        {message || "Couldn't load leaderboard data"}
      </Text>
      <Pressable
        onPress={onRetry}
        style={({pressed}) => [
          styles.retryButton,
          pressed && styles.retryButtonPressed,
        ]}
        accessibilityLabel="Retry loading"
        accessibilityRole="button">
        <Text style={styles.retryText}>Try Again</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: palette.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.borderLight,
    padding: 24,
    alignItems: 'center',
    marginTop: 16,
  },
  emoji: {
    fontSize: 32,
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: palette.textPrimary,
    marginBottom: 4,
  },
  message: {
    fontSize: 14,
    color: palette.textMuted,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: palette.tile,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: palette.borderLight,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginTop: 16,
  },
  retryButtonPressed: {
    opacity: 0.8,
  },
  retryText: {
    fontSize: 14,
    fontWeight: '600',
    color: palette.textPrimary,
  },
});
