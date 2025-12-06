import {kv} from './mmkv';

const FRIEND_CODE_KEY = 'user.friendCode';
const DISPLAY_NAME_KEY = 'user.displayName';

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
 * Gets the user's display name from local storage.
 * Defaults to 'Player' if not set.
 */
export function getDisplayName(): string {
  const displayName = kv.getString(DISPLAY_NAME_KEY);
  return displayName || 'Player';
}

/**
 * Sets the user's display name in local storage.
 */
export function setDisplayName(name: string): void {
  kv.set(DISPLAY_NAME_KEY, name);
}

/**
 * Gets the first letter of the user's display name for avatar.
 */
export function getUserLetter(): string {
  const name = getDisplayName();
  return name.charAt(0).toUpperCase();
}
