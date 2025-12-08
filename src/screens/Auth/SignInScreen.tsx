/**
 * Sign In Screen
 *
 * Allows users to sign in with email and password.
 * Only used in production mode - bypassed in development.
 */

import React, {useState} from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {palette} from '../../theme/colors';
import {authService} from '../../services/auth';
import LinearGradient from 'react-native-linear-gradient';
import {Logo} from '../../components/Logo';
import {AuthInput} from '../../components/AuthInput';
import {AuthBackground} from '../../components/AuthBackground';
import Svg, {Path} from 'react-native-svg';

type Props = {
  onSignInSuccess: () => void;
  onNavigateToSignUp: () => void;
};

// Simple social icons
function GoogleIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <Path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <Path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <Path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </Svg>
  );
}

function AppleIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"
        fill={palette.textPrimary}
      />
    </Svg>
  );
}

export default function SignInScreen({
  onSignInSuccess,
  onNavigateToSignUp,
}: Props) {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const handleSignIn = async () => {
    setError('');

    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    setLoading(true);

    try {
      const result = await authService.signIn(email, password);

      if (result.error) {
        setError(result.error.message);
        setLoading(false);
        return;
      }

      // Success - auth state change will update isAuthenticated
      // via AuthContext, which triggers navigation automatically
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign in');
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setError('');
    setResetSent(false);

    if (!email) {
      setError('Please enter your email address');
      return;
    }

    setResetLoading(true);

    try {
      const result = await authService.resetPassword(email);

      if (result.error) {
        setError(result.error.message);
        setResetLoading(false);
        return;
      }

      setResetSent(true);
      setResetLoading(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to send reset email',
      );
      setResetLoading(false);
    }
  };

  const handleSocialLogin = () => {
    Alert.alert(
      'Coming Soon',
      'Social login will be available in a future update.',
    );
  };

  return (
    <View
      style={[
        styles.container,
        {paddingTop: insets.top, paddingBottom: insets.bottom},
      ]}>
      <AuthBackground />

      <View style={styles.content}>
        {/* Brand Header */}
        <View style={styles.header}>
          <Logo size="large" />
          <Text style={styles.wordmark}>WrathWord</Text>
          <Text style={styles.tagline}>
            Compete with friends. One word at a time.
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <AuthInput
              icon="email"
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <AuthInput
              icon="password"
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
            />
          </View>

          <Pressable
            onPress={handleForgotPassword}
            disabled={resetLoading || loading}
            style={styles.forgotPassword}>
            <Text style={styles.forgotPasswordText}>
              {resetLoading ? 'Sending...' : 'Forgot password?'}
            </Text>
          </Pressable>

          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {resetSent ? (
            <View style={styles.successContainer}>
              <Text style={styles.successText}>
                Check your email for reset instructions
              </Text>
            </View>
          ) : null}

          <Pressable
            onPress={handleSignIn}
            disabled={loading}
            style={({pressed}) => [
              styles.signInButton,
              pressed && !loading && styles.signInButtonPressed,
            ]}>
            <LinearGradient
              colors={[palette.gradientStart, palette.gradientEnd]}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 1}}
              style={styles.signInButtonGradient}>
              {loading ? (
                <ActivityIndicator color={palette.textPrimary} />
              ) : (
                <Text style={styles.signInButtonText}>Sign In</Text>
              )}
            </LinearGradient>
          </Pressable>
        </View>

        {/* Divider */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or continue with</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Social Buttons */}
        <View style={styles.socialButtons}>
          <Pressable
            onPress={handleSocialLogin}
            style={({pressed}) => [
              styles.socialButton,
              pressed && styles.socialButtonPressed,
            ]}>
            <GoogleIcon />
            <Text style={styles.socialButtonText}>Google</Text>
          </Pressable>
          <Pressable
            onPress={handleSocialLogin}
            style={({pressed}) => [
              styles.socialButton,
              pressed && styles.socialButtonPressed,
            ]}>
            <AppleIcon />
            <Text style={styles.socialButtonText}>Apple</Text>
          </Pressable>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <Pressable onPress={onNavigateToSignUp} disabled={loading}>
            <Text style={styles.footerLink}>Sign Up</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.bg,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  wordmark: {
    fontSize: 32,
    fontWeight: '800',
    color: palette.textPrimary,
    marginTop: 20,
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 15,
    color: palette.textMuted,
    textAlign: 'center',
  },
  form: {
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: palette.textMuted,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: -8,
    marginBottom: 20,
  },
  forgotPasswordText: {
    fontSize: 13,
    color: palette.textMuted,
  },
  errorContainer: {
    backgroundColor: 'rgba(255, 69, 58, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 69, 58, 0.2)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: palette.destructive,
    fontSize: 14,
    textAlign: 'center',
  },
  successContainer: {
    backgroundColor: 'rgba(62, 184, 176, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(62, 184, 176, 0.2)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  successText: {
    color: palette.accentTeal,
    fontSize: 14,
    textAlign: 'center',
  },
  signInButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  signInButtonPressed: {
    opacity: 0.8,
  },
  signInButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  signInButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: palette.textPrimary,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: palette.cardBorder,
  },
  dividerText: {
    fontSize: 13,
    color: palette.textDim,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  socialButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  socialButton: {
    flex: 1,
    backgroundColor: palette.card,
    borderWidth: 1,
    borderColor: palette.cardBorder,
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  socialButtonPressed: {
    opacity: 0.8,
    backgroundColor: palette.cardHighlight,
  },
  socialButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: palette.textPrimary,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: palette.textMuted,
  },
  footerLink: {
    fontSize: 14,
    fontWeight: '600',
    color: palette.accentTeal,
  },
});

