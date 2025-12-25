# Task 4.1: useGameSession Hook (PARALLEL - Wave 1)

## Agent Assignment
This task runs in **parallel with Task 4.3** (Navigation).
Task 4.2 depends on this task completing first.

## Objective
Extract all game logic from `GameScreen.tsx` into a custom hook `useGameSession`.

## Files to Create
- `src/presentation/screens/Game/useGameSession.ts`
- `__tests__/presentation/screens/Game/useGameSession.test.ts`

## Why This Extraction?

GameScreen.tsx is currently 600+ lines mixing:
- UI rendering (should stay)
- Game state management (extract)
- Game logic (extract)
- Persistence (extract)
- Stale game detection (extract)

After extraction, GameScreen should be <200 lines of pure UI.

## State to Extract

```typescript
// All this state moves to the hook
interface GameSessionState {
  // Configuration
  length: number;
  maxRows: number;
  mode: 'daily' | 'free';
  dateISO: string;
  
  // Game state
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
  
  // Derived
  keyStates: Map<string, TileStateValue>;
  hintDisabled: boolean;
  gameInProgress: boolean;
  formattedDate: string;
}
```

## Hook Interface

```typescript
// src/presentation/screens/Game/useGameSession.ts

import { TileStateValue } from '../../../domain/game/value-objects/TileState';

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

export function useGameSession(options?: UseGameSessionOptions): UseGameSessionReturn;
```

## Implementation Structure

```typescript
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

export interface GameConfig {
  length: number;
  maxRows: number;
  mode: 'daily' | 'free';
}

export interface UseGameSessionOptions {
  initialMode?: 'daily' | 'free' | null;
}

export function useGameSession(options: UseGameSessionOptions = {}) {
  const { initialMode } = options;
  
  // Repositories (use new infrastructure)
  const gameRepository = useMemo(() => getGameRepository(), []);
  const completionRepository = useMemo(() => getCompletionRepository(), []);
  const wordList = useMemo(() => getWordList(), []);
  const evaluator = useMemo(() => new GuessEvaluator(), []);
  
  // === STATE ===
  const [length, setLength] = useState<number>(getJSON('settings.length', 5));
  const [maxRows, setMaxRows] = useState<number>(getJSON('settings.maxRows', 6));
  const [mode, setMode] = useState<'daily' | 'free'>(getJSON('settings.mode', 'daily'));
  const [dateISO, setDateISO] = useState<string>('');
  const [answer, setAnswer] = useState<string>('');
  const [rows, setRows] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<TileStateValue[][]>([]);
  const [current, setCurrent] = useState<string>('');
  const [status, setStatus] = useState<'playing' | 'won' | 'lost'>('playing');
  
  // Hint state
  const [hintUsed, setHintUsed] = useState<boolean>(false);
  const [hintedCell, setHintedCell] = useState<{ row: number; col: number } | null>(null);
  const [hintedLetter, setHintedLetter] = useState<string | null>(null);
  
  // UI state
  const [showResult, setShowResult] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [staleGameWarning, setStaleGameWarning] = useState(false);
  
  // Refs
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const firstLaunchRef = useRef(getJSON('app.hasLaunched', false) === false);
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
  
  // ... (implement all the callbacks from GameScreen)
  // loadNew, commitGuess, onKey, handleHint, etc.
  
  // === EFFECTS ===
  
  // ... (implement all the effects from GameScreen)
  // initialization, persistence, stale detection, etc.
  
  return {
    // State
    length, maxRows, mode, dateISO, answer, rows, feedback, current, status,
    hintUsed, hintedCell, hintedLetter,
    showResult, showSettings, errorMsg, staleGameWarning,
    
    // Derived
    keyStates, hintDisabled, gameInProgress, formattedDate,
    
    // Actions
    onKey, handleHint, handleNewGame, handleNewGameStart,
    handleCancel, handleGiveUp, handleStartTodaysPuzzle,
    handleFinishCurrentGame,
    closeResult: () => setShowResult(false),
    playAgain: () => { setShowResult(false); loadNew(); },
    
    // Animation
    shakeAnim,
  };
}
```

## Test File

