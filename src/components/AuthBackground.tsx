/**
 * AuthBackground Component
 *
 * Subtle Wordle-style grid background for auth screens with:
 * - Very faint tile grid pattern (3% opacity)
 * - Teal radial glow behind logo area
 */

import React from 'react';
import {View, StyleSheet, Dimensions} from 'react-native';
import Svg, {Rect, Defs, Pattern} from 'react-native-svg';
import {palette} from '../theme/colors';

const {width, height} = Dimensions.get('window');

export function AuthBackground() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* Subtle grid pattern */}
      <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
        <Defs>
          <Pattern
            id="authGrid"
            width={56}
            height={56}
            patternUnits="userSpaceOnUse">
            <Rect
              x={2}
              y={2}
              width={52}
              height={52}
              fill="none"
              stroke={palette.tileBorder}
              strokeWidth={1}
              rx={4}
            />
          </Pattern>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#authGrid)" opacity={0.03} />
      </Svg>

      {/* Teal glow behind logo area */}
      <View style={styles.glow} />
    </View>
  );
}

const styles = StyleSheet.create({
  glow: {
    position: 'absolute',
    top: 100,
    left: '50%',
    marginLeft: -150,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: palette.accentTealDim,
    transform: [{scaleY: 0.7}],
  },
});
