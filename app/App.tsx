// app/App.tsx
import React, {useState} from 'react';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {KeyboardProvider} from 'react-native-keyboard-controller';
import {View, ActivityIndicator, StyleSheet} from 'react-native';
import GameScreen from '../src/screens/GameScreen';
import StatsScreen from '../src/screens/StatsScreen';
import FriendsScreen from '../src/screens/FriendsScreen';
import {SignInScreen, SignUpScreen} from '../src/screens/Auth';
import {AuthProvider, useAuth} from '../src/contexts/AuthContext';
import {palette} from '../src/theme/colors';

type Screen = 'game' | 'stats' | 'friends' | 'signin' | 'signup';

function AppContent() {
  const {isAuthenticated, loading, isDevelopmentMode} = useAuth();
  const [currentScreen, setCurrentScreen] = useState<Screen>('game');

  // Show loading screen while checking auth state
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={palette.primary} />
      </View>
    );
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
        userPlayedToday={true}
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

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: palette.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