```typescript
// __tests__/presentation/screens/Game/useGameSession.test.ts

import { renderHook, act } from '@testing-library/react-hooks';
import { useGameSession } from '../../../../src/presentation/screens/Game/useGameSession';

// Mock dependencies
jest.mock('../../../../src/infrastructure/persistence/MMKVGameRepository');
jest.mock('../../../../src/infrastructure/persistence/MMKVCompletionRepository');
jest.mock('../../../../src/infrastructure/words/StaticWordList');
jest.mock('../../../../src/storage/mmkv');
jest.mock('../../../../src/utils/haptics');
jest.mock('../../../../src/hooks/useToday', () => ({
  useToday: () => '2025-01-15',
}));

describe('useGameSession', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Setup default mocks
  });

  describe('initialization', () => {
    it('starts with default state', () => {
      const { result } = renderHook(() => useGameSession());
      
      expect(result.current.status).toBe('playing');
      expect(result.current.rows).toEqual([]);
      expect(result.current.feedback).toEqual([]);
    });

    it('restores saved game state', () => {
      // Mock saved state
      const { result } = renderHook(() => useGameSession());
      
      // Verify restoration
    });

    it('handles initialMode="daily"', () => {
      const { result } = renderHook(() => 
        useGameSession({ initialMode: 'daily' })
      );
      
      expect(result.current.mode).toBe('daily');
    });

    it('handles initialMode="free"', () => {
      const { result } = renderHook(() => 
        useGameSession({ initialMode: 'free' })
      );
      
      expect(result.current.showSettings).toBe(true);
    });
  });

  describe('onKey', () => {
    it('adds letter to current input', () => {
      const { result } = renderHook(() => useGameSession());
      
      act(() => {
        result.current.onKey('A');
      });
      
      expect(result.current.current).toContain('A');
    });

    it('removes letter on DEL', () => {
      const { result } = renderHook(() => useGameSession());
      
      act(() => {
        result.current.onKey('A');
        result.current.onKey('B');
        result.current.onKey('DEL');
      });
      
      expect(result.current.current).toBe('A');
    });

    it('submits guess on ENTER', async () => {
      const { result } = renderHook(() => useGameSession());
      
      // Type full word
      await act(async () => {
        'CRANE'.split('').forEach(k => result.current.onKey(k));
        result.current.onKey('ENTER');
      });
      
      // Verify guess was submitted
    });

    it('skips hint position when typing', () => {
      // Setup with hint at position 2
      const { result } = renderHook(() => useGameSession());
      
      // Verify hint position is skipped
    });
  });

  describe('hint system', () => {
    it('reveals unrevealed position', () => {
      const { result } = renderHook(() => useGameSession());
      
      act(() => {
        result.current.handleHint();
      });
      
      expect(result.current.hintUsed).toBe(true);
      expect(result.current.hintedCell).not.toBeNull();
      expect(result.current.hintedLetter).not.toBeNull();
    });

    it('prevents second hint', () => {
      const { result } = renderHook(() => useGameSession());
      
      act(() => {
        result.current.handleHint();
      });
      
      expect(result.current.hintDisabled).toBe(true);
    });
  });

  describe('game completion', () => {
    it('sets status to won on correct guess', async () => {
      // Setup with known answer
      const { result } = renderHook(() => useGameSession());
      
      // Submit correct answer
      // Verify won status
    });

    it('sets status to lost after max guesses', async () => {
      // Setup game
      // Submit wrong guesses until max
      // Verify lost status
    });

    it('marks daily as completed on win', async () => {
      // Verify completionRepository.markDailyCompleted called
    });
  });

  describe('stale game detection', () => {
    it('shows warning for yesterday\'s game with progress', () => {
      // Mock saved game from yesterday with rows
      const { result } = renderHook(() => useGameSession());
      
      expect(result.current.staleGameWarning).toBe(true);
    });

    it('auto-starts today\'s game if no progress', () => {
      // Mock saved game from yesterday with no rows
      const { result } = renderHook(() => useGameSession());
      
      expect(result.current.staleGameWarning).toBe(false);
    });
  });

  describe('keyStates', () => {
    it('tracks best state per letter', () => {
      const { result } = renderHook(() => useGameSession());
      
      // Submit guess and verify keyStates
    });

    it('never downgrades key state', () => {
      // Submit multiple guesses
      // Verify correct > present > absent precedence
    });

    it('marks hinted letter as correct', () => {
      const { result } = renderHook(() => useGameSession());
      
      act(() => {
        result.current.handleHint();
      });
      
      const hintedLetter = result.current.hintedLetter;
      expect(result.current.keyStates.get(hintedLetter!)).toBe('correct');
    });
  });

  describe('persistence', () => {
    it('saves state on every change', () => {
      // Verify setJSON called on state changes
    });

    it('handles corrupted saved state gracefully', () => {
      // Mock corrupted data
      // Verify hook doesn't crash
    });
  });
});
```

## Verification

```bash
# Create directories
mkdir -p src/presentation/screens/Game
mkdir -p __tests__/presentation/screens/Game

# Run tests
npm test -- --testPathPattern="useGameSession"

# Type check
npx tsc --noEmit
```

## Implementation Notes

1. **Keep existing utilities for now**: Use existing `selectDaily`, `evaluateGuess`, etc. until Phase 5 cleanup
2. **Use new infrastructure**: Use the new repositories from Phase 3
3. **Don't modify GameScreen yet**: That's Task 4.2
4. **Export everything needed**: The hook should export everything GameScreen needs

## Completion Criteria
- [ ] `useGameSession` hook created with full interface
- [ ] All game state extracted from GameScreen
- [ ] All game logic extracted as callbacks
- [ ] All effects extracted
- [ ] Comprehensive test coverage
- [ ] No TypeScript errors
- [ ] Tests pass

## Commit Message
```
feat(presentation): extract useGameSession hook from GameScreen
```
