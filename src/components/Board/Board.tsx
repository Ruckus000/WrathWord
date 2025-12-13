// src/components/Board/Board.tsx
import React from 'react';
import {View, useWindowDimensions} from 'react-native';
import {Tile} from './Tile';
import {styles} from './styles';
import type {BoardProps} from './types';

export const Board = React.memo(({
  length,
  rows,
  feedback,
  current,
  maxRows,
  tileColors,
  hintedCell,
  hintedLetter,
}: BoardProps) => {
  const {width} = useWindowDimensions();
  const gap = 8;
  const maxTileSize = 62;
  const padding = 16;
  const availableWidth = width - padding * 2;
  const calculatedSize = Math.min(
    maxTileSize,
    Math.floor((availableWidth - gap * (length - 1)) / length),
  );
  const tileSize = {width: calculatedSize, height: calculatedSize * 1.12};

  const allRows = [...rows];
  const activeRow = rows.length < maxRows ? rows.length : -1;
  if (rows.length < maxRows) allRows.push(current.padEnd(length, ' '));
  while (allRows.length < maxRows) allRows.push(''.padEnd(length, ' '));

  return (
    <View style={styles.board}>
      {allRows.map((word, rIdx) => (
        <View key={rIdx} style={styles.row}>
          {Array.from({length}).map((_, cIdx) => {
            const rawCh = word[cIdx] ?? '';
            const ch = rawCh === ' ' ? '' : rawCh; // Treat space as empty
            const state = feedback[rIdx]?.[cIdx] ?? 'empty';
            const isActive = rIdx === activeRow && ch !== '';

            // Check if this is a hinted tile (works for current AND submitted rows)
            const isHinted = hintedCell?.row === rIdx && hintedCell?.col === cIdx;

            return (
              <Tile
                key={cIdx}
                ch={isHinted && rIdx === activeRow && hintedLetter ? hintedLetter : ch}
                state={state as any}
                isActive={isActive}
                isHinted={isHinted}
                size={tileSize}
                tileColors={tileColors}
              />
            );
          })}
        </View>
      ))}
    </View>
  );
});

Board.displayName = 'Board';
