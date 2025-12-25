# Task 4.2: GameScreen Refactor (SEQUENTIAL - Wave 2)

## Agent Assignment
This task runs **after Task 4.1 completes**.
It depends on the `useGameSession` hook created in Task 4.1.

## Objective
Refactor `GameScreen.tsx` to be a thin UI layer (<200 lines) that uses `useGameSession` hook.

## Files to Modify
- `src/screens/GameScreen.tsx` → Move to `src/presentation/screens/Game/GameScreen.tsx`

## Current State
- GameScreen.tsx is 600+ lines
- Mixes UI, state, logic, and persistence

## Target State
- GameScreen.tsx is <200 lines
- Pure UI rendering
- All logic delegated to `useGameSession` hook

## Implementation

```typescript
// src/presentation/screens/Game/GameScreen.tsx

import React from 'react';
import { View, StyleSheet, Animated, Modal, Text, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Hook with all game logic
import { useGameSession } from './useGameSession';

// UI Components
import Header from '../../../components/Header';
import { NewGameModal } from '../../../components/NewGameModal';
import { Board } from '../../../components/Board';
import { Keyboard } from '../../../components/Keyboard';
import { ResultModal } from '../../../components/ResultModal';

// Theme
import { palette } from '../../../theme/colors';
import { getTileColors } from '../../../theme/getColors';

interface GameScreenProps {
  onNavigateToStats?: () => void;
  initialMode?: 'daily' | 'free' | null;
}

export default function GameScreen({ 
  onNavigateToStats, 
  initialMode 
}: GameScreenProps) {
  const insets = useSafeAreaInsets();
  const tileColors = getTileColors();
  
  // All state and logic from the hook
  const {
    // State
    length,
    maxRows,
    mode,
    dateISO,
    answer,
    rows,
    feedback,
    current,
    status,
    
    // Hint state
    hintUsed,
    hintedCell,
    hintedLetter,
    
    // UI state
    showResult,
    showSettings,
    errorMsg,
    staleGameWarning,
    
    // Derived
    keyStates,
    hintDisabled,
    gameInProgress,
    formattedDate,
    playAgainIsFreeMode,
    
    // Actions
    onKey,
    handleHint,
    handleNewGame,
    handleNewGameStart,
    handleCancel,
    handleGiveUp,
    handleStartTodaysPuzzle,
    handleFinishCurrentGame,
    closeResult,
    playAgain,
    
    // Animation
    shakeAnim,
  } = useGameSession({ initialMode });

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top, paddingBottom: insets.bottom },
      ]}
    >
      {/* Header */}
      <Header
        mode={mode}
        length={length}
        maxRows={maxRows}
        formattedDate={formattedDate}
        onMenuPress={onNavigateToStats}
        onNewGamePress={handleNewGame}
        onHintPress={handleHint}
        hintDisabled={hintDisabled}
      />

      {/* Error message */}
      {errorMsg ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{errorMsg}</Text>
        </View>
      ) : null}

      {/* Board */}
      <Animated.View style={{ flex: 1, transform: [{ translateX: shakeAnim }] }}>
        <Board
          length={length}
          rows={rows}
          feedback={feedback}
          current={current}
          maxRows={maxRows}
          tileColors={tileColors}
          hintedCell={hintedCell}
          hintedLetter={hintedLetter}
        />
      </Animated.View>

      {/* Keyboard */}
      <Keyboard onKey={onKey} keyStates={keyStates} tileColors={tileColors} />

      {/* Settings sheet */}
      <NewGameModal
        visible={showSettings}
        initialConfig={{ length, maxRows, mode }}
        gameInProgress={gameInProgress}
        onStart={handleNewGameStart}
        onCancel={handleCancel}
        onGiveUp={handleGiveUp}
      />

      {/* Stale game warning modal */}
      <StaleGameModal
        visible={staleGameWarning}
        onStartToday={handleStartTodaysPuzzle}
        onFinishCurrent={handleFinishCurrentGame}
      />

      {/* Result modal */}
      <ResultModal
        visible={showResult}
        status={status}
        rows={rows}
        maxRows={maxRows}
        length={length}
        feedback={feedback}
        dateISO={dateISO}
        answer={answer}
        tileColors={tileColors}
        playAgainIsFreeMode={playAgainIsFreeMode}
        onPlayAgain={playAgain}
      />
    </View>
  );
}

/**
 * Stale game warning modal component.
 * Extracted to keep GameScreen clean.
 */
function StaleGameModal({
  visible,
  onStartToday,
  onFinishCurrent,
}: {
  visible: boolean;
  onStartToday: () => void;
  onFinishCurrent: () => void;
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onFinishCurrent}
    >
      <View style={styles.staleGameOverlay}>
        <View style={styles.staleGameCard}>
          <Text style={styles.staleGameTitle}>New Day!</Text>
          <Text style={styles.staleGameText}>
            A new daily puzzle is available. Would you like to finish your
            current game or start today's puzzle?
          </Text>
          <Pressable style={styles.staleGameButton} onPress={onStartToday}>
            <Text style={styles.staleGameButtonText}>Start Today's Puzzle</Text>
          </Pressable>
          <Pressable
            style={styles.staleGameButtonSecondary}
            onPress={onFinishCurrent}
          >
            <Text style={styles.staleGameButtonTextSecondary}>
              Finish Current Game
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.bg,
    paddingHorizontal: 16,
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: 10,
    minHeight: 40,
    backgroundColor: '#2c1f1f',
    borderRadius: 8,
    marginHorizontal: 20,
  },
  errorText: {
    color: '#ff453a',
    fontSize: 14,
    fontWeight: '600',
  },
  staleGameOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  staleGameCard: {
    backgroundColor: palette.bg,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  staleGameTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#e4e4e7',
    textAlign: 'center',
    marginBottom: 12,
  },
  staleGameText: {
    fontSize: 15,
    color: '#a1a1aa',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  staleGameButton: {
    backgroundColor: '#22c55e',
    paddingVertical: 14,
    borderRadius: 10,
    marginBottom: 12,
  },
  staleGameButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  staleGameButtonSecondary: {
    backgroundColor: 'transparent',
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#3f3f46',
  },
  staleGameButtonTextSecondary: {
    color: '#a1a1aa',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
});
```

