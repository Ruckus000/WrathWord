/**
 * Supabase client configuration
 * 
 * This module initializes and exports the Supabase client for use throughout the app.
 * Uses MMKV for session persistence to maintain auth state across app restarts.
 */

import {createClient, SupabaseClient} from '@supabase/supabase-js';
import {supabaseConfig, shouldUseSupabase} from '../../config/environment';
import {kv} from '../../storage/mmkv';

// Custom storage adapter using MMKV for auth persistence
const mmkvStorage = {
  getItem: (key: string) => {
    return kv.getString(key) ?? null;
  },
  setItem: (key: string, value: string) => {
    kv.set(key, value);
  },
  removeItem: (key: string) => {
    kv.delete(key);
  },
};

/**
 * Initialize Supabase client with MMKV storage adapter
 * Only creates a real client if Supabase is configured
 */
function initializeSupabase(): SupabaseClient | null {
  if (!shouldUseSupabase()) {
    // Return null in dev mode or if not configured
    // Services will check for this and use mock implementations
    return null;
  }

  const client = createClient(supabaseConfig.url, supabaseConfig.anonKey, {
    auth: {
      storage: mmkvStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });

  return client;
}

/**
 * Singleton Supabase client instance
 * Will be null in development mode or if not configured
 */
export const supabase = initializeSupabase();

/**
 * Check if Supabase client is available and ready to use
 */
export function isSupabaseAvailable(): boolean {
  return supabase !== null;
}

/**
 * Database table type definitions
 * These match the Supabase schema
 */
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          user_id: string;
          username: string;
          display_name: string;
          friend_code: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          username: string;
          display_name: string;
          friend_code: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          username?: string;
          display_name?: string;
          friend_code?: string;
          updated_at?: string;
        };
      };
      game_stats: {
        Row: {
          user_id: string;
          word_length: number;
          games_played: number;
          games_won: number;
          current_streak: number;
          max_streak: number;
          guess_distribution: Record<string, number>;
          used_words: string[];
          current_cycle: number;
          last_played_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          word_length: number;
          games_played?: number;
          games_won?: number;
          current_streak?: number;
          max_streak?: number;
          guess_distribution?: Record<string, number>;
          used_words?: string[];
          current_cycle?: number;
          last_played_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          games_played?: number;
          games_won?: number;
          current_streak?: number;
          max_streak?: number;
          guess_distribution?: Record<string, number>;
          used_words?: string[];
          current_cycle?: number;
          last_played_date?: string | null;
          updated_at?: string;
        };
      };
      game_results: {
        Row: {
          id: string;
          user_id: string;
          word_length: number;
          won: boolean;
          guesses: number;
          max_rows: number;
          date: string;
          feedback: any; // JSONB
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          word_length: number;
          won: boolean;
          guesses: number;
          max_rows: number;
          date: string;
          feedback: any;
          created_at?: string;
        };
        Update: {
          won?: boolean;
          guesses?: number;
          feedback?: any;
        };
      };
      friendships: {
        Row: {
          id: string;
          user_id_1: string;
          user_id_2: string;
          status: 'pending' | 'accepted';
          created_at: string;
          accepted_at: string | null;
        };
        Insert: {
          id?: string;
          user_id_1: string;
          user_id_2: string;
          status?: 'pending' | 'accepted';
          created_at?: string;
          accepted_at?: string | null;
        };
        Update: {
          status?: 'pending' | 'accepted';
          accepted_at?: string | null;
        };
      };
      friend_requests: {
        Row: {
          id: string;
          from_user_id: string;
          to_user_id: string;
          status: 'pending' | 'accepted' | 'declined';
          created_at: string;
        };
        Insert: {
          id?: string;
          from_user_id: string;
          to_user_id: string;
          status?: 'pending' | 'accepted' | 'declined';
          created_at?: string;
        };
        Update: {
          status?: 'pending' | 'accepted' | 'declined';
        };
      };
    };
  };
};



