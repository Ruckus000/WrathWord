# Task 4.3: Navigation Abstraction (PARALLEL - Wave 1)

## Agent Assignment
This task runs in **parallel with Task 4.1** (useGameSession).
This task has no dependencies on other Phase 4 tasks.

## Objective
Create a navigation abstraction layer to replace the manual screen state management in `App.tsx`.

## Files to Create
- `src/presentation/navigation/types.ts`
- `src/presentation/navigation/NavigationContext.tsx`
- `src/presentation/navigation/NavigationProvider.tsx`
- `src/presentation/navigation/useNavigation.ts`
- `__tests__/presentation/navigation/NavigationProvider.test.tsx`

## Current Problem

`App.tsx` currently uses manual state management:
```typescript
const [currentScreen, setCurrentScreen] = useState<Screen>('home');
const [initialMode, setInitialMode] = useState<InitialMode>(null);

// Scattered navigation calls
setCurrentScreen('game');
setInitialMode('daily');
```

This is error-prone and doesn't scale.

## Solution: Navigation Context

Create a type-safe navigation context that:
1. Centralizes navigation state
2. Provides type-safe navigation functions
3. Handles screen parameters (like `initialMode`)
4. Is easily testable

## Implementation

### Types

```typescript
// src/presentation/navigation/types.ts

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
```

### Context

```typescript
// src/presentation/navigation/NavigationContext.tsx

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
```

### Provider

```typescript
// src/presentation/navigation/NavigationProvider.tsx

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
```

### Hook

```typescript
// src/presentation/navigation/useNavigation.ts

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
```

### Index Export

```typescript
// src/presentation/navigation/index.ts

export * from './types';
export * from './NavigationContext';
export * from './NavigationProvider';
export * from './useNavigation';
```

## Test File

```typescript
// __tests__/presentation/navigation/NavigationProvider.test.tsx

import React from 'react';
import { renderHook, act } from '@testing-library/react-hooks';
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
  beforeEach(() => {
    jest.resetModules();
    jest.doMock('../../../src/config/featureFlags', () => ({
      FEATURE_FLAGS: {
        HOME_SCREEN_ENABLED: false,
      },
    }));
  });

  it('starts at game screen when HOME_SCREEN_ENABLED is false', async () => {
    // Re-import with new mock
    const { NavigationProvider: NavProvider } = await import(
      '../../../src/presentation/navigation/NavigationProvider'
    );
    const { useNavigation: useNav } = await import(
      '../../../src/presentation/navigation/useNavigation'
    );

    const customWrapper = ({ children }: { children: React.ReactNode }) => (
      <NavProvider>{children}</NavProvider>
    );

    const { result } = renderHook(() => useNav(), { wrapper: customWrapper });
    
    expect(result.current.currentScreen).toBe('game');
  });
});
```

## Verification

```bash
# Create directories
mkdir -p src/presentation/navigation
mkdir -p __tests__/presentation/navigation

# Run tests
npm test -- --testPathPattern="NavigationProvider"

# Type check
npx tsc --noEmit
```

## Integration Note

**Do NOT modify App.tsx yet.** Phase 5 will integrate the NavigationProvider:

```typescript
// Future App.tsx (Phase 5)
export default function App() {
  return (
    <KeyboardProvider>
      <SafeAreaProvider>
        <AuthProvider>
          <NavigationProvider>
            <AppContent />
          </NavigationProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </KeyboardProvider>
  );
}
```

## Completion Criteria
- [ ] Navigation types defined
- [ ] NavigationContext created
- [ ] NavigationProvider with state management
- [ ] useNavigation hook with convenience methods
- [ ] useScreenParams hook for typed params
- [ ] Comprehensive test coverage
- [ ] No TypeScript errors
- [ ] Tests pass

## Commit Message
```
feat(presentation): add NavigationProvider for type-safe navigation
```
