// src/components/ResultModal/types.ts
import {TileState} from '../../logic/evaluateGuess';
import {getTileColors} from '../../theme/getColors';

export type TileColors = ReturnType<typeof getTileColors>;

export type GameStatus = 'playing' | 'won' | 'lost';

export type ResultModalProps = {
  visible: boolean;
  status: GameStatus;
  rows: string[];
  maxRows: number;
  length: number;
  feedback: TileState[][];
  dateISO: string;
  answer: string;
  tileColors: TileColors;
  playAgainIsFreeMode: boolean;
  onPlayAgain: () => void;
};
