// src/storage/profile.ts
import {getJSON, setJSON, kv} from './mmkv';
import {getScopedKey, getCurrentUserId} from './userScope';
import {VALID_LENGTHS} from '../config/gameConfig';

export type UserProfile = {
  id: string;
  createdAt: number;
  stats: GameStats;
  preferences: UserPreferences;
};

export type GameStats = {
  // Stats per word length (4-6)
  [length: number]: LengthStats;
};

export type LengthStats = {
  gamesPlayed: number;
  gamesWon: number;
  currentStreak: number;
  maxStreak: number;
  lastPlayedDate: string | null; // ISO date string
  guessDistribution: {[guesses: number]: number}; // { 1: 5, 2: 20, 3: 40, ... }
  usedWords: string[]; // Words already played in this cycle
  currentCycle: number; // Which cycle we're on (increments when all words used)
};

export type UserPreferences = {
  defaultLength: number;
  defaultRows: number;
  defaultMode: 'daily' | 'free';
  hapticsEnabled: boolean;
  highContrastEnabled: boolean;
};

const PROFILE_BASE_KEY = 'user.profile';

// Get the scoped profile key for the current user
function getProfileKey(): string | null {
  return getScopedKey(PROFILE_BASE_KEY);
}

// Generate a simple UUID
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Initialize empty stats for a word length
export function initLengthStats(): LengthStats {
  return {
    gamesPlayed: 0,
    gamesWon: 0,
    currentStreak: 0,
    maxStreak: 0,
    lastPlayedDate: null,
    guessDistribution: {},
    usedWords: [],
    currentCycle: 0,
  };
}

// Create default profile (used when no user is logged in or for new users)
function createDefaultProfile(): UserProfile {
  const stats: GameStats = {};
  for (const len of VALID_LENGTHS) {
    stats[len] = initLengthStats();
  }
  return {
    id: generateUUID(),
    createdAt: Date.now(),
    stats,
    preferences: {
      defaultLength: 5,
      defaultRows: 6,
      defaultMode: 'daily',
      hapticsEnabled: true,
      highContrastEnabled: false,
    },
  };
}

// Create new profile for current user and save it
function createProfile(): UserProfile {
  const profile = createDefaultProfile();
  const key = getProfileKey();
  if (key) {
    setJSON(key, profile);
  }
  return profile;
}

// Get or create profile for current user
// Returns a default empty profile if no user is logged in
export function getProfile(): UserProfile {
  const key = getProfileKey();
  if (!key) {
    // No user logged in - return default profile (not persisted)
    return createDefaultProfile();
  }

  const existing = getJSON<UserProfile | null>(key, null);
  if (existing) {
    return existing;
  }
  return createProfile();
}

// Save profile for current user
export function saveProfile(profile: UserProfile): void {
  const key = getProfileKey();
  if (key) {
    setJSON(key, profile);
  }
}

// Update preferences
export function updatePreferences(prefs: Partial<UserPreferences>): void {
  const profile = getProfile();
  profile.preferences = {...profile.preferences, ...prefs};
  saveProfile(profile);
}

// Record game result
export function recordGameResult(params: {
  length: number;
  won: boolean;
  guesses: number;
  maxRows: number;
  date: string; // ISO date string
}): void {
  const profile = getProfile();
  const {length, won, guesses, date} = params;

  // Ensure stats exist for this length
  if (!profile.stats[length]) {
    profile.stats[length] = initLengthStats();
  }

  const stats = profile.stats[length];

  // Update basic stats
  stats.gamesPlayed++;
  if (won) {
    stats.gamesWon++;

    // Update guess distribution
    if (!stats.guessDistribution[guesses]) {
      stats.guessDistribution[guesses] = 0;
    }
    stats.guessDistribution[guesses]++;
  }

  // Update streak
  const lastPlayed = stats.lastPlayedDate;
  if (won) {
    if (lastPlayed === null) {
      // First game
      stats.currentStreak = 1;
    } else {
      // Check if consecutive day
      const lastDate = new Date(lastPlayed);
      const currentDate = new Date(date);
      const dayDiff = Math.floor(
        (currentDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24),
      );

      if (dayDiff === 0) {
        // Same day, keep streak (but don't increment for multiple games same day)
        // Keep current streak
      } else if (dayDiff === 1) {
        // Next day, increment
        stats.currentStreak++;
      } else {
        // Streak broken
        stats.currentStreak = 1;
      }
    }

    // Update max streak (moved outside to catch first win)
    if (stats.currentStreak > stats.maxStreak) {
      stats.maxStreak = stats.currentStreak;
    }
  } else {
    // Lost, break streak
    stats.currentStreak = 0;
  }

  stats.lastPlayedDate = date;
  saveProfile(profile);
}

