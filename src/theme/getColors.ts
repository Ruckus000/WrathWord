import {palette} from './colors';
import {getProfile} from '../storage/profile';

/**
 * Returns tile colors based on the user's high contrast preference.
 * Call this inside a component to get the current colors.
 */
export function getTileColors() {
  const {highContrastEnabled} = getProfile().preferences;

  return {
    correct: highContrastEnabled ? palette.correctHighContrast : palette.correct,
    present: highContrastEnabled ? palette.presentHighContrast : palette.present,
    absent: palette.absent,
  };
}
