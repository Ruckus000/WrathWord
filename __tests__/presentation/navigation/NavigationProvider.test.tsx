import React from 'react';
import { renderHook, act } from '@testing-library/react-native';
import { NavigationProvider } from '../../../src/presentation/navigation/NavigationProvider';
import { useNavigation, useScreenParams } from '../../../src/presentation/navigation/useNavigation';

// Mock feature flags
jest.mock('../../../src/config/featureFlags', () => ({
  FEATURE_FLAGS: {
    HOME_SCREEN_ENABLED: true,
  },
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <NavigationProvider>{children}</NavigationProvider>
);

describe('NavigationProvider', () => {
  describe('initial state', () => {
    it('starts at home screen when HOME_SCREEN_ENABLED', () => {
      const { result } = renderHook(() => useNavigation(), { wrapper });

      expect(result.current.currentScreen).toBe('home');
    });

    it('respects initialScreen prop', () => {
      const customWrapper = ({ children }: { children: React.ReactNode }) => (
        <NavigationProvider initialScreen="stats">{children}</NavigationProvider>
      );

      const { result } = renderHook(() => useNavigation(), { wrapper: customWrapper });

      expect(result.current.currentScreen).toBe('stats');
    });

    it('starts with empty history', () => {
      const { result } = renderHook(() => useNavigation(), { wrapper });

      expect(result.current.canGoBack).toBe(false);
    });
  });

  describe('navigate', () => {
    it('changes current screen', () => {
      const { result } = renderHook(() => useNavigation(), { wrapper });

      act(() => {
        result.current.navigate('game');
      });

      expect(result.current.currentScreen).toBe('game');
    });

    it('passes params to new screen', () => {
      const { result } = renderHook(() => useNavigation(), { wrapper });

      act(() => {
        result.current.navigateToGame('daily');
      });

      expect(result.current.currentScreen).toBe('game');
      expect(result.current.params).toEqual({ initialMode: 'daily' });
    });

    it('adds previous screen to history', () => {
      const { result } = renderHook(() => useNavigation(), { wrapper });

      act(() => {
        result.current.navigate('game');
      });

      expect(result.current.canGoBack).toBe(true);
    });
  });

  describe('goBack', () => {
    it('returns to previous screen', () => {
      const { result } = renderHook(() => useNavigation(), { wrapper });

      act(() => {
        result.current.navigate('game');
        result.current.navigate('stats');
      });

      expect(result.current.currentScreen).toBe('stats');

      act(() => {
        result.current.goBack();
      });

      expect(result.current.currentScreen).toBe('game');
    });

    it('does nothing if no history', () => {
      const { result } = renderHook(() => useNavigation(), { wrapper });

      const initialScreen = result.current.currentScreen;

      act(() => {
        result.current.goBack();
      });

      expect(result.current.currentScreen).toBe(initialScreen);
    });

    it('clears params on goBack', () => {
      const { result } = renderHook(() => useNavigation(), { wrapper });

      act(() => {
        result.current.navigateToGame('daily');
        result.current.goBack();
      });

      expect(result.current.params).toBeUndefined();
    });
  });

  describe('reset', () => {
    it('navigates to screen and clears history', () => {
      const { result } = renderHook(() => useNavigation(), { wrapper });

      act(() => {
        result.current.navigate('game');
        result.current.navigate('stats');
        result.current.navigate('friends');
      });

      expect(result.current.canGoBack).toBe(true);

      act(() => {
        result.current.reset('home');
      });

      expect(result.current.currentScreen).toBe('home');
      expect(result.current.canGoBack).toBe(false);
    });
  });

  describe('convenience methods', () => {
    it('navigateToGame sets correct screen and params', () => {
      const { result } = renderHook(() => useNavigation(), { wrapper });

      act(() => {
        result.current.navigateToGame('free');
      });

      expect(result.current.currentScreen).toBe('game');
      expect(result.current.params).toEqual({ initialMode: 'free' });
    });

    it('navigateToStats sets correct screen', () => {
      const { result } = renderHook(() => useNavigation(), { wrapper });

      act(() => {
        result.current.navigateToStats();
      });

      expect(result.current.currentScreen).toBe('stats');
    });

    it('navigateToFriends sets correct screen', () => {
      const { result } = renderHook(() => useNavigation(), { wrapper });

      act(() => {
        result.current.navigateToFriends();
      });

      expect(result.current.currentScreen).toBe('friends');
    });
  });

  describe('useScreenParams', () => {
    it('returns current screen params', () => {
      const { result } = renderHook(
        () => ({
          nav: useNavigation(),
          params: useScreenParams<'game'>(),
        }),
        { wrapper }
      );

      act(() => {
        result.current.nav.navigateToGame('daily');
      });

      expect(result.current.params).toEqual({ initialMode: 'daily' });
    });

    it('returns undefined when no params', () => {
      const { result } = renderHook(
        () => ({
          nav: useNavigation(),
          params: useScreenParams<'stats'>(),
        }),
        { wrapper }
      );

      act(() => {
        result.current.nav.navigateToStats();
      });

      expect(result.current.params).toBeUndefined();
    });
  });
});

describe('NavigationProvider without HOME_SCREEN_ENABLED', () => {
  it('starts at game screen when initialScreen overrides feature flag', () => {
    // Test that initialScreen prop overrides the feature flag
    const customWrapper = ({ children }: { children: React.ReactNode }) => (
      <NavigationProvider initialScreen="game">{children}</NavigationProvider>
    );

    const { result } = renderHook(() => useNavigation(), { wrapper: customWrapper });

    expect(result.current.currentScreen).toBe('game');
  });
});
