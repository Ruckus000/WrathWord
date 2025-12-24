// src/presentation/screens/Game/useGameSession.ts

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { Animated, AccessibilityInfo } from 'react-native';

// Domain imports
import { TileStateValue } from '../../../domain/game/value-objects/TileState';
import { GuessEvaluator } from '../../../domain/game/services/GuessEvaluator';

// Infrastructure imports
import { getGameRepository } from '../../../infrastructure/persistence/MMKVGameRepository';
import { getCompletionRepository } from '../../../infrastructure/persistence/MMKVCompletionRepository';
import { getWordList } from '../../../infrastructure/words/StaticWordList';

// Existing utilities (keep using until Phase 5 cleanup)
import { triggerImpact, triggerNotification } from '../../../utils/haptics';
import { getJSON, setJSON } from '../../../storage/mmkv';
import { selectDaily } from '../../../logic/selectDaily';
import { useToday } from '../../../hooks/useToday';
import { gameResultsService } from '../../../services/data';
import { getOrdinal } from '../../../utils/formatters';
import { logger } from '../../../utils/logger';
import { markWordAsUsed, getUnusedWords } from '../../../storage/profile';
import { isValidLength } from '../../../config/gameConfig';

export interface GameConfig {
  length: number;
  maxRows: number;
  mode: 'daily' | 'free';
}

export interface UseGameSessionReturn {
  // State
  length: number;
  maxRows: number;
  mode: 'daily' | 'free';
  dateISO: string;
  answer: string;
  rows: string[];
  feedback: TileStateValue[][];
  current: string;
  status: 'playing' | 'won' | 'lost';

  // Hint state
  hintUsed: boolean;
  hintedCell: { row: number; col: number } | null;
  hintedLetter: string | null;

  // UI state
  showResult: boolean;
  showSettings: boolean;
  errorMsg: string;
  staleGameWarning: boolean;

  // Derived state
  keyStates: Map<string, TileStateValue>;
  hintDisabled: boolean;
  gameInProgress: boolean;
  formattedDate: string;

  // Actions
  onKey: (key: string) => void;
  handleHint: () => void;
  handleNewGame: () => void;
  handleNewGameStart: (config: GameConfig) => void;
  handleCancel: () => void;
  handleGiveUp: () => void;
  handleStartTodaysPuzzle: () => void;
  handleFinishCurrentGame: () => void;
  closeResult: () => void;
  playAgain: () => void;

  // For animation (passed to UI)
  shakeAnim: Animated.Value;
}

export interface UseGameSessionOptions {
  initialMode?: 'daily' | 'free' | null;
}

type Mode = 'daily' | 'free';
type GameStatus = 'playing' | 'won' | 'lost';

