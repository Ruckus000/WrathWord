// src/storage/userScope.ts
// Manages user-scoped storage keys to prevent data leakage between users

import {kv} from './mmkv';

const USER_ID_KEY = 'currentUserId';

let currentUserId: string | null = null;

/**
 * Set the current user ID for scoped storage.
 * Call this on sign-in with the user's ID, or on sign-out with null.
 */
export function setCurrentUserId(userId: string | null): void {
  currentUserId = userId;
  if (userId) {
    kv.set(USER_ID_KEY, userId);
  } else {
    kv.remove(USER_ID_KEY);
  }
}

/**
 * Get the current user ID.
 * Returns null if no user is signed in.
 */
export function getCurrentUserId(): string | null {
  if (currentUserId) {
    return currentUserId;
  }
  // Try to restore from storage (app restart)
  const stored = kv.getString(USER_ID_KEY);
  if (stored) {
    currentUserId = stored;
    return stored;
  }
  return null;
}

/**
 * Get a user-scoped storage key.
 * Returns the scoped key like 'user.profile.abc123' if user is set,
 * or null if no user is signed in.
 */
export function getScopedKey(baseKey: string): string | null {
  const userId = getCurrentUserId();
  if (!userId) {
    return null;
  }
  return `${baseKey}.${userId}`;
}

/**
 * Check if a user is currently set.
 */
export function hasCurrentUser(): boolean {
  return getCurrentUserId() !== null;
}
