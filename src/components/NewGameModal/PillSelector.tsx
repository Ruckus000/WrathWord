import React from 'react';
import {View, Text, Pressable, StyleSheet} from 'react-native';

type PillSelectorProps = {
  options: number[];
  value: number;
  onChange: (value: number) => void;
  accessibilityLabel: string;
};

export function PillSelector({
  options,
  value,
  onChange,
  accessibilityLabel,
}: PillSelectorProps) {
  return (
    <View style={styles.container} accessibilityLabel={accessibilityLabel}>
      {options.map(option => (
        <Pressable
          key={option}
          onPress={() => onChange(option)}
          style={[styles.pill, value === option && styles.pillActive]}
          accessibilityRole="button"
          accessibilityState={{selected: value === option}}>
          <Text style={[styles.text, value === option && styles.textActive]}>
            {option}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#18181b',
    borderColor: '#27272a',
    borderWidth: 1,
    borderRadius: 8,
    padding: 3,
    gap: 2,
  },
  pill: {
    flex: 1,
    paddingVertical: 7,
    paddingHorizontal: 16,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'transparent',
    alignItems: 'center',
  },
  pillActive: {
    backgroundColor: '#27272a',
    borderColor: '#3f3f46',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  text: {
    color: '#a1a1aa',
    fontWeight: '500',
    fontSize: 14,
  },
  textActive: {
    color: '#fafafa',
  },
});