// Get stats for a specific length
export function getStatsForLength(length: number): LengthStats {
  const profile = getProfile();
  if (!profile.stats[length]) {
    profile.stats[length] = initLengthStats();
    saveProfile(profile);
  }
  return profile.stats[length];
}

// Calculate win rate
export function getWinRate(length: number): number {
  const stats = getStatsForLength(length);
  if (stats.gamesPlayed === 0) return 0;
  return Math.round((stats.gamesWon / stats.gamesPlayed) * 100);
}

// Get total stats (across all lengths)
export function getTotalStats(): {
  played: number;
  won: number;
  winRate: number;
  currentStreak: number;
  maxStreak: number;
  guessDistribution: {[guesses: number]: number};
} {
  const profile = getProfile();
  let played = 0;
  let won = 0;
  let maxStreak = 0;
  const guessDistribution: {[guesses: number]: number} = {};

  // Aggregate across valid lengths only (4-6)
  Object.entries(profile.stats)
    .filter(([len]) => VALID_LENGTHS.includes(Number(len) as 4 | 5 | 6))
    .forEach(([, stats]) => {
      played += stats.gamesPlayed;
      won += stats.gamesWon;
      if (stats.maxStreak > maxStreak) {
        maxStreak = stats.maxStreak;
      }
      // Aggregate guess distribution
      Object.entries(stats.guessDistribution || {}).forEach(([guesses, count]) => {
        const guessNum = parseInt(guesses, 10);
        guessDistribution[guessNum] = (guessDistribution[guessNum] || 0) + count;
      });
    });

  // Current streak is from the most recently played valid length
  let currentStreak = 0;
  let mostRecentDate: string | null = null;

  Object.entries(profile.stats)
    .filter(([len]) => VALID_LENGTHS.includes(Number(len) as 4 | 5 | 6))
    .forEach(([, stats]) => {
      if (stats.lastPlayedDate) {
        if (
          !mostRecentDate ||
          new Date(stats.lastPlayedDate) > new Date(mostRecentDate)
        ) {
          mostRecentDate = stats.lastPlayedDate;
          currentStreak = stats.currentStreak;
        }
      }
    });

  const winRate = played > 0 ? Math.round((won / played) * 100) : 0;

  return {played, won, winRate, currentStreak, maxStreak, guessDistribution};
}

// Reset stats (for testing or user request)
export function resetStats(): void {
  const profile = getProfile();
  const stats: GameStats = {};
  for (const len of VALID_LENGTHS) {
    stats[len] = initLengthStats();
  }
  profile.stats = stats;
  saveProfile(profile);
}

// Export profile as JSON (for sharing/backup)
export function exportProfile(): string {
  const profile = getProfile();
  return JSON.stringify(profile, null, 2);
}

// Import profile from JSON (restore backup)
export function importProfile(jsonString: string): boolean {
  try {
    const profile = JSON.parse(jsonString) as UserProfile;
    // Validate basic structure
    if (!profile.id || !profile.stats || !profile.preferences) {
      return false;
    }
    saveProfile(profile);
    return true;
  } catch {
    return false;
  }
}

// Mark word as used and manage cycling
export function markWordAsUsed(length: number, word: string, totalWords: number): void {
  const profile = getProfile();

  if (!profile.stats[length]) {
    profile.stats[length] = initLengthStats();
  }

  const stats = profile.stats[length];

  // Add to used words if not already there
  if (!stats.usedWords.includes(word.toLowerCase())) {
    stats.usedWords.push(word.toLowerCase());
  }

  // Check if we've used all words - start new cycle
  if (stats.usedWords.length >= totalWords) {
    stats.usedWords = []; // Reset for new cycle
    stats.currentCycle++;
  }

  saveProfile(profile);
}

// Get unused words for a length
export function getUnusedWords(length: number, allWords: string[]): string[] {
  const profile = getProfile();

  if (!profile.stats[length]) {
    profile.stats[length] = initLengthStats();
  }

  const stats = profile.stats[length];

  // Backward compatibility: ensure usedWords exists
  if (!stats.usedWords) {
    stats.usedWords = [];
    stats.currentCycle = 0;
    saveProfile(profile);
  }

  const usedSet = new Set(stats.usedWords);

  return allWords.filter(word => !usedSet.has(word.toLowerCase()));
}

// Check if a word has been used
export function hasWordBeenUsed(length: number, word: string): boolean {
  const profile = getProfile();

  if (!profile.stats[length]) {
    return false;
  }

  const stats = profile.stats[length];
  return stats.usedWords.includes(word.toLowerCase());
}
