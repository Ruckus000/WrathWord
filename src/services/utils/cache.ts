/**
 * Cache Utility for Friends Service
 *
 * Implements a stale-while-revalidate pattern:
 * 1. Return cached data immediately if available
 * 2. Fetch fresh data in background
 * 3. Update cache when fresh data arrives
 *
 * This improves perceived performance by showing data instantly
 * while ensuring data stays fresh.
 */

import {getJSON, setJSON} from '../../storage/mmkv';

// Cache keys
const CACHE_KEYS = {
  FRIENDS: 'cache_friends',
  GLOBAL_LEADERBOARD: 'cache_global_leaderboard',
  FRIENDS_LEADERBOARD: 'cache_friends_leaderboard',
} as const;

// Cache TTL in milliseconds (5 minutes)
const CACHE_TTL = 5 * 60 * 1000;

// Stale TTL - data older than this triggers background refresh (1 minute)
const STALE_TTL = 60 * 1000;

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

/**
 * Get cached data if available and not expired
 * Returns null if cache is empty or expired
 */
export function getCache<T>(key: string): T | null {
  const cacheKey = `${key}_v1`;
  const entry = getJSON<CacheEntry<T> | null>(cacheKey, null);

  if (!entry) {
    return null;
  }

  const age = Date.now() - entry.timestamp;

  // Return null if cache is completely expired
  if (age > CACHE_TTL) {
    return null;
  }

  return entry.data;
}

/**
 * Check if cache data is stale (needs background refresh)
 */
export function isCacheStale(key: string): boolean {
  const cacheKey = `${key}_v1`;
  const entry = getJSON<CacheEntry<unknown> | null>(cacheKey, null);

  if (!entry) {
    return true;
  }

  const age = Date.now() - entry.timestamp;
  return age > STALE_TTL;
}

/**
 * Set cache data with current timestamp
 */
export function setCache<T>(key: string, data: T): void {
  const cacheKey = `${key}_v1`;
  const entry: CacheEntry<T> = {
    data,
    timestamp: Date.now(),
  };
  setJSON(cacheKey, entry);
}

/**
 * Clear specific cache entry
 */
export function clearCache(key: string): void {
  const cacheKey = `${key}_v1`;
  setJSON(cacheKey, null);
}

/**
 * Clear all friends-related cache
 */
export function clearAllFriendsCache(): void {
  Object.values(CACHE_KEYS).forEach(key => {
    clearCache(key);
  });
}

// Export cache keys for service use
export {CACHE_KEYS};
