import React from 'react';
import {View, Text, Pressable, StyleSheet, Share} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {palette} from '../../../../theme/colors';
import {formatShortDate} from '../../../../utils/formatters';
import {StreakBadge} from '../StreakBadge';
import {LeaderboardPreview} from '../LeaderboardPreview';
import {HomeGameSummary, LeaderboardEntry} from '../../types';
import {TileState} from '../../../../logic/evaluateGuess';
import {getTileColors} from '../../../../theme/getColors';

interface Props {
  gameSummary: HomeGameSummary | null;
  streak: number;
  leaderboardType: 'friends' | 'global';
  leaderboardEntries: LeaderboardEntry[];
  onFreePlay: () => void;
  onLeaderboardPress: () => void;
}

function MiniGrid({feedback}: {feedback: TileState[][]}) {
  const tileColors = getTileColors();

  return (
    <View style={styles.miniGrid}>
      {feedback.slice(0, 6).map((row, rowIdx) => (
        <View key={rowIdx} style={styles.miniRow}>
          {row.map((state, colIdx) => {
            let bgColor = palette.tileEmpty;
            if (state === 'correct') bgColor = tileColors.correct;
            else if (state === 'present') bgColor = tileColors.present;
            else if (state === 'absent') bgColor = tileColors.absent;

            return (
              <View
                key={colIdx}
                style={[styles.miniTile, {backgroundColor: bgColor}]}
              />
            );
          })}
        </View>
      ))}
    </View>
  );
}

export function CompletedCard({
  gameSummary,
  streak,
  leaderboardType,
  leaderboardEntries,
  onFreePlay,
  onLeaderboardPress,
}: Props) {
  const today = new Date().toISOString().slice(0, 10);
  const dateDisplay = formatShortDate(today);
  const won = gameSummary?.status === 'won';
  const guesses = gameSummary?.guessesUsed ?? 0;
  const feedback = gameSummary?.feedback ?? [];

  const handleShare = async () => {
    const resultEmoji = won ? '🎉' : '😔';
    const guessText = won ? `${guesses}/6` : 'X/6';
    const message = `WrathWord ${dateDisplay} ${resultEmoji}\n${guessText}\n\nPlay at: https://wrathword.app`;

    try {
      await Share.share({message});
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  return (
    <View style={styles.cardWrapper}>
      {/* Gradient border effect */}
      <LinearGradient
        colors={
          won
            ? [palette.success, palette.accentTeal]
            : [palette.textDim, palette.textMuted]
        }
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
        style={styles.gradientBorder}>
        <View style={styles.card}>
          {/* Header row */}
          <View style={styles.headerRow}>
            <Text style={[styles.label, won && styles.labelWon]}>
              {won ? 'COMPLETED!' : 'GAME OVER'}
            </Text>
            {streak > 0 && <StreakBadge streak={streak} />}
          </View>

          {/* Result row */}
          <View style={styles.resultRow}>
            {/* Mini grid */}
            {feedback.length > 0 && <MiniGrid feedback={feedback} />}

            {/* Result text */}
            <View style={styles.resultText}>
              <Text style={styles.resultEmoji}>{won ? '🎉' : '😔'}</Text>
              <Text style={styles.resultTitle}>
                {won ? 'Nice!' : 'Better luck tomorrow'}
              </Text>
              <Text style={styles.resultSubtitle}>
                {won
                  ? `Solved in ${guesses} guess${guesses !== 1 ? 'es' : ''}`
                  : 'You ran out of guesses'}
              </Text>
            </View>
          </View>

          {/* Leaderboard preview */}
          <LeaderboardPreview
            type={leaderboardType}
            entries={leaderboardEntries}
            onPress={onLeaderboardPress}
          />

          {/* Action buttons */}
          <View style={styles.buttonRow}>
            {/* Share button */}
            <Pressable
              onPress={handleShare}
              style={({pressed}) => [
                styles.shareButton,
                pressed && styles.buttonPressed,
              ]}
              accessibilityLabel="Share your result"
              accessibilityRole="button">
              <Text style={styles.shareIcon}>📤</Text>
              <Text style={styles.shareText}>Share</Text>
            </Pressable>

            {/* Free Play button */}
            <Pressable
              onPress={onFreePlay}
              style={({pressed}) => [
                styles.freePlayButton,
                pressed && styles.buttonPressed,
              ]}
              accessibilityLabel="Play free mode"
              accessibilityRole="button">
              <LinearGradient
                colors={[palette.gradientStart, palette.gradientEnd]}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 0}}
                style={styles.freePlayGradient}>
                <Text style={styles.freePlayText}>Play Free Mode</Text>
              </LinearGradient>
            </Pressable>
          </View>
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
    color: palette.textMuted,
    letterSpacing: 1,
  },
  labelWon: {
    color: palette.success,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    gap: 16,
  },
  miniGrid: {
    gap: 3,
  },
  miniRow: {
    flexDirection: 'row',
    gap: 3,
  },
  miniTile: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },
  resultText: {
    flex: 1,
  },
  resultEmoji: {
    fontSize: 28,
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: palette.textPrimary,
    marginTop: 4,
  },
  resultSubtitle: {
    fontSize: 14,
    color: palette.textMuted,
    marginTop: 2,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.tile,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.borderLight,
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 6,
  },
  shareIcon: {
    fontSize: 16,
  },
  shareText: {
    fontSize: 14,
    fontWeight: '600',
    color: palette.textPrimary,
  },
  freePlayButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{scale: 0.98}],
  },
  freePlayGradient: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  freePlayText: {
    fontSize: 14,
    fontWeight: '700',
    color: palette.textPrimary,
  },
});
