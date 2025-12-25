# Task 5.2: App.tsx Update (PARALLEL - Wave 1)

## Agent Assignment
This task runs in **parallel with Tasks 5.1 and 5.5**.
Task 5.3 depends on this task completing first.

## Objective
Update `App.tsx` to:
1. Import GameScreen from the new `src/presentation/screens/Game/` location
2. Add NavigationProvider wrapper
3. Use the new navigation hooks

## Files to Modify
- `app/App.tsx`

## Current State

```typescript
// app/App.tsx - CURRENT
import GameScreen from '../src/screens/GameScreen';  // OLD location

// Manual screen state management
const [currentScreen, setCurrentScreen] = useState<Screen>('home');
const [initialMode, setInitialMode] = useState<InitialMode>(null);

// Scattered navigation calls
setCurrentScreen('game');
setInitialMode('daily');
```

## Target State

```typescript
// app/App.tsx - AFTER
import GameScreen from '../src/presentation/screens/Game/GameScreen';  // NEW location
import { NavigationProvider, useNavigation } from '../src/presentation/navigation';

// Clean navigation via context
const { currentScreen, params, navigateToGame, navigateToStats } = useNavigation();
```

## Implementation

```typescript
// app/App.tsx

import React, { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import BootSplash from 'react-native-bootsplash';

// Screens - use NEW presentation layer location
import { HomeScreen } from '../src/screens/HomeScreen';
import GameScreen from '../src/presentation/screens/Game/GameScreen';  // NEW
import StatsScreen from '../src/screens/StatsScreen';
import FriendsScreen from '../src/screens/FriendsScreen';
import { SignInScreen, SignUpScreen } from '../src/screens/Auth';

// Auth
import { AuthProvider, useAuth } from '../src/contexts/AuthContext';

// Navigation - use NEW navigation provider
import { NavigationProvider, useNavigation, useScreenParams } from '../src/presentation/navigation';

import { FEATURE_FLAGS } from '../src/config/featureFlags';

function AppContent() {
  const { isAuthenticated, loading, isDevelopmentMode } = useAuth();
  const { 
    currentScreen, 
    navigateToGame, 
    navigateToStats, 
    navigateToFriends,
    navigateToHome,
    navigateToSignIn,
    navigateToSignUp,
    reset,
  } = useNavigation();

  // Get screen params for game screen
  const gameParams = useScreenParams<'game'>();

  // Hide splash screen when auth loading completes
  useEffect(() => {
    if (!loading) {
      BootSplash.hide({ fade: true });
    }
  }, [loading]);

  // Keep showing splash while loading
  if (loading) {
    return null;
  }

  // In production mode, show auth screens if not authenticated
  if (!isDevelopmentMode && !isAuthenticated) {
    if (currentScreen === 'signup') {
      return (
        <SignUpScreen
          onSignUpSuccess={() => reset(FEATURE_FLAGS.HOME_SCREEN_ENABLED ? 'home' : 'game')}
          onNavigateToSignIn={navigateToSignIn}
        />
      );
    }

    return (
      <SignInScreen
        onSignInSuccess={() => reset(FEATURE_FLAGS.HOME_SCREEN_ENABLED ? 'home' : 'game')}
        onNavigateToSignUp={navigateToSignUp}
      />
    );
  }

  // Main app screens (authenticated or dev mode)

  // HomeScreen
  if (currentScreen === 'home') {
    return (
      <HomeScreen
        onPlayDaily={() => navigateToGame('daily')}
        onContinueGame={() => navigateToGame(null)}
        onFreePlay={() => navigateToGame('free')}
        onNavigateToStats={navigateToStats}
        onNavigateToFriends={navigateToFriends}
      />
    );
  }

  // FriendsScreen
  if (currentScreen === 'friends') {
    return (
      <FriendsScreen
        onBack={navigateToStats}
        onPlayNow={() => navigateToGame(null)}
      />
    );
  }

  // StatsScreen
  if (currentScreen === 'stats') {
    return (
      <StatsScreen
        onBack={() => FEATURE_FLAGS.HOME_SCREEN_ENABLED ? navigateToHome() : navigateToGame(null)}
        onNavigateToFriends={navigateToFriends}
      />
    );
  }

  // GameScreen (default)
  return (
    <GameScreen
      initialMode={gameParams?.initialMode}
      onNavigateToStats={() => {
        console.log('[App] onNavigateToStats called');
        navigateToStats();
      }}
    />
  );
}

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

## Key Changes

| Before | After |
|--------|-------|
| `import GameScreen from '../src/screens/GameScreen'` | `import GameScreen from '../src/presentation/screens/Game/GameScreen'` |
| `useState` for screen management | `useNavigation()` hook |
| `setCurrentScreen('game')` | `navigateToGame('daily')` |
| `setInitialMode(null)` | Params via navigation context |
| No NavigationProvider | Wrapped with NavigationProvider |

## Verification Steps

After making changes:

```bash
# 1. Type check (ensures imports resolve)
npx tsc --noEmit

# 2. Run all tests
npm test

# 3. Run the app to verify navigation works
npm run ios
```

## Manual Smoke Test

After the changes, verify:
1. [ ] App launches without errors
2. [ ] Home screen displays (if feature flag enabled)
3. [ ] Can navigate to Game screen
4. [ ] Can navigate to Stats screen
5. [ ] Can navigate to Friends screen
6. [ ] Back navigation works
7. [ ] Auth screens work (if in production mode)

## Completion Criteria
- [ ] GameScreen import updated to new location
- [ ] NavigationProvider wraps AppContent
- [ ] useNavigation hook replaces useState
- [ ] All navigation callbacks use hook methods
- [ ] useScreenParams used for game params
- [ ] No TypeScript errors
- [ ] All tests pass
- [ ] Manual smoke test passes

## Commit Message
```
refactor(app): use NavigationProvider and new GameScreen location

- Switch GameScreen import to presentation layer
- Wrap app with NavigationProvider
- Replace useState with useNavigation hook
- Use type-safe navigation methods
```
