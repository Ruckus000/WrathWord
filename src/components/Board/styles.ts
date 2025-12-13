// src/components/Board/styles.ts
import {StyleSheet} from 'react-native';
import {palette} from '../../theme/colors';

export const styles = StyleSheet.create({
  board: {
    flex: 1,
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
    alignSelf: 'center',
  },
  tile: {
    borderRadius: 8,
    borderWidth: 2,
    borderColor: palette.tileBorder,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: palette.tileEmpty,
  },
  tileActive: {
    borderColor: palette.tileBorderActive,
    borderWidth: 2,
    transform: [{scale: 1.05}],
  },
  tileText: {
    color: palette.textPrimary,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
});
