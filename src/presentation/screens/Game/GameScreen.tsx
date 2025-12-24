import React from 'react';
import { View, StyleSheet, Animated, Modal, Text, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGameSession } from './useGameSession';
import Header from '../../../components/Header';
import { NewGameModal } from '../../../components/NewGameModal';
import { Board } from '../../../components/Board';
import { Keyboard } from '../../../components/Keyboard';
import { ResultModal } from '../../../components/ResultModal';
import { palette } from '../../../theme/colors';
import { getTileColors } from '../../../theme/getColors';

interface GameScreenProps {
  onNavigateToStats?: () => void;
  initialMode?: 'daily' | 'free' | null;
}

export default function GameScreen({ onNavigateToStats, initialMode }: GameScreenProps) {
  const insets = useSafeAreaInsets();
  const tileColors = getTileColors();
  const {
    length, maxRows, mode, dateISO, answer, rows, feedback, current, status,
    hintUsed, hintedCell, hintedLetter, showResult, showSettings, errorMsg,
    staleGameWarning, keyStates, hintDisabled, gameInProgress, formattedDate,
    onKey, handleHint, handleNewGame, handleNewGameStart, handleCancel,
    handleGiveUp, handleStartTodaysPuzzle, handleFinishCurrentGame,
    closeResult, playAgain, shakeAnim,
  } = useGameSession({ initialMode });
  const playAgainIsFreeMode = mode === 'daily';

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
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
      {errorMsg ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{errorMsg}</Text>
        </View>
      ) : null}
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
      <Keyboard onKey={onKey} keyStates={keyStates} tileColors={tileColors} />
      <NewGameModal
        visible={showSettings}
        initialConfig={{ length, maxRows, mode }}
        gameInProgress={gameInProgress}
        onStart={handleNewGameStart}
        onCancel={handleCancel}
        onGiveUp={handleGiveUp}
      />
      <StaleGameModal
        visible={staleGameWarning}
        onStartToday={handleStartTodaysPuzzle}
        onFinishCurrent={handleFinishCurrentGame}
      />
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

function StaleGameModal({ visible, onStartToday, onFinishCurrent }: {
  visible: boolean; onStartToday: () => void; onFinishCurrent: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onFinishCurrent}>
      <View style={styles.staleGameOverlay}>
        <View style={styles.staleGameCard}>
          <Text style={styles.staleGameTitle}>New Day!</Text>
          <Text style={styles.staleGameText}>
            A new daily puzzle is available. Would you like to finish your current game or start today's puzzle?
          </Text>
          <Pressable style={styles.staleGameButton} onPress={onStartToday}>
            <Text style={styles.staleGameButtonText}>Start Today's Puzzle</Text>
          </Pressable>
          <Pressable style={styles.staleGameButtonSecondary} onPress={onFinishCurrent}>
            <Text style={styles.staleGameButtonTextSecondary}>Finish Current Game</Text>
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
