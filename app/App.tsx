// app/App.tsx
import React, {useState} from 'react';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import GameScreen from '../src/screens/GameScreen';
import StatsScreen from '../src/screens/StatsScreen';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<'game' | 'stats'>('game');

  if (currentScreen === 'stats') {
    return (
      <SafeAreaProvider>
        <StatsScreen onBack={() => setCurrentScreen('game')} />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <GameScreen onNavigateToStats={() => setCurrentScreen('stats')} />
    </SafeAreaProvider>
  );
}
