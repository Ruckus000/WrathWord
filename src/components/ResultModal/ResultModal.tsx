// src/components/ResultModal/ResultModal.tsx
import React from 'react';
import {Modal, View, Text, Pressable, Share} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {palette} from '../../theme/colors';
import {
  generateShareText,
  getResultEmoji,
  getResultTitle,
} from '../../logic/shareResult';
import {getStatsForLength} from '../../storage/profile';
import {styles} from './styles';
import type {ResultModalProps} from './types';

export const ResultModal = React.memo(({
  visible,
  status,
  rows,
  maxRows,
  length,
  feedback,
  dateISO,
  answer,
  tileColors,
  playAgainIsFreeMode,
  onPlayAgain,
}: ResultModalProps) => {
  const handleShare = async () => {
    const shareData = generateShareText({
      length,
      maxRows,
      guesses: rows.length,
      won: status === 'won',
      feedback,
      date: dateISO,
    });
    try {
      await Share.share({
        message: shareData.text,
      });
    } catch (_error) {
      // User cancelled or error
    }
  };

  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.modalBackdrop}>
        <View style={styles.resultModalCard}>
          {/* Header */}
          <View style={styles.resultHeader}>
            <Text style={styles.resultEmoji}>
              {getResultEmoji(rows.length, maxRows, status === 'won')}
            </Text>
            <Text style={styles.resultTitle}>
              {getResultTitle(rows.length, maxRows, status === 'won')}
            </Text>
            <Text style={styles.resultSubtitle}>
              {length}×{maxRows} · {new Date(dateISO).toLocaleDateString('en-US', {month: 'short', day: 'numeric'})}
            </Text>
          </View>

          {/* Score and Word Section - Side by Side */}
          <View style={styles.scoreWordRow}>
            {/* Score Section - Smaller, on the left */}
            <View style={styles.scoreSection}>
              <Text style={styles.scoreLabel}>Score</Text>
              <Text style={[styles.scoreValue, status === 'lost' && styles.scoreValueLost]}>
                {status === 'won' ? `${rows.length}/${maxRows}` : `X/${maxRows}`}
              </Text>
            </View>

            {/* Word Display - Larger, on the right */}
            <View style={[styles.wordDisplay, status === 'lost' && styles.wordDisplayLost]}>
              <Text style={[styles.wordLabel, status === 'lost' && styles.wordLabelLost]}>
                {status === 'won' ? 'The word' : 'The word was'}
              </Text>
              <Text style={[styles.wordText, status === 'lost' && styles.wordTextLost]}>
                {answer.toUpperCase()}
              </Text>
            </View>
          </View>

          {/* Grid Section */}
          <View style={styles.gridSection}>
            <Text style={styles.gridLabel}>Your Guesses</Text>
            <View style={styles.guessGrid}>
              {feedback.map((row, rIdx) => (
                <View key={rIdx} style={styles.guessRow}>
                  {row.map((state, cIdx) => {
                    const tileColor =
                      state === 'correct'
                        ? tileColors.correct
                        : state === 'present'
                        ? tileColors.present
                        : tileColors.absent;
                    return (
                      <View
                        key={cIdx}
                        style={[styles.guessTile, {backgroundColor: tileColor}]}
                      />
                    );
                  })}
                </View>
              ))}
            </View>
          </View>

          {/* Streak Display */}
          {(() => {
            const stats = getStatsForLength(length);
            const hasStreak = stats.currentStreak > 0 || stats.maxStreak > 0;
            return hasStreak ? (
              <View style={styles.streakSection}>
                {stats.currentStreak > 0 && (
                  <View style={styles.streakItem}>
                    <Text style={styles.streakLabel}>🔥 Current Streak</Text>
                    <Text style={styles.streakValue}>{stats.currentStreak} days</Text>
                  </View>
                )}
                {stats.maxStreak > 0 && (
                  <View style={styles.streakItem}>
                    <Text style={styles.streakLabel}>⭐ Best Streak</Text>
                    <Text style={styles.streakValue}>{stats.maxStreak} days</Text>
                  </View>
                )}
              </View>
            ) : null;
          })()}

          {/* Buttons */}
          <View style={styles.resultButtonGroup}>
            <Pressable style={styles.btnShare} onPress={handleShare}>
              <Text style={styles.btnShareText}>Share</Text>
            </Pressable>
            <Pressable onPress={onPlayAgain}>
              <LinearGradient
                colors={[palette.gradientStart, palette.gradientEnd]}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 1}}
                style={styles.btnPlayAgain}>
                <Text style={styles.btnPlayAgainText}>
                  {playAgainIsFreeMode ? 'Play Free Mode' : 'Play Again'}
                </Text>
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
});

ResultModal.displayName = 'ResultModal';
