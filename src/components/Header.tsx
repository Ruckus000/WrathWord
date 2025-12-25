// src/components/Header.tsx
import React from 'react';
import {View, Text, StyleSheet, Pressable} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {palette} from '../theme/colors';
import {logger} from '../utils/logger';

type Props = {
  mode: 'daily' | 'free';
  length: number;
  maxRows: number;
  formattedDate?: string;
  onMenuPress?: () => void;
  onNewGamePress: () => void;
  onHintPress?: () => void;
  hintDisabled?: boolean;
};

export default function Header({
  mode,
  length,
  maxRows,
  formattedDate,
  onMenuPress,
  onNewGamePress,
  onHintPress,
  hintDisabled,
}: Props) {
  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        {onMenuPress && (
          <Pressable
            style={styles.menuBtn}
            onPress={() => {
              logger.log('[Header] Settings button pressed');
              onMenuPress();
            }}
            accessibilityLabel="Settings"
            accessibilityRole="button">
            <Text style={styles.menuIcon}>⚙️</Text>
          </Pressable>
        )}
      </View>

      <View style={styles.gameInfo}>
        <View style={[styles.modeIndicator, mode === 'free' && styles.modeIndicatorFree]}>
          <View style={[styles.modeDot, mode === 'free' && styles.modeDotFree]} />
          <Text style={styles.modeText} numberOfLines={1}>{mode === 'daily' ? 'Daily' : 'Free'}</Text>
        </View>
      </View>

      <View style={styles.headerRight}>
        {onHintPress && (
          <Pressable
            style={[styles.hintBtn, hintDisabled && styles.hintBtnDisabled]}
            onPress={() => {
              logger.log('[Header] Hint button pressed, hintDisabled:', hintDisabled);
              if (!hintDisabled) {
                onHintPress();
              }
            }}
            disabled={hintDisabled}
            accessibilityLabel={hintDisabled ? 'Hint already used' : 'Use hint to reveal one letter'}
            accessibilityRole="button"
            accessibilityState={{disabled: hintDisabled}}>
            <Text style={styles.hintIcon}>💡</Text>
          </Pressable>
        )}
        <Pressable onPress={() => {
          logger.log('[Header] New button pressed');
          onNewGamePress();
        }}>
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
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    paddingHorizontal: 0,
    paddingVertical: 16,
    minHeight: 60,
  },
  headerLeft: {
    position: 'absolute',
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
    justifyContent: 'center',
    gap: 8,
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
  headerRight: {
    position: 'absolute',
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
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
  hintBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: palette.accentPurpleLight,
    borderWidth: 1,
    borderColor: palette.accentPurpleBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hintBtnDisabled: {
    backgroundColor: palette.tileEmpty,
    borderColor: palette.borderLight,
    opacity: 0.4,
  },
  hintIcon: {
    fontSize: 18,
  },
});
