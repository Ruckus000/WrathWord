/**
 * Haptics Utility - Using React Native's built-in Vibration API
 *
 * Uses the Vibration API for tactile feedback, which works with Legacy Architecture
 * without requiring additional dependencies. Respects the user's hapticsEnabled preference.
 *
 * Limitation: iOS Vibration API doesn't support different impact styles,
 * so all haptic feedback feels the same on iOS. Android supports duration-based vibration.
 */

import {Platform, Vibration} from 'react-native';
import {getProfile} from '../storage/profile';

// Duration in ms for different impact styles (Android only)
const IMPACT_DURATIONS: Record<'Light' | 'Medium' | 'Heavy', number> = {
  Light: 10,
  Medium: 20,
  Heavy: 40,
};

// Vibration patterns for notifications (Android only - [delay, vibrate, delay, vibrate, ...])
const NOTIFICATION_PATTERNS: Record<'Success' | 'Warning' | 'Error', number[]> = {
  Success: [0, 30],
  Warning: [0, 20, 100, 20],
  Error: [0, 50, 100, 50],
};

export const triggerImpact = (style: 'Light' | 'Medium' | 'Heavy' = 'Medium') => {
  const profile = getProfile();
  if (!profile.preferences.hapticsEnabled) return;

  if (Platform.OS === 'ios') {
    // iOS: Simple vibration (duration is ignored)
    Vibration.vibrate();
  } else {
    // Android: Duration-based vibration
    Vibration.vibrate(IMPACT_DURATIONS[style]);
  }
};

export const triggerNotification = (type: 'Success' | 'Warning' | 'Error') => {
  const profile = getProfile();
  if (!profile.preferences.hapticsEnabled) return;

  if (Platform.OS === 'ios') {
    Vibration.vibrate();
  } else {
    Vibration.vibrate(NOTIFICATION_PATTERNS[type]);
  }
};
