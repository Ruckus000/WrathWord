// src/components/Header.tsx
import React, {useCallback} from 'react';
import {View, Text, StyleSheet, Pressable} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {palette} from '../theme/colors';
import {logger} from '../utils/logger';
import {SettingsGearIcon, HelpCircleIcon} from './icons/HeaderIcons';
import {PlusIcon} from './icons/SettingsIcons';

type Props = {
  mode: 'daily' | 'free';
  onMenuPress?: () => void;
  onNewGamePress: () => void;
  onHelpPress?: () => void;
};

function Header({mode, onMenuPress, onNewGamePress, onHelpPress}: Props) {
  const handleMenuPress = useCallback(() => {
    logger.log('[Header] Settings button pressed');
    onMenuPress?.();
  }, [onMenuPress]);

  const handleHelpPress = useCallback(() => {
    logger.log('[Header] Help button pressed');
    onHelpPress?.();
  }, [onHelpPress]);

  const handleNewGamePress = useCallback(() => {
    logger.log('[Header] New button pressed');
    onNewGamePress();
  }, [onNewGamePress]);

  return (
    <View style={styles.header}>
      {/* Left: Settings */}
      <View style={styles.headerLeft}>
        {onMenuPress && (
          <Pressable
            style={({pressed}) => [
              styles.iconBtnBase,
              styles.settingsBtn,
              pressed && styles.settingsBtnPressed,
            ]}
            onPress={handleMenuPress}
            accessibilityLabel="Settings"
            accessibilityRole="button">
            <SettingsGearIcon size={20} color={palette.textMuted} />
          </Pressable>
        )}
      </View>

      {/* Center: Mode indicator */}
      <View style={styles.gameInfo}>
        <View style={styles.modeIndicator}>
          <View style={[styles.modeDot, mode === 'free' && styles.modeDotFree]} />
          <Text style={styles.modeText} numberOfLines={1}>
            {mode === 'daily' ? 'Daily' : 'Free'}
          </Text>
        </View>
      </View>

      {/* Right: Help + New */}
      <View style={styles.headerRight}>
        {onHelpPress && (
          <Pressable
            style={({pressed}) => [
              styles.iconBtnBase,
              styles.helpBtn,
              pressed && styles.helpBtnPressed,
            ]}
            onPress={handleHelpPress}
            accessibilityLabel="Help"
            accessibilityHint="Use hint or learn how to play"
            accessibilityRole="button">
            <HelpCircleIcon size={18} color={palette.textMuted} />
          </Pressable>
        )}
        <Pressable
          style={({pressed}) => [
            styles.newGameBtnWrapper,
            pressed && styles.newGameBtnPressed,
          ]}
          onPress={handleNewGamePress}
          accessibilityLabel="New game"
          accessibilityRole="button">
          <LinearGradient
            colors={[palette.gradientStart, palette.gradientEnd]}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
            style={styles.newGameBtnGradient}>
            <PlusIcon size={18} color={palette.textPrimary} />
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}

export default React.memo(Header);

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
  },

  // Shared base for 40x40 icon buttons (DRY)
  iconBtnBase: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Settings button specifics
  settingsBtn: {
    backgroundColor: palette.tileEmpty,
    borderWidth: 1,
    borderColor: palette.borderLight,
  },
  settingsBtnPressed: {
    backgroundColor: palette.keyPressed,
  },

  // Center mode indicator
  gameInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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

  // Right section
  headerRight: {
    position: 'absolute',
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  // Help button specifics
  helpBtn: {
    backgroundColor: palette.accentPurpleLight,
    borderWidth: 1,
    borderColor: palette.accentPurpleBorder,
  },
  helpBtnPressed: {
    backgroundColor: palette.accentPurpleBorder,
  },

  // New game button - wrapper pattern (matches ResultModal)
  newGameBtnWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
  },
  newGameBtnGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  newGameBtnPressed: {
    opacity: 0.8,
    transform: [{scale: 0.96}],
  },
});