export function useGameSession(options: UseGameSessionOptions = {}): UseGameSessionReturn {
  const { initialMode } = options;

  // Repositories (use new infrastructure)
  const gameRepository = useMemo(() => getGameRepository(), []);
  const completionRepository = useMemo(() => getCompletionRepository(), []);
  const wordList = useMemo(() => getWordList(), []);
  const evaluator = useMemo(() => new GuessEvaluator(), []);

  // === STATE ===
  const [length, setLength] = useState<number>(getJSON('settings.length', 5));
  const [maxRows, setMaxRows] = useState<number>(getJSON('settings.maxRows', 6));
  const [mode, setMode] = useState<Mode>(getJSON('settings.mode', 'daily'));
  const [dateISO, setDateISO] = useState<string>('');
  const [answer, setAnswer] = useState<string>('');
  const [rows, setRows] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<TileStateValue[][]>([]);
  const [current, setCurrent] = useState<string>('');
  const [status, setStatus] = useState<GameStatus>('playing');

  // Hint state
  const [hintUsed, setHintUsed] = useState<boolean>(false);
  const [hintedCell, setHintedCell] = useState<{ row: number; col: number } | null>(null);
  const [hintedLetter, setHintedLetter] = useState<string | null>(null);

  // UI state
  const [showResult, setShowResult] = useState(false);
  const firstLaunchRef = useRef(getJSON('app.hasLaunched', false) === false);
  const [showSettings, setShowSettings] = useState(firstLaunchRef.current);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [staleGameWarning, setStaleGameWarning] = useState(false);

  // Refs
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const initialModeHandled = useRef(false);
  const warnedForDateRef = useRef<string | null>(null);

  // Today's date for stale detection
  const today = useToday();

  // === DERIVED STATE ===

  const keyStates = useMemo(() => {
    const map = new Map<string, TileStateValue>();
    feedback.forEach((fb, rowIdx) => {
      const word = rows[rowIdx] ?? '';
      for (let i = 0; i < fb.length; i++) {
        const ch = word[i];
        const prev = map.get(ch);
        const next = fb[i];
        const rank = { absent: 0, present: 1, correct: 2 };
        if (!prev || rank[next] > rank[prev]) map.set(ch, next);
      }
    });
    if (hintedLetter) {
      map.set(hintedLetter, 'correct');
    }
    return map;
  }, [feedback, rows, hintedLetter]);

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
  const gameInProgress = rows.length > 0 && status === 'playing';

  const formattedDate = useMemo(() => {
    if (!dateISO || mode !== 'daily') return '';
    const d = new Date(dateISO + 'T00:00:00');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[d.getMonth()]} ${d.getDate()}`;
  }, [dateISO, mode]);

  // === ACTIONS ===

  const loadNew = useCallback(
    async (seedDate?: string, explicitMode?: Mode, explicitLength?: number, explicitMaxRows?: number) => {
      // Use explicit parameters if provided, otherwise fall back to state
      const effectiveLength = explicitLength ?? length;
      const effectiveMaxRows = explicitMaxRows ?? maxRows;
      let effectiveMode: Mode = explicitMode ?? mode;
      const targetDateISO = seedDate ?? new Date().toISOString().slice(0, 10);

      // DAILY REPLAY PREVENTION: Check if daily is already completed
      if (effectiveMode === 'daily') {
        const alreadyCompleted = completionRepository.isDailyCompleted(
          effectiveLength as 4 | 5 | 6,
          effectiveMaxRows,
          targetDateISO
        );
        if (alreadyCompleted) {
          effectiveMode = 'free';
          setMode('free');
        }
      }

      // Fetch the word lists for the effective length
      const answers = wordList.getAnswers(effectiveLength as 4 | 5 | 6);

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
      setJSON('session', {
        length: effectiveLength,
        maxRows: effectiveMaxRows,
        mode: effectiveMode,
        dateISO: targetDateISO,
        answerHash: next,
      });
    },
    [length, maxRows, mode, wordList, completionRepository]
  );

  const showError = useCallback(
    (msg: string) => {
      setErrorMsg(msg);
      triggerNotification('Error');
      AccessibilityInfo.announceForAccessibility?.(msg);

      // Shake animation
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
      ]).start();

      setTimeout(() => setErrorMsg(''), 2000);
    },
    [shakeAnim]
  );

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

    // Check if word is valid
    if (!wordList.isValidGuess(current.toLowerCase(), length as 4 | 5 | 6)) {
      showError('Not in word list');
      return;
    }

    const result = evaluator.evaluate(answer, current.toLowerCase());
    const fb = result.states;
    setRows(r => [...r, current.toUpperCase()]);
    setFeedback(f => [...f, fb]);
    setCurrent('');
    triggerImpact('Medium');

    const won = result.isWin();
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
      markWordAsUsed(length, answer, wordList.getAnswerCount(length as 4 | 5 | 6));
      // Mark daily completion for replay prevention
      if (mode === 'daily') {
        completionRepository.markDailyCompleted(length as 4 | 5 | 6, maxRows, dateISO);
      }
    } else if (rows.length + 1 >= maxRows) {
      setStatus('lost');
      setShowResult(true);
      triggerNotification('Warning');
      AccessibilityInfo.announceForAccessibility?.(
        `You lose. The word was ${answer.toUpperCase()}`
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
      markWordAsUsed(length, answer, wordList.getAnswerCount(length as 4 | 5 | 6));
      if (mode === 'daily') {
        completionRepository.markDailyCompleted(length as 4 | 5 | 6, maxRows, dateISO);
      }
    }
  }, [
    answer,
    current,
    length,
    rows.length,
    status,
    showError,
    maxRows,
    dateISO,
    mode,
    wordList,
    evaluator,
    completionRepository,
    feedback,
  ]);

  // Keyboard handlers (hint-aware)
  const onKey = useCallback(
    (k: string) => {
      if (status !== 'playing') return;

      const activeRow = rows.length;
      const hintPos = hintedCell?.row === activeRow ? hintedCell.col : null;

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
    [commitGuess, length, status, hintedCell, rows.length]
  );

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
    setHintedCell({ row: activeRow, col: position });
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

  const handleNewGame = useCallback(() => {
    logger.log('[useGameSession] handleNewGame called, setting showSettings=true');
    setShowSettings(true);
  }, []);

  const handleNewGameStart = useCallback(
    (config: GameConfig) => {
      setLength(config.length);
      setMaxRows(config.maxRows);
      setMode(config.mode);
      setShowSettings(false);
      setJSON('app.hasLaunched', true);
      loadNew(undefined, config.mode, config.length, config.maxRows);
    },
    [loadNew]
  );

  const handleCancel = useCallback(async () => {
    // On first launch, cancel should auto-start a sensible default without extra prompts
    if (firstLaunchRef.current) {
      const today = new Date().toISOString().slice(0, 10);
      // Check if today's daily 5x6 has been completed previously
      let alreadyPlayedDailyToday = completionRepository.isDailyCompleted(5, 6, today);

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
  }, [loadNew, completionRepository]);

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

    markWordAsUsed(length, answer, wordList.getAnswerCount(length as 4 | 5 | 6));
    if (mode === 'daily') {
      completionRepository.markDailyCompleted(length as 4 | 5 | 6, maxRows, dateISO);
    }
  }, [answer, length, maxRows, dateISO, mode, rows.length, feedback, wordList, completionRepository]);

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

  const closeResult = useCallback(() => setShowResult(false), []);

  const playAgain = useCallback(() => {
    setShowResult(false);
    loadNew();
  }, [loadNew]);

  // === EFFECTS ===

  // Persist settings
  useEffect(() => {
    setJSON('settings.length', length);
    setJSON('settings.maxRows', maxRows);
    setJSON('settings.mode', mode);
  }, [length, maxRows, mode]);

  // Persist game state
  useEffect(() => {
    const state = {
      length,
      maxRows,
      mode,
      dateISO,
      answer,
      rows,
      feedback,
      status,
      hintUsed,
      hintedCell,
      hintedLetter,
    };
    gameRepository.save(state as any);
  }, [length, maxRows, mode, dateISO, answer, rows, feedback, status, hintUsed, hintedCell, hintedLetter, gameRepository]);

  // One-time initialization
  useEffect(() => {
    const init = async () => {
      // MIGRATION: Handle invalid length settings from removed 2/3-letter modes
      const savedLength = getJSON<number>('settings.length', 5);
      if (!isValidLength(savedLength)) {
        setJSON('settings.length', 5);
        setLength(5);
      }

      // Clear any in-progress game with invalid length
      const savedGame = gameRepository.load();
      if (savedGame && savedGame.length && !isValidLength(savedGame.length)) {
        gameRepository.clear();
      }

      if (firstLaunchRef.current) {
        // Enforce defaults for the initial experience
        setLength(5);
        setMaxRows(6);
        setMode('daily');
        // Do not restore saved progress or auto-start; user will press Start Game
        return;
      }

      const saved = gameRepository.load();
      const today = new Date().toISOString().slice(0, 10);

      if (saved && typeof saved === 'object' && saved.answer) {
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
        let restoredCurrent = '';
        if (saved.hintedCell && saved.hintedLetter && saved.status === 'playing') {
          const activeRowIdx = Array.isArray(saved.rows) ? saved.rows.length : 0;
          if (saved.hintedCell.row === activeRowIdx) {
            const hintPos = saved.hintedCell.col;
            // Ensure hint letter is at correct position with space padding
            const padded = ''.padEnd(hintPos, ' ');
            restoredCurrent = padded.slice(0, hintPos) + saved.hintedLetter + padded.slice(hintPos + 1);
          }
        }
        setCurrent(restoredCurrent);

        // If game already ended, keep result modal visible for clarity
        if (saved.status === 'won' || saved.status === 'lost') setShowResult(true);
        return;
      }

      // No saved game: if not first launch, auto-start a new game
      const hasLaunched = getJSON('app.hasLaunched', false);
      if (hasLaunched) {
        await loadNew(today);
      }
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle initialMode from HomeScreen navigation
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

  // Detect stale daily game
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

  return {
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
  };
}
