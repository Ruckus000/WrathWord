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
    gap: 8,
  },
  pill: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
    backgroundColor: '#27272a',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
  },
  pillActive: {
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    borderColor: '#6366f1',
  },
  text: {
    color: '#71717a',
    fontWeight: '700',
    fontSize: 20,
  },
  textActive: {
    color: '#fff',
  },
});
