/**
 * Game Results Service
 * 
 * Handles saving and retrieving game results.
 * Routes to appropriate implementation based on environment mode.
 */

import {isDevelopment} from '../../config/environment';
import {supabase} from '../supabase/client';
import {TileState} from '../../logic/evaluateGuess';
import {recordGameResult as recordLocal} from '../../storage/profile';

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
    // Always save locally first
    recordLocal({
      length: result.wordLength,
      won: result.won,
      guesses: result.guesses,
      maxRows: result.maxRows,
      date: result.date,
    });

    if (!supabase) {
      return;
    }

    try {
      const {data: {user}} = await supabase.auth.getUser();
      if (!user) {
        return;
      }

      // Save to Supabase
      await supabase.from('game_results').insert({
        user_id: user.id,
        word_length: result.wordLength,
        won: result.won,
        guesses: result.guesses,
        max_rows: result.maxRows,
        date: result.date,
        feedback: result.feedback,
      });
    } catch (err) {
      console.error('Failed to save game result to Supabase:', err);
      // Fail silently - local save is already done
    }
  }

  async getRecentGames(limit = 10): Promise<GameResult[]> {
    if (!supabase) {
      return [];
    }

    try {
      const {data: {user}} = await supabase.auth.getUser();
      if (!user) {
        return [];
      }

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
    if (!supabase) {
      return [];
    }

    try {
      const {data: {user}} = await supabase.auth.getUser();
      if (!user) {
        return [];
      }

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







