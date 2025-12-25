/**
 * Direct PostgREST RPC Client
 *
 * Bypasses the Supabase JS client to make direct HTTP calls to PostgREST.
 * This avoids the internal auth handling pipeline that can hang indefinitely.
 *
 * The Supabase JS client's supabase.rpc() method runs internal auth checks
 * (token refresh, session validation) before making HTTP requests. These
 * internal checks can hang during token refresh, blocking the entire call.
 *
 * By making direct HTTP calls, we:
 * - Skip the blocking auth pipeline
 * - Control exact timeout behavior with AbortController
 * - Get instant responses from the fast database
 * - Still enforce RLS via the Authorization header
 *
 * WORKAROUND: Supabase JS client getSession() can hang indefinitely in React Native
 *
 * Root cause: A locking mechanism in supabase-js serializes calls to `_useSession`.
 * When async Supabase calls (rpc, from, storage) are made, the custom fetch wrapper
 * calls `_useSession` internally, causing a deadlock if already waiting on session.
 *
 * This particularly affects:
 * - Token refresh (every ~1 hour)
 * - Calls made inside onAuthStateChange callbacks
 * - App startup when backend is slow/unreachable
 *
 * Our solution: Cache session synchronously via onAuthStateChange, then use
 * direct fetch() calls with explicit timeouts instead of supabase-js methods.
 *
 * Related GitHub issues:
 * - https://github.com/supabase/gotrue-js/issues/762 (main deadlock issue)
 * - https://github.com/supabase/supabase-js/issues/970 (getSession slow/hanging)
 * - https://github.com/supabase/supabase/issues/17016 (React Native session issues)
 */

import {supabaseConfig} from '../../config/environment';
import {logger} from '../../utils/logger';

interface DirectRpcOptions {
  /** The name of the Postgres function to call */
  functionName: string;
  /** Parameters to pass to the function */
  params: Record<string, unknown>;
  /** JWT access token for authorization (from AuthContext) */
  accessToken: string;
  /** Timeout in milliseconds (default: 8000ms) */
  timeoutMs?: number;
}

interface DirectRpcResult<T> {
  data: T | null;
  error: Error | null;
}

/**
 * Make a direct RPC call to PostgREST, bypassing Supabase JS client
 *
 * @example
 * const {data, error} = await directRpc({
 *   functionName: 'get_leaderboard',
 *   params: { p_user_id: userId, p_friends_only: false },
 *   accessToken: session.accessToken,
 * });
 */
export async function directRpc<T>(
  options: DirectRpcOptions,
): Promise<DirectRpcResult<T>> {
  const {functionName, params, accessToken, timeoutMs = 8000} = options;

  // Validate inputs
  if (!supabaseConfig.url || !supabaseConfig.anonKey) {
    return {
      data: null,
      error: new Error('Supabase not configured'),
    };
  }

  if (!accessToken) {
    return {
      data: null,
      error: new Error('No access token provided'),
    };
  }

  // Set up timeout with AbortController
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const startTime = Date.now();
  logger.log(`[DirectRPC] Calling ${functionName}...`);

  try {
    const response = await fetch(
      `${supabaseConfig.url}/rest/v1/rpc/${functionName}`,
      {
        method: 'POST',
        headers: {
          apikey: supabaseConfig.anonKey,
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          // Prefer: return=representation ensures we get the result back
          Prefer: 'return=representation',
        },
        body: JSON.stringify(params),
        signal: controller.signal,
      },
    );

    clearTimeout(timeoutId);
    const duration = Date.now() - startTime;
    logger.log(`[DirectRPC] ${functionName} completed in ${duration}ms`);

    if (!response.ok) {
      const errorText = await response.text();
      logger.error(`[DirectRPC] ${functionName} error: ${response.status} - ${errorText}`);
      return {
        data: null,
        error: new Error(`RPC error ${response.status}: ${errorText}`),
      };
    }

    const data = await response.json();
    logger.log(`[DirectRPC] ${functionName} returned ${Array.isArray(data) ? data.length + ' items' : 'data'}`);
    return {data: data as T, error: null};
  } catch (err) {
    clearTimeout(timeoutId);
    const duration = Date.now() - startTime;

    if (err instanceof Error && err.name === 'AbortError') {
      logger.error(`[DirectRPC] ${functionName} timed out after ${duration}ms`);
      return {
        data: null,
        error: new Error(`Request timed out after ${timeoutMs}ms`),
      };
    }

    logger.error(`[DirectRPC] ${functionName} failed after ${duration}ms:`, err);
    return {
      data: null,
      error: err instanceof Error ? err : new Error('Unknown error'),
    };
  }
}

/**
 * Make a direct query to a table, bypassing Supabase JS client
 * Useful for simple SELECT queries that don't need the full query builder
 *
 * @example
 * const {data, error} = await directQuery({
 *   table: 'game_results',
 *   select: 'user_id,won,guesses',
 *   filters: { date: 'eq.2025-01-15', user_id: 'in.(id1,id2)' },
 *   accessToken: session.accessToken,
 * });
 */
