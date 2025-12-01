import React, {useCallback} from 'react';
import {View, Text, StyleSheet, Pressable, Share, Platform} from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import LinearGradient from 'react-native-linear-gradient';
import {palette} from '../../../theme/colors';
import {CopyIcon, ShareIcon} from '../../../components/icons/SettingsIcons';
import {triggerImpact} from '../../../utils/haptics';

type Props = {
  friendCode: string;
  onCopied?: () => void;
};

export default function FriendCodeCard({friendCode, onCopied}: Props) {
  const handleCopy = useCallback(() => {
    Clipboard.setString(friendCode);
    triggerImpact('Light');
    onCopied?.();
  }, [friendCode, onCopied]);

  const handleShare = useCallback(async () => {
    try {
      triggerImpact('Light');
      await Share.share({
        message: `Add me on WrathWord! My friend code is ${friendCode}`,
        // For future: add deep link URL here
      });
    } catch (error) {
      // User cancelled or share failed - no action needed
    }
  }, [friendCode]);

  return (
    <LinearGradient
      colors={['rgba(59, 130, 246, 0.08)', 'rgba(139, 92, 246, 0.08)']}
      start={{x: 0, y: 0}}
      end={{x: 1, y: 1}}
      style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.label}>Your Friend Code</Text>
        <Text style={styles.hint}>Share to add friends</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.code}>{friendCode}</Text>
        <View style={styles.actions}>
          <Pressable
            style={styles.actionBtn}
            onPress={handleCopy}
            accessibilityLabel="Copy friend code"
            accessibilityRole="button">
            <CopyIcon size={18} color={palette.textMuted} />
          </Pressable>
          <Pressable
            style={[styles.actionBtn, styles.actionBtnPrimary]}
            onPress={handleShare}
            accessibilityLabel="Share friend code"
            accessibilityRole="button">
            <ShareIcon size={18} color="#fff" />
          </Pressable>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
    padding: 20,
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: palette.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  hint: {
    fontSize: 12,
    color: palette.textDim,
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  code: {
    fontSize: 28,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    letterSpacing: 2,
    color: palette.textPrimary,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    width: 44,
    height: 44,
    backgroundColor: palette.card,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnPrimary: {
    backgroundColor: palette.primary,
  },
});
