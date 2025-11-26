import React from 'react';
import {View, Text, Pressable, StyleSheet} from 'react-native';
import type {GameMode} from './types';

type ModeCardProps = {
  mode: GameMode;
  icon: string;
  label: string;
  description: string;
  selected: boolean;
  onPress: () => void;
};

const modeStyles = {
  daily: {
    background: 'rgba(34, 197, 94, 0.12)',
    backgroundSelected: 'rgba(34, 197, 94, 0.18)',
    borderColor: '#22c55e',
    labelColor: '#4ade80',
  },
  free: {
    background: 'rgba(99, 102, 241, 0.12)',
    backgroundSelected: 'rgba(99, 102, 241, 0.18)',
    borderColor: '#6366f1',
    labelColor: '#a5b4fc',
  },
};

export function ModeCard({
  mode,
  icon,
  label,
  description,
  selected,
  onPress,
}: ModeCardProps) {
  const colors = modeStyles[mode];

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.card,
        {
          backgroundColor: selected ? colors.backgroundSelected : colors.background,
          borderColor: selected ? colors.borderColor : 'transparent',
        },
      ]}
      accessibilityRole="button"
      accessibilityState={{selected}}>
      <Text style={[styles.icon, !selected && styles.iconDimmed]}>{icon}</Text>
      <View style={styles.textContainer}>
        <Text
          style={[
            styles.label,
            selected && {color: colors.labelColor},
          ]}>
          {label}
        </Text>
        <Text style={[styles.description, selected && styles.descriptionSelected]}>
          {description}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 2,
  },
  icon: {
    fontSize: 28,
  },
  iconDimmed: {
    opacity: 0.4,
  },
  textContainer: {
    flex: 1,
  },
  label: {
    color: '#fafafa',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  description: {
    color: '#71717a',
    fontSize: 12,
    fontWeight: '400',
  },
  descriptionSelected: {
    color: '#a1a1aa',
  },
});
