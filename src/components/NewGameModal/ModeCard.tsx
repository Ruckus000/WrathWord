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
    backgroundSelected: 'rgba(34, 197, 94, 0.15)',
    borderColor: '#22c55e',
    labelColor: '#4ade80',
  },
  free: {
    background: 'rgba(99, 102, 241, 0.12)',
    backgroundSelected: 'rgba(99, 102, 241, 0.15)',
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
        !selected && styles.cardInactive,
        selected && {
          backgroundColor: colors.backgroundSelected,
          borderColor: colors.borderColor,
        },
      ]}
      accessibilityRole="button"
      accessibilityState={{selected}}>
      <Text style={[styles.icon, !selected && styles.iconDimmed]}>{icon}</Text>
      <Text
        style={[
          styles.label,
          !selected && styles.labelInactive,
          selected && {color: colors.labelColor},
        ]}>
        {label}
      </Text>
      <Text style={[styles.description, selected && styles.descriptionSelected]}>
        {description}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  cardInactive: {
    backgroundColor: '#27272a',
  },
  icon: {
    fontSize: 28,
    marginBottom: 8,
  },
  iconDimmed: {
    opacity: 0.5,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  labelInactive: {
    color: '#71717a',
  },
  description: {
    color: '#52525b',
    fontSize: 11,
    textAlign: 'center',
  },
  descriptionSelected: {
    color: '#71717a',
  },
});
