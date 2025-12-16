import React from 'react';
import {View, Text, Pressable, StyleSheet} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {palette} from '../../../../theme/colors';
import {formatShortDate} from '../../../../utils/formatters';
import {StreakBadge} from '../StreakBadge';
import {LeaderboardPreview} from '../LeaderboardPreview';
import {LeaderboardEntry} from '../../types';

interface Props {
  streak: number;
  puzzleNumber: number;
  wordLength: number;
  leaderboardType: 'friends' | 'global';
  leaderboardEntries: LeaderboardEntry[];
  onPlayDaily: () => void;
  onLeaderboardPress: () => void;
}

export function DailyCard({
  streak,
  puzzleNumber,
  wordLength,
  leaderboardType,
  leaderboardEntries,
  onPlayDaily,
  onLeaderboardPress,
}: Props) {
  const today = new Date().toISOString().slice(0, 10);
  const dateDisplay = formatShortDate(today);

  return (
    <View style={styles.cardWrapper}>
      {/* Gradient border effect */}
      <LinearGradient
        colors={[palette.gradientStart, palette.gradientEnd]}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
        style={styles.gradientBorder}>
        <View style={styles.card}>
          {/* Header row */}
          <View style={styles.headerRow}>
            <Text style={styles.label}>DAILY CHALLENGE</Text>
            {streak > 0 && <StreakBadge streak={streak} />}
          </View>

          {/* Date */}
          <Text style={styles.date}>{dateDisplay}</Text>

          {/* Puzzle info */}
          <Text style={styles.puzzleInfo}>
            Puzzle #{puzzleNumber} • {wordLength} letters
          </Text>

          {/* Leaderboard preview */}
          <LeaderboardPreview
            type={leaderboardType}
            entries={leaderboardEntries}
            onPress={onLeaderboardPress}
          />

          {/* Play button */}
          <Pressable
            onPress={onPlayDaily}
            style={({pressed}) => [
              styles.playButton,
              pressed && styles.playButtonPressed,
            ]}
            accessibilityLabel="Play today's daily challenge"
            accessibilityRole="button">
            <LinearGradient
              colors={[palette.gradientStart, palette.gradientEnd]}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 0}}
              style={styles.playButtonGradient}>
              <Text style={styles.playButtonText}>Play Now</Text>
            </LinearGradient>
          </Pressable>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  cardWrapper: {
    marginTop: 8,
  },
  gradientBorder: {
    borderRadius: 20,
    padding: 1,
  },
  card: {
    backgroundColor: palette.card,
    borderRadius: 19,
    padding: 24,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: palette.gradientStart,
    letterSpacing: 1,
  },
  date: {
    fontSize: 32,
    fontWeight: '800',
    color: palette.textPrimary,
    marginTop: 8,
  },
  puzzleInfo: {
    fontSize: 13,
    color: palette.textMuted,
    marginTop: 4,
  },
  playButton: {
    marginTop: 20,
    borderRadius: 12,
    overflow: 'hidden',
  },
  playButtonPressed: {
    opacity: 0.9,
    transform: [{scale: 0.98}],
  },
  playButtonGradient: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  playButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: palette.textPrimary,
  },
});