export async function directQuery<T>(options: {
  table: string;
  select?: string;
  filters?: Record<string, string>;
  accessToken: string;
  timeoutMs?: number;
}): Promise<DirectRpcResult<T[]>> {
  const {table, select = '*', filters = {}, accessToken, timeoutMs = 8000} = options;

  if (!supabaseConfig.url || !supabaseConfig.anonKey) {
    return {
      data: null,
      error: new Error('Supabase not configured'),
    };
  }

  if (!accessToken) {
    return {
      data: null,
      error: new Error('No access token provided'),
    };
  }

  // Build URL with query params
  const url = new URL(`${supabaseConfig.url}/rest/v1/${table}`);
  url.searchParams.set('select', select);
  Object.entries(filters).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const startTime = Date.now();
  logger.log(`[DirectQuery] Querying ${table}...`);

  try {
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        apikey: supabaseConfig.anonKey,
        Authorization: `Bearer ${accessToken}`,
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const duration = Date.now() - startTime;
    logger.log(`[DirectQuery] ${table} completed in ${duration}ms`);

    if (!response.ok) {
      const errorText = await response.text();
      return {
        data: null,
        error: new Error(`Query error ${response.status}: ${errorText}`),
      };
    }

    const data = await response.json();
    return {data: data as T[], error: null};
  } catch (err) {
    clearTimeout(timeoutId);

    if (err instanceof Error && err.name === 'AbortError') {
      return {
        data: null,
        error: new Error(`Request timed out after ${timeoutMs}ms`),
      };
    }

    return {
      data: null,
      error: err instanceof Error ? err : new Error('Unknown error'),
    };
  }
}

/**
 * Direct INSERT to a table, bypassing Supabase JS client
 * Uses AbortController for timeout control
 *
 * @example
 * const {error} = await directInsert('game_results', {
 *   user_id: userId,
 *   word_length: 5,
 *   won: true,
 * }, accessToken);
 */
export async function directInsert(
  table: string,
  data: Record<string, unknown>,
  accessToken: string,
  timeoutMs = 10000,
): Promise<{error: Error | null}> {
  if (!supabaseConfig.url || !supabaseConfig.anonKey) {
    return {error: new Error('Supabase not configured')};
  }

  if (!accessToken) {
    return {error: new Error('No access token provided')};
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const startTime = Date.now();
  logger.log(`[DirectInsert] Inserting into ${table}...`);

  try {
    const response = await fetch(`${supabaseConfig.url}/rest/v1/${table}`, {
      method: 'POST',
      headers: {
        apikey: supabaseConfig.anonKey,
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify(data),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const duration = Date.now() - startTime;
    logger.log(`[DirectInsert] ${table} completed in ${duration}ms`);

    if (!response.ok) {
      const errorText = await response.text();
      logger.error(
        `[DirectInsert] ${table} error: ${response.status} - ${errorText}`,
      );
      return {error: new Error(`Insert error ${response.status}: ${errorText}`)};
    }

    return {error: null};
  } catch (err) {
    clearTimeout(timeoutId);
    const duration = Date.now() - startTime;

    if (err instanceof Error && err.name === 'AbortError') {
      logger.error(`[DirectInsert] ${table} timed out after ${duration}ms`);
      return {error: new Error(`Insert timed out after ${timeoutMs}ms`)};
    }

    logger.error(`[DirectInsert] ${table} failed after ${duration}ms:`, err);
    return {error: err instanceof Error ? err : new Error('Unknown error')};
  }
}

/**
 * Direct UPSERT to a table, bypassing Supabase JS client
 * Uses AbortController for timeout control
 *
 * @example
 * const {error} = await directUpsert('game_stats', {
 *   user_id: userId,
 *   word_length: 5,
 *   games_played: 10,
 * }, accessToken, 'user_id,word_length');
 */
export async function directUpsert(
  table: string,
  data: Record<string, unknown>,
  accessToken: string,
  onConflict: string,
  timeoutMs = 10000,
): Promise<{error: Error | null}> {
  if (!supabaseConfig.url || !supabaseConfig.anonKey) {
    return {error: new Error('Supabase not configured')};
  }

  if (!accessToken) {
    return {error: new Error('No access token provided')};
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const startTime = Date.now();
  logger.log(`[DirectUpsert] Upserting into ${table}...`);

  try {
    const response = await fetch(
      `${supabaseConfig.url}/rest/v1/${table}?on_conflict=${onConflict}`,
      {
        method: 'POST',
        headers: {
          apikey: supabaseConfig.anonKey,
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          Prefer: 'resolution=merge-duplicates,return=minimal',
        },
        body: JSON.stringify(data),
        signal: controller.signal,
      },
    );

    clearTimeout(timeoutId);
    const duration = Date.now() - startTime;
    logger.log(`[DirectUpsert] ${table} completed in ${duration}ms`);

    if (!response.ok) {
      const errorText = await response.text();
      logger.error(
        `[DirectUpsert] ${table} error: ${response.status} - ${errorText}`,
      );
      return {error: new Error(`Upsert error ${response.status}: ${errorText}`)};
    }

    return {error: null};
  } catch (err) {
    clearTimeout(timeoutId);
    const duration = Date.now() - startTime;

    if (err instanceof Error && err.name === 'AbortError') {
      logger.error(`[DirectUpsert] ${table} timed out after ${duration}ms`);
      return {error: new Error(`Upsert timed out after ${timeoutMs}ms`)};
    }

    logger.error(`[DirectUpsert] ${table} failed after ${duration}ms:`, err);
    return {error: err instanceof Error ? err : new Error('Unknown error')};
  }
}
