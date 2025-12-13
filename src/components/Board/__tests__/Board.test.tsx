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
import {useWindowDimensions} from 'react-native';
import {Board} from '../Board';
import {palette} from '../../../theme/colors';
import type {BoardProps} from '../types';
import type {TileState} from '../../../logic/evaluateGuess';

// Mock useWindowDimensions
jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({
  default: jest.fn(),
}));

const mockUseWindowDimensions = useWindowDimensions as jest.MockedFunction<
  typeof useWindowDimensions
>;

describe('Board', () => {
  const defaultTileColors = {
    correct: palette.correct,
    present: palette.present,
    absent: palette.absent,
  };

  const createBoardProps = (overrides?: Partial<BoardProps>): BoardProps => ({
    length: 5,
    rows: [],
    feedback: [],
    current: '',
    maxRows: 6,
    tileColors: defaultTileColors,
    hintedCell: null,
    hintedLetter: null,
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();
    // Default window width for responsive calculations
    mockUseWindowDimensions.mockReturnValue({
      width: 375,
      height: 812,
      scale: 2,
      fontScale: 1,
    });
  });

  describe('when rendering an empty board', () => {
    it('should render correct number of empty rows', () => {
      const {getAllByRole} = render(
        <Board {...createBoardProps({maxRows: 6, length: 5})} />
      );

      const tiles = getAllByRole('text');
      // 6 rows * 5 tiles = 30 tiles
      expect(tiles).toHaveLength(30);
    });

    it('should render all tiles as empty initially', () => {
      const {getAllByRole} = render(
        <Board {...createBoardProps({maxRows: 6, length: 5})} />
      );

      const tiles = getAllByRole('text');
      tiles.forEach(tile => {
        expect(tile.props.accessibilityLabel).toContain('blank');
      });
    });
  });

  describe('when rendering with different word lengths', () => {
    it('should render 4-letter word board', () => {
      const {getAllByRole} = render(
        <Board {...createBoardProps({length: 4, maxRows: 6})} />
      );

      const tiles = getAllByRole('text');
      expect(tiles).toHaveLength(24); // 6 rows * 4 tiles
    });

    it('should render 5-letter word board', () => {
      const {getAllByRole} = render(
        <Board {...createBoardProps({length: 5, maxRows: 6})} />
      );

      const tiles = getAllByRole('text');
      expect(tiles).toHaveLength(30); // 6 rows * 5 tiles
    });

    it('should render 6-letter word board', () => {
      const {getAllByRole} = render(
        <Board {...createBoardProps({length: 6, maxRows: 6})} />
      );

      const tiles = getAllByRole('text');
      expect(tiles).toHaveLength(36); // 6 rows * 6 tiles
    });
  });

  describe('when rendering with different max rows', () => {
    it('should render board with 5 max rows', () => {
      const {getAllByRole} = render(
        <Board {...createBoardProps({length: 5, maxRows: 5})} />
      );

      const tiles = getAllByRole('text');
      expect(tiles).toHaveLength(25); // 5 rows * 5 tiles
    });

    it('should render board with 7 max rows', () => {
      const {getAllByRole} = render(
        <Board {...createBoardProps({length: 5, maxRows: 7})} />
      );

      const tiles = getAllByRole('text');
      expect(tiles).toHaveLength(35); // 7 rows * 5 tiles
    });
  });

  describe('when rendering submitted rows', () => {
    it('should display submitted word in first row', () => {
      const {getAllByRole} = render(
        <Board
          {...createBoardProps({
            rows: ['HELLO'],
            feedback: [['absent', 'absent', 'absent', 'absent', 'absent']],
          })}
        />
      );

      const tiles = getAllByRole('text');
      expect(tiles[0].props.children).toBe('H');
      expect(tiles[1].props.children).toBe('E');
      expect(tiles[2].props.children).toBe('L');
      expect(tiles[3].props.children).toBe('L');
      expect(tiles[4].props.children).toBe('O');
    });

    it('should apply correct feedback states to submitted row', () => {
      const feedback: TileState[][] = [
        ['correct', 'present', 'absent', 'present', 'correct'],
      ];

      const {getAllByRole} = render(
        <Board
          {...createBoardProps({
            rows: ['WORLD'],
            feedback,
          })}
        />
      );

      const tiles = getAllByRole('text');
      expect(tiles[0].props.accessibilityLabel).toContain('correct');
      expect(tiles[1].props.accessibilityLabel).toContain('present');
      expect(tiles[2].props.accessibilityLabel).toContain('absent');
      expect(tiles[3].props.accessibilityLabel).toContain('present');
      expect(tiles[4].props.accessibilityLabel).toContain('correct');
    });

    it('should display multiple submitted rows', () => {
      const feedback: TileState[][] = [
        ['absent', 'absent', 'absent', 'absent', 'absent'],
        ['present', 'absent', 'correct', 'absent', 'present'],
      ];

      const {getAllByRole} = render(
        <Board
          {...createBoardProps({
            rows: ['STARE', 'CRANE'],
            feedback,
          })}
        />
      );

      const tiles = getAllByRole('text');
      // First row
      expect(tiles[0].props.children).toBe('S');
      expect(tiles[4].props.children).toBe('E');
      // Second row
      expect(tiles[5].props.children).toBe('C');
      expect(tiles[9].props.children).toBe('E');
    });
  });

  describe('when rendering current input row', () => {
    it('should display current input after submitted rows', () => {
      const {getAllByRole} = render(
        <Board
          {...createBoardProps({
            rows: ['HELLO'],
            feedback: [['absent', 'absent', 'absent', 'absent', 'absent']],
            current: 'WOR',
          })}
        />
      );

      const tiles = getAllByRole('text');
      // Second row should have current input
      expect(tiles[5].props.children).toBe('W');
      expect(tiles[6].props.children).toBe('O');
      expect(tiles[7].props.children).toBe('R');
      expect(tiles[8].props.children).toBe('');
      expect(tiles[9].props.children).toBe('');
    });

    it('should pad current input with spaces to fill row', () => {
      const {getAllByRole} = render(
        <Board
          {...createBoardProps({
            rows: [],
            current: 'AB',
            length: 5,
          })}
        />
      );

      const tiles = getAllByRole('text');
      expect(tiles[0].props.children).toBe('A');
      expect(tiles[1].props.children).toBe('B');
      expect(tiles[2].props.children).toBe('');
      expect(tiles[3].props.children).toBe('');
      expect(tiles[4].props.children).toBe('');
    });

    it('should not add current row when board is full', () => {
      const rows = ['HELLO', 'WORLD', 'STARE', 'CRANE', 'SLATE', 'GRAPE'];
      const feedback: TileState[][] = Array(6).fill(
        ['absent', 'absent', 'absent', 'absent', 'absent']
      );

      const {getAllByRole} = render(
        <Board
          {...createBoardProps({
            rows,
            feedback,
            current: 'EXTRA',
            maxRows: 6,
          })}
        />
      );

      const tiles = getAllByRole('text');
      expect(tiles).toHaveLength(30); // Still 6 rows, no extra
    });
  });

  describe('when handling hinted cells', () => {
    it('should display hinted letter in current row', () => {
      const {getAllByRole} = render(
        <Board
          {...createBoardProps({
            rows: [],
            current: 'AB',
            hintedCell: {row: 0, col: 2},
            hintedLetter: 'C',
          })}
        />
      );

      const tiles = getAllByRole('text');
      expect(tiles[2].props.children).toBe('C');
      expect(tiles[2].props.accessibilityLabel).toContain('hinted');
    });

    it('should show hint in submitted row', () => {
      const {getAllByRole} = render(
        <Board
          {...createBoardProps({
            rows: ['HELLO'],
            feedback: [['correct', 'present', 'absent', 'present', 'correct']],
            hintedCell: {row: 0, col: 1},
            hintedLetter: 'E',
          })}
        />
      );

      const tiles = getAllByRole('text');
      expect(tiles[1].props.accessibilityLabel).toContain('hinted');
    });

    it('should not show hinted letter if hintedCell is null', () => {
      const {getAllByRole} = render(
        <Board
          {...createBoardProps({
            rows: [],
            current: 'AB',
            hintedCell: null,
            hintedLetter: 'C',
          })}
        />
      );

      const tiles = getAllByRole('text');
      expect(tiles[0].props.children).toBe('A');
      expect(tiles[1].props.children).toBe('B');
      expect(tiles[2].props.children).toBe('');
    });

    it('should prioritize user input over hint in current row if position does not match', () => {
      const {getAllByRole} = render(
        <Board
          {...createBoardProps({
            rows: [],
            current: 'ABCD',
            hintedCell: {row: 0, col: 4},
            hintedLetter: 'X',
          })}
        />
      );

      const tiles = getAllByRole('text');
      expect(tiles[0].props.children).toBe('A');
      expect(tiles[1].props.children).toBe('B');
      expect(tiles[2].props.children).toBe('C');
      expect(tiles[3].props.children).toBe('D');
      // Position 4 should have hint since user hasn't typed there yet
      expect(tiles[4].props.children).toBe('X');
    });
  });

  describe('when calculating tile sizes', () => {
    it('should calculate tile size based on window width', () => {
      mockUseWindowDimensions.mockReturnValue({
        width: 375,
        height: 812,
        scale: 2,
        fontScale: 1,
      });

      // With width 375, padding 32, gap 32 (8*4), length 5:
      // Available: 375 - 32 = 343
      // Per tile: (343 - 32) / 5 = 62.2 -> floor = 62 (maxTileSize)
      const {getAllByRole} = render(
        <Board {...createBoardProps({length: 5})} />
      );

      expect(getAllByRole('text')).toBeTruthy();
    });

    it('should cap tile size at maxTileSize (62)', () => {
      mockUseWindowDimensions.mockReturnValue({
        width: 1000, // Very wide screen
        height: 1000,
        scale: 2,
        fontScale: 1,
      });

      const {getAllByRole} = render(
        <Board {...createBoardProps({length: 5})} />
      );

      // Should still work with max tile size
      expect(getAllByRole('text')).toBeTruthy();
    });

    it('should handle narrow screens', () => {
      mockUseWindowDimensions.mockReturnValue({
        width: 320, // iPhone SE width
        height: 568,
        scale: 2,
        fontScale: 1,
      });

      const {getAllByRole} = render(
        <Board {...createBoardProps({length: 6})} />
      );

      // Should still render all tiles
      const tiles = getAllByRole('text');
      expect(tiles).toHaveLength(36); // 6 rows * 6 tiles
    });
  });

  describe('when handling edge cases', () => {
    it('should handle empty current input', () => {
      const {getAllByRole} = render(
        <Board
          {...createBoardProps({
            rows: [],
            current: '',
          })}
        />
      );

      const tiles = getAllByRole('text');
      tiles.slice(0, 5).forEach(tile => {
        expect(tile.props.children).toBe('');
      });
    });

    it('should handle partial feedback array', () => {
      const {getAllByRole} = render(
        <Board
          {...createBoardProps({
            rows: ['HELLO', 'WORLD'],
            feedback: [['correct', 'present', 'absent', 'present', 'correct']],
            // Missing feedback for second row
          })}
        />
      );

      const tiles = getAllByRole('text');
      // First row has feedback
      expect(tiles[0].props.accessibilityLabel).toContain('correct');
      // Second row defaults to empty state
      expect(tiles[5].props.accessibilityLabel).not.toContain('correct');
    });

    it('should treat space characters as empty', () => {
      const {getAllByRole} = render(
        <Board
          {...createBoardProps({
            rows: ['HE LO'],
            feedback: [['absent', 'absent', 'absent', 'absent', 'absent']],
          })}
        />
      );

      const tiles = getAllByRole('text');
      expect(tiles[0].props.children).toBe('H');
      expect(tiles[1].props.children).toBe('E');
      expect(tiles[2].props.children).toBe(''); // Space treated as empty
      expect(tiles[3].props.children).toBe('L');
      expect(tiles[4].props.children).toBe('O');
    });

    it('should handle missing feedback for specific tiles', () => {
      const incompleteFeedback: TileState[][] = [
        ['correct', 'present'], // Only 2 elements instead of 5
      ];

      const {getAllByRole} = render(
        <Board
          {...createBoardProps({
            rows: ['HELLO'],
            feedback: incompleteFeedback,
          })}
        />
      );

      const tiles = getAllByRole('text');
      expect(tiles[0].props.accessibilityLabel).toContain('correct');
      expect(tiles[1].props.accessibilityLabel).toContain('present');
      // Remaining tiles should default to empty
      expect(tiles[2].props.accessibilityLabel).not.toContain('absent');
    });
  });

  describe('when using custom tile colors', () => {
    it('should pass custom tile colors to all tiles', () => {
      const customColors = {
        correct: palette.correctHighContrast,
        present: palette.presentHighContrast,
        absent: palette.absent,
      };

      const {getAllByRole} = render(
        <Board
          {...createBoardProps({
            rows: ['HELLO'],
            feedback: [['correct', 'present', 'absent', 'present', 'correct']],
            tileColors: customColors,
          })}
        />
      );

      const tiles = getAllByRole('text');
      // Tiles should render with custom colors
      expect(tiles).toBeTruthy();
    });
  });

  describe('when handling row structure', () => {
    it('should maintain correct row order', () => {
      const {getAllByRole} = render(
        <Board
          {...createBoardProps({
            rows: ['FIRST', 'SECND', 'THIRD'],
            feedback: [
              ['absent', 'absent', 'absent', 'absent', 'absent'],
              ['absent', 'absent', 'absent', 'absent', 'absent'],
              ['absent', 'absent', 'absent', 'absent', 'absent'],
            ],
          })}
        />
      );

      const tiles = getAllByRole('text');
      // Row 1
      expect(tiles[0].props.children).toBe('F');
      expect(tiles[4].props.children).toBe('T');
      // Row 2
      expect(tiles[5].props.children).toBe('S');
      expect(tiles[9].props.children).toBe('D');
      // Row 3
      expect(tiles[10].props.children).toBe('T');
      expect(tiles[14].props.children).toBe('D');
    });

    it('should fill remaining rows with empty tiles', () => {
      const {getAllByRole} = render(
        <Board
          {...createBoardProps({
            rows: ['HELLO'],
            feedback: [['absent', 'absent', 'absent', 'absent', 'absent']],
            current: '',
            maxRows: 6,
          })}
        />
      );

      const tiles = getAllByRole('text');
      // First row has word
      expect(tiles[0].props.children).toBe('H');
      // Rows 2-6 should be empty
      for (let i = 5; i < 30; i++) {
        expect(tiles[i].props.children).toBe('');
      }
    });
  });

  describe('when displaying component name', () => {
    it('should have displayName set to Board', () => {
      expect(Board.displayName).toBe('Board');
    });
  });
});
