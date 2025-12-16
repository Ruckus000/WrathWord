import React, {useEffect, useRef} from 'react';
import {View, StyleSheet, Animated} from 'react-native';
import {palette} from '../../../theme/colors';

/**
 * Skeleton loading state for HomeScreen
 * Shows shimmer placeholders matching the layout
 */
export function HomeScreenSkeleton() {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const shimmer = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    );
    shimmer.start();
    return () => shimmer.stop();
  }, [shimmerAnim]);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <View style={styles.container}>
      {/* Header skeleton */}
      <View style={styles.header}>
        <Animated.View style={[styles.logoSkeleton, {opacity}]} />
        <Animated.View style={[styles.avatarSkeleton, {opacity}]} />
      </View>

      {/* Hero card skeleton */}
      <Animated.View style={[styles.heroCard, {opacity}]}>
        <View style={styles.heroLabel} />
        <View style={styles.heroDate} />
        <View style={styles.heroInfo} />

        {/* Leaderboard skeleton */}
        <View style={styles.leaderboardSection}>
          {[1, 2, 3].map(i => (
            <View key={i} style={styles.leaderboardRow}>
              <View style={styles.leaderboardAvatar} />
              <View style={styles.leaderboardName} />
              <View style={styles.leaderboardGuesses} />
            </View>
          ))}
        </View>

        <View style={styles.heroButton} />
      </Animated.View>

      {/* Stat cards skeleton */}
      <View style={styles.statRow}>
        <Animated.View style={[styles.statCard, {opacity}]} />
        <Animated.View style={[styles.statCard, {opacity}]} />
      </View>

      {/* Free play button skeleton */}
      <Animated.View style={[styles.freePlaySkeleton, {opacity}]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  logoSkeleton: {
    width: 120,
    height: 28,
    backgroundColor: palette.card,
    borderRadius: 8,
  },
  avatarSkeleton: {
    width: 40,
    height: 40,
    backgroundColor: palette.card,
    borderRadius: 12,
  },
  heroCard: {
    backgroundColor: palette.card,
    borderRadius: 20,
    padding: 20,
    marginTop: 8,
  },
  heroLabel: {
    width: 120,
    height: 12,
    backgroundColor: palette.bg,
    borderRadius: 4,
  },
  heroDate: {
    width: 80,
    height: 32,
    backgroundColor: palette.bg,
    borderRadius: 8,
    marginTop: 8,
  },
  heroInfo: {
    width: 140,
    height: 14,
    backgroundColor: palette.bg,
    borderRadius: 4,
    marginTop: 8,
  },
  leaderboardSection: {
    backgroundColor: palette.bg,
    borderRadius: 12,
    padding: 12,
    marginTop: 16,
    gap: 12,
  },
  leaderboardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  leaderboardAvatar: {
    width: 28,
    height: 28,
    backgroundColor: palette.card,
    borderRadius: 8,
  },
  leaderboardName: {
    flex: 1,
    height: 14,
    backgroundColor: palette.card,
    borderRadius: 4,
  },
  leaderboardGuesses: {
    width: 60,
    height: 12,
    backgroundColor: palette.card,
    borderRadius: 4,
  },
  heroButton: {
    height: 48,
    backgroundColor: palette.bg,
    borderRadius: 12,
    marginTop: 16,
  },
  statRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  statCard: {
    flex: 1,
    height: 80,
    backgroundColor: palette.card,
    borderRadius: 16,
  },
  freePlaySkeleton: {
    height: 76,
    backgroundColor: palette.card,
    borderRadius: 14,
    marginTop: 16,
  },
});
