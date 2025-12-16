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
  AccessibilityInfo,
  Animated,
  Modal,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useToday} from '../hooks/useToday';
import {triggerImpact, triggerNotification} from '../utils/haptics';
import {getOrdinal} from '../utils/formatters';
import {evaluateGuess, TileState} from '../logic/evaluateGuess';
import {selectDaily} from '../logic/selectDaily';
import {getJSON, setJSON} from '../storage/mmkv';
import {getScopedKey} from '../storage/userScope';
import {
  getProfile,
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

import Header from '../components/Header';
import {NewGameModal, GameConfig} from '../components/NewGameModal';
import {Board} from '../components/Board';
import {Keyboard} from '../components/Keyboard';
import {ResultModal} from '../components/ResultModal';
import {palette} from '../theme/colors';
import {getTileColors} from '../theme/getColors';

const GAME_STATE_BASE_KEY = 'game.state';

// Get the scoped game state key for the current user
function getGameStateKey(): string {
  const scopedKey = getScopedKey(GAME_STATE_BASE_KEY);
  // Fall back to base key if no user is set (for backwards compatibility during development)
  return scopedKey ?? GAME_STATE_BASE_KEY;
}

type Mode = 'daily' | 'free';
type GameStatus = 'playing' | 'won' | 'lost';

type Props = {
  onNavigateToStats?: () => void;
  /**
   * Controls startup behavior when coming from HomeScreen:
   * - 'daily': Start a fresh daily game
   * - 'free': Open NewGameModal for free play configuration
   * - null/undefined: Restore from storage (existing behavior)
   */
  initialMode?: 'daily' | 'free' | null;
};

export default function GameScreen({
  onNavigateToStats,
  initialMode,
}: Props) {
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

  // Removed noisy debug log that printed on every render

  // Log initial flags only when visibility changes to avoid spam
  useEffect(() => {
    console.log('[GameScreen] firstLaunch:', firstLaunchRef.current, 'showSettings:', showSettings);
  }, [showSettings]);

  const [errorMsg, setErrorMsg] = useState<string>('');
  const [playAgainIsFreeMode, setPlayAgainIsFreeMode] = useState(false);
  const shakeAnim = useRef(new Animated.Value(0)).current;

  // Hint system state
  const [hintUsed, setHintUsed] = useState<boolean>(false);
  const [hintedCell, setHintedCell] = useState<{row: number; col: number} | null>(null);
  const [hintedLetter, setHintedLetter] = useState<string | null>(null);

  // Stale game detection - shows modal when playing yesterday's puzzle
  const today = useToday();
  const [staleGameWarning, setStaleGameWarning] = useState(false);
  const warnedForDateRef = useRef<string | null>(null);

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

  // Handle initialMode from HomeScreen navigation
  // This runs after the main init effect and overrides behavior when coming from HomeScreen
  const initialModeHandled = useRef(false);
  useEffect(() => {
    // Only handle once per mount, and only if initialMode is explicitly set
    if (initialModeHandled.current || initialMode === undefined) {
      return;
    }

    initialModeHandled.current = true;

    if (initialMode === 'daily') {
      // Start fresh daily game with default settings
      const today = new Date().toISOString().slice(0, 10);
      setLength(5);
      setMaxRows(6);
      setMode('daily');
      setShowSettings(false);
      setJSON('app.hasLaunched', true);
      loadNew(today, 'daily', 5, 6);
    } else if (initialMode === 'free') {
      // Open NewGameModal for free play configuration
      setShowSettings(true);
      setMode('free');
    }
    // If initialMode is null, let normal restoration happen (already handled by main init)
  }, [initialMode, loadNew]);

  // Update playAgainIsFreeMode when game ends (for dynamic button text)
  useEffect(() => {
    if (status === 'won' || status === 'lost') {
      setPlayAgainIsFreeMode(mode === 'daily');
    }
  }, [status, mode]);

  // Refresh tile colors safely without causing a render loop.
  // Only update state if values actually changed.
  useEffect(() => {
    const newColors = getTileColors();
    setTileColors(prev => {
      if (
        prev.correct === newColors.correct &&
        prev.present === newColors.present &&
        prev.absent === newColors.absent
      ) {
        return prev; // no-op, prevents rerender loop
      }
      return newColors;
    });
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

  // Detect stale daily game - compare session date directly
  useEffect(() => {
    // Skip if: no session, not daily mode, or game already finished
    if (!dateISO || mode !== 'daily' || status !== 'playing') {
      return;
    }

    // Check if playing a stale puzzle from a previous day
    // Only warn once per stale dateISO (prevents modal re-triggering after dismissal)
    if (dateISO !== today && warnedForDateRef.current !== dateISO) {
      if (rows.length > 0) {
        // Has progress - ask user what to do (mark as warned first)
        warnedForDateRef.current = dateISO;
        setStaleGameWarning(true);
      } else {
        // No progress - silently start today's puzzle
        loadNew(today, 'daily', length, maxRows);
      }
    }
  }, [today, dateISO, mode, status, rows.length, length, maxRows, loadNew]);

  // Handler for starting today's puzzle
  const handleStartTodaysPuzzle = useCallback(() => {
    setStaleGameWarning(false);
    warnedForDateRef.current = null; // Reset for future stale sessions
    loadNew(today, 'daily', length, maxRows);
  }, [today, length, maxRows, loadNew]);

  // Handler for continuing stale game
  const handleFinishCurrentGame = useCallback(() => {
    setStaleGameWarning(false);
    // warnedForDateRef stays set - prevents re-triggering
    // User continues playing the stale game
    // When they complete it, stats record with original dateISO (yesterday)
  }, []);

  const handleNewGame = useCallback(() => {
    console.log('[GameScreen] handleNewGame called, setting showSettings=true');
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

  // DEBUG: Log hint state
  console.log('[GameScreen] hintDisabled:', hintDisabled, '| hintUsed:', hintUsed, '| status:', status, '| allPositionsCorrect:', allPositionsCorrect);

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

      {/* Stale game warning modal */}
      <Modal
        visible={staleGameWarning}
        transparent
        animationType="fade"
        onRequestClose={handleFinishCurrentGame}
      >
        <View style={styles.staleGameOverlay}>
          <View style={styles.staleGameCard}>
            <Text style={styles.staleGameTitle}>New Day!</Text>
            <Text style={styles.staleGameText}>
              A new daily puzzle is available. Would you like to finish your
              current game or start today's puzzle?
            </Text>
            <Pressable
              style={styles.staleGameButton}
              onPress={handleStartTodaysPuzzle}
            >
              <Text style={styles.staleGameButtonText}>
                Start Today's Puzzle
              </Text>
            </Pressable>
            <Pressable
              style={styles.staleGameButtonSecondary}
              onPress={handleFinishCurrentGame}
            >
              <Text style={styles.staleGameButtonTextSecondary}>
                Finish Current Game
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>

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
        onPlayAgain={() => {
          setShowResult(false);
          loadNew();
        }}
      />
    </View>
  );
}

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
  // Stale game warning modal styles
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
