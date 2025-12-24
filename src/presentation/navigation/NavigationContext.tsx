import React, { createContext, useContext } from 'react';
import { NavigationContextValue, NavigationState } from './types';

const defaultState: NavigationState = {
  currentScreen: 'home',
  params: undefined,
  history: [],
};

const defaultValue: NavigationContextValue = {
  state: defaultState,
  navigate: () => {},
  goBack: () => {},
  canGoBack: false,
  reset: () => {},
};

export const NavigationContext = createContext<NavigationContextValue>(defaultValue);

export function useNavigationContext(): NavigationContextValue {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigationContext must be used within NavigationProvider');
  }
  return context;
}