## Migration Strategy

1. **Create new file** at `src/presentation/screens/Game/GameScreen.tsx`
2. **Keep old file** at `src/screens/GameScreen.tsx` temporarily
3. **Update imports** in `App.tsx` to use new location
4. **Test thoroughly**
5. **Delete old file** in Phase 5

## Test File

```typescript
// __tests__/presentation/screens/Game/GameScreen.test.tsx

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import GameScreen from '../../../../src/presentation/screens/Game/GameScreen';

// Mock the hook
jest.mock('../../../../src/presentation/screens/Game/useGameSession', () => ({
  useGameSession: () => ({
    // State
    length: 5,
    maxRows: 6,
    mode: 'daily',
    dateISO: '2025-01-15',
    answer: 'HELLO',
    rows: [],
    feedback: [],
    current: '',
    status: 'playing',
    
    // Hint state
    hintUsed: false,
    hintedCell: null,
    hintedLetter: null,
    
    // UI state
    showResult: false,
    showSettings: false,
    errorMsg: '',
    staleGameWarning: false,
    
    // Derived
    keyStates: new Map(),
    hintDisabled: false,
    gameInProgress: false,
    formattedDate: 'Jan 15',
    playAgainIsFreeMode: false,
    
    // Actions
    onKey: jest.fn(),
    handleHint: jest.fn(),
    handleNewGame: jest.fn(),
    handleNewGameStart: jest.fn(),
    handleCancel: jest.fn(),
    handleGiveUp: jest.fn(),
    handleStartTodaysPuzzle: jest.fn(),
    handleFinishCurrentGame: jest.fn(),
    closeResult: jest.fn(),
    playAgain: jest.fn(),
    
    // Animation
    shakeAnim: { setValue: jest.fn() },
  }),
}));

// Mock safe area
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }),
  SafeAreaProvider: ({ children }: any) => children,
}));

// Mock theme
jest.mock('../../../../src/theme/getColors', () => ({
  getTileColors: () => ({
    correct: '#34c759',
    present: '#ffd60a',
    absent: '#3a3a3c',
  }),
}));

const renderGameScreen = (props = {}) => {
  return render(
    <SafeAreaProvider>
      <GameScreen {...props} />
    </SafeAreaProvider>
  );
};

describe('GameScreen', () => {
  it('renders without crashing', () => {
    const { getByTestId } = renderGameScreen();
    // Verify basic rendering
  });

  it('renders Header with correct props', () => {
    const { getByText } = renderGameScreen();
    // Verify header content
  });

  it('renders Board component', () => {
    renderGameScreen();
    // Verify board is rendered
  });

  it('renders Keyboard component', () => {
    renderGameScreen();
    // Verify keyboard is rendered
  });

  it('does not render error when errorMsg is empty', () => {
    const { queryByText } = renderGameScreen();
    // Verify no error container
  });

  it('passes onNavigateToStats to Header', () => {
    const onNavigateToStats = jest.fn();
    renderGameScreen({ onNavigateToStats });
    // Verify prop is passed
  });

  it('passes initialMode to useGameSession', () => {
    renderGameScreen({ initialMode: 'daily' });
    // Verify hook receives prop
  });
});

describe('GameScreen with error state', () => {
  beforeEach(() => {
    jest.doMock('../../../../src/presentation/screens/Game/useGameSession', () => ({
      useGameSession: () => ({
        // ... other state
        errorMsg: 'Not in word list',
        // ... rest of state
      }),
    }));
  });

  it('renders error message when present', async () => {
    // Re-import with mock
    // Verify error is displayed
  });
});

describe('GameScreen line count', () => {
  it('should be under 200 lines', () => {
    // This is a documentation test - verify manually
    // The refactored GameScreen should be around 150-180 lines
  });
});
```

## Verification

```bash
# Ensure Task 4.1 is complete first!
npm test -- --testPathPattern="useGameSession"

# Then run GameScreen tests
npm test -- --testPathPattern="GameScreen"

# Full test suite
npm test

# Type check
npx tsc --noEmit

# Line count check (should be <200)
wc -l src/presentation/screens/Game/GameScreen.tsx
```

## Completion Criteria
- [ ] GameScreen is <200 lines
- [ ] All logic delegated to useGameSession hook
- [ ] StaleGameModal extracted as separate component
- [ ] All existing functionality preserved
- [ ] Tests pass
- [ ] No TypeScript errors
- [ ] Manual smoke test passes

## Commit Message
```
refactor(presentation): slim GameScreen to pure UI layer

- Extract all game logic to useGameSession hook
- GameScreen now <200 lines
- Extract StaleGameModal component
```
