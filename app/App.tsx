// app/App.tsx
import React, {useState} from 'react';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import GameScreen from '../src/screens/GameScreen';
import StatsScreen from '../src/screens/StatsScreen';
import FriendsScreen from '../src/screens/FriendsScreen';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<
    'game' | 'stats' | 'friends'
  >('game');

  if (currentScreen === 'friends') {
    return (
      <SafeAreaProvider>
        <FriendsScreen
          onBack={() => setCurrentScreen('stats')}
          onPlayNow={() => setCurrentScreen('game')}
          userPlayedToday={true}
        />
      </SafeAreaProvider>
    );
  }

  if (currentScreen === 'stats') {
    return (
      <SafeAreaProvider>
        <StatsScreen
          onBack={() => setCurrentScreen('game')}
          onNavigateToFriends={() => setCurrentScreen('friends')}
        />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <GameScreen onNavigateToStats={() => setCurrentScreen('stats')} />
    </SafeAreaProvider>
  );
}
