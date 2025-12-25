/**
 * Environment configuration for WrathWord
 *
 * Controls whether the app runs in development mode (using mocked data)
 * or production mode (using Supabase backend).
 */

import {SUPABASE_URL, SUPABASE_ANON_KEY} from '@env';

/**
 * ========================================
 * DEVELOPMENT MODE CONFIGURATION
 * ========================================
 *
 * Uses React Native's __DEV__ flag which is automatically:
 * - true in development builds (Metro bundler)
 * - false in production/release builds
 *
 * This prevents accidentally shipping with dev mode enabled.
 *
 * To test production behavior during development, build a release:
 *   npx react-native run-ios --mode Release
 */

/**
 * Main flag that determines if app is in development mode.
 * Derived from React Native's __DEV__ global - cannot be accidentally misconfigured.
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
export const isDevelopment = __DEV__;

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



