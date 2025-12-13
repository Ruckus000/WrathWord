// src/components/Keyboard/Key.tsx
import React from 'react';
import {Text, Pressable} from 'react-native';
import {styles} from './styles';
import type {KeyProps} from './types';

export const Key = React.memo(({
  label,
  onPress,
  state,
  flex,
  isAction,
  accessibilityLabel,
  disabled,
  tileColors,
}: KeyProps) => {
  // Dynamic color styles based on high contrast preference
  const stateStyle =
    state === 'correct' && tileColors
      ? {backgroundColor: tileColors.correct}
      : state === 'present' && tileColors
      ? {backgroundColor: tileColors.present}
      : state === 'absent' && tileColors
      ? {backgroundColor: tileColors.absent}
      : null;

  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      style={({pressed}) => [
        styles.key,
        {flex: flex ?? 1},
        stateStyle,
        isAction && styles.keyAction,
        disabled && styles.keyDisabled,
        !disabled && pressed && styles.keyPressed,
      ]}
      accessibilityRole="button"
      accessibilityState={{disabled}}
      accessibilityLabel={accessibilityLabel || label}>
      <Text
        style={[
          styles.keyText,
          isAction && styles.keyTextAction,
          disabled && styles.keyTextDisabled,
        ]}>
        {label}
      </Text>
    </Pressable>
  );
});

Key.displayName = 'Key';
