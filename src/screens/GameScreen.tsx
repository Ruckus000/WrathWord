// src/screens/GameScreen.tsx
import React, {useCallback, useEffect, useMemo, useState, useRef} from 'react';
// Statically import word lists for lengths 4-6 (Metro/Expo + Hermes compatible)
import answers4 from '../logic/words/answers-4';
import allowed4 from '../logic/words/allowed-4';
import answers5 from '../logic/words/answers-5';
import allowed5 from '../logic/words/allowed-5';
import answers6 from '../logic/words/answers-6';
import allowed6 from '../logic/words/allowed-6';
import {VALID_LENGTHS, DEFAULT_LENGTH, isValidLength} from '../config/gameConfig';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Modal,
  AccessibilityInfo,
  useWindowDimensions,
  Animated,
  Share,
  ScrollView,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {triggerImpact, triggerNotification} from '../utils/haptics';
import {evaluateGuess, TileState} from '../logic/evaluateGuess';
import {selectDaily} from '../logic/selectDaily';
import {getJSON, setJSON} from '../storage/mmkv';
import {getScopedKey} from '../storage/userScope';
import {
  getProfile,
  getStatsForLength,
  getWinRate,
  markWordAsUsed,
  getUnusedWords,
} from '../storage/profile';
import {
  isDailyCompleted,
  markDailyCompleted,
  isDailyCompletedFromGameState,
} from '../storage/dailyCompletion';

import {gameResultsService} from '../services/data';
import {
  generateShareText,
  getResultEmoji,
  getResultTitle,
} from '../logic/shareResult';

import Header from '../components/Header';
import {NewGameModal, GameConfig} from '../components/NewGameModal';
import {palette} from '../theme/colors';
import {getTileColors} from '../theme/getColors';
import LinearGradient from 'react-native-linear-gradient';

const GAME_STATE_BASE_KEY = 'game.state';

// Get the scoped game state key for the current user
function getGameStateKey(): string {
  const scopedKey = getScopedKey(GAME_STATE_BASE_KEY);
  // Fall back to base key if no user is set (for backwards compatibility during development)
  return scopedKey ?? GAME_STATE_BASE_KEY;
}

type Mode = 'daily' | 'free';
type GameStatus = 'playing' | 'won' | 'lost';

const LETTERS = ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM']; // simple keyboard

