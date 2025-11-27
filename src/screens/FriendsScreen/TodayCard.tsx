import React, {useRef, useEffect} from 'react';
import {View, Text, StyleSheet, Animated} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {palette} from '../../theme/colors';
import {TileState} from '../../logic/evaluateGuess';
import {Friend} from '../../data/mockFriends';
import MiniResultGrid from './MiniResultGrid';

type Props = {
  userRank: number;
  totalPlayed: number;
  guesses: number;
  feedback?: TileState[][];
  friendsPlayed: Friend[];
  friendsWaiting: Friend[];
};

function getOrdinalSuffix(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

export default function TodayCard({
  userRank,
  totalPlayed,
  guesses,
  feedback,
  friendsPlayed,
  friendsWaiting,
}: Props) {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.5,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  const betterThanPercent = Math.round(
    ((totalPlayed - userRank) / totalPlayed) * 100,
  );

  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  return (
    <LinearGradient
      colors={['rgba(34, 197, 94, 0.08)', 'rgba(59, 130, 246, 0.08)']}
      start={{x: 0, y: 0}}
      end={{x: 1, y: 1}}
      style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.label}>
          <Animated.View style={[styles.dot, {opacity: pulseAnim}]} />
          <Text style={styles.labelText}>Today's Challenge</Text>
        </View>
        <Text style={styles.date}>{dateStr}</Text>
      </View>

      {/* Result */}
      <View style={styles.result}>
        {feedback && <MiniResultGrid feedback={feedback} />}

        <View style={styles.resultInfo}>
          <Text style={styles.resultTitle}>Solved in {guesses}</Text>
          <Text style={styles.resultSubtitle}>
            Better than {betterThanPercent}% of friends
          </Text>
        </View>

        <View style={styles.position}>
          <Text style={styles.positionRank}>
            {userRank}
            <Text style={styles.positionSup}>{getOrdinalSuffix(userRank)}</Text>
          </Text>
          <Text style={styles.positionLabel}>of {totalPlayed} played</Text>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.avatars}>
          {friendsPlayed.slice(0, 3).map((friend, idx) => (
            <LinearGradient
              key={friend.id}
              colors={[palette.avatarPurpleStart, palette.avatarPurpleEnd]}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 1}}
              style={[styles.avatar, idx === 0 && styles.avatarFirst]}>
              <Text style={styles.avatarText}>{friend.letter}</Text>
            </LinearGradient>
          ))}
          {friendsWaiting.length > 0 && (
            <View style={[styles.avatar, styles.avatarWaiting]}>
              <Text style={styles.avatarWaitingText}>
                +{friendsWaiting.length}
              </Text>
            </View>
          )}
        </View>
        <Text style={styles.friendsStatus}>
          <Text style={styles.friendsStatusBold}>{friendsWaiting.length}</Text>{' '}
          friends waiting
        </Text>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
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
  date: {
    fontSize: 13,
    color: palette.textDim,
  },
  result: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 20,
  },
  resultInfo: {
    flex: 1,
  },
  resultTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: palette.textPrimary,
    marginBottom: 2,
  },
  resultSubtitle: {
    fontSize: 14,
    color: palette.textMuted,
  },
  position: {
    alignItems: 'flex-end',
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
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  avatars: {
    flexDirection: 'row',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -8,
    borderWidth: 2,
    borderColor: palette.bg,
  },
  avatarFirst: {
    marginLeft: 0,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '600',
    color: palette.textPrimary,
  },
  avatarWaiting: {
    backgroundColor: palette.card,
    borderColor: palette.cardBorder,
  },
  avatarWaitingText: {
    fontSize: 12,
    color: palette.textDim,
  },
  friendsStatus: {
    fontSize: 13,
    color: palette.textMuted,
  },
  friendsStatusBold: {
    fontWeight: '700',
    color: palette.textPrimary,
  },
});
