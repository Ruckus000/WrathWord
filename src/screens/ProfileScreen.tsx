/**
 * Profile Screen
 *
 * Allows users to view and edit their profile information.
 * Shows friend code, display name, and sign out option.
 */

import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Clipboard from '@react-native-clipboard/clipboard';
import LinearGradient from 'react-native-linear-gradient';
import {palette} from '../theme/colors';
import {useAuth} from '../contexts/AuthContext';
import {profileService} from '../services/data';
import ProfileAvatar from '../components/ProfileAvatar';
import {ChevronLeft} from '../components/icons/SettingsIcons';

type Props = {
  onClose: () => void;
};

export default function ProfileScreen({onClose}: Props) {
  const insets = useSafeAreaInsets();
  const {user, signOut} = useAuth();

  const [displayName, setDisplayName] = useState(
    user?.displayName || user?.username || '',
  );
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [copied, setCopied] = useState(false);

  const originalDisplayName = user?.displayName || user?.username || '';

  useEffect(() => {
    setHasChanges(displayName.trim() !== originalDisplayName);
  }, [displayName, originalDisplayName]);

  const validateDisplayName = (name: string): string | null => {
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      return 'Display name must be at least 2 characters';
    }
    if (trimmed.length > 20) {
      return 'Display name must be 20 characters or less';
    }
    if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) {
      return 'Only letters, numbers, and underscores allowed';
    }
    return null;
  };

  const handleSave = async () => {
    const error = validateDisplayName(displayName);
    if (error) {
      Alert.alert('Invalid Name', error);
      return;
    }

    setIsSaving(true);
    try {
      await profileService.updateDisplayName(displayName.trim());
      Alert.alert('Success', 'Profile updated successfully', [
        {text: 'OK', onPress: onClose},
      ]);
    } catch (err) {
      Alert.alert(
        'Error',
        err instanceof Error ? err.message : 'Failed to update profile',
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyFriendCode = () => {
    if (user?.friendCode) {
      Clipboard.setString(user.friendCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          onClose();
        },
      },
    ]);
  };

  const avatarLetter = (displayName || user?.username || 'W').charAt(0);

  return (
    <View
      style={[
        styles.container,
        {paddingTop: insets.top, paddingBottom: insets.bottom},
      ]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={onClose}>
          <ChevronLeft size={22} color={palette.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Avatar Section */}
      <View style={styles.avatarSection}>
        <ProfileAvatar letter={avatarLetter} size="large" />
        <Text style={styles.displayNamePreview}>
          {displayName || 'Your Name'}
        </Text>
        <Text style={styles.emailText}>{user?.email}</Text>
      </View>

      {/* Friend Code Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>YOUR FRIEND CODE</Text>
        <Pressable style={styles.friendCodeCard} onPress={handleCopyFriendCode}>
          <Text style={styles.friendCode}>{user?.friendCode || '----'}</Text>
          <View style={styles.copyButton}>
            <Text style={styles.copyButtonText}>
              {copied ? 'Copied!' : 'Copy'}
            </Text>
          </View>
        </Pressable>
        <Text style={styles.friendCodeHint}>
          Share this code so friends can add you
        </Text>
      </View>

      {/* Display Name Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>DISPLAY NAME</Text>
        <TextInput
          style={styles.input}
          value={displayName}
          onChangeText={setDisplayName}
          placeholder="Enter display name"
          placeholderTextColor={palette.textDim}
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={20}
          editable={!isSaving}
        />
        <Text style={styles.inputHint}>2-20 characters, letters and numbers</Text>
      </View>

      {/* Save Button */}
      {hasChanges && (
        <View style={styles.saveSection}>
          <Pressable
            onPress={handleSave}
            disabled={isSaving}
            style={({pressed}) => [
              styles.saveButton,
              pressed && !isSaving && styles.saveButtonPressed,
            ]}>
            <LinearGradient
              colors={[palette.gradientStart, palette.gradientEnd]}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 1}}
              style={styles.saveButtonGradient}>
              {isSaving ? (
                <ActivityIndicator color={palette.textPrimary} />
              ) : (
                <Text style={styles.saveButtonText}>Save Changes</Text>
              )}
            </LinearGradient>
          </Pressable>
        </View>
      )}

      {/* Sign Out */}
      <Pressable style={styles.signOutButton} onPress={handleSignOut}>
        <Text style={styles.signOutText}>Sign Out</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingTop: 4,
    paddingBottom: 16,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: palette.textPrimary,
  },
  headerRight: {
    width: 36,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: palette.cardBorder,
    marginHorizontal: 20,
    marginBottom: 24,
  },
  displayNamePreview: {
    fontSize: 24,
    fontWeight: '700',
    color: palette.textPrimary,
    marginTop: 16,
  },
  emailText: {
    fontSize: 14,
    color: palette.textMuted,
    marginTop: 4,
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: palette.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  friendCodeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: palette.card,
    borderWidth: 1,
    borderColor: palette.cardBorder,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  friendCode: {
    fontSize: 20,
    fontWeight: '700',
    color: palette.textPrimary,
    letterSpacing: 2,
  },
  copyButton: {
    backgroundColor: palette.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  copyButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: palette.textPrimary,
  },
  friendCodeHint: {
    fontSize: 12,
    color: palette.textDim,
    marginTop: 8,
  },
  input: {
    backgroundColor: palette.card,
    borderWidth: 1,
    borderColor: palette.cardBorder,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: palette.textPrimary,
  },
  inputHint: {
    fontSize: 12,
    color: palette.textDim,
    marginTop: 8,
  },
  saveSection: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  saveButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  saveButtonPressed: {
    opacity: 0.8,
  },
  saveButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: palette.textPrimary,
  },
  signOutButton: {
    alignItems: 'center',
    paddingVertical: 16,
    marginTop: 'auto',
    marginBottom: 24,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '500',
    color: palette.destructive,
  },
});
