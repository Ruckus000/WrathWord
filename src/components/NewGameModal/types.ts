export type GameMode = 'daily' | 'free';

export type GameConfig = {
  length: number;
  maxRows: number;
  mode: GameMode;
};

export type NewGameModalProps = {
  visible: boolean;
  initialConfig: GameConfig;
  gameInProgress?: boolean;
  onStart: (config: GameConfig) => void;
  onCancel: () => void;
  onGiveUp?: () => void;
};
