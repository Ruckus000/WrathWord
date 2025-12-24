import React, { useState, useCallback, useMemo, ReactNode } from 'react';
import { NavigationContext } from './NavigationContext';
import { Screen, ScreenParams, NavigationState, NavigationContextValue } from './types';
import { FEATURE_FLAGS } from '../../config/featureFlags';

interface NavigationProviderProps {
  children: ReactNode;
  initialScreen?: Screen;
}

export function NavigationProvider({
  children,
  initialScreen
}: NavigationProviderProps) {
  // Determine initial screen based on feature flag
  const defaultScreen: Screen = FEATURE_FLAGS.HOME_SCREEN_ENABLED ? 'home' : 'game';

  const [state, setState] = useState<NavigationState>({
    currentScreen: initialScreen ?? defaultScreen,
    params: undefined,
    history: [],
  });

  const navigate = useCallback(<S extends Screen>(
    screen: S,
    params?: ScreenParams[S]
  ) => {
    setState(prev => ({
      currentScreen: screen,
      params: params as ScreenParams[Screen],
      history: [...prev.history, prev.currentScreen],
    }));
  }, []);

  const goBack = useCallback(() => {
    setState(prev => {
      if (prev.history.length === 0) return prev;

      const newHistory = [...prev.history];
      const previousScreen = newHistory.pop()!;

      return {
        currentScreen: previousScreen,
        params: undefined,
        history: newHistory,
      };
    });
  }, []);

  const reset = useCallback((screen: Screen) => {
    setState({
      currentScreen: screen,
      params: undefined,
      history: [],
    });
  }, []);

  const value: NavigationContextValue = useMemo(() => ({
    state,
    navigate,
    goBack,
    canGoBack: state.history.length > 0,
    reset,
  }), [state, navigate, goBack, reset]);

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
}
