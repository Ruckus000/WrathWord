// src/components/ProfileAvatar.tsx
import React from 'react';
import {View, Text, StyleSheet, Pressable} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {palette} from '../theme/colors';

type Size = 'small' | 'large';

type Props = {
  letter?: string;
  size?: Size;
  onPress?: () => void;
};

export default function ProfileAvatar({letter = 'W', size = 'small', onPress}: Props) {
  const isLarge = size === 'large';
  const containerSize = isLarge ? 80 : 40;
  const fontSize = isLarge ? 36 : 18;
  const borderRadius = isLarge ? 20 : 12;

  const avatar = (
    <LinearGradient
      colors={[palette.gradientStart, palette.gradientEnd]}
      start={{x: 0, y: 0}}
      end={{x: 1, y: 1}}
      style={[
        styles.avatar,
        {
          width: containerSize,
          height: containerSize,
          borderRadius,
        },
      ]}>
      <Text style={[styles.letter, {fontSize}]}>{letter.toUpperCase()}</Text>
    </LinearGradient>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({pressed}) => pressed && styles.pressed}>
        {avatar}
      </Pressable>
    );
  }

  return avatar;
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  letter: {
    fontWeight: '700',
    color: palette.textPrimary,
  },
  pressed: {
    opacity: 0.8,
    transform: [{scale: 0.98}],
  },
});
