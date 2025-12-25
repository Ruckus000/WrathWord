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
import {logger} from '../../utils/logger';

/**
 * Cached session for synchronous access
 * Populated by onAuthStateChange in supabaseAuthService
 * Avoids calling getSession() which can hang in React Native
 */
interface CachedSession {
  user: {id: string};
  accessToken: string;
}

let _cachedSession: CachedSession | null = null;

export function setCachedSession(
  session: {user: {id: string}; access_token: string} | null,
) {
  if (session) {
    _cachedSession = {
      user: {id: session.user.id},
      accessToken: session.access_token,
    };
    logger.log('[Supabase] Session cached for user:', session.user.id);
  } else {
    _cachedSession = null;
    logger.log('[Supabase] Session cache cleared');
  }
}

export function getCachedSession(): CachedSession | null {
  return _cachedSession;
}

/**
 * Decode JWT and check if it expires within the threshold (default 5 minutes)
 * Returns true if token is expiring soon or cannot be parsed
 */
function isTokenExpiringSoon(token: string, thresholdMs = 5 * 60 * 1000): boolean {
  try {
    // JWT format: header.payload.signature
    const parts = token.split('.');
    if (parts.length !== 3) {
      return true; // Invalid JWT format
    }

    // Decode base64 payload (handle URL-safe base64)
    const base64Payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(base64Payload));

    if (typeof payload.exp !== 'number') {
      return true; // No expiry claim
    }

    const expiresAt = payload.exp * 1000; // Convert to milliseconds
    const now = Date.now();
    const isExpiring = expiresAt - now < thresholdMs;

    if (isExpiring) {
      const remainingMs = expiresAt - now;
      logger.log(`[Supabase] Token expires in ${Math.round(remainingMs / 1000)}s (threshold: ${thresholdMs / 1000}s)`);
    }

    return isExpiring;
  } catch (error) {
    // If we can't parse, assume it might be expired
    logger.warn('[Supabase] Failed to parse JWT for expiry check:', error);
    return true;
  }
}

// Simple promise-based mutex to prevent concurrent refreshes
let _refreshPromise: Promise<string | null> | null = null;

/**
 * Get a valid access token, refreshing if necessary.
 * Uses mutex to prevent concurrent refresh attempts.
 *
 * This function should be called before making direct API calls
 * to ensure the token is valid and not expired.
 */
export async function getValidAccessToken(): Promise<string | null> {
  const cached = getCachedSession();

  // No cached session - cannot refresh
  if (!cached?.accessToken) {
    logger.log('[Supabase] No cached session for token validation');
    return null;
  }

  // Token is still valid - return it immediately
  if (!isTokenExpiringSoon(cached.accessToken)) {
    return cached.accessToken;
  }

  // Token expiring soon - need to refresh
  // If refresh already in progress, wait for it (mutex)
  if (_refreshPromise) {
    logger.log('[Supabase] Token refresh in progress, waiting...');
    return _refreshPromise;
  }

  // Start refresh with mutex
  _refreshPromise = (async () => {
    try {
      logger.log('[Supabase] Token expiring soon, refreshing...');
      const supabase = getSupabase();
      if (!supabase) {
        logger.warn('[Supabase] No client available for token refresh');
        return null; // Force re-auth instead of returning stale token
      }

      const {data: {session}, error} = await supabase.auth.refreshSession();
      if (error || !session) {
        logger.error('[Supabase] Token refresh failed:', error?.message);
        return null; // Force re-auth instead of returning stale token
      }

      // Update cache with new token
      setCachedSession({
        user: {id: session.user.id},
        access_token: session.access_token,
      });

      logger.log('[Supabase] Token refreshed successfully');
      return session.access_token;
    } catch (err) {
      logger.error('[Supabase] Token refresh exception:', err);
      return null; // Force re-auth instead of returning stale token
    } finally {
      _refreshPromise = null; // Release mutex
    }
  })();

  return _refreshPromise;
}

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
  logger.log('[Supabase] Initializing...');
  logger.log('[Supabase] URL:', supabaseConfig.url || '(empty)');
  logger.log('[Supabase] Key present:', !!supabaseConfig.anonKey);
  logger.log('[Supabase] shouldUseSupabase:', shouldUseSupabase());

  if (!shouldUseSupabase()) {
    logger.log('[Supabase] Skipping - dev mode or not configured');
    return null;
  }

  try {
    logger.log('[Supabase] Creating client...');

    // Create a custom fetch with timeout to prevent infinite hangs
    const fetchWithTimeout = (url: RequestInfo | URL, options?: RequestInit): Promise<Response> => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

      return fetch(url, {
        ...options,
        signal: controller.signal,
      }).finally(() => clearTimeout(timeoutId));
    };

    const client = createClient(supabaseConfig.url, supabaseConfig.anonKey, {
      auth: {
        storage: getMmkvStorage(),
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
      global: {
        fetch: fetchWithTimeout,
      },
    });
    logger.log('[Supabase] Client created successfully');

    // DIAGNOSTIC: Test if raw fetch works (dev only)
    if (__DEV__) {
      logger.log('[Supabase] Testing raw fetch...');
      fetch(`${supabaseConfig.url}/rest/v1/`, {
        headers: {apikey: supabaseConfig.anonKey},
      })
        .then(res => logger.log('[Supabase] RAW FETCH SUCCESS:', res.status))
        .catch(err => logger.log('[Supabase] RAW FETCH ERROR:', err.message));
    }

    return client;
  } catch (error) {
    logger.error('[Supabase] Failed to create client:', error);
    return null;
  }
}

/**
 * Get the Supabase client instance (lazy initialization)
 * Returns null in development mode or if not configured
 */
export function getSupabase(): SupabaseClient | null {
  if (!_initialized) {
    logger.log('[Supabase] getSupabase: First call, initializing...');
    _initialized = true;
    _supabase = initializeSupabase();
  }
  return _supabase;
}

/**
 * Test RPC connectivity - useful for debugging (dev only)
 */
export const testRpcCall = __DEV__
  ? async (): Promise<{success: boolean; error?: string; duration?: number}> => {
      const supabase = getSupabase();
      if (!supabase) {
        return {success: false, error: 'No supabase client'};
      }

      logger.log('[Supabase] testRpcCall: Getting session...');
      const {data: {session}} = await supabase.auth.getSession();
      if (!session?.user) {
        return {success: false, error: 'No session'};
      }

      logger.log('[Supabase] testRpcCall: Calling RPC...');
      const startTime = Date.now();
      try {
        const {data, error} = await supabase.rpc('get_leaderboard', {
          p_user_id: session.user.id,
          p_friends_only: false,
          p_period: 'alltime',
          p_limit: 1,
        });
        const duration = Date.now() - startTime;
        logger.log(`[Supabase] testRpcCall: Completed in ${duration}ms`);

        if (error) {
          return {success: false, error: error.message, duration};
        }
        return {success: true, duration};
      } catch (err) {
        const duration = Date.now() - startTime;
        return {success: false, error: String(err), duration};
      }
    }
  : undefined;

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













