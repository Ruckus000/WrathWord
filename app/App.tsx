// app/App.tsx
import React, {useEffect} from 'react';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {KeyboardProvider} from 'react-native-keyboard-controller';
import BootSplash from 'react-native-bootsplash';

import {HomeScreen} from '../src/screens/HomeScreen';
import GameScreen from '../src/presentation/screens/Game/GameScreen';
import StatsScreen from '../src/screens/StatsScreen';
import FriendsScreen from '../src/screens/FriendsScreen';
import {SignInScreen, SignUpScreen} from '../src/screens/Auth';
import {AuthProvider, useAuth} from '../src/contexts/AuthContext';
import {NavigationProvider, useNavigation, useScreenParams} from '../src/presentation/navigation';
import {FEATURE_FLAGS} from '../src/config/featureFlags';

function AppContent() {
  const {isAuthenticated, loading, isDevelopmentMode, isGuest, enterGuestMode, signOut} = useAuth();
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
      BootSplash.hide({fade: true});
    }
  }, [loading]);

  // Keep showing splash while loading (return null keeps bootsplash visible)
  if (loading) {
    return null;
  }

  // Check if user can access the app (authenticated, guest, or dev mode)
  const canAccessApp = isDevelopmentMode || isAuthenticated || isGuest;

  // Handle guest mode entry
  const handleContinueAsGuest = () => {
    enterGuestMode();
    reset(FEATURE_FLAGS.HOME_SCREEN_ENABLED ? 'home' : 'game');
  };

  // In production mode, show auth screens if not authenticated and not guest
  if (!canAccessApp) {
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
        onContinueAsGuest={handleContinueAsGuest}
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
        onNavigateToSignIn={async () => {
          await signOut();
          navigateToSignIn();
        }}
      />
    );
  }

  // StatsScreen
  if (currentScreen === 'stats') {
    return (
      <StatsScreen
        onBack={() => FEATURE_FLAGS.HOME_SCREEN_ENABLED ? navigateToHome() : navigateToGame(null)}
        onNavigateToFriends={navigateToFriends}
        onNavigateToSignIn={async () => {
          await signOut();
          navigateToSignIn();
        }}
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

