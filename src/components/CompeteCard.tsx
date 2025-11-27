import React from 'react';
import {View, Text, StyleSheet, Pressable} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {palette} from '../theme/colors';
import {ChevronRight} from './icons/SettingsIcons';

type FriendAvatar = {
  id: string;
  name: string;
  letter: string;
  isYou?: boolean;
  isFirst?: boolean;
};

type Props = {
  userRank: number;
  totalPlayed: number;
  waitingCount: number;
  topFriends: FriendAvatar[];
  onPress: () => void;
};

function getOrdinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function Avatar({friend}: {friend: FriendAvatar}) {
  let colors: [string, string];
  if (friend.isFirst) {
    colors = [palette.gold, palette.goldEnd];
  } else if (friend.isYou) {
    colors = [palette.avatarBlueStart, palette.avatarBlueEnd];
  } else {
    colors = [palette.avatarPurpleStart, palette.avatarPurpleEnd];
  }

  return (
    <LinearGradient
      colors={colors}
      start={{x: 0, y: 0}}
      end={{x: 1, y: 1}}
      style={styles.avatar}>
      <Text style={styles.avatarText}>{friend.letter}</Text>
    </LinearGradient>
  );
}

export default function CompeteCard({
  userRank,
  totalPlayed,
  waitingCount,
  topFriends,
  onPress,
}: Props) {
  return (
    <Pressable
      style={({pressed}) => [styles.card, pressed && styles.cardPressed]}
      onPress={onPress}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.icon}>🏆</Text>
          <Text style={styles.title}>Compete</Text>
        </View>
        <ChevronRight size={16} color={palette.textDim} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.status}>
          <Text style={styles.rankText}>
            You're{' '}
            <Text style={styles.rankHighlight}>{getOrdinal(userRank)}</Text> of{' '}
            {totalPlayed} today
          </Text>
          {waitingCount > 0 && (
            <Text style={styles.waitingText}>
              {waitingCount} friend{waitingCount !== 1 ? 's' : ''} still playing
            </Text>
          )}
        </View>

        {/* Friend Avatars */}
        <View style={styles.avatars}>
          {topFriends.slice(0, 3).map((friend, idx) => (
            <View
              key={friend.id}
              style={[styles.avatarWrap, idx === 0 && styles.avatarFirst]}>
              <Avatar friend={friend} />
            </View>
          ))}
          {waitingCount > 0 && (
            <View style={[styles.avatarWrap, styles.avatarWaiting]}>
              <Text style={styles.avatarWaitingText}>+{waitingCount}</Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.successDim,
    borderWidth: 1,
    borderColor: palette.successBorder,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 24,
  },
  cardPressed: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    borderColor: 'rgba(34, 197, 94, 0.35)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  icon: {
    fontSize: 18,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: palette.textPrimary,
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  status: {
    gap: 4,
  },
  rankText: {
    fontSize: 14,
    color: palette.textPrimary,
    fontWeight: '500',
  },
  rankHighlight: {
    color: palette.success,
    fontWeight: '700',
  },
  waitingText: {
    fontSize: 13,
    color: palette.textMuted,
  },
  avatars: {
    flexDirection: 'row',
  },
  avatarWrap: {
    marginLeft: -8,
  },
  avatarFirst: {
    marginLeft: 0,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: palette.bg,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '600',
    color: palette.textPrimary,
  },
  avatarWaiting: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.card,
    borderWidth: 2,
    borderColor: palette.cardBorder,
  },
  avatarWaitingText: {
    fontSize: 12,
    color: palette.textDim,
  },
});
