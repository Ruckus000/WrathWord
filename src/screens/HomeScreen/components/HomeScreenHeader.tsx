import React from 'react';
import {View, Text, Pressable, StyleSheet} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import {palette} from '../../../theme/colors';

interface Props {
  onProfilePress: () => void;
  userInitial?: string;
}

export function HomeScreenHeader({onProfilePress, userInitial = 'W'}: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.header, {paddingTop: insets.top + 8}]}>
      {/* Logo */}
      <View style={styles.logoContainer}>
        <Text style={styles.logoText}>WrathWord</Text>
      </View>

      {/* Profile Avatar Button */}
      <Pressable
        onPress={onProfilePress}
        style={({pressed}) => [
          styles.avatarButton,
          pressed && styles.avatarPressed,
        ]}
        accessibilityLabel="View profile and stats"
        accessibilityRole="button">
        <LinearGradient
          colors={[palette.gradientStart, palette.gradientEnd]}
          style={styles.avatar}>
          <Text style={styles.avatarText}>{userInitial.toUpperCase()}</Text>
        </LinearGradient>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 20,
    fontWeight: '800',
    color: palette.textPrimary,
    letterSpacing: -0.5,
  },
  avatarButton: {
    borderRadius: 20,
  },
  avatarPressed: {
    opacity: 0.8,
    transform: [{scale: 0.98}],
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: palette.textPrimary,
  },
});
