/**
 * Environment configuration for WrathWord
 * 
 * Controls whether the app runs in development mode (using mocked data)
 * or production mode (using Supabase backend).
 */

// Check if running in React Native development mode
const isReactNativeDev = typeof __DEV__ !== 'undefined' ? __DEV__ : false;

// Allow manual override via environment variable
// In production builds, you can set this to 'production' to force prod mode
const ENV_MODE = process.env.NODE_ENV || 'development';

/**
 * Main flag that determines if app is in development mode.
 * 
 * When true:
 * - Authentication is bypassed
 * - All data comes from local mocks
 * - No network calls to Supabase
 * 
 * When false:
 * - Real authentication required
 * - Data synced with Supabase backend
 * - Network calls enabled
 * 
 * DEFAULT: true (safe for development)
 */
export const isDevelopment = isReactNativeDev || ENV_MODE === 'development';

/**
 * Supabase configuration
 * These should be set via environment variables in production builds
 */
export const supabaseConfig = {
    url: process.env.SUPABASE_URL || '',
    anonKey: process.env.SUPABASE_ANON_KEY || '',
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



