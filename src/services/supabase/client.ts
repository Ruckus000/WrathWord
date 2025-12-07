/**
 * Supabase client configuration
 *
 * This module initializes and exports the Supabase client for use throughout the app.
 * Uses MMKV for session persistence to maintain auth state across app restarts.
 *
 * PERFORMANCE: Uses lazy initialization to avoid blocking app startup.
 * The client is only created when first accessed via getSupabase().
 */

// URL polyfill required for Supabase in React Native
import 'react-native-url-polyfill/auto';

import {createClient, SupabaseClient} from '@supabase/supabase-js';
import {supabaseConfig, shouldUseSupabase} from '../../config/environment';

// Lazy-loaded MMKV storage adapter
let _mmkvStorage: {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
} | null = null;

function getMmkvStorage() {
  if (!_mmkvStorage) {
    // Only import MMKV when actually needed
    const {kv} = require('../../storage/mmkv');
    _mmkvStorage = {
      getItem: (key: string) => kv.getString(key) ?? null,
      setItem: (key: string, value: string) => kv.set(key, value),
      removeItem: (key: string) => kv.remove(key),
    };
  }
  return _mmkvStorage;
}

// Cached client instance for lazy initialization
let _supabase: SupabaseClient | null = null;
let _initialized = false;

/**
 * Initialize Supabase client with MMKV storage adapter
 * Only creates a real client if Supabase is configured
 */
function initializeSupabase(): SupabaseClient | null {
  console.log('[Supabase] Initializing, shouldUseSupabase:', shouldUseSupabase());

  if (!shouldUseSupabase()) {
    console.log('[Supabase] Skipping - dev mode or not configured');
    return null;
  }

  try {
    console.log('[Supabase] Creating client...');
    const client = createClient(supabaseConfig.url, supabaseConfig.anonKey, {
      auth: {
        storage: getMmkvStorage(),
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    });
    console.log('[Supabase] Client created successfully');
    return client;
  } catch (error) {
    console.error('[Supabase] Failed to create client:', error);
    return null;
  }
}

/**
 * Get the Supabase client instance (lazy initialization)
 * Returns null in development mode or if not configured
 */
export function getSupabase(): SupabaseClient | null {
  if (!_initialized) {
    _initialized = true;
    _supabase = initializeSupabase();
  }
  return _supabase;
}

/**
 * Legacy export for backwards compatibility
 * @deprecated Use getSupabase() instead for lazy initialization
 */
export const supabase = null as SupabaseClient | null;

/**
 * Check if Supabase client is available and ready to use
 */
export function isSupabaseAvailable(): boolean {
  return getSupabase() !== null;
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







