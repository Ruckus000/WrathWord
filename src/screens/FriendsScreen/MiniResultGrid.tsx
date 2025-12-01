import React from 'react';
import {View, StyleSheet} from 'react-native';
import {TileState} from '../../logic/evaluateGuess';
import {getTileColors} from '../../theme/getColors';

type Props = {
  feedback: TileState[][];
  maxRows?: number;
};

export default function MiniResultGrid({feedback, maxRows = 4}: Props) {
  const wordLength = feedback[0]?.length || 5;
  const emptyRows = Math.max(0, maxRows - feedback.length);
  const tileColors = getTileColors();

  return (
    <View style={styles.container}>
      {feedback.map((row, rowIdx) => (
        <View key={rowIdx} style={styles.row}>
          {row.map((state, colIdx) => {
            const bgColor =
              state === 'correct'
                ? tileColors.correct
                : state === 'present'
                ? tileColors.present
                : tileColors.absent;
            return (
              <View
                key={colIdx}
                style={[styles.tile, {backgroundColor: bgColor}]}
              />
            );
          })}
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
  tileEmpty: {
    backgroundColor: '#27272a',
    borderWidth: 1,
    borderColor: '#3f3f46',
  },
});
