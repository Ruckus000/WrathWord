import React from 'react';
import {View, Text, StyleSheet, Pressable} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {palette} from '../../../theme/colors';
import {CheckIcon, XIcon} from '../../../components/icons/SettingsIcons';
import {triggerImpact, triggerNotification} from '../../../utils/haptics';

type Props = {
  name: string;
  letter: string;
  subtitle: string; // e.g., "Sent 2 hours ago" or "Waiting for response"
  type: 'incoming' | 'outgoing';
  onAccept?: () => void;
  onDecline?: () => void;
  onCancel?: () => void;
};

export default function RequestRow({
  name,
  letter,
  subtitle,
  type,
  onAccept,
  onDecline,
  onCancel,
}: Props) {
  const avatarColors: [string, string] =
    type === 'incoming'
      ? [palette.avatarPurpleStart, palette.avatarPurpleEnd]
      : [palette.avatarBlueStart, palette.avatarBlueEnd];

  const handleAccept = () => {
    triggerNotification('Success');
    onAccept?.();
  };

  const handleDecline = () => {
    triggerImpact('Light');
    onDecline?.();
  };

  const handleCancel = () => {
    triggerImpact('Light');
    onCancel?.();
  };

  return (
    <View style={styles.row}>
      <LinearGradient
        colors={avatarColors}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
        style={styles.avatar}>
        <Text style={styles.avatarText}>{letter}</Text>
      </LinearGradient>

      <View style={styles.info}>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>

      {type === 'incoming' && (
        <View style={styles.actions}>
          <Pressable
            style={[styles.actionBtn, styles.declineBtn]}
            onPress={handleDecline}
            accessibilityLabel={`Decline ${name}'s request`}>
            <XIcon size={16} color={palette.textDim} />
          </Pressable>
          <Pressable
            style={[styles.actionBtn, styles.acceptBtn]}
            onPress={handleAccept}
            accessibilityLabel={`Accept ${name}'s request`}>
            <CheckIcon size={16} color="#fff" />
          </Pressable>
        </View>
      )}

      {type === 'outgoing' && (
        <Pressable
          style={[styles.actionBtn, styles.cancelBtn]}
          onPress={handleCancel}
          accessibilityLabel={`Cancel request to ${name}`}>
          <XIcon size={16} color={palette.textDim} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    paddingHorizontal: 16,
    gap: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: palette.cardBorder,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '600',
    color: palette.textPrimary,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: '500',
    color: palette.textPrimary,
  },
  subtitle: {
    fontSize: 13,
    color: palette.textDim,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptBtn: {
    backgroundColor: palette.success,
  },
  declineBtn: {
    backgroundColor: palette.cardHighlight,
  },
  cancelBtn: {
    backgroundColor: palette.cardHighlight,
  },
});
