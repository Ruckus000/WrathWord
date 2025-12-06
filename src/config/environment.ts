/**
 * Environment configuration for WrathWord
 *
 * Controls whether the app runs in development mode (using mocked data)
 * or production mode (using Supabase backend).
 */

import {SUPABASE_URL, SUPABASE_ANON_KEY} from '@env';

/**
 * ========================================
 * MANUAL MODE TOGGLE
 * ========================================
 *
 * Set this to control which mode the app runs in:
 *
 *   true  = DEV MODE (mock data, no auth required)
 *   false = PROD MODE (Supabase backend, real auth)
 *
 * Change this value and restart Metro to switch modes.
 */
const FORCE_DEV_MODE = false;

/**
 * Main flag that determines if app is in development mode.
 *
 * When true (DEV MODE):
 * - Authentication is bypassed (auto-logged in)
 * - Friends data comes from mockFriends.ts
 * - Leaderboards show mock data
 * - No network calls to Supabase
 *
 * When false (PROD MODE):
 * - Real Supabase authentication required
 * - Friends/leaderboards from database
 * - Game results sync to cloud
 * - Requires .env with Supabase credentials
 */
export const isDevelopment = FORCE_DEV_MODE;

/**
 * Supabase configuration
 * These should be set via environment variables in production builds
 */
export const supabaseConfig = {
    url: SUPABASE_URL || '',
    anonKey: SUPABASE_ANON_KEY || '',
};

/**
 * Validate Supabase configuration
 * Returns true if config is valid for production use
 */
export function isSupabaseConfigured(): boolean {
    return Boolean(supabaseConfig.url && supabaseConfig.anonKey);
}

/**
 * Get current mode as string for debugging
 */
export function getCurrentMode(): 'development' | 'production' {
    return isDevelopment ? 'development' : 'production';
}

/**
 * Check if app should use Supabase backend
 * Only use Supabase if in prod mode AND config is valid
 */
export function shouldUseSupabase(): boolean {
    return !isDevelopment && isSupabaseConfigured();
}



