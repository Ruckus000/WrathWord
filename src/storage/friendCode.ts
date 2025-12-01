import {kv} from './mmkv';
import {getProfile} from './profile';

const FRIEND_CODE_KEY = 'user.friendCode';

/**
 * Generates a unique 8-character friend code in format XXXX-XXXX.
 * Uses only unambiguous characters (excludes I, O, 0, 1).
 */
function generateFriendCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    if (i === 4) code += '-';
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

/**
 * Gets the user's friend code. Generates one on first call and persists it.
 * The friend code is permanent and never changes.
 */
export function getFriendCode(): string {
  const existing = kv.getString(FRIEND_CODE_KEY);
  if (existing) {
    return existing;
  }

  const newCode = generateFriendCode();
  kv.set(FRIEND_CODE_KEY, newCode);
  return newCode;
}

/**
 * Gets the user's display name from profile storage.
 * Defaults to 'Player' if not set.
 */
export function getDisplayName(): string {
  const profile = getProfile();
  // Profile doesn't have a name field yet, so default to 'Player'
  // In the future, this could be added to UserProfile type
  return 'Player';
}

/**
 * Gets the first letter of the user's display name for avatar.
 */
export function getUserLetter(): string {
  const name = getDisplayName();
  return name.charAt(0).toUpperCase();
}
