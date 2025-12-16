// src/screens/HomeScreen/types.ts
// TypeScript types for the Home Screen

import {TileState} from '../../logic/evaluateGuess';

/**
 * Screen state for HomeScreen
 */
export type HomeScreenState =
  | 'loading'
  | 'not_started'
  | 'in_progress'
  | 'completed';

/**
 * Leaderboard entry for display in the preview
 * Simplified view of Friend data
 */
export interface LeaderboardEntry {
  id: string;
  name: string;
  letter: string;
  guesses: number | null; // null = not played today
  isUser: boolean;
  rank: number;
}

/**
 * Summary of game state for HomeScreen display
 * Derived from the full game state in MMKV storage
 *
 * Note: Full storage structure includes:
 * length, maxRows, mode, dateISO, answer, rows, feedback,
 * current, status, hintUsed, hintedCell, hintedLetter
 */
export interface HomeGameSummary {
  mode: 'daily' | 'free';
  status: 'playing' | 'won' | 'lost';
  length: number;
  maxRows: number;
  dateISO: string;
  guessesUsed: number; // Derived from rows.length
  feedback: TileState[][]; // For mini-board display
}

/**
 * Today's completion result for display
 */
export interface TodayResult {
  won: boolean;
  guesses: number;
  feedback: TileState[][];
}

/**
 * Props for the main HomeScreen component
 */
export interface HomeScreenProps {
  onPlayDaily: () => void;
  onContinueGame: () => void;
  onFreePlay: () => void;
  onNavigateToStats: () => void;
  onNavigateToFriends: () => void;
}
