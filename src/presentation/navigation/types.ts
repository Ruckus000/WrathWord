export type Screen = 'home' | 'game' | 'stats' | 'friends' | 'signin' | 'signup';

export type ScreenParams = {
  home: undefined;
  game: { initialMode?: 'daily' | 'free' | null };
  stats: undefined;
  friends: undefined;
  signin: undefined;
  signup: undefined;
};

export interface NavigationState {
  currentScreen: Screen;
  params: ScreenParams[Screen];
  history: Screen[];
}

export interface NavigationContextValue {
  state: NavigationState;
  navigate: <S extends Screen>(screen: S, params?: ScreenParams[S]) => void;
  goBack: () => void;
  canGoBack: boolean;
  reset: (screen: Screen) => void;
}
