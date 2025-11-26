// src/screens/GameScreen.tsx
import React, {useCallback, useEffect, useMemo, useState, useRef} from 'react';
// Statically import all word lists so Metro/Expo + Hermes can bundle without `require`
import answers2 from '../logic/words/answers-2';
import allowed2 from '../logic/words/allowed-2';
import answers3 from '../logic/words/answers-3';
import allowed3 from '../logic/words/allowed-3';
import answers4 from '../logic/words/answers-4';
import allowed4 from '../logic/words/allowed-4';
import answers5 from '../logic/words/answers-5';
import allowed5 from '../logic/words/allowed-5';
import answers6 from '../logic/words/answers-6';
import allowed6 from '../logic/words/allowed-6';
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
import {
  getProfile,
  recordGameResult,
  getStatsForLength,
  getWinRate,
  markWordAsUsed,
  getUnusedWords,
} from '../storage/profile';
import {
  generateShareText,
  getResultEmoji,
  getResultTitle,
} from '../logic/shareResult';
import Header from '../components/Header';
import {palette} from '../theme/colors';
import LinearGradient from 'react-native-linear-gradient';

type Mode = 'daily' | 'free';
type GameStatus = 'playing' | 'won' | 'lost';

const LETTERS = ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM']; // simple keyboard

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
  const shakeAnim = useRef(new Animated.Value(0)).current;

  // Pending settings (for sheet)
  const [pendingLength, setPendingLength] = useState<number>(length);
  const [pendingMaxRows, setPendingMaxRows] = useState<number>(maxRows);
  const [pendingMode, setPendingMode] = useState<Mode>(mode);

  // Load wordlists per length (static require map to satisfy Metro)
  const LISTS: Record<number, {answers: string[]; allowed: string[]}> = {
    2: {answers: answers2 as string[], allowed: allowed2 as string[]},
    3: {answers: answers3 as string[], allowed: allowed3 as string[]},
    4: {answers: answers4 as string[], allowed: allowed4 as string[]},
    5: {answers: answers5 as string[], allowed: allowed5 as string[]},
    6: {answers: answers6 as string[], allowed: allowed6 as string[]},
  };
  const getLists = useCallback((len: number): {answers: string[]; allowed: string[]} => {
    return LISTS[len] ?? LISTS[5];
  }, []);

  // Keep the same Promise-based API used elsewhere
  const listsPromise = useMemo(() => Promise.resolve(getLists(length)), [getLists, length]);

  const loadNew = useCallback(
    async (seedDate?: string, explicitMode?: Mode, explicitLength?: number, explicitMaxRows?: number) => {
      // Use explicit parameters if provided, otherwise fall back to state
      const effectiveLength = explicitLength ?? length;
      const effectiveMaxRows = explicitMaxRows ?? maxRows;
      const effectiveMode: Mode = explicitMode ?? mode;

      // Fetch the word lists for the effective length
      const {answers} = getLists(effectiveLength);
      const dateISO = seedDate ?? new Date().toISOString().slice(0, 10);

      // Get unused words for this length
      const unusedWords = getUnusedWords(effectiveLength, answers);

      // If all words have been used, use the full list (cycle resets automatically)
      const availableWords = unusedWords.length > 0 ? unusedWords : answers;

      const next =
        effectiveMode === 'daily'
          ? selectDaily(effectiveLength, effectiveMaxRows, dateISO, availableWords)
          : availableWords[Math.floor(Math.random() * availableWords.length)];

      setAnswer(next);
      setDateISO(dateISO);
      setRows([]);
      setFeedback([]);
      setCurrent('');
      setStatus('playing');
      setShowResult(false);
      setJSON('session', {length: effectiveLength, maxRows: effectiveMaxRows, mode: effectiveMode, dateISO, answerHash: next}); // store hash in a real app
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
    };
    setJSON('game.state', state);
  }, [length, maxRows, mode, dateISO, answer, rows, feedback, current, status]);

  // One-time initialization: on first launch, enforce 5×6 defaults and do not
  // restore any previous saved state. Otherwise, resume saved game if present.
  // - if not first launch -> start a new game automatically
  // - if first launch -> leave the New Game sheet open
  useEffect(() => {
    const init = async () => {
      if (firstLaunchRef.current) {
        // Enforce defaults for the initial experience
        setLength(5);
        setMaxRows(6);
        setMode('daily');
        setPendingLength(5);
        setPendingMaxRows(6);
        setPendingMode('daily');
        // Do not restore saved progress or auto-start; user will press Start Game
        return;
      }
      const saved: any = getJSON('game.state', null as any);
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
        setCurrent(typeof saved.current === 'string' ? saved.current : '');
        setStatus(saved.status === 'won' || saved.status === 'lost' ? saved.status : 'playing');
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

      // Record win stats
      recordGameResult({
        length,
        won: true,
        guesses: rows.length + 1,
        maxRows,
        date: dateISO,
      });

      // Mark word as used after successful completion
      const lists = await listsPromise;
      markWordAsUsed(length, answer, lists.answers.length);
      // If today's daily was completed, mark completion flag so onboarding cancel can respect it
      if (mode === 'daily') {
        const key = `daily.${length}x${maxRows}.${dateISO}.completed`;
        setJSON(key, true);
      }
    } else if (rows.length + 1 >= maxRows) {
      setStatus('lost');
      setShowResult(true);
      triggerNotification('Warning');
      AccessibilityInfo.announceForAccessibility?.(
        `You lose. The word was ${answer.toUpperCase()}`,
      );

      // Record loss stats
      recordGameResult({
        length,
        won: false,
        guesses: rows.length + 1,
        maxRows,
        date: dateISO,
      });

      // Mark word as used even on loss (they completed the game)
      const lists = await listsPromise;
      markWordAsUsed(length, answer, lists.answers.length);
      if (mode === 'daily') {
        const key = `daily.${length}x${maxRows}.${dateISO}.completed`;
        setJSON(key, true);
      }
    }
  }, [answer, current, length, listsPromise, rows.length, status, showError, maxRows, dateISO, mode]);

  // Keyboard handlers
  const onKey = useCallback(
    (k: string) => {
      if (status !== 'playing') return;
      if (k === 'ENTER') commitGuess();
      else if (k === 'DEL') setCurrent(c => c.slice(0, -1));
      else if (/^[A-Z]$/.test(k) && current.length < length)
        setCurrent(c => (c + k).toUpperCase());
    },
    [commitGuess, current.length, length, status],
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
    return map;
  }, [feedback, rows]);

  const handleNewGame = useCallback(() => {
    setPendingLength(length);
    setPendingMaxRows(maxRows);
    setPendingMode(mode);
    setShowSettings(true);
  }, [length, maxRows, mode]);

  const handleStartGame = useCallback(() => {
    setLength(pendingLength);
    setMaxRows(pendingMaxRows);
    setMode(pendingMode);
    setShowSettings(false);
    setJSON('app.hasLaunched', true);
    // Pass the new settings directly to loadNew to avoid state update race condition
    loadNew(undefined, pendingMode, pendingLength, pendingMaxRows);
  }, [pendingLength, pendingMaxRows, pendingMode, loadNew]);

  const handleCancel = useCallback(async () => {
    // On first launch, cancel should auto-start a sensible default without extra prompts
    if (firstLaunchRef.current) {
      const today = new Date().toISOString().slice(0, 10);
      // Check if today's daily 5x6 has been completed previously
      const key = `daily.5x6.${today}.completed`;
      let alreadyPlayedDailyToday = getJSON<boolean>(key, false);
      if (!alreadyPlayedDailyToday) {
        const saved: any = getJSON('game.state', null as any);
        if (
          saved &&
          saved.mode === 'daily' &&
          saved.dateISO === today &&
          (saved.status === 'won' || saved.status === 'lost')
        ) {
          alreadyPlayedDailyToday = true;
        }
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
        />
      </Animated.View>

      {/* Keyboard */}
      <Keyboard onKey={onKey} keyStates={keyStates} />

      {/* Settings sheet */}
      <Modal transparent visible={showSettings} animationType="slide">
        <View style={styles.modalBackdrop}>
          <Pressable
            style={styles.backdropPress}
            onPress={() => setShowSettings(false)}
          />
          <View style={styles.settingsSheet}>
            {/* Header */}
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Start New Game</Text>
              <Text style={styles.sheetDescription}>Configure your game settings below</Text>
              {gameInProgress && (
                <View style={styles.warningBadge}>
                  <Text style={styles.warningBadgeText}>⚠️ Current progress will be lost</Text>
                </View>
              )}
            </View>

            {/* Content */}
            <View style={styles.sheetContent}>
              <View style={styles.settingGroup}>
                <Text style={styles.settingLabel}>Word Length</Text>
                <Segment
                  value={pendingLength}
                  onChange={setPendingLength}
                  options={[2, 3, 4, 5, 6]}
                />
              </View>

              <View style={styles.settingGroup}>
                <Text style={styles.settingLabel}>Maximum Guesses</Text>
                <Segment
                  value={pendingMaxRows}
                  onChange={setPendingMaxRows}
                  options={[4, 5, 6, 7, 8]}
                />
              </View>

              <View style={styles.settingGroup}>
                <Text style={styles.settingLabel}>Game Mode</Text>
                <Text style={styles.settingHint}>Choose between daily puzzle or random word</Text>
                <View style={styles.radioGroup}>
                  <RadioCard
                    icon="📅"
                    label="Daily Challenge"
                    description="Same puzzle for everyone today"
                    selected={pendingMode === 'daily'}
                    onPress={() => setPendingMode('daily')}
                  />
                  <RadioCard
                    icon="🎲"
                    label="Free Play"
                    description="Random word, play unlimited"
                    selected={pendingMode === 'free'}
                    onPress={() => setPendingMode('free')}
                  />
                </View>
              </View>
            </View>

            {/* Footer */}
            <View style={styles.sheetFooter}>
              <Pressable
                style={styles.cancelBtn}
                onPress={handleCancel}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.startBtn} onPress={handleStartGame}>
                <Text style={styles.startBtnText}>Start Game</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

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
                    {row.map((state, cIdx) => (
                      <View
                        key={cIdx}
                        style={[
                          styles.guessTile,
                          state === 'correct' && styles.tileCorrectSmall,
                          state === 'present' && styles.tilePresentSmall,
                          state === 'absent' && styles.tileAbsentSmall,
                        ]}
                      />
                    ))}
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
                  <Text style={styles.btnPlayAgainText}>Play Again</Text>
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
const RadioCard = React.memo(
  ({
    icon,
    label,
    description,
    selected,
    onPress,
  }: {
    icon: string;
    label: string;
    description: string;
    selected: boolean;
    onPress: () => void;
  }) => (
    <Pressable
      style={[
        styles.radioCard,
        selected && styles.radioCardSelected,
      ]}
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{checked: selected}}>
      <View style={[
        styles.radioCircle,
        selected && styles.radioCircleSelected,
      ]}>
        {selected && <View style={styles.radioCircleInner} />}
      </View>
      <View style={styles.radioContent}>
        <Text style={styles.radioIcon}>{icon}</Text>
        <View style={styles.radioTextContent}>
          <Text style={[
            styles.radioLabel,
            selected && styles.radioLabelSelected,
          ]}>{label}</Text>
          <Text style={[
            styles.radioDescription,
            selected && styles.radioDescriptionSelected,
          ]}>{description}</Text>
        </View>
      </View>
    </Pressable>
  ),
);

const Segment = React.memo(
  ({
    value,
    onChange,
    options,
  }: {
    value: number;
    onChange: (v: number) => void;
    options?: number[];
  }) => {
    const opts = options ?? [2, 3, 4, 5, 6];
    return (
      <View style={styles.segment}>
        {opts.map(n => (
          <Pressable
            key={n}
            onPress={() => onChange(n)}
            style={[
              styles.segmentItem,
              value === n && styles.segmentItemActive,
            ]}
            accessibilityRole="button"
            accessibilityState={{selected: value === n}}>
            <Text
              style={[
                styles.segmentText,
                value === n && styles.segmentTextActive,
              ]}>
              {n}
            </Text>
          </Pressable>
        ))}
      </View>
    );
  },
);

const Board = React.memo(
  ({
    length,
    rows,
    feedback,
    current,
    maxRows,
  }: {
    length: number;
    rows: string[];
    feedback: TileState[][];
    current: string;
    maxRows: number;
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
              const ch = word[cIdx] ?? ' ';
              const state = feedback[rIdx]?.[cIdx] ?? 'empty';
              const isActive = rIdx === activeRow && ch !== ' ';
              return (
                <Tile
                  key={cIdx}
                  ch={ch}
                  state={state as any}
                  isActive={isActive}
                  size={tileSize}
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
    size,
  }: {
    ch: string;
    state: TileState | 'empty';
    isActive?: boolean;
    size?: {width: number; height: number};
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

    return (
      <Animated.View
        style={[
          styles.tile,
          size,
          state === 'correct' && styles.tCorrect,
          state === 'present' && styles.tPresent,
          state === 'absent' && styles.tAbsent,
          isActive && styles.tileActive,
          {transform: [{rotateX}]},
        ]}>
        <Text
          style={[styles.tileText, {fontSize}]}
          accessible
          accessibilityLabel={`${ch || 'blank'} ${state !== 'empty' ? state : ''}`}
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
  }: {
    onKey: (k: string) => void;
    keyStates: Map<string, TileState>;
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
  }: {
    label: string;
    onPress: () => void;
    state?: TileState;
    flex?: number;
    isAction?: boolean;
    accessibilityLabel?: string;
    disabled?: boolean;
  }) => (
    <Pressable
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      style={({pressed}) => [
        styles.key,
        {flex: flex ?? 1},
        state === 'correct' && styles.kCorrect,
        state === 'present' && styles.kPresent,
        state === 'absent' && styles.kAbsent,
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
  ),
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
  segment: {
    flexDirection: 'row',
    backgroundColor: '#18181b',
    borderColor: '#27272a',
    borderWidth: 1,
    borderRadius: 8,
    padding: 3,
    gap: 2,
  },
  segmentItem: {
    flex: 1,
    paddingVertical: 7,
    paddingHorizontal: 16,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  segmentItemActive: {
    backgroundColor: '#27272a',
    borderColor: '#3f3f46',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentText: {color: '#a1a1aa', fontWeight: '500', fontSize: 14, textAlign: 'center'},
  segmentTextActive: {color: '#fafafa', fontWeight: '500'},
  newBtn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#3f3f46',
  },
  newBtnText: {color: '#a1a1aa', fontWeight: '600', fontSize: 15},

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
  backdropPress: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  settingsSheet: {
    width: '90%',
    maxWidth: 420,
    backgroundColor: '#09090b',
    borderColor: '#27272a',
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 25},
    shadowOpacity: 0.5,
    shadowRadius: 50,
    elevation: 24,
  },
  sheetHeader: {
    paddingTop: 24,
    paddingHorizontal: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
  },
  sheetTitle: {
    color: '#fafafa',
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  sheetDescription: {
    color: '#a1a1aa',
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
  },
  warningBadge: {
    marginTop: 12,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    borderColor: 'rgba(251, 191, 36, 0.2)',
    borderWidth: 1,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  warningBadgeText: {
    color: '#fbbf24',
    fontSize: 12,
    fontWeight: '500',
  },
  sheetContent: {
    padding: 24,
    gap: 24,
  },
  settingGroup: {
    gap: 12,
  },
  settingLabel: {
    color: '#fafafa',
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: -0.2,
  },
  settingHint: {
    color: '#71717a',
    fontSize: 13,
    fontWeight: '400',
    marginTop: -8,
  },
  radioGroup: {
    gap: 10,
  },
  radioCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    backgroundColor: '#18181b',
    borderColor: '#27272a',
    borderWidth: 1.5,
    borderRadius: 8,
  },
  radioCardSelected: {
    borderColor: '#3b82f6',
    backgroundColor: 'rgba(59, 130, 246, 0.05)',
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#52525b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioCircleSelected: {
    borderColor: '#3b82f6',
    backgroundColor: '#3b82f6',
  },
  radioCircleInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#fff',
  },
  radioContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  radioIcon: {
    fontSize: 22,
  },
  radioTextContent: {
    flex: 1,
  },
  radioLabel: {
    color: '#fafafa',
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 2,
  },
  radioLabelSelected: {
    color: '#fafafa',
  },
  radioDescription: {
    color: '#71717a',
    fontSize: 13,
    fontWeight: '400',
  },
  radioDescriptionSelected: {
    color: '#a1a1aa',
  },
  sheetFooter: {
    flexDirection: 'row',
    gap: 10,
    padding: 16,
    paddingHorizontal: 24,
    borderTopWidth: 1,
    borderTopColor: '#27272a',
    backgroundColor: '#0a0a0b',
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: 'transparent',
    borderColor: '#27272a',
    borderWidth: 1.5,
    paddingVertical: 11,
    borderRadius: 7,
    alignItems: 'center',
  },
  cancelBtnText: {
    color: '#fafafa',
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: -0.2,
  },
  startBtn: {
    flex: 1,
    backgroundColor: '#3b82f6',
    borderWidth: 1.5,
    borderColor: 'transparent',
    paddingVertical: 11,
    borderRadius: 7,
    alignItems: 'center',
  },
  startBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: -0.2,
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
  tileCorrectSmall: {
    backgroundColor: '#30d158',
  },
  tilePresentSmall: {
    backgroundColor: '#ffcc00',
  },
  tileAbsentSmall: {
    backgroundColor: '#48484a',
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
