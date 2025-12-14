// app/App.tsx
import React, {useState, useEffect} from 'react';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {KeyboardProvider} from 'react-native-keyboard-controller';
import BootSplash from 'react-native-bootsplash';

import {HomeScreen} from '../src/screens/HomeScreen';
import GameScreen from '../src/screens/GameScreen';
import StatsScreen from '../src/screens/StatsScreen';
import FriendsScreen from '../src/screens/FriendsScreen';
import {SignInScreen, SignUpScreen} from '../src/screens/Auth';
import {AuthProvider, useAuth} from '../src/contexts/AuthContext';
import {FEATURE_FLAGS} from '../src/config/featureFlags';

type Screen = 'home' | 'game' | 'stats' | 'friends' | 'signin' | 'signup';
type InitialMode = 'daily' | 'free' | null;

function AppContent() {
  const {isAuthenticated, loading, isDevelopmentMode} = useAuth();

  // Determine initial screen based on feature flag
  const initialScreen: Screen = FEATURE_FLAGS.HOME_SCREEN_ENABLED ? 'home' : 'game';
  const [currentScreen, setCurrentScreen] = useState<Screen>(initialScreen);

  // Track the mode to pass to GameScreen
  const [initialMode, setInitialMode] = useState<InitialMode>(null);

  // Hide splash screen when auth loading completes
  useEffect(() => {
    if (!loading) {
      BootSplash.hide({fade: true});
    }
  }, [loading]);

  // Keep showing splash while loading (return null keeps bootsplash visible)
  if (loading) {
    return null;
  }

  // In production mode, show auth screens if not authenticated
  if (!isDevelopmentMode && !isAuthenticated) {
    if (currentScreen === 'signup') {
      return (
        <SignUpScreen
          onSignUpSuccess={() => setCurrentScreen(initialScreen)}
          onNavigateToSignIn={() => setCurrentScreen('signin')}
        />
      );
    }

    return (
      <SignInScreen
        onSignInSuccess={() => setCurrentScreen(initialScreen)}
        onNavigateToSignUp={() => setCurrentScreen('signup')}
      />
    );
  }

  // Main app screens (authenticated or dev mode)

  // HomeScreen (new entry point when feature flag enabled)
  if (currentScreen === 'home') {
    return (
      <HomeScreen
        onPlayDaily={() => {
          setInitialMode('daily');
          setCurrentScreen('game');
        }}
        onContinueGame={() => {
          setInitialMode(null); // Let GameScreen restore from storage
          setCurrentScreen('game');
        }}
        onFreePlay={() => {
          setInitialMode('free'); // Triggers NewGameModal
          setCurrentScreen('game');
        }}
        onNavigateToStats={() => setCurrentScreen('stats')}
        onNavigateToFriends={() => setCurrentScreen('friends')}
      />
    );
  }

  if (currentScreen === 'friends') {
    return (
      <FriendsScreen
        onBack={() => setCurrentScreen('stats')}
        onPlayNow={() => {
          setInitialMode(null);
          setCurrentScreen('game');
        }}
      />
    );
  }

  if (currentScreen === 'stats') {
    return (
      <StatsScreen
        onBack={() => setCurrentScreen(FEATURE_FLAGS.HOME_SCREEN_ENABLED ? 'home' : 'game')}
        onNavigateToFriends={() => setCurrentScreen('friends')}
      />
    );
  }

  // GameScreen
  return (
    <GameScreen
      initialMode={initialMode}
      onNavigateToStats={() => {
        console.log('[App] onNavigateToStats called, switching to stats');
        setCurrentScreen('stats');
      }}
    />
  );
}

export default function App() {
  return (
    <KeyboardProvider>
      <SafeAreaProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </SafeAreaProvider>
    </KeyboardProvider>
  );
}

