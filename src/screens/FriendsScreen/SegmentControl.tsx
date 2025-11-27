import React from 'react';
import {View, Text, StyleSheet, Pressable} from 'react-native';
import {palette} from '../../theme/colors';

export type Period = 'today' | 'week' | 'alltime';

type Props = {
  selected: Period;
  onSelect: (period: Period) => void;
};

const SEGMENTS: {key: Period; label: string}[] = [
  {key: 'today', label: 'Today'},
  {key: 'week', label: 'This Week'},
  {key: 'alltime', label: 'All Time'},
];

export default function SegmentControl({selected, onSelect}: Props) {
  return (
    <View style={styles.container}>
      {SEGMENTS.map(segment => (
        <Pressable
          key={segment.key}
          style={[styles.btn, selected === segment.key && styles.btnActive]}
          onPress={() => onSelect(segment.key)}>
          <Text
            style={[
              styles.text,
              selected === segment.key && styles.textActive,
            ]}>
            {segment.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: palette.card,
    borderRadius: 10,
    padding: 3,
    marginHorizontal: 16,
    marginBottom: 16,
    gap: 2,
  },
  btn: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  btnActive: {
    backgroundColor: palette.cardHighlight,
  },
  text: {
    fontSize: 13,
    fontWeight: '500',
    color: palette.textMuted,
  },
  textActive: {
    color: palette.textPrimary,
    fontWeight: '600',
  },
});
