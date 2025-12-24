import { useCallback } from 'react';
import { useNavigationContext } from './NavigationContext';
import { Screen, ScreenParams } from './types';

/**
 * Hook for navigation actions.
 * Provides type-safe navigation functions.
 */
export function useNavigation() {
  const { state, navigate, goBack, canGoBack, reset } = useNavigationContext();

  // Convenience methods for common navigations
  const navigateToGame = useCallback((initialMode?: 'daily' | 'free' | null) => {
    navigate('game', { initialMode });
  }, [navigate]);

  const navigateToStats = useCallback(() => {
    navigate('stats');
  }, [navigate]);

  const navigateToFriends = useCallback(() => {
    navigate('friends');
  }, [navigate]);

  const navigateToHome = useCallback(() => {
    navigate('home');
  }, [navigate]);

  const navigateToSignIn = useCallback(() => {
    navigate('signin');
  }, [navigate]);

  const navigateToSignUp = useCallback(() => {
    navigate('signup');
  }, [navigate]);

  return {
    // Current state
    currentScreen: state.currentScreen,
    params: state.params,
    canGoBack,

    // Generic navigation
    navigate,
    goBack,
    reset,

    // Typed convenience methods
    navigateToGame,
    navigateToStats,
    navigateToFriends,
    navigateToHome,
    navigateToSignIn,
    navigateToSignUp,
  };
}

/**
 * Hook for getting screen-specific params.
 * Use in screens to get their navigation params.
 */
export function useScreenParams<S extends Screen>(): ScreenParams[S] | undefined {
  const { state } = useNavigationContext();
  return state.params as ScreenParams[S] | undefined;
}
