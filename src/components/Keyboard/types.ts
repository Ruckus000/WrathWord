// src/components/Keyboard/types.ts
import {TileState} from '../../logic/evaluateGuess';
import {getTileColors} from '../../theme/getColors';

export type TileColors = ReturnType<typeof getTileColors>;

export type KeyProps = {
  label: string;
  onPress: () => void;
  state?: TileState;
  flex?: number;
  isAction?: boolean;
  accessibilityLabel?: string;
  disabled?: boolean;
  tileColors?: TileColors;
};

export type KeyboardProps = {
  onKey: (k: string) => void;
  keyStates: Map<string, TileState>;
  tileColors: TileColors;
};
