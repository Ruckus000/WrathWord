import React from 'react';
import {View, Text, Pressable, StyleSheet} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {palette} from '../../../../theme/colors';
import {HomeGameSummary} from '../../types';

interface Props {
  gameSummary: HomeGameSummary;
  onContinue: () => void;
  onAbandon: () => void;
}

export function ContinueCard({gameSummary, onContinue, onAbandon}: Props) {
  const {guessesUsed, maxRows, length, mode} = gameSummary;
  const remaining = maxRows - guessesUsed;
  const progress = guessesUsed / maxRows;

  const modeLabel = mode === 'daily' ? 'Daily Challenge' : 'Free Play';

  return (
    <View style={styles.cardWrapper}>
      {/* Gradient border effect */}
      <LinearGradient
        colors={[palette.gradientStart, palette.gradientEnd]}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
        style={styles.gradientBorder}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.headerRow}>
            <Text style={styles.label}>GAME IN PROGRESS</Text>
            <View style={styles.modeBadge}>
              <Text style={styles.modeText}>{modeLabel}</Text>
            </View>
          </View>

          {/* Title */}
          <Text style={styles.title}>{length}-letter word</Text>

          {/* Progress bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressLabels}>
              <Text style={styles.progressText}>
                {guessesUsed} guess{guessesUsed !== 1 ? 'es' : ''} used
              </Text>
              <Text style={styles.progressText}>{remaining} remaining</Text>
            </View>
            <View style={styles.progressBar}>
              <LinearGradient
                colors={[palette.gradientStart, palette.gradientEnd]}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 0}}
                style={[styles.progressFill, {width: `${progress * 100}%`}]}
              />
            </View>
          </View>

          {/* Continue button */}
          <Pressable
            onPress={onContinue}
            style={({pressed}) => [
              styles.continueButton,
              pressed && styles.buttonPressed,
            ]}
            accessibilityLabel="Continue your game"
            accessibilityRole="button">
            <LinearGradient
              colors={[palette.gradientStart, palette.gradientEnd]}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 0}}
              style={styles.buttonGradient}>
              <Text style={styles.buttonText}>Continue</Text>
            </LinearGradient>
          </Pressable>

          {/* Abandon link */}
          <Pressable
            onPress={onAbandon}
            style={styles.abandonButton}
            accessibilityLabel="Abandon this game"
            accessibilityRole="button">
            <Text style={styles.abandonText}>Abandon game</Text>
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
    color: palette.accentPurple,
    letterSpacing: 1,
  },
  modeBadge: {
    backgroundColor: palette.accentPurpleLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  modeText: {
    fontSize: 12,
    fontWeight: '600',
    color: palette.accentPurple,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: palette.textPrimary,
    marginTop: 12,
  },
  progressContainer: {
    marginTop: 16,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 13,
    color: palette.textMuted,
  },
  progressBar: {
    height: 4,
    backgroundColor: palette.tileBorder,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  continueButton: {
    marginTop: 20,
    borderRadius: 12,
    overflow: 'hidden',
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{scale: 0.98}],
  },
  buttonGradient: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: palette.textPrimary,
  },
  abandonButton: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 4,
  },
  abandonText: {
    fontSize: 14,
    color: palette.textDim,
  },
});
