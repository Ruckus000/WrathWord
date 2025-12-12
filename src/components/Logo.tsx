/**
 * WrathWord Logo Component
 *
 * Renders the app logo in various sizes.
 * Used on auth screens and elsewhere for branding.
 */

import React from 'react';
import {View, Image, StyleSheet} from 'react-native';

type LogoSize = 'small' | 'medium' | 'large';

interface LogoProps {
  size?: LogoSize;
}

const SIZES = {
  small: 48,
  medium: 72,
  large: 100,
};

const BORDER_RADIUS = {
  small: 12,
  medium: 18,
  large: 24,
};

export function Logo({size = 'large'}: LogoProps) {
  const dimension = SIZES[size];
  const borderRadius = BORDER_RADIUS[size];

  return (
    <View
      style={[
        styles.container,
        {
          width: dimension,
          height: dimension,
          borderRadius,
        },
      ]}>
      <Image
        source={require('../../assets/bootsplash/logo.png')}
        style={{
          width: dimension,
          height: dimension,
          borderRadius,
        }}
        resizeMode="cover"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
});
