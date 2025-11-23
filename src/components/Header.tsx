// src/components/Header.tsx
import React from 'react';
import {View, Text, StyleSheet, Pressable} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import ProfileAvatar from './ProfileAvatar';
import {palette} from '../theme/colors';

type Props = {
  mode: 'daily' | 'free';
  length: number;
  maxRows: number;
  formattedDate?: string;
  onMenuPress?: () => void;
  onAvatarPress?: () => void;
  onNewGamePress: () => void;
};

export default function Header({
  mode,
  length,
  maxRows,
  formattedDate,
  onMenuPress,
  onAvatarPress,
  onNewGamePress,
}: Props) {
  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        {onMenuPress && (
          <Pressable style={styles.menuBtn} onPress={onMenuPress}>
            <Text style={styles.menuIcon}>☰</Text>
          </Pressable>
        )}
        {onAvatarPress && <ProfileAvatar letter="W" size="small" onPress={onAvatarPress} />}
      </View>

      <View style={styles.gameInfo}>
        <View style={[styles.modeIndicator, mode === 'free' && styles.modeIndicatorFree]}>
          <View style={[styles.modeDot, mode === 'free' && styles.modeDotFree]} />
          <Text style={styles.modeText}>{mode === 'daily' ? 'Daily' : 'Free'}</Text>
        </View>
        <View style={styles.configDisplay}>
          <Text style={styles.configText}>
            {length}×{maxRows}
          </Text>
        </View>
      </View>

      <View style={styles.headerRight}>
        <Pressable onPress={onNewGamePress}>
          <LinearGradient
            colors={[palette.gradientStart, palette.gradientEnd]}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
            style={styles.newGameBtn}>
            <Text style={styles.newGameBtnText}>New</Text>
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 0,
    paddingVertical: 16,
    minHeight: 60,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexShrink: 0,
    minWidth: 0,
  },
  menuBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: palette.tileEmpty,
    borderWidth: 1,
    borderColor: palette.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuIcon: {
    fontSize: 20,
    color: palette.textPrimary,
  },
  gameInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 1,
    maxWidth: '50%',
  },
  modeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: palette.tileEmpty,
    borderWidth: 1,
    borderColor: palette.borderLight,
    borderRadius: 20,
    flexShrink: 1,
  },
  modeIndicatorFree: {
    // Could have different styling for free mode
  },
  modeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: palette.success,
  },
  modeDotFree: {
    backgroundColor: palette.gradientStart,
  },
  modeText: {
    fontSize: 13,
    color: palette.textMuted,
    fontWeight: '500',
  },
  configDisplay: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: palette.accentPurpleLight,
    borderWidth: 1,
    borderColor: palette.accentPurpleBorder,
    borderRadius: 8,
    flexShrink: 1,
  },
  configText: {
    fontSize: 14,
    fontWeight: '600',
    color: palette.accentPurple,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
    minWidth: 0,
  },
  newGameBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  newGameBtnText: {
    color: palette.textPrimary,
    fontWeight: '600',
    fontSize: 13,
  },
});
