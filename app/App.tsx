// app/App.tsx
import React, {useState, useEffect} from 'react';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {KeyboardProvider} from 'react-native-keyboard-controller';
import BootSplash from 'react-native-bootsplash';

import GameScreen from '../src/screens/GameScreen';
import StatsScreen from '../src/screens/StatsScreen';
import FriendsScreen from '../src/screens/FriendsScreen';
import {SignInScreen, SignUpScreen} from '../src/screens/Auth';
import {AuthProvider, useAuth} from '../src/contexts/AuthContext';

type Screen = 'game' | 'stats' | 'friends' | 'signin' | 'signup';

function AppContent() {
  const {isAuthenticated, loading, isDevelopmentMode} = useAuth();
  const [currentScreen, setCurrentScreen] = useState<Screen>('game');

  // Hide splash screen when auth loading completes
  useEffect(() => {
    if (!loading) {
      BootSplash.hide({fade: true, duration: 250});
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
          onSignUpSuccess={() => setCurrentScreen('game')}
          onNavigateToSignIn={() => setCurrentScreen('signin')}
        />
      );
    }

    return (
      <SignInScreen
        onSignInSuccess={() => setCurrentScreen('game')}
        onNavigateToSignUp={() => setCurrentScreen('signup')}
      />
    );
  }

  // Main app screens (authenticated or dev mode)
  if (currentScreen === 'friends') {
    return (
      <FriendsScreen
        onBack={() => setCurrentScreen('stats')}
        onPlayNow={() => setCurrentScreen('game')}
      />
    );
  }

  if (currentScreen === 'stats') {
    return (
      <StatsScreen
        onBack={() => setCurrentScreen('game')}
        onNavigateToFriends={() => setCurrentScreen('friends')}
      />
    );
  }

  return <GameScreen onNavigateToStats={() => setCurrentScreen('stats')} />;
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

