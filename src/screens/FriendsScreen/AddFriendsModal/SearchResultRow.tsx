import React from 'react';
import {View, Text, StyleSheet, Pressable, Platform} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {palette} from '../../../theme/colors';
import {CheckIcon} from '../../../components/icons/SettingsIcons';
import {triggerImpact} from '../../../utils/haptics';

type RelationshipStatus = 'none' | 'pending' | 'friends';

type Props = {
  name: string;
  letter: string;
  friendCode: string;
  status: RelationshipStatus;
  onAdd?: () => void;
};

export default function SearchResultRow({
  name,
  letter,
  friendCode,
  status,
  onAdd,
}: Props) {
  const handleAdd = () => {
    triggerImpact('Medium');
    onAdd?.();
  };

  return (
    <View style={styles.row}>
      <LinearGradient
        colors={[palette.avatarPurpleStart, palette.avatarPurpleEnd]}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
        style={styles.avatar}>
        <Text style={styles.avatarText}>{letter}</Text>
      </LinearGradient>

      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {name}
        </Text>
        <Text style={styles.code}>{friendCode}</Text>
      </View>

      {status === 'none' && (
        <Pressable style={styles.addBtn} onPress={handleAdd}>
          <Text style={styles.addBtnText}>Add</Text>
        </Pressable>
      )}

      {status === 'pending' && (
        <View style={styles.pendingBtn}>
          <Text style={styles.pendingBtnText}>Pending</Text>
        </View>
      )}

      {status === 'friends' && (
        <View style={styles.friendsBtn}>
          <CheckIcon size={14} color={palette.success} />
          <Text style={styles.friendsBtnText}>Friends</Text>
        </View>
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
  code: {
    fontSize: 13,
    color: palette.textDim,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginTop: 2,
  },
  addBtn: {
    backgroundColor: palette.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  addBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  pendingBtn: {
    backgroundColor: palette.cardHighlight,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  pendingBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: palette.textDim,
  },
  friendsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  friendsBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: palette.success,
  },
});
