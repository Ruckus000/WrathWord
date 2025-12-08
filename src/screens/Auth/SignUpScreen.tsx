/**
 * Sign Up Screen
 *
 * Allows new users to create an account with email, password, and username.
 * Only used in production mode - bypassed in development.
 */

import React, {useState} from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {palette} from '../../theme/colors';
import {authService} from '../../services/auth';
import {ChevronLeft} from '../../components/icons/SettingsIcons';
import LinearGradient from 'react-native-linear-gradient';
import {Logo} from '../../components/Logo';
import {AuthInput} from '../../components/AuthInput';
import {AuthBackground} from '../../components/AuthBackground';
import Svg, {Path, Rect} from 'react-native-svg';

type Props = {
  onSignUpSuccess: () => void;
  onNavigateToSignIn: () => void;
};

// Styled email icon for confirmation screen
function EmailConfirmIcon() {
  return (
    <View style={confirmStyles.iconContainer}>
      <Svg width={48} height={48} viewBox="0 0 24 24" fill="none">
        <Rect
          x={2}
          y={4}
          width={20}
          height={16}
          rx={2}
          stroke={palette.accentTeal}
          strokeWidth={2}
        />
        <Path
          d="M22 6l-10 7L2 6"
          stroke={palette.accentTeal}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
}

export default function SignUpScreen({
  onSignUpSuccess,
  onNavigateToSignIn,
}: Props) {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);

  const validateForm = (): boolean => {
    if (!email || !username || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return false;
    }

    if (username.length < 3 || username.length > 20) {
      setError('Username must be 3-20 characters');
      return false;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setError('Username can only contain letters, numbers, and underscores');
      return false;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    return true;
  };

  const handleSignUp = async () => {
    setError('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const result = await authService.signUp(email, password, username);

      if (result.error) {
        // Check if this is email confirmation required (not an error, it's success!)
        if (result.error.code === 'EMAIL_CONFIRMATION_REQUIRED') {
          setShowConfirmation(true);
          setLoading(false);
          return;
        }
        setError(result.error.message);
        setLoading(false);
        return;
      }

      // Immediate success (no email confirmation required)
      // Auth state change will update isAuthenticated via AuthContext
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create account');
      setLoading(false);
    }
  };

  // Show email confirmation success screen
  if (showConfirmation) {
    return (
      <View
        style={[
          styles.container,
          {paddingTop: insets.top, paddingBottom: insets.bottom},
        ]}>
        <AuthBackground />
        <View style={confirmStyles.container}>
          <EmailConfirmIcon />
          <Text style={confirmStyles.title}>Check Your Email</Text>
          <Text style={confirmStyles.text}>
            We sent a confirmation link to{'\n'}
            <Text style={confirmStyles.email}>{email}</Text>
          </Text>
          <Text style={confirmStyles.subtext}>
            Click the link in the email to activate your account, then come back
            and sign in.
          </Text>
          <Pressable
            onPress={onNavigateToSignIn}
            style={({pressed}) => [
              styles.signUpButton,
              pressed && styles.signUpButtonPressed,
            ]}>
            <LinearGradient
              colors={[palette.gradientStart, palette.gradientEnd]}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 1}}
              style={styles.signUpButtonGradient}>
              <Text style={styles.signUpButtonText}>Go to Sign In</Text>
            </LinearGradient>
          </Pressable>
          <View style={confirmStyles.resendRow}>
            <Text style={styles.footerText}>Didn't receive the email? </Text>
            <Pressable>
              <Text style={styles.footerLink}>Resend</Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        {paddingTop: insets.top, paddingBottom: insets.bottom},
      ]}>
      <AuthBackground />

      <View style={styles.content}>
        {/* Back Button */}
        <Pressable style={styles.backButton} onPress={onNavigateToSignIn}>
          <ChevronLeft size={24} color={palette.textPrimary} />
        </Pressable>

        {/* Header */}
        <View style={styles.header}>
          <Logo size="medium" />
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>
            Join WrathWord and compete with friends
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Username</Text>
            <AuthInput
              icon="user"
              value={username}
              onChangeText={setUsername}
              placeholder="wordmaster"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
            />
          </View>

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
              placeholder="At least 6 characters"
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Confirm Password</Text>
            <AuthInput
              icon="password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Re-enter password"
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
            />
          </View>

          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <Pressable
            onPress={handleSignUp}
            disabled={loading}
            style={({pressed}) => [
              styles.signUpButton,
              pressed && !loading && styles.signUpButtonPressed,
            ]}>
            <LinearGradient
              colors={[palette.gradientStart, palette.gradientEnd]}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 1}}
              style={styles.signUpButtonGradient}>
              {loading ? (
                <ActivityIndicator color={palette.textPrimary} />
              ) : (
                <Text style={styles.signUpButtonText}>Create Account</Text>
              )}
            </LinearGradient>
          </Pressable>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <Pressable onPress={onNavigateToSignIn} disabled={loading}>
            <Text style={styles.footerLink}>Sign In</Text>
          </Pressable>
        </View>

        {/* Terms */}
        <Text style={styles.termsText}>
          By creating an account, you agree to our{'\n'}
          Terms of Service and Privacy Policy
        </Text>
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
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  header: {
    alignItems: 'center',
    marginBottom: 28,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: palette.textPrimary,
    marginTop: 16,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    color: palette.textMuted,
    textAlign: 'center',
  },
  form: {
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: palette.textMuted,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  errorContainer: {
    backgroundColor: 'rgba(255, 69, 58, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 69, 58, 0.2)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 14,
  },
  errorText: {
    color: palette.destructive,
    fontSize: 14,
    textAlign: 'center',
  },
  signUpButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 4,
  },
  signUpButtonPressed: {
    opacity: 0.8,
  },
  signUpButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  signUpButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: palette.textPrimary,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
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
  termsText: {
    fontSize: 12,
    color: palette.textDim,
    textAlign: 'center',
    lineHeight: 18,
  },
});

const confirmStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  iconContainer: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: palette.accentTealDim,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: palette.textPrimary,
    marginBottom: 16,
    textAlign: 'center',
  },
  text: {
    fontSize: 16,
    color: palette.textMuted,
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 24,
  },
  email: {
    fontWeight: '600',
    color: palette.textPrimary,
  },
  subtext: {
    fontSize: 14,
    color: palette.textDim,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 20,
  },
  resendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
});

