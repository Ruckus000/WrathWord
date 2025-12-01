import React, {useMemo} from 'react';
import {View, Text, StyleSheet} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import type {GameMode} from './types';

type TileState = 'correct' | 'present' | 'absent' | 'empty';

type BoardPreviewProps = {
  length: number;
  maxRows: number;
  mode: GameMode;
};

const DAILY_PATTERN: TileState[] = [
  'correct',
  'absent',
  'present',
  'absent',
  'correct',
  'present',
];

function getDemoPattern(mode: GameMode, length: number): TileState[] {
  if (mode === 'daily') {
    // Fixed pattern for daily - trim or repeat to match length
    const pattern: TileState[] = [];
    for (let i = 0; i < length; i++) {
      pattern.push(DAILY_PATTERN[i % DAILY_PATTERN.length]);
    }
    return pattern;
  } else {
    // Random pattern for free mode
    const states: TileState[] = ['correct', 'present', 'absent'];
    return Array.from(
      {length},
      () => states[Math.floor(Math.random() * states.length)],
    );
  }
}

function MiniTile({state}: {state: TileState}) {
  return (
    <View
      style={[
        styles.miniTile,
        state === 'correct' && styles.miniTileCorrect,
        state === 'present' && styles.miniTilePresent,
        state === 'absent' && styles.miniTileAbsent,
        state === 'empty' && styles.miniTileEmpty,
      ]}
    />
  );
}

export function BoardPreview({length, maxRows, mode}: BoardPreviewProps) {
  // Memoize the demo pattern to prevent re-randomization on every render
  // Only regenerate when mode or length changes
  const demoPattern = useMemo(
    () => getDemoPattern(mode, length),
    [mode, length],
  );

  return (
    <LinearGradient
      colors={['rgba(99, 102, 241, 0.06)', 'transparent']}
      style={styles.container}>
      <Text style={styles.label}>YOUR GAME</Text>
      <View style={styles.board}>
        {Array.from({length: maxRows}).map((_, rowIdx) => (
          <View key={rowIdx} style={styles.row}>
            {Array.from({length}).map((_, colIdx) => {
              // Only first row shows colored tiles
              const state: TileState =
                rowIdx === 0 ? demoPattern[colIdx] : 'empty';
              return <MiniTile key={colIdx} state={state} />;
            })}
          </View>
        ))}
      </View>
      <Text style={styles.configText}>
        <Text style={styles.configValue}>{length}</Text> letters ·{' '}
        <Text style={styles.configValue}>{maxRows}</Text> guesses
      </Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingTop: 28,
    paddingBottom: 20,
    paddingHorizontal: 24,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6366f1',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 16,
  },
  board: {
    gap: 4,
  },
  row: {
    flexDirection: 'row',
    gap: 4,
  },
  miniTile: {
    width: 28,
    height: 32,
    borderRadius: 4,
  },
  miniTileCorrect: {
    backgroundColor: '#22c55e',
  },
  miniTilePresent: {
    backgroundColor: '#eab308',
  },
  miniTileAbsent: {
    backgroundColor: '#3f3f46',
  },
  miniTileEmpty: {
    backgroundColor: '#27272a',
    borderWidth: 1,
    borderColor: '#3f3f46',
  },
  configText: {
    marginTop: 16,
    fontSize: 14,
    color: '#a1a1aa',
  },
  configValue: {
    fontWeight: '600',
    color: '#fff',
  },
});
