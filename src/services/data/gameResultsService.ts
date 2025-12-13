/**
 * Game Results Service
 * 
 * Handles saving and retrieving game results.
 * Routes to appropriate implementation based on environment mode.
 */

import {isDevelopment} from '../../config/environment';
import {getSupabase, getCachedSession} from '../supabase/client';
import {directInsert} from '../supabase/directRpc';
import {TileState} from '../../logic/evaluateGuess';
import {recordGameResult as recordLocal} from '../../storage/profile';
import {getProfileService} from './profileService';

export interface GameResult {
  id?: string;
  userId: string;
  wordLength: number;
  won: boolean;
  guesses: number;
  maxRows: number;
  date: string;
  feedback: TileState[][];
  createdAt?: string;
}

export interface IGameResultsService {
  saveGameResult(result: Omit<GameResult, 'id' | 'userId' | 'createdAt'>): Promise<void>;
  getRecentGames(limit?: number): Promise<GameResult[]>;
  getGamesForDate(date: string): Promise<GameResult[]>;
}

/**
 * Mock Game Results Service (Dev Mode)
 * Uses local MMKV storage
 */
class MockGameResultsService implements IGameResultsService {
  async saveGameResult(
    result: Omit<GameResult, 'id' | 'userId' | 'createdAt'>,
  ): Promise<void> {
    // Save to local storage using existing function
    recordLocal({
      length: result.wordLength,
      won: result.won,
      guesses: result.guesses,
      maxRows: result.maxRows,
      date: result.date,
    });
  }

  async getRecentGames(limit = 10): Promise<GameResult[]> {
    // In dev mode, we don't store individual game history
    // Return empty array
    return [];
  }

  async getGamesForDate(date: string): Promise<GameResult[]> {
    // In dev mode, we don't store individual game history
    return [];
  }
}

/**
 * Supabase Game Results Service (Prod Mode)
 * Saves to Supabase backend
 */
class SupabaseGameResultsService implements IGameResultsService {
  async saveGameResult(
    result: Omit<GameResult, 'id' | 'userId' | 'createdAt'>,
  ): Promise<void> {
    // DIAGNOSTIC: Trace exactly what's happening
    console.log('[GameResultsService] saveGameResult called');
    const cachedSession = getCachedSession();
    console.log('[GameResultsService] getCachedSession() =', cachedSession ? 'EXISTS' : 'NULL');
    if (cachedSession) {
      console.log('[GameResultsService] user.id =', cachedSession.user.id);
    }

    // Always save locally first
    recordLocal({
      length: result.wordLength,
      won: result.won,
      guesses: result.guesses,
      maxRows: result.maxRows,
      date: result.date,
    });
    console.log('[GameResultsService] Saved locally');

    // Use cached session (avoids getSession() which hangs)
    const session = getCachedSession();
    if (!session) {
      console.warn(
        '[GameResultsService] No cached session - skipping cloud sync',
      );
      return;
    }
    console.log('[GameResultsService] Using cached session for user:', session.user.id);

    try {
      // Use directInsert with timeout (avoids Supabase JS client pipeline)
      const {error} = await directInsert(
        'game_results',
        {
          user_id: session.user.id,
          word_length: result.wordLength,
          won: result.won,
          guesses: result.guesses,
          max_rows: result.maxRows,
          date: result.date,
          feedback: result.feedback,
        },
        session.accessToken,
      );

      if (error) {
        console.error('[GameResultsService] Insert failed:', error.message);
        return;
      }
      console.log('[GameResultsService] game_results insert succeeded');

      // Sync aggregated stats to game_stats table
      // This ensures leaderboards have fresh data
      console.log('[GameResultsService] About to call syncStats()...');
      const startSync = Date.now();
      await getProfileService().syncStats();
      console.log(
        `[GameResultsService] syncStats() returned in ${Date.now() - startSync}ms`,
      );
      console.log('[GameResultsService] Stats sync complete');
    } catch (err) {
      console.error('[GameResultsService] Exception caught:', err);
      // Fail silently - local save is already done
    }
  }

  async getRecentGames(limit = 10): Promise<GameResult[]> {
    const supabase = getSupabase();
    if (!supabase) {
      return [];
    }

    try {
      // Use getSession() - cached locally, no network call
      const {data: {session}} = await supabase.auth.getSession();
      if (!session?.user) {
        return [];
      }
      const user = session.user;

      const {data: results, error} = await supabase
        .from('game_results')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', {ascending: false})
        .limit(limit);

      if (error || !results) {
        return [];
      }

      return results.map(r => ({
        id: r.id,
        userId: r.user_id,
        wordLength: r.word_length,
        won: r.won,
        guesses: r.guesses,
        maxRows: r.max_rows,
        date: r.date,
        feedback: r.feedback,
        createdAt: r.created_at,
      }));
    } catch {
      return [];
    }
  }

  async getGamesForDate(date: string): Promise<GameResult[]> {
    const supabase = getSupabase();
    if (!supabase) {
      return [];
    }

    try {
      // Use getSession() - cached locally, no network call
      const {data: {session}} = await supabase.auth.getSession();
      if (!session?.user) {
        return [];
      }
      const user = session.user;

      const {data: results, error} = await supabase
        .from('game_results')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', date);

      if (error || !results) {
        return [];
      }

      return results.map(r => ({
        id: r.id,
        userId: r.user_id,
        wordLength: r.word_length,
        won: r.won,
        guesses: r.guesses,
        maxRows: r.max_rows,
        date: r.date,
        feedback: r.feedback,
        createdAt: r.created_at,
      }));
    } catch {
      return [];
    }
  }
}

/**
 * Get the appropriate game results service based on environment
 */
export function getGameResultsService(): IGameResultsService {
  return isDevelopment
    ? new MockGameResultsService()
    : new SupabaseGameResultsService();
}

export const gameResultsService = getGameResultsService();













