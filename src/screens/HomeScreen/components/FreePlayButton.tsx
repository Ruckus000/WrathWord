import React from 'react';
import {View, Text, Pressable, StyleSheet} from 'react-native';
import {palette} from '../../../theme/colors';

interface Props {
  disabled: boolean;
  onPress: () => void;
}

export function FreePlayButton({disabled, onPress}: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({pressed}) => [
        styles.button,
        pressed && !disabled && styles.buttonPressed,
        disabled && styles.buttonDisabled,
      ]}
      accessibilityLabel={
        disabled ? 'Free Play (finish current game first)' : 'Play Free Mode'
      }
      accessibilityRole="button"
      accessibilityState={{disabled}}>
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>🎲</Text>
      </View>

      <View style={styles.textContainer}>
        <Text style={[styles.title, disabled && styles.textDisabled]}>
          Free Play
        </Text>
        <Text style={[styles.subtitle, disabled && styles.textDisabled]}>
          {disabled ? 'Finish current game first' : 'Practice with any word length'}
        </Text>
      </View>

      <Text style={[styles.arrow, disabled && styles.textDisabled]}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.tile,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: palette.borderLight,
    padding: 16,
    marginTop: 16,
  },
  buttonPressed: {
    opacity: 0.8,
    transform: [{scale: 0.98}],
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: palette.accentTealDim,
    borderWidth: 1,
    borderColor: palette.accentTealBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 22,
  },
  textContainer: {
    flex: 1,
    marginLeft: 14,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: palette.textPrimary,
  },
  subtitle: {
    fontSize: 13,
    color: palette.textMuted,
    marginTop: 2,
  },
  textDisabled: {
    color: palette.textDim,
  },
  arrow: {
    fontSize: 24,
    color: palette.textMuted,
    marginLeft: 8,
  },
});
