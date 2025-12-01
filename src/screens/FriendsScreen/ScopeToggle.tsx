import React from 'react';
import {View, Text, StyleSheet, Pressable} from 'react-native';
import {palette} from '../../theme/colors';
import {FriendsIcon, GlobalIcon} from './icons';

export type Scope = 'friends' | 'global';

type Props = {
  selected: Scope;
  onSelect: (scope: Scope) => void;
};

export default function ScopeToggle({selected, onSelect}: Props) {
  return (
    <View style={styles.container}>
      <Pressable
        style={[styles.option, selected === 'friends' && styles.optionActive]}
        onPress={() => onSelect('friends')}>
        <FriendsIcon
          size={16}
          color={
            selected === 'friends' ? palette.textPrimary : palette.textMuted
          }
        />
        <Text
          style={[
            styles.optionText,
            selected === 'friends' && styles.optionTextActive,
          ]}>
          Friends
        </Text>
      </Pressable>

      <Pressable
        style={[styles.option, selected === 'global' && styles.optionActive]}
        onPress={() => onSelect('global')}>
        <GlobalIcon
          size={16}
          color={selected === 'global' ? palette.textPrimary : palette.textMuted}
        />
        <Text
          style={[
            styles.optionText,
            selected === 'global' && styles.optionTextActive,
          ]}>
          Global
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: palette.card,
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  option: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
  },
  optionActive: {
    backgroundColor: palette.cardHighlight,
  },
  optionText: {
    fontSize: 14,
    fontWeight: '500',
    color: palette.textMuted,
  },
  optionTextActive: {
    color: palette.primary,
    fontWeight: '600',
  },
});
