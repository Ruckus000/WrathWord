// src/components/Keyboard/styles.ts
import {StyleSheet} from 'react-native';
import {palette} from '../../theme/colors';

export const styles = StyleSheet.create({
  kb: {
    gap: 8,
    marginBottom: 12,
    paddingHorizontal: 2,
  },
  kbRow: {
    flexDirection: 'row',
    gap: 4,
    justifyContent: 'center',
  },
  key: {
    minWidth: 31,
    height: 52,
    borderRadius: 6,
    backgroundColor: palette.keyBase,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  keyPressed: {
    backgroundColor: palette.keyPressed,
    transform: [{scale: 0.94}],
  },
  keyAction: {
    backgroundColor: palette.keyAction,
  },
  keyText: {
    color: palette.textPrimary,
    fontSize: 15,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  keyTextAction: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  keyDisabled: {
    backgroundColor: palette.keyDisabled,
  },
  keyTextDisabled: {
    color: palette.keyAction,
  },
});
