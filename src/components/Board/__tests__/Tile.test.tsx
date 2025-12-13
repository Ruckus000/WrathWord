// Mock modules before imports
jest.mock('../../../storage/mmkv', () => ({
  kv: {
    getString: jest.fn(),
    set: jest.fn(),
  },
  getJSON: jest.fn(),
  setJSON: jest.fn(),
}));

jest.mock('../../../storage/userScope', () => ({
  getScopedKey: jest.fn(),
  getCurrentUserId: jest.fn(),
}));

import React from 'react';
import {render} from '@testing-library/react-native';
import {Animated} from 'react-native';
import {Tile} from '../Tile';
import {palette} from '../../../theme/colors';
import type {TileProps} from '../types';

// Mock Animated to avoid timing issues in tests
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  RN.Animated.timing = () => ({
    start: (callback?: (result: {finished: boolean}) => void) =>
      callback?.({finished: true}),
  });
  return RN;
});

describe('Tile', () => {
  const defaultTileColors = {
    correct: palette.correct,
    present: palette.present,
    absent: palette.absent,
  };

  const defaultSize = {width: 62, height: 69};

  const createTileProps = (overrides?: Partial<TileProps>): TileProps => ({
    ch: 'A',
    state: 'empty',
    isActive: false,
    isHinted: false,
    size: defaultSize,
    tileColors: defaultTileColors,
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('when rendering different states', () => {
    it('should render empty tile with no character', () => {
      const {getByRole} = render(<Tile {...createTileProps({ch: '', state: 'empty'})} />);

      const tile = getByRole('text');
      expect(tile).toBeTruthy();
      expect(tile.props.accessibilityLabel).toBe('blank ');
    });

    it('should render tile with character in uppercase', () => {
      const {getByText} = render(<Tile {...createTileProps({ch: 'B'})} />);

      expect(getByText('B')).toBeTruthy();
    });

    it('should render correct state with green background', () => {
      const {getByRole} = render(
        <Tile {...createTileProps({ch: 'C', state: 'correct'})} />
      );

      const tile = getByRole('text');
      expect(tile.props.accessibilityLabel).toContain('correct');
    });

    it('should render present state with yellow background', () => {
      const {getByRole} = render(
        <Tile {...createTileProps({ch: 'D', state: 'present'})} />
      );

      const tile = getByRole('text');
      expect(tile.props.accessibilityLabel).toContain('present');
    });

    it('should render absent state with gray background', () => {
      const {getByRole} = render(
        <Tile {...createTileProps({ch: 'E', state: 'absent'})} />
      );

      const tile = getByRole('text');
      expect(tile.props.accessibilityLabel).toContain('absent');
    });

    it('should render hinted tile with purple background', () => {
      const {getByRole} = render(
        <Tile {...createTileProps({ch: 'F', state: 'empty', isHinted: true})} />
      );

      const tile = getByRole('text');
      expect(tile.props.accessibilityLabel).toContain('hinted');
    });
  });

  describe('when handling special characters', () => {
    it('should render space as empty', () => {
      const {getByRole} = render(<Tile {...createTileProps({ch: ' '})} />);

      const tile = getByRole('text');
      expect(tile.props.children).toBe('');
    });

    it('should handle empty string', () => {
      const {getByRole} = render(<Tile {...createTileProps({ch: ''})} />);

      const tile = getByRole('text');
      expect(tile.props.children).toBe('');
    });
  });

  describe('when handling active state', () => {
    it('should apply active styling when isActive is true', () => {
      const {getByRole} = render(
        <Tile {...createTileProps({ch: 'G', isActive: true})} />
      );

      const tile = getByRole('text');
      expect(tile).toBeTruthy();
    });

    it('should not apply active styling when isActive is false', () => {
      const {getByRole} = render(
        <Tile {...createTileProps({ch: 'H', isActive: false})} />
      );

      const tile = getByRole('text');
      expect(tile).toBeTruthy();
    });
  });

  describe('when handling size prop', () => {
    it('should calculate fontSize based on tile width', () => {
      const customSize = {width: 50, height: 56};
      const expectedFontSize = Math.floor(50 * 0.54); // 27

      const {getByRole} = render(
        <Tile {...createTileProps({ch: 'I', size: customSize})} />
      );

      const tile = getByRole('text');
      expect(tile.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({fontSize: expectedFontSize})
        ])
      );
    });

    it('should use default fontSize when size is undefined', () => {
      const {getByRole} = render(
        <Tile {...createTileProps({ch: 'J', size: undefined})} />
      );

      const tile = getByRole('text');
      expect(tile.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({fontSize: 28})
        ])
      );
    });

    it('should handle very small tile sizes', () => {
      const tinySize = {width: 20, height: 22};
      const expectedFontSize = Math.floor(20 * 0.54); // 10

      const {getByRole} = render(
        <Tile {...createTileProps({ch: 'K', size: tinySize})} />
      );

      const tile = getByRole('text');
      expect(tile.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({fontSize: expectedFontSize})
        ])
      );
    });

    it('should handle very large tile sizes', () => {
      const largeSize = {width: 100, height: 112};
      const expectedFontSize = Math.floor(100 * 0.54); // 54

      const {getByRole} = render(
        <Tile {...createTileProps({ch: 'L', size: largeSize})} />
      );

      const tile = getByRole('text');
      expect(tile.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({fontSize: expectedFontSize})
        ])
      );
    });
  });

  describe('when using custom tile colors', () => {
    it('should apply custom correct color', () => {
      const customColors = {
        correct: palette.correctHighContrast,
        present: palette.present,
        absent: palette.absent,
      };

      const {getByRole} = render(
        <Tile {...createTileProps({ch: 'M', state: 'correct', tileColors: customColors})} />
      );

      const tile = getByRole('text');
      expect(tile.props.accessibilityLabel).toContain('correct');
    });

    it('should apply custom present color', () => {
      const customColors = {
        correct: palette.correct,
        present: palette.presentHighContrast,
        absent: palette.absent,
      };

      const {getByRole} = render(
        <Tile {...createTileProps({ch: 'N', state: 'present', tileColors: customColors})} />
      );

      const tile = getByRole('text');
      expect(tile.props.accessibilityLabel).toContain('present');
    });
  });

  describe('when handling accessibility', () => {
    it('should provide correct accessibility label for empty tile', () => {
      const {getByRole} = render(<Tile {...createTileProps({ch: '', state: 'empty'})} />);

      const tile = getByRole('text');
      expect(tile.props.accessibilityLabel).toBe('blank ');
    });

    it('should provide correct accessibility label for filled tile', () => {
      const {getByRole} = render(<Tile {...createTileProps({ch: 'O'})} />);

      const tile = getByRole('text');
      expect(tile.props.accessibilityLabel).toBe('O ');
    });

    it('should include state in accessibility label', () => {
      const {getByRole} = render(
        <Tile {...createTileProps({ch: 'P', state: 'correct'})} />
      );

      const tile = getByRole('text');
      expect(tile.props.accessibilityLabel).toBe('P correct');
    });

    it('should prioritize hinted status in accessibility label', () => {
      const {getByRole} = render(
        <Tile {...createTileProps({ch: 'Q', state: 'empty', isHinted: true})} />
      );

      const tile = getByRole('text');
      expect(tile.props.accessibilityLabel).toBe('Q hinted');
    });

    it('should have text accessibility role', () => {
      const {getByRole} = render(<Tile {...createTileProps()} />);

      expect(getByRole('text')).toBeTruthy();
    });
  });

  describe('when hinted state overrides other states', () => {
    it('should show hinted style even when state is correct', () => {
      const {getByRole} = render(
        <Tile {...createTileProps({ch: 'R', state: 'correct', isHinted: true})} />
      );

      const tile = getByRole('text');
      expect(tile.props.accessibilityLabel).toContain('hinted');
    });

    it('should show hinted style even when state is present', () => {
      const {getByRole} = render(
        <Tile {...createTileProps({ch: 'S', state: 'present', isHinted: true})} />
      );

      const tile = getByRole('text');
      expect(tile.props.accessibilityLabel).toContain('hinted');
    });

    it('should show hinted style even when state is absent', () => {
      const {getByRole} = render(
        <Tile {...createTileProps({ch: 'T', state: 'absent', isHinted: true})} />
      );

      const tile = getByRole('text');
      expect(tile.props.accessibilityLabel).toContain('hinted');
    });
  });

  describe('when handling animation', () => {
    it('should trigger flip animation when state changes from empty to correct', () => {
      const animatedTimingSpy = jest.spyOn(Animated, 'timing');
      const animatedSequenceSpy = jest.spyOn(Animated, 'sequence');

      const {rerender} = render(
        <Tile {...createTileProps({ch: 'U', state: 'empty'})} />
      );

      // Change state to trigger animation
      rerender(<Tile {...createTileProps({ch: 'U', state: 'correct'})} />);

      expect(animatedSequenceSpy).toHaveBeenCalled();
      expect(animatedTimingSpy).toHaveBeenCalledTimes(2); // Two timing animations in sequence
    });

    it('should not trigger animation for empty state', () => {
      const animatedSequenceSpy = jest.spyOn(Animated, 'sequence');

      render(<Tile {...createTileProps({ch: 'V', state: 'empty'})} />);

      expect(animatedSequenceSpy).not.toHaveBeenCalled();
    });

    it('should trigger animation when state changes from empty to present', () => {
      const animatedSequenceSpy = jest.spyOn(Animated, 'sequence');

      const {rerender} = render(
        <Tile {...createTileProps({ch: 'W', state: 'empty'})} />
      );

      rerender(<Tile {...createTileProps({ch: 'W', state: 'present'})} />);

      expect(animatedSequenceSpy).toHaveBeenCalled();
    });

    it('should trigger animation when state changes from empty to absent', () => {
      const animatedSequenceSpy = jest.spyOn(Animated, 'sequence');

      const {rerender} = render(
        <Tile {...createTileProps({ch: 'X', state: 'empty'})} />
      );

      rerender(<Tile {...createTileProps({ch: 'X', state: 'absent'})} />);

      expect(animatedSequenceSpy).toHaveBeenCalled();
    });
  });

  describe('when displaying component name', () => {
    it('should have displayName set to Tile', () => {
      expect(Tile.displayName).toBe('Tile');
    });
  });
});
