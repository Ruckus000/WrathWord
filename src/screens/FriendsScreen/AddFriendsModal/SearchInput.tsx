import React from 'react';
import {View, TextInput, StyleSheet} from 'react-native';
import {palette} from '../../../theme/colors';
import {SearchIcon} from '../../../components/icons/SettingsIcons';

type Props = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
};

export default function SearchInput({value, onChangeText, placeholder}: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.iconWrapper}>
        <SearchIcon size={18} color={palette.textDim} />
      </View>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder ?? 'Enter friend code or name...'}
        placeholderTextColor={palette.textDim}
        autoCapitalize="characters"
        autoCorrect={false}
        returnKeyType="search"
        clearButtonMode="while-editing"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.cardBorder,
    height: 48,
    paddingHorizontal: 14,
  },
  iconWrapper: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: palette.textPrimary,
    padding: 0, // Remove default padding
  },
});
