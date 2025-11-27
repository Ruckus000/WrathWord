import React from 'react';
import {View, Text, StyleSheet, Pressable, Modal} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {palette} from '../../theme/colors';
import {Friend, MOCK_USER} from '../../data/mockFriends';

type Props = {
  visible: boolean;
  friend: Friend | null;
  onClose: () => void;
};

type StatRow = {
  label: string;
  you: number;
  them: number;
  format: (v: number) => string;
  lowerIsBetter: boolean;
};

export default function HeadToHeadModal({visible, friend, onClose}: Props) {
  if (!friend) return null;

  const stats: StatRow[] = [
    {
      label: 'Win Rate',
      you: MOCK_USER.stats.winRate,
      them: friend.stats.winRate,
      format: (v: number) => `${v}%`,
      lowerIsBetter: false,
    },
    {
      label: 'Avg. Guesses',
      you: MOCK_USER.stats.avgGuesses,
      them: friend.stats.avgGuesses,
      format: (v: number) => v.toFixed(1),
      lowerIsBetter: true,
    },
    {
      label: 'Current Streak',
      you: MOCK_USER.streak,
      them: friend.streak,
      format: (v: number) => String(v),
      lowerIsBetter: false,
    },
    {
      label: 'Best Streak',
      you: MOCK_USER.stats.maxStreak,
      them: friend.stats.maxStreak,
      format: (v: number) => String(v),
      lowerIsBetter: false,
    },
    {
      label: 'Games Played',
      you: MOCK_USER.stats.played,
      them: friend.stats.played,
      format: (v: number) => String(v),
      lowerIsBetter: false,
    },
  ];

  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={e => e.stopPropagation()}>
          {/* Handle */}
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Head to Head</Text>
            <View style={styles.versus}>
              <View style={styles.player}>
                <LinearGradient
                  colors={[palette.avatarBlueStart, palette.avatarBlueEnd]}
                  start={{x: 0, y: 0}}
                  end={{x: 1, y: 1}}
                  style={styles.avatar}>
                  <Text style={styles.avatarText}>{MOCK_USER.letter}</Text>
                </LinearGradient>
                <Text style={styles.playerName}>You</Text>
              </View>
              <View style={styles.vsBadge}>
                <Text style={styles.vsText}>VS</Text>
              </View>
              <View style={styles.player}>
                <LinearGradient
                  colors={[palette.avatarPurpleStart, palette.avatarPurpleEnd]}
                  start={{x: 0, y: 0}}
                  end={{x: 1, y: 1}}
                  style={styles.avatar}>
                  <Text style={styles.avatarText}>{friend.letter}</Text>
                </LinearGradient>
                <Text style={styles.playerName}>{friend.name}</Text>
              </View>
            </View>
          </View>

          {/* Record */}
          <View style={styles.record}>
            <Text
              style={[
                styles.score,
                friend.h2h.yourWins > friend.h2h.theirWins
                  ? styles.scoreWinning
                  : styles.scoreLosing,
              ]}>
              {friend.h2h.yourWins}
            </Text>
            <Text style={styles.dash}>–</Text>
            <Text
              style={[
                styles.score,
                friend.h2h.theirWins > friend.h2h.yourWins
                  ? styles.scoreWinning
                  : styles.scoreLosing,
              ]}>
              {friend.h2h.theirWins}
            </Text>
          </View>

          {/* Stats */}
          <View style={styles.stats}>
            {stats.map(stat => {
              const youBetter = stat.lowerIsBetter
                ? stat.you < stat.them
                : stat.you > stat.them;
              const themBetter = stat.lowerIsBetter
                ? stat.them < stat.you
                : stat.them > stat.you;
              const equal = stat.you === stat.them;

              return (
                <View key={stat.label} style={styles.statRow}>
                  <Text
                    style={[
                      styles.statValue,
                      youBetter && styles.statBetter,
                      themBetter && styles.statWorse,
                      equal && styles.statEqual,
                    ]}>
                    {stat.format(stat.you)}
                  </Text>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                  <Text
                    style={[
                      styles.statValue,
                      themBetter && styles.statBetter,
                      youBetter && styles.statWorse,
                      equal && styles.statEqual,
                    ]}>
                    {stat.format(stat.them)}
                  </Text>
                </View>
              );
            })}
          </View>

          {/* Close Button */}
          <Pressable style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>Done</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: palette.bgElevated,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 34,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: palette.cardBorder,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    color: palette.textDim,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 16,
  },
  versus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  player: {
    alignItems: 'center',
    gap: 8,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '700',
    color: palette.textPrimary,
  },
  playerName: {
    fontSize: 15,
    fontWeight: '600',
    color: palette.textPrimary,
  },
  vsBadge: {
    backgroundColor: palette.card,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  vsText: {
    fontSize: 12,
    fontWeight: '700',
    color: palette.textDim,
  },
  record: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'baseline',
    gap: 8,
    marginBottom: 28,
  },
  score: {
    fontSize: 42,
    fontWeight: '800',
    letterSpacing: -2,
  },
  scoreWinning: {
    color: palette.success,
  },
  scoreLosing: {
    color: palette.textDim,
  },
  dash: {
    fontSize: 32,
    fontWeight: '300',
    color: palette.textDim,
  },
  stats: {
    backgroundColor: palette.card,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: palette.cardBorder,
  },
  statValue: {
    width: 80,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  statBetter: {
    color: palette.success,
  },
  statWorse: {
    color: palette.textDim,
  },
  statEqual: {
    color: palette.textMuted,
  },
  statLabel: {
    flex: 1,
    fontSize: 14,
    color: palette.textMuted,
    textAlign: 'center',
  },
  closeBtn: {
    backgroundColor: palette.card,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  closeBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: palette.textPrimary,
  },
});
