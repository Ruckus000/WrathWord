import React from 'react';
import {View, StyleSheet} from 'react-native';
import {TileState} from '../../logic/evaluateGuess';
import {palette} from '../../theme/colors';

type Props = {
  feedback: TileState[][];
  maxRows?: number;
};

export default function MiniResultGrid({feedback, maxRows = 4}: Props) {
  const wordLength = feedback[0]?.length || 5;
  const emptyRows = Math.max(0, maxRows - feedback.length);

  return (
    <View style={styles.container}>
      {feedback.map((row, rowIdx) => (
        <View key={rowIdx} style={styles.row}>
          {row.map((state, colIdx) => (
            <View
              key={colIdx}
              style={[
                styles.tile,
                state === 'correct' && styles.tileCorrect,
                state === 'present' && styles.tilePresent,
                state === 'absent' && styles.tileAbsent,
              ]}
            />
          ))}
        </View>
      ))}
      {Array.from({length: emptyRows}).map((_, idx) => (
        <View key={`empty-${idx}`} style={styles.row}>
          {Array.from({length: wordLength}).map((_, colIdx) => (
            <View key={colIdx} style={[styles.tile, styles.tileEmpty]} />
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 4,
  },
  row: {
    flexDirection: 'row',
    gap: 3,
  },
  tile: {
    width: 8,
    height: 8,
    borderRadius: 2,
  },
  tileCorrect: {
    backgroundColor: palette.success,
  },
  tilePresent: {
    backgroundColor: palette.warning,
  },
  tileAbsent: {
    backgroundColor: '#3f3f46',
  },
  tileEmpty: {
    backgroundColor: '#27272a',
    borderWidth: 1,
    borderColor: '#3f3f46',
  },
});
