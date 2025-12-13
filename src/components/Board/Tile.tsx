// src/components/Board/Tile.tsx
import React, {useEffect, useRef} from 'react';
import {Text, Animated} from 'react-native';
import {palette} from '../../theme/colors';
import {styles} from './styles';
import type {TileProps} from './types';

export const Tile = React.memo(({
  ch,
  state,
  isActive,
  isHinted,
  size,
  tileColors,
}: TileProps) => {
  const fontSize = size ? Math.floor(size.width * 0.54) : 28;
  const flipAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (state !== 'empty') {
      // Trigger flip animation when tile gets a state
      Animated.sequence([
        Animated.timing(flipAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(flipAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [state, flipAnim]);

  const rotateX = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '90deg'],
  });

  // Dynamic color styles based on high contrast preference
  // Check isHinted FIRST to override other states
  const colorStyle =
    isHinted
      ? {backgroundColor: palette.accentPurple, borderColor: palette.accentPurple}
      : state === 'correct'
      ? {backgroundColor: tileColors.correct, borderColor: tileColors.correct}
      : state === 'present'
      ? {backgroundColor: tileColors.present, borderColor: tileColors.present}
      : state === 'absent'
      ? {backgroundColor: tileColors.absent, borderColor: tileColors.absent}
      : null;

  return (
    <Animated.View
      style={[
        styles.tile,
        size,
        colorStyle,
        isActive && styles.tileActive,
        {transform: [{rotateX}]},
      ]}>
      <Text
        style={[styles.tileText, {fontSize}]}
        accessible
        accessibilityLabel={`${ch || 'blank'} ${isHinted ? 'hinted' : state !== 'empty' ? state : ''}`}
        accessibilityRole="text">
        {ch !== ' ' ? ch : ''}
      </Text>
    </Animated.View>
  );
});

Tile.displayName = 'Tile';
