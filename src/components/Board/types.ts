// src/components/Board/types.ts
import {TileState} from '../../logic/evaluateGuess';
import {getTileColors} from '../../theme/getColors';

export type TileColors = ReturnType<typeof getTileColors>;

export type TileProps = {
  ch: string;
  state: TileState | 'empty';
  isActive?: boolean;
  isHinted?: boolean;
  size?: {width: number; height: number};
  tileColors: TileColors;
};

export type BoardProps = {
  length: number;
  rows: string[];
  feedback: TileState[][];
  current: string;
  maxRows: number;
  tileColors: TileColors;
  hintedCell: {row: number; col: number} | null;
  hintedLetter: string | null;
};