// Helper function for ordinal numbers (1st, 2nd, 3rd, etc.)
const getOrdinal = (n: number): string => {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

type Props = {
  onNavigateToStats?: () => void;
};

export default function GameScreen({onNavigateToStats}: Props) {
  const insets = useSafeAreaInsets();
  const [length, setLength] = useState<number>(getJSON('settings.length', 5));
  const [maxRows, setMaxRows] = useState<number>(getJSON('settings.maxRows', 6));
  const [mode, setMode] = useState<Mode>(getJSON('settings.mode', 'daily'));
  const [dateISO, setDateISO] = useState<string>('');
  const [answer, setAnswer] = useState<string>('');
  const [rows, setRows] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<TileState[][]>([]);
  const [current, setCurrent] = useState<string>('');
  const [status, setStatus] = useState<GameStatus>('playing');
  const [showResult, setShowResult] = useState(false);
  // Only show the New Game sheet on true first launch
  const firstLaunchRef = useRef(getJSON('app.hasLaunched', false) === false);
  const [showSettings, setShowSettings] = useState(firstLaunchRef.current);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [playAgainIsFreeMode, setPlayAgainIsFreeMode] = useState(false);
  const shakeAnim = useRef(new Animated.Value(0)).current;

  // Hint system state
  const [hintUsed, setHintUsed] = useState<boolean>(false);
  const [hintedCell, setHintedCell] = useState<{row: number; col: number} | null>(null);
  const [hintedLetter, setHintedLetter] = useState<string | null>(null);

  // Track tile colors for reactivity when preferences change
  const [tileColors, setTileColors] = useState(getTileColors());

  // Load wordlists per length (4-6 only)
  const LISTS: Record<number, {answers: string[]; allowed: string[]}> = {
    4: {answers: answers4 as string[], allowed: allowed4 as string[]},
    5: {answers: answers5 as string[], allowed: allowed5 as string[]},
    6: {answers: answers6 as string[], allowed: allowed6 as string[]},
  };
  const getLists = useCallback((len: number): {answers: string[]; allowed: string[]} => {
    return LISTS[len] ?? LISTS[DEFAULT_LENGTH];
  }, []);

  // Keep the same Promise-based API used elsewhere
  const listsPromise = useMemo(() => Promise.resolve(getLists(length)), [getLists, length]);

  const loadNew = useCallback(
    async (seedDate?: string, explicitMode?: Mode, explicitLength?: number, explicitMaxRows?: number) => {
      // Use explicit parameters if provided, otherwise fall back to state
      const effectiveLength = explicitLength ?? length;
      const effectiveMaxRows = explicitMaxRows ?? maxRows;
      let effectiveMode: Mode = explicitMode ?? mode;
      const targetDateISO = seedDate ?? new Date().toISOString().slice(0, 10);

      // DAILY REPLAY PREVENTION: Check if daily is already completed
      if (effectiveMode === 'daily') {
        const alreadyCompleted = isDailyCompleted(effectiveLength, effectiveMaxRows, targetDateISO);
        if (alreadyCompleted) {
          effectiveMode = 'free';
          setMode('free');
        }
      }

      // Fetch the word lists for the effective length
      const {answers} = getLists(effectiveLength);

      // Get unused words for this length
      const unusedWords = getUnusedWords(effectiveLength, answers);

      // If all words have been used, use the full list (cycle resets automatically)
      const availableWords = unusedWords.length > 0 ? unusedWords : answers;

      // Select the next word based on mode
      const next =
        effectiveMode === 'daily'
          ? selectDaily(effectiveLength, effectiveMaxRows, targetDateISO, availableWords)
          : availableWords[Math.floor(Math.random() * availableWords.length)];

      setAnswer(next);
      setDateISO(targetDateISO);
      setRows([]);
      setFeedback([]);
      setCurrent('');
      setStatus('playing');
      setShowResult(false);
      // Reset hint state for new game
      setHintUsed(false);
      setHintedCell(null);
      setHintedLetter(null);
      setJSON('session', {length: effectiveLength, maxRows: effectiveMaxRows, mode: effectiveMode, dateISO: targetDateISO, answerHash: next});
    },
    [getLists, length, maxRows, mode],
  );

  useEffect(() => {
    setJSON('settings.length', length);
    setJSON('settings.maxRows', maxRows);
    setJSON('settings.mode', mode);
  }, [length, maxRows, mode]);

  // Persist progress whenever key fields change
  useEffect(() => {
    const state = {
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
    };
    setJSON(getGameStateKey(), state);
  }, [length, maxRows, mode, dateISO, answer, rows, feedback, current, status, hintUsed, hintedCell, hintedLetter]);

  // One-time initialization: on first launch, enforce 5×6 defaults and do not
  // restore any previous saved state. Otherwise, resume saved game if present.
  // - if not first launch -> start a new game automatically
  // - if first launch -> leave the New Game sheet open
  useEffect(() => {
    const init = async () => {
      // MIGRATION: Handle invalid length settings from removed 2/3-letter modes
      const savedLength = getJSON<number>('settings.length', DEFAULT_LENGTH);
      if (!isValidLength(savedLength)) {
        setJSON('settings.length', DEFAULT_LENGTH);
        setLength(DEFAULT_LENGTH);
      }

      // Clear any in-progress game with invalid length
      const savedGame = getJSON<{length?: number}>(getGameStateKey(), null as unknown as {length?: number});
      if (savedGame && savedGame.length && !isValidLength(savedGame.length)) {
        setJSON(getGameStateKey(), null);
      }

      if (firstLaunchRef.current) {
        // Enforce defaults for the initial experience
        setLength(5);
        setMaxRows(6);
        setMode('daily');
        // Do not restore saved progress or auto-start; user will press Start Game
        return;
      }
      const saved: any = getJSON(getGameStateKey(), null as any);
      const today = new Date().toISOString().slice(0, 10);
      if (saved && typeof saved === 'object') {
        // If daily and date changed, roll to today's word
        if (saved.mode === 'daily' && saved.dateISO && saved.dateISO !== today) {
          setLength(saved.length ?? length);
          setMaxRows(saved.maxRows ?? maxRows);
          setMode(saved.mode ?? mode);
          await loadNew(today);
          return;
        }

        // Restore saved session
        setLength(saved.length ?? length);
        setMaxRows(saved.maxRows ?? maxRows);
        setMode(saved.mode ?? mode);
        setDateISO(saved.dateISO ?? today);
        setAnswer(saved.answer ?? '');
        setRows(Array.isArray(saved.rows) ? saved.rows : []);
        setFeedback(Array.isArray(saved.feedback) ? saved.feedback : []);
        setStatus(saved.status === 'won' || saved.status === 'lost' ? saved.status : 'playing');

        // Restore hint state
        setHintUsed(saved.hintUsed ?? false);
        setHintedCell(saved.hintedCell ?? null);
        setHintedLetter(saved.hintedLetter ?? null);

        // Reconstruct current with hinted letter if needed
        let restoredCurrent = typeof saved.current === 'string' ? saved.current : '';
        if (saved.hintedCell && saved.hintedLetter && saved.status === 'playing') {
          const activeRowIdx = (Array.isArray(saved.rows) ? saved.rows.length : 0);
          if (saved.hintedCell.row === activeRowIdx) {
            const hintPos = saved.hintedCell.col;
            // Ensure hint letter is at correct position with space padding
            if (restoredCurrent.length <= hintPos || restoredCurrent[hintPos] !== saved.hintedLetter) {
              const padded = restoredCurrent.padEnd(hintPos, ' ');
              restoredCurrent = padded.slice(0, hintPos) + saved.hintedLetter + padded.slice(hintPos + 1);
            }
          }
        }
        setCurrent(restoredCurrent);

        // If game already ended, keep result modal visible for clarity
        if (saved.status === 'won' || saved.status === 'lost') setShowResult(true);
        // Do not auto-close the New Game sheet here; it may be closed by default unless firstLaunch
        return;
      }

      // No saved game: if not first launch, auto-start a new game
      const hasLaunched = getJSON('app.hasLaunched', false);
      if (hasLaunched) {
        await loadNew(today);
      }
    };
    // Fire and forget (loadNew is async already)
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update playAgainIsFreeMode when game ends (for dynamic button text)
  useEffect(() => {
    if (status === 'won' || status === 'lost') {
      setPlayAgainIsFreeMode(mode === 'daily');
    }
  }, [status, mode]);

  // Refresh tile colors when component re-renders (e.g., returning from Settings)
  // This ensures High Contrast changes take effect immediately
  useEffect(() => {
    const newColors = getTileColors();
    setTileColors(newColors);
  });

  const showError = useCallback((msg: string) => {
    setErrorMsg(msg);
    triggerNotification('Error');
    AccessibilityInfo.announceForAccessibility?.(msg);

    // Shake animation
    Animated.sequence([
      Animated.timing(shakeAnim, {toValue: 10, duration: 50, useNativeDriver: true}),
      Animated.timing(shakeAnim, {toValue: -10, duration: 50, useNativeDriver: true}),
      Animated.timing(shakeAnim, {toValue: 10, duration: 50, useNativeDriver: true}),
      Animated.timing(shakeAnim, {toValue: 0, duration: 50, useNativeDriver: true}),
    ]).start();

    setTimeout(() => setErrorMsg(''), 2000);
  }, [shakeAnim]);

  const commitGuess = useCallback(async () => {
    if (status !== 'playing') return;
    // Check for incomplete word (spaces indicate unfilled positions)
    if (current.includes(' ')) {
      showError('Not enough letters');
      return;
    }
    if (current.length !== length) {
      showError('Not enough letters');
      return;
    }
    // Guard against empty answer
    if (!answer || answer.length === 0) {
      showError('Game not ready');
      return;
    }
    const {allowed} = await listsPromise;
    if (!allowed.includes(current.toLowerCase())) {
      showError('Not in word list');
      return;
    }
    const fb = evaluateGuess(answer, current.toLowerCase());
    setRows(r => [...r, current.toUpperCase()]);
    setFeedback(f => [...f, fb]);
    setCurrent('');
    triggerImpact('Medium');

    const won = fb.every(s => s === 'correct');
    if (won) {
      setStatus('won');
      setShowResult(true);
      triggerNotification('Success');
      AccessibilityInfo.announceForAccessibility?.('You win!');

      // Record win stats (saves locally and syncs to cloud in prod)
      await gameResultsService.saveGameResult({
        wordLength: length,
        won: true,
        guesses: rows.length + 1,
        maxRows,
        date: dateISO,
        feedback,
      });

      // Mark word as used after successful completion
      const lists = await listsPromise;
      markWordAsUsed(length, answer, lists.answers.length);
      // Mark daily completion for replay prevention
      if (mode === 'daily') {
        markDailyCompleted(length, maxRows, dateISO);
      }
    } else if (rows.length + 1 >= maxRows) {
      setStatus('lost');
      setShowResult(true);
      triggerNotification('Warning');
      AccessibilityInfo.announceForAccessibility?.(
        `You lose. The word was ${answer.toUpperCase()}`,
      );

      // Record loss stats (saves locally and syncs to cloud in prod)
      await gameResultsService.saveGameResult({
        wordLength: length,
        won: false,
        guesses: rows.length + 1,
        maxRows,
        date: dateISO,
        feedback,
      });

      // Mark word as used even on loss (they completed the game)
      const lists = await listsPromise;
      markWordAsUsed(length, answer, lists.answers.length);
      if (mode === 'daily') {
        markDailyCompleted(length, maxRows, dateISO);
      }
    }
  }, [answer, current, length, listsPromise, rows.length, status, showError, maxRows, dateISO, mode]);

  // Keyboard handlers (hint-aware)
  const onKey = useCallback(
    (k: string) => {
      if (status !== 'playing') return;

      const activeRow = rows.length;
      const hintPos = (hintedCell?.row === activeRow) ? hintedCell.col : null;

      if (k === 'ENTER') {
        commitGuess();
        return;
      }

      if (k === 'DEL') {
        setCurrent(c => {
          if (c.length === 0) return c;

          // Find last non-space, non-hint character to delete
          for (let i = c.length - 1; i >= 0; i--) {
            // Skip hint position
            if (hintPos !== null && i === hintPos) continue;
            // Skip spaces
            if (c[i] === ' ') continue;

            // Found a deletable character at position i
            const before = c.slice(0, i);
            const after = c.slice(i + 1);
            let result = before + ' ' + after;

            // Trim trailing spaces but preserve hint position
            let trimmed = result.trimEnd();
            if (hintPos !== null && trimmed.length <= hintPos) {
              // Must keep up to hint position
              trimmed = result.slice(0, hintPos + 1);
            }
            return trimmed || '';
          }
          return c; // Nothing to delete
        });
        return;
      }

      if (/^[A-Z]$/.test(k)) {
        setCurrent(c => {
          // Find first empty slot, skipping hint position
          for (let i = 0; i < length; i++) {
            // Skip hint position
            if (hintPos !== null && i === hintPos) continue;

            const isEmpty = i >= c.length || c[i] === ' ';
            if (isEmpty) {
              // Insert at position i
              const padded = c.padEnd(i + 1, ' ');
              const result = padded.slice(0, i) + k + padded.slice(i + 1);
              return result.trimEnd();
            }
          }
          return c; // Full - no empty slots
        });
      }
    },
    [commitGuess, length, status, hintedCell, rows.length],
  );

  const keyStates = useMemo(() => {
    const map = new Map<string, TileState>();
    feedback.forEach((fb, rowIdx) => {
      const word = rows[rowIdx] ?? '';
      for (let i = 0; i < fb.length; i++) {
        const ch = word[i];
        const prev = map.get(ch);
        const next = fb[i];
        const rank = {absent: 0, present: 1, correct: 2};
        if (!prev || rank[next] > rank[prev]) map.set(ch, next);
      }
    });
    // Mark hinted letter as 'correct' on keyboard
    if (hintedLetter) {
      map.set(hintedLetter, 'correct');
    }
    return map;
  }, [feedback, rows, hintedLetter]);

  const handleNewGame = useCallback(() => {
    setShowSettings(true);
  }, []);

  const handleNewGameStart = useCallback((config: GameConfig) => {
    setLength(config.length);
    setMaxRows(config.maxRows);
    setMode(config.mode);
    setShowSettings(false);
    setJSON('app.hasLaunched', true);
    loadNew(undefined, config.mode, config.length, config.maxRows);
  }, [loadNew]);

  const handleCancel = useCallback(async () => {
    // On first launch, cancel should auto-start a sensible default without extra prompts
    if (firstLaunchRef.current) {
      const today = new Date().toISOString().slice(0, 10);
      // Check if today's daily 5x6 has been completed previously
      let alreadyPlayedDailyToday = isDailyCompleted(5, 6, today);
      // Backup check from game state
      if (!alreadyPlayedDailyToday) {
        const saved = getJSON(getGameStateKey(), null as {mode?: string; dateISO?: string; status?: string; length?: number; maxRows?: number} | null);
        alreadyPlayedDailyToday = isDailyCompletedFromGameState(saved, today, 5, 6);
      }
      const nextMode: Mode = alreadyPlayedDailyToday ? 'free' : 'daily';
      // Enforce 5x6 as requested
      setLength(5);
      setMaxRows(6);
      setMode(nextMode);
      setShowSettings(false);
      setJSON('app.hasLaunched', true);
      // Start a new game immediately with explicit settings to avoid race with async state
      await loadNew(today, nextMode, 5, 6);
      return;
    }
    // Otherwise, just close the sheet
    setShowSettings(false);
  }, [loadNew]);

  // Hint system: compute disabled state
  const allPositionsCorrect = useMemo(() => {
    if (status !== 'playing') return true;
    const correctPositions = new Set<number>();
    feedback.forEach(fb => {
      fb.forEach((state, idx) => {
        if (state === 'correct') correctPositions.add(idx);
      });
    });
    return correctPositions.size >= length;
  }, [feedback, length, status]);

  const hintDisabled = hintUsed || status !== 'playing' || allPositionsCorrect;

  // Hint handler
  const handleHint = useCallback(() => {
    if (hintUsed || status !== 'playing' || !answer) return;

    // Find positions already marked 'correct' in any feedback row
    const correctPositions = new Set<number>();
    feedback.forEach(fb => {
      fb.forEach((state, idx) => {
        if (state === 'correct') correctPositions.add(idx);
      });
    });

    // Get unrevealed positions
    const unrevealedPositions: number[] = [];
    for (let i = 0; i < length; i++) {
      if (!correctPositions.has(i)) unrevealedPositions.push(i);
    }

    if (unrevealedPositions.length === 0) return;

    // Pick random unrevealed position
    const position = unrevealedPositions[Math.floor(Math.random() * unrevealedPositions.length)];
    const letter = answer[position].toUpperCase();
    const activeRow = rows.length;

    setHintUsed(true);
    setHintedCell({row: activeRow, col: position});
    setHintedLetter(letter);

    // Update current with hint letter at correct position using space padding
    setCurrent(prev => {
      // Pad to hint position with spaces, preserving existing typed letters
      const padded = prev.padEnd(position, ' ');
      let result = padded.slice(0, position) + letter;
      // Preserve any letters after hint position (unlikely but safe)
      if (prev.length > position + 1) {
        result += prev.slice(position + 1);
      }
      return result;
    });

    triggerImpact('Light');
    AccessibilityInfo.announceForAccessibility?.(
      `Hint: The ${getOrdinal(position + 1)} letter is ${letter}`
    );
  }, [hintUsed, status, answer, feedback, length, rows.length]);

  // Give Up handler
  const handleGiveUp = useCallback(async () => {
    setShowSettings(false);
    setStatus('lost');
    setShowResult(true);
    triggerNotification('Warning');
    AccessibilityInfo.announceForAccessibility?.(
      `You gave up. The word was ${answer.toUpperCase()}`
    );

    await gameResultsService.saveGameResult({
      wordLength: length,
      won: false,
      guesses: rows.length,
      maxRows,
      date: dateISO,
      feedback,
    });

    const lists = await listsPromise;
    markWordAsUsed(length, answer, lists.answers.length);
    if (mode === 'daily') {
      markDailyCompleted(length, maxRows, dateISO);
    }
  }, [answer, length, maxRows, dateISO, mode, rows.length, feedback, listsPromise]);

  const gameInProgress = rows.length > 0 && status === 'playing';

  const formattedDate = useMemo(() => {
    if (!dateISO || mode !== 'daily') return '';
    const d = new Date(dateISO + 'T00:00:00');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[d.getMonth()]} ${d.getDate()}`;
  }, [dateISO, mode]);

  return (
    <View
      style={[
        styles.container,
        {paddingTop: insets.top, paddingBottom: insets.bottom},
      ]}>
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
      <Animated.View style={{flex: 1, transform: [{translateX: shakeAnim}]}}>
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
        initialConfig={{length, maxRows, mode}}
        gameInProgress={gameInProgress}
        onStart={handleNewGameStart}
        onCancel={handleCancel}
        onGiveUp={handleGiveUp}
      />

      {/* Result modal */}
      <Modal transparent visible={showResult} animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.resultModalCard}>
            {/* Header */}
            <View style={styles.resultHeader}>
              <Text style={styles.resultEmoji}>
                {getResultEmoji(rows.length, maxRows, status === 'won')}
              </Text>
              <Text style={styles.resultTitle}>
                {getResultTitle(rows.length, maxRows, status === 'won')}
              </Text>
              <Text style={styles.resultSubtitle}>
                {length}×{maxRows} · {new Date(dateISO).toLocaleDateString('en-US', {month: 'short', day: 'numeric'})}
              </Text>
            </View>

            {/* Score and Word Section - Side by Side */}
            <View style={styles.scoreWordRow}>
              {/* Score Section - Smaller, on the left */}
              <View style={styles.scoreSection}>
                <Text style={styles.scoreLabel}>Score</Text>
                <Text style={[styles.scoreValue, status === 'lost' && styles.scoreValueLost]}>
                  {status === 'won' ? `${rows.length}/${maxRows}` : `X/${maxRows}`}
                </Text>
              </View>

              {/* Word Display - Larger, on the right */}
              <View style={[styles.wordDisplay, status === 'lost' && styles.wordDisplayLost]}>
                <Text style={[styles.wordLabel, status === 'lost' && styles.wordLabelLost]}>
                  {status === 'won' ? 'The word' : 'The word was'}
                </Text>
                <Text style={[styles.wordText, status === 'lost' && styles.wordTextLost]}>
                  {answer.toUpperCase()}
                </Text>
              </View>
            </View>

            {/* Grid Section */}
            <View style={styles.gridSection}>
              <Text style={styles.gridLabel}>Your Guesses</Text>
              <View style={styles.guessGrid}>
                {feedback.map((row, rIdx) => (
                  <View key={rIdx} style={styles.guessRow}>
                    {row.map((state, cIdx) => {
                      const tileColor =
                        state === 'correct'
                          ? tileColors.correct
                          : state === 'present'
                          ? tileColors.present
                          : tileColors.absent;
                      return (
                        <View
                          key={cIdx}
                          style={[styles.guessTile, {backgroundColor: tileColor}]}
                        />
                      );
                    })}
                  </View>
                ))}
              </View>
            </View>

            {/* Streak Display */}
            {(() => {
              const stats = getStatsForLength(length);
              const hasStreak = stats.currentStreak > 0 || stats.maxStreak > 0;
              return hasStreak ? (
                <View style={styles.streakSection}>
                  {stats.currentStreak > 0 && (
                    <View style={styles.streakItem}>
                      <Text style={styles.streakLabel}>🔥 Current Streak</Text>
                      <Text style={styles.streakValue}>{stats.currentStreak} days</Text>
                    </View>
                  )}
                  {stats.maxStreak > 0 && (
                    <View style={styles.streakItem}>
                      <Text style={styles.streakLabel}>⭐ Best Streak</Text>
                      <Text style={styles.streakValue}>{stats.maxStreak} days</Text>
                    </View>
                  )}
                </View>
              ) : null;
            })()}

            {/* Buttons */}
            <View style={styles.resultButtonGroup}>
              <Pressable
                style={styles.btnShare}
                onPress={async () => {
                  const shareData = generateShareText({
                    length,
                    maxRows,
                    guesses: rows.length,
                    won: status === 'won',
                    feedback,
                    date: dateISO,
                  });
                  try {
                    await Share.share({
                      message: shareData.text,
                    });
                  } catch (error) {
                    // User cancelled or error
                  }
                }}>
                <Text style={styles.btnShareText}>Share</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  setShowResult(false);
                  // Immediately start a new game with the same settings
                  // without opening the New Game sheet
                  loadNew();
                }}>
                <LinearGradient
                  colors={[palette.gradientStart, palette.gradientEnd]}
                  start={{x: 0, y: 0}}
                  end={{x: 1, y: 1}}
                  style={styles.btnPlayAgain}>
                  <Text style={styles.btnPlayAgainText}>
                    {playAgainIsFreeMode ? 'Play Free Mode' : 'Play Again'}
                  </Text>
                </LinearGradient>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

/** UI bits (kept here to stay single-screen). Memoize to reduce re-renders. */
const Board = React.memo(
  ({
    length,
    rows,
    feedback,
    current,
    maxRows,
    tileColors,
    hintedCell,
    hintedLetter,
  }: {
    length: number;
    rows: string[];
    feedback: TileState[][];
    current: string;
    maxRows: number;
    tileColors: ReturnType<typeof getTileColors>;
    hintedCell: {row: number; col: number} | null;
    hintedLetter: string | null;
  }) => {
    const {width} = useWindowDimensions();
    const gap = 8;
    const maxTileSize = 62;
    const padding = 16;
    const availableWidth = width - padding * 2;
    const calculatedSize = Math.min(
      maxTileSize,
      Math.floor((availableWidth - gap * (length - 1)) / length),
    );
    const tileSize = {width: calculatedSize, height: calculatedSize * 1.12};

    const allRows = [...rows];
    const activeRow = rows.length < maxRows ? rows.length : -1;
    if (rows.length < maxRows) allRows.push(current.padEnd(length, ' '));
    while (allRows.length < maxRows) allRows.push(''.padEnd(length, ' '));
    return (
      <View style={styles.board}>
        {allRows.map((word, rIdx) => (
          <View key={rIdx} style={styles.row}>
            {Array.from({length}).map((_, cIdx) => {
              const rawCh = word[cIdx] ?? '';
              const ch = rawCh === ' ' ? '' : rawCh; // Treat space as empty
              const state = feedback[rIdx]?.[cIdx] ?? 'empty';
              const isActive = rIdx === activeRow && ch !== '';

              // Check if this is a hinted tile (works for current AND submitted rows)
              const isHinted = hintedCell?.row === rIdx && hintedCell?.col === cIdx;

              return (
                <Tile
                  key={cIdx}
                  ch={isHinted && rIdx === activeRow && hintedLetter ? hintedLetter : ch}
                  state={state as any}
                  isActive={isActive}
                  isHinted={isHinted}
                  size={tileSize}
                  tileColors={tileColors}
                />
              );
            })}
          </View>
        ))}
      </View>
    );
  },
);

const Tile = React.memo(
  ({
    ch,
    state,
    isActive,
    isHinted,
    size,
    tileColors,
  }: {
    ch: string;
    state: TileState | 'empty';
    isActive?: boolean;
    isHinted?: boolean;
    size?: {width: number; height: number};
    tileColors: ReturnType<typeof getTileColors>;
  }) => {
    const fontSize = size ? Math.floor(size.width * 0.54) : 28;
    const flipAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      if (state !== 'empty') {
        // Trigger flip animation when tile gets a state
        Animated.sequence([
          Animated.timing(flipAnim, {
            toValue: 1,
            duration: 250,
            useNativeDriver: true,
          }),
          Animated.timing(flipAnim, {
            toValue: 0,
            duration: 250,
            useNativeDriver: true,
          }),
        ]).start();
      }
    }, [state, flipAnim]);

    const rotateX = flipAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '90deg'],
    });

    // Dynamic color styles based on high contrast preference
    // Check isHinted FIRST to override other states
    const colorStyle =
      isHinted
        ? {backgroundColor: palette.accentPurple, borderColor: palette.accentPurple}
        : state === 'correct'
        ? {backgroundColor: tileColors.correct, borderColor: tileColors.correct}
        : state === 'present'
        ? {backgroundColor: tileColors.present, borderColor: tileColors.present}
        : state === 'absent'
        ? {backgroundColor: tileColors.absent, borderColor: tileColors.absent}
        : null;

    return (
      <Animated.View
        style={[
          styles.tile,
          size,
          colorStyle,
          isActive && styles.tileActive,
          {transform: [{rotateX}]},
        ]}>
        <Text
          style={[styles.tileText, {fontSize}]}
          accessible
          accessibilityLabel={`${ch || 'blank'} ${isHinted ? 'hinted' : state !== 'empty' ? state : ''}`}
          accessibilityRole="text">
          {ch !== ' ' ? ch : ''}
        </Text>
      </Animated.View>
    );
  },
);

const Keyboard = React.memo(
  ({
    onKey,
    keyStates,
    tileColors,
  }: {
    onKey: (k: string) => void;
    keyStates: Map<string, TileState>;
    tileColors: ReturnType<typeof getTileColors>;
  }) => {
    return (
      <View style={styles.kb}>
        {LETTERS.map((row, idx) => (
          <View key={idx} style={styles.kbRow}>
            {idx === 2 && (
              <Key label="↵" flex={2} onPress={() => onKey('ENTER')} isAction accessibilityLabel="Enter" />
            )}
            {row.split('').map(k => {
              const st = keyStates.get(k);
              const disabled = st === 'absent';
              return (
                <Key
                  key={k}
                  label={k}
                  state={st}
                  disabled={disabled}
                  onPress={() => onKey(k)}
                  tileColors={tileColors}
                />
              );
            })}
            {idx === 2 && (
              <Key label="⌫" flex={2} onPress={() => onKey('DEL')} isAction accessibilityLabel="Delete" />
            )}
          </View>
        ))}
      </View>
    );
  },
);

const Key = React.memo(
  ({
    label,
    onPress,
    state,
    flex,
    isAction,
    accessibilityLabel,
    disabled,
    tileColors,
  }: {
    label: string;
    onPress: () => void;
    state?: TileState;
    flex?: number;
    isAction?: boolean;
    accessibilityLabel?: string;
    disabled?: boolean;
    tileColors?: ReturnType<typeof getTileColors>;
  }) => {
    // Dynamic color styles based on high contrast preference
    const stateStyle =
      state === 'correct' && tileColors
        ? {backgroundColor: tileColors.correct}
        : state === 'present' && tileColors
        ? {backgroundColor: tileColors.present}
        : state === 'absent' && tileColors
        ? {backgroundColor: tileColors.absent}
        : null;

    return (
      <Pressable
        onPress={disabled ? undefined : onPress}
        disabled={disabled}
        style={({pressed}) => [
          styles.key,
          {flex: flex ?? 1},
          stateStyle,
          isAction && styles.keyAction,
          disabled && styles.keyDisabled,
          !disabled && pressed && styles.keyPressed,
        ]}
        accessibilityRole="button"
        accessibilityState={{disabled}}
        accessibilityLabel={accessibilityLabel || label}>
        <Text
          style={[
            styles.keyText,
            isAction && styles.keyTextAction,
            disabled && styles.keyTextDisabled,
          ]}>
          {label}
        </Text>
      </Pressable>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.bg,
    paddingHorizontal: 16,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 16,
    paddingVertical: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  menuBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuBtnText: {
    fontSize: 20,
    color: '#e4e4e7',
  },
  quizTypeBadge: {
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quizTypeText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#e4e4e7',
  },
  quizTypeDivider: {
    width: 1,
    height: 14,
    backgroundColor: '#3f3f46',
  },
  quizTypeDate: {
    fontSize: 12,
    fontWeight: '400',
    color: '#71717a',
  },
  configBadge: {
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  configSize: {
    fontSize: 15,
    fontWeight: '600',
    color: '#e4e4e7',
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

  board: {flex: 1, justifyContent: 'center', gap: 8, paddingVertical: 12},
  row: {flexDirection: 'row', gap: 8, alignSelf: 'center'},
  tile: {
    borderRadius: 8,
    borderWidth: 2,
    borderColor: palette.tileBorder,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: palette.tileEmpty,
  },
  tileActive: {
    borderColor: palette.tileBorderActive,
    borderWidth: 2,
    transform: [{scale: 1.05}],
  },
  tileText: {
    color: palette.textPrimary,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  tCorrect: {backgroundColor: palette.correct, borderColor: palette.correct},
  tPresent: {backgroundColor: palette.present, borderColor: palette.present},
  tAbsent: {backgroundColor: palette.absent, borderColor: palette.absent},

  kb: {gap: 8, marginBottom: 12, paddingHorizontal: 2},
  kbRow: {flexDirection: 'row', gap: 4, justifyContent: 'center'},
  key: {
    minWidth: 31,
    height: 52,
    borderRadius: 6,
    backgroundColor: palette.keyBase,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  keyPressed: {
    backgroundColor: palette.keyPressed,
    transform: [{scale: 0.94}],
  },
  keyAction: {
    backgroundColor: palette.keyAction,
  },
  keyText: {
    color: palette.textPrimary,
    fontSize: 15,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  keyTextAction: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  kCorrect: {backgroundColor: palette.correct},
  kPresent: {backgroundColor: palette.present},
  kAbsent: {backgroundColor: palette.absent},
  keyDisabled: {
    backgroundColor: palette.keyDisabled,
  },
  keyTextDisabled: {
    color: palette.keyAction,
  },

  modalBackdrop: {
    flex: 1,
    backgroundColor: palette.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Result Modal Styles (from HTML design)
  resultModalCard: {
    width: '90%',
    maxWidth: 340,
    backgroundColor: palette.card,
    borderRadius: 20,
    padding: 32,
    paddingTop: 28,
    paddingBottom: 28,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 20},
    shadowOpacity: 0.5,
    shadowRadius: 60,
    elevation: 24,
    borderWidth: 1,
    borderColor: palette.cardBorder,
  },
  resultHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  resultEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  resultTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: palette.textPrimary,
    marginBottom: 8,
  },
  resultSubtitle: {
    fontSize: 14,
    color: palette.textMuted,
    fontWeight: '500',
  },
  scoreWordRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  scoreSection: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: '#2c2c2e',
    borderRadius: 12,
    minWidth: 90,
  },
  scoreLabel: {
    fontSize: 11,
    color: '#8e8e93',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
    fontWeight: '600',
  },
  scoreValue: {
    fontSize: 32,
    fontWeight: '800',
    color: '#30d158',
    lineHeight: 32,
  },
  scoreValueLost: {
    color: '#ff453a',
  },
  wordDisplay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: 'rgba(48, 209, 88, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(48, 209, 88, 0.2)',
    borderRadius: 8,
  },
  wordDisplayLost: {
    backgroundColor: 'rgba(255, 69, 58, 0.1)',
    borderColor: 'rgba(255, 69, 58, 0.2)',
  },
  wordLabel: {
    fontSize: 11,
    color: '#30d158',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
    fontWeight: '600',
  },
  wordLabelLost: {
    color: '#ff453a',
  },
  wordText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#30d158',
    letterSpacing: 2,
  },
  wordTextLost: {
    color: '#ff453a',
  },
  gridSection: {
    marginBottom: 20,
  },
  gridLabel: {
    fontSize: 12,
    color: '#8e8e93',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  guessGrid: {
    alignItems: 'center',
    gap: 6,
  },
  guessRow: {
    flexDirection: 'row',
    gap: 6,
  },
  guessTile: {
    width: 32,
    height: 32,
    borderRadius: 4,
  },
  streakSection: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    backgroundColor: 'rgba(48, 209, 88, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(48, 209, 88, 0.2)',
    borderRadius: 10,
    marginBottom: 20,
  },
  streakItem: {
    flex: 1,
    alignItems: 'center',
  },
  streakLabel: {
    fontSize: 13,
    color: '#30d158',
    fontWeight: '600',
    marginBottom: 4,
  },
  streakValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#30d158',
  },
  resultButtonGroup: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 28,
  },
  btnShare: {
    flex: 1,
    backgroundColor: palette.accentPurpleLight,
    borderWidth: 1,
    borderColor: palette.accentPurpleBorder,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnShareText: {
    fontSize: 15,
    fontWeight: '600',
    color: palette.accentPurple,
  },
  btnPlayAgain: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnPlayAgainText: {
    fontSize: 15,
    fontWeight: '600',
    color: palette.textPrimary,
  },
});
