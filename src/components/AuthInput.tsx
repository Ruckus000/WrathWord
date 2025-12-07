/**
 * AuthInput Component
 *
 * Styled text input for auth screens with:
 * - Left icon support (email, password, user)
 * - Password visibility toggle
 * - Focus state with teal border glow
 * - Error state styling
 */

import React, {useState} from 'react';
import {
  View,
  TextInput,
  Pressable,
  StyleSheet,
  TextInputProps,
} from 'react-native';
import Svg, {Path, Circle} from 'react-native-svg';
import {palette} from '../theme/colors';

type IconType = 'email' | 'password' | 'user';

interface AuthInputProps extends TextInputProps {
  icon?: IconType;
  error?: boolean;
}

// Simple inline icons to match auth screen style
function EmailIcon({color}: {color: string}) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M22 6l-10 7L2 6"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function PasswordIcon({color}: {color: string}) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 11H5a2 2 0 00-2 2v7a2 2 0 002 2h14a2 2 0 002-2v-7a2 2 0 00-2-2z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M7 11V7a5 5 0 0110 0v4"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function UserInputIcon({color}: {color: string}) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle
        cx={12}
        cy={7}
        r={4}
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function EyeOpenIcon({color}: {color: string}) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle
        cx={12}
        cy={12}
        r={3}
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function EyeClosedIcon({color}: {color: string}) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M1 1l22 22"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function getIcon(type: IconType, color: string) {
  switch (type) {
    case 'email':
      return <EmailIcon color={color} />;
    case 'password':
      return <PasswordIcon color={color} />;
    case 'user':
      return <UserInputIcon color={color} />;
  }
}

export function AuthInput({
  icon,
  error,
  secureTextEntry,
  style,
  editable = true,
  ...props
}: AuthInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const isPassword = secureTextEntry !== undefined;
  const iconColor = isFocused ? palette.accentTeal : palette.textDim;

  return (
    <View
      style={[
        styles.container,
        isFocused && styles.containerFocused,
        error && styles.containerError,
        !editable && styles.containerDisabled,
      ]}>
      {icon && <View style={styles.iconContainer}>{getIcon(icon, iconColor)}</View>}
      <TextInput
        style={[styles.input, icon && styles.inputWithIcon, style]}
        placeholderTextColor={palette.textDim}
        secureTextEntry={isPassword && !showPassword}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        editable={editable}
        {...props}
      />
      {isPassword && (
        <Pressable
          style={styles.toggleButton}
          onPress={() => setShowPassword(!showPassword)}
          hitSlop={8}>
          {showPassword ? (
            <EyeOpenIcon color={palette.textDim} />
          ) : (
            <EyeClosedIcon color={palette.textDim} />
          )}
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: palette.card,
    borderWidth: 1,
    borderColor: palette.cardBorder,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  containerFocused: {
    borderColor: palette.accentTeal,
    shadowColor: palette.accentTeal,
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 2,
  },
  containerError: {
    borderColor: palette.destructive,
  },
  containerDisabled: {
    opacity: 0.6,
  },
  iconContainer: {
    width: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    color: palette.textPrimary,
  },
  inputWithIcon: {
    paddingLeft: 0,
  },
  toggleButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
