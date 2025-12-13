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
import type {TileState} from '../../../logic/evaluateGuess';

// Mock useWindowDimensions
jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({
  default: jest.fn(),
}));

const mockUseWindowDimensions = useWindowDimensions as jest.MockedFunction<
  typeof useWindowDimensions
>;

describe('Board Integration Tests', () => {
  const defaultTileColors = {
    correct: palette.correct,
    present: palette.present,
    absent: palette.absent,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseWindowDimensions.mockReturnValue({
      width: 375,
      height: 812,
      scale: 2,
      fontScale: 1,
    });
  });

  describe('Complete game simulation', () => {
    it('should display a complete game with multiple guesses', () => {
      const rows = ['STARE', 'CRANE', 'BRAKE', 'SNAKE'];
      const feedback: TileState[][] = [
        ['absent', 'absent', 'present', 'absent', 'present'],
        ['absent', 'absent', 'present', 'absent', 'present'],
        ['absent', 'absent', 'present', 'present', 'present'],
        ['correct', 'correct', 'correct', 'correct', 'correct'],
      ];

      const {getAllByRole} = render(
        <Board
          length={5}
          rows={rows}
          feedback={feedback}
          current=""
          maxRows={6}
          tileColors={defaultTileColors}
          hintedCell={null}
          hintedLetter={null}
        />
      );

      const tiles = getAllByRole('text');

      // Verify word content
      expect(tiles[0].props.children).toBe('S'); // STARE
      expect(tiles[5].props.children).toBe('C'); // CRANE
      expect(tiles[10].props.children).toBe('B'); // BRAKE
      expect(tiles[15].props.children).toBe('S'); // SNAKE

      // Verify final winning row
      expect(tiles[15].props.accessibilityLabel).toContain('correct');
      expect(tiles[16].props.accessibilityLabel).toContain('correct');
      expect(tiles[17].props.accessibilityLabel).toContain('correct');
      expect(tiles[18].props.accessibilityLabel).toContain('correct');
      expect(tiles[19].props.accessibilityLabel).toContain('correct');
    });

    it('should handle game in progress with current input', () => {
      const rows = ['STARE', 'CRANE'];
      const feedback: TileState[][] = [
        ['absent', 'absent', 'present', 'absent', 'present'],
        ['absent', 'absent', 'present', 'absent', 'present'],
      ];
      const current = 'BRA';

      const {getAllByRole} = render(
        <Board
          length={5}
          rows={rows}
          feedback={feedback}
          current={current}
          maxRows={6}
          tileColors={defaultTileColors}
          hintedCell={null}
          hintedLetter={null}
        />
      );

      const tiles = getAllByRole('text');

      // Verify submitted rows
      expect(tiles[0].props.children).toBe('S');
      expect(tiles[5].props.children).toBe('C');

      // Verify current input row (row 3, index 10-14)
      expect(tiles[10].props.children).toBe('B');
      expect(tiles[11].props.children).toBe('R');
      expect(tiles[12].props.children).toBe('A');
      expect(tiles[13].props.children).toBe('');
      expect(tiles[14].props.children).toBe('');

      // Verify remaining empty rows
      for (let i = 15; i < 30; i++) {
        expect(tiles[i].props.children).toBe('');
      }
    });
  });

  describe('Hint feature integration', () => {
    it('should display hint in active row correctly', () => {
      const rows = ['STARE'];
      const feedback: TileState[][] = [
        ['absent', 'absent', 'present', 'absent', 'present'],
      ];
      const current = 'CR';
      const hintedCell = {row: 1, col: 2};
      const hintedLetter = 'A';

      const {getAllByRole} = render(
        <Board
          length={5}
          rows={rows}
          feedback={feedback}
          current={current}
          maxRows={6}
          tileColors={defaultTileColors}
          hintedCell={hintedCell}
          hintedLetter={hintedLetter}
        />
      );

      const tiles = getAllByRole('text');

      // Current row (row 1, index 5-9)
      expect(tiles[5].props.children).toBe('C'); // User input
      expect(tiles[6].props.children).toBe('R'); // User input
      expect(tiles[7].props.children).toBe('A'); // Hinted letter
      expect(tiles[7].props.accessibilityLabel).toContain('hinted');
      expect(tiles[8].props.children).toBe('');
      expect(tiles[9].props.children).toBe('');
    });

    it('should preserve user input when hint is in different position', () => {
      const current = 'ABCD';
      const hintedCell = {row: 0, col: 4}; // Last position
      const hintedLetter = 'E';

      const {getAllByRole} = render(
        <Board
          length={5}
          rows={[]}
          feedback={[]}
          current={current}
          maxRows={6}
          tileColors={defaultTileColors}
          hintedCell={hintedCell}
          hintedLetter={hintedLetter}
        />
      );

      const tiles = getAllByRole('text');

      // User input preserved
      expect(tiles[0].props.children).toBe('A');
      expect(tiles[1].props.children).toBe('B');
      expect(tiles[2].props.children).toBe('C');
      expect(tiles[3].props.children).toBe('D');
      // Hint displayed in position 4
      expect(tiles[4].props.children).toBe('E');
      expect(tiles[4].props.accessibilityLabel).toContain('hinted');
    });

    it('should show hint in submitted row', () => {
      const rows = ['STARE'];
      const feedback: TileState[][] = [
        ['absent', 'absent', 'present', 'absent', 'present'],
      ];
      const hintedCell = {row: 0, col: 2}; // Third letter of submitted row
      const hintedLetter = 'A';

      const {getAllByRole} = render(
        <Board
          length={5}
          rows={rows}
          feedback={feedback}
          current=""
          maxRows={6}
          tileColors={defaultTileColors}
          hintedCell={hintedCell}
          hintedLetter={hintedLetter}
        />
      );

      const tiles = getAllByRole('text');

      // Hinted tile in submitted row
      expect(tiles[2].props.children).toBe('A');
      expect(tiles[2].props.accessibilityLabel).toContain('hinted');
    });
  });

  describe('Different game configurations', () => {
    it('should handle 4-letter word game', () => {
      const rows = ['TEST', 'BEST'];
      const feedback: TileState[][] = [
        ['absent', 'correct', 'correct', 'correct'],
        ['correct', 'correct', 'correct', 'correct'],
      ];

      const {getAllByRole} = render(
        <Board
          length={4}
          rows={rows}
          feedback={feedback}
          current=""
          maxRows={6}
          tileColors={defaultTileColors}
          hintedCell={null}
          hintedLetter={null}
        />
      );

      const tiles = getAllByRole('text');
      expect(tiles).toHaveLength(24); // 6 rows * 4 letters

      // Verify first row
      expect(tiles[0].props.children).toBe('T');
      expect(tiles[1].props.children).toBe('E');
      expect(tiles[2].props.children).toBe('S');
      expect(tiles[3].props.children).toBe('T');
    });

    it('should handle 6-letter word game', () => {
      const rows = ['STARED', 'CRANED'];
      const feedback: TileState[][] = [
        ['absent', 'absent', 'present', 'absent', 'present', 'absent'],
        ['absent', 'absent', 'present', 'absent', 'present', 'absent'],
      ];

      const {getAllByRole} = render(
        <Board
          length={6}
          rows={rows}
          feedback={feedback}
          current=""
          maxRows={6}
          tileColors={defaultTileColors}
          hintedCell={null}
          hintedLetter={null}
        />
      );

      const tiles = getAllByRole('text');
      expect(tiles).toHaveLength(36); // 6 rows * 6 letters

      expect(tiles[0].props.children).toBe('S');
      expect(tiles[5].props.children).toBe('D');
    });

    it('should handle game with 5 max rows instead of 6', () => {
      const rows = ['STARE', 'CRANE', 'BRAKE'];
      const feedback: TileState[][] = [
        ['absent', 'absent', 'present', 'absent', 'present'],
        ['absent', 'absent', 'present', 'absent', 'present'],
        ['absent', 'absent', 'present', 'present', 'present'],
      ];

      const {getAllByRole} = render(
        <Board
          length={5}
          rows={rows}
          feedback={feedback}
          current=""
          maxRows={5}
          tileColors={defaultTileColors}
          hintedCell={null}
          hintedLetter={null}
        />
      );

      const tiles = getAllByRole('text');
      expect(tiles).toHaveLength(25); // 5 rows * 5 letters
    });
  });

  describe('Mixed tile states in realistic scenarios', () => {
    it('should handle row with mix of correct, present, and absent tiles', () => {
      const rows = ['CRANE'];
      const feedback: TileState[][] = [
        ['correct', 'absent', 'present', 'absent', 'correct'],
      ];

      const {getAllByRole} = render(
        <Board
          length={5}
          rows={rows}
          feedback={feedback}
          current=""
          maxRows={6}
          tileColors={defaultTileColors}
          hintedCell={null}
          hintedLetter={null}
        />
      );

      const tiles = getAllByRole('text');

      expect(tiles[0].props.accessibilityLabel).toContain('correct');
      expect(tiles[1].props.accessibilityLabel).toContain('absent');
      expect(tiles[2].props.accessibilityLabel).toContain('present');
      expect(tiles[3].props.accessibilityLabel).toContain('absent');
      expect(tiles[4].props.accessibilityLabel).toContain('correct');
    });

    it('should handle progressive game state with improving guesses', () => {
      const rows = ['STARE', 'SLATE', 'SNAKE'];
      const feedback: TileState[][] = [
        ['correct', 'absent', 'present', 'absent', 'absent'],
        ['correct', 'absent', 'present', 'absent', 'absent'],
        ['correct', 'correct', 'correct', 'correct', 'correct'],
      ];

      const {getAllByRole} = render(
        <Board
          length={5}
          rows={rows}
          feedback={feedback}
          current=""
          maxRows={6}
          tileColors={defaultTileColors}
          hintedCell={null}
          hintedLetter={null}
        />
      );

      const tiles = getAllByRole('text');

      // First guess: one correct
      expect(tiles[0].props.accessibilityLabel).toContain('correct');

      // Second guess: still one correct
      expect(tiles[5].props.accessibilityLabel).toContain('correct');

      // Third guess: all correct (winning guess)
      expect(tiles[10].props.accessibilityLabel).toContain('correct');
      expect(tiles[11].props.accessibilityLabel).toContain('correct');
      expect(tiles[12].props.accessibilityLabel).toContain('correct');
      expect(tiles[13].props.accessibilityLabel).toContain('correct');
      expect(tiles[14].props.accessibilityLabel).toContain('correct');
    });
  });

  describe('High contrast mode', () => {
    it('should use high contrast colors when provided', () => {
      const highContrastColors = {
        correct: palette.correctHighContrast,
        present: palette.presentHighContrast,
        absent: palette.absent,
      };

      const rows = ['CRANE'];
      const feedback: TileState[][] = [
        ['correct', 'absent', 'present', 'absent', 'correct'],
      ];

      const {getAllByRole} = render(
        <Board
          length={5}
          rows={rows}
          feedback={feedback}
          current=""
          maxRows={6}
          tileColors={highContrastColors}
          hintedCell={null}
          hintedLetter={null}
        />
      );

      const tiles = getAllByRole('text');

      // Tiles should render with high contrast colors
      expect(tiles[0].props.accessibilityLabel).toContain('correct');
      expect(tiles[2].props.accessibilityLabel).toContain('present');
    });
  });

  describe('Full board scenarios', () => {
    it('should handle losing game with all rows filled', () => {
      const rows = ['STARE', 'CRANE', 'BRAKE', 'FLAKE', 'STAKE', 'SHADE'];
      const feedback: TileState[][] = [
        ['correct', 'absent', 'present', 'absent', 'absent'],
        ['absent', 'absent', 'present', 'absent', 'absent'],
        ['absent', 'absent', 'present', 'present', 'absent'],
        ['absent', 'absent', 'present', 'present', 'absent'],
        ['correct', 'absent', 'present', 'present', 'absent'],
        ['correct', 'absent', 'present', 'absent', 'absent'],
      ];

      const {getAllByRole} = render(
        <Board
          length={5}
          rows={rows}
          feedback={feedback}
          current=""
          maxRows={6}
          tileColors={defaultTileColors}
          hintedCell={null}
          hintedLetter={null}
        />
      );

      const tiles = getAllByRole('text');
      expect(tiles).toHaveLength(30); // All 6 rows filled

      // Verify all rows have content
      expect(tiles[0].props.children).toBe('S');
      expect(tiles[5].props.children).toBe('C');
      expect(tiles[10].props.children).toBe('B');
      expect(tiles[15].props.children).toBe('F');
      expect(tiles[20].props.children).toBe('S');
      expect(tiles[25].props.children).toBe('S');
    });

    it('should handle winning on last guess', () => {
      const rows = ['STARE', 'CRANE', 'BRAKE', 'FLAKE', 'STAKE', 'SNAKE'];
      const feedback: TileState[][] = [
        ['correct', 'absent', 'present', 'absent', 'absent'],
        ['absent', 'absent', 'present', 'absent', 'absent'],
        ['absent', 'absent', 'present', 'present', 'absent'],
        ['absent', 'absent', 'present', 'present', 'absent'],
        ['correct', 'absent', 'present', 'present', 'absent'],
        ['correct', 'correct', 'correct', 'correct', 'correct'],
      ];

      const {getAllByRole} = render(
        <Board
          length={5}
          rows={rows}
          feedback={feedback}
          current=""
          maxRows={6}
          tileColors={defaultTileColors}
          hintedCell={null}
          hintedLetter={null}
        />
      );

      const tiles = getAllByRole('text');

      // Last row should be all correct
      expect(tiles[25].props.accessibilityLabel).toContain('correct');
      expect(tiles[26].props.accessibilityLabel).toContain('correct');
      expect(tiles[27].props.accessibilityLabel).toContain('correct');
      expect(tiles[28].props.accessibilityLabel).toContain('correct');
      expect(tiles[29].props.accessibilityLabel).toContain('correct');
    });
  });
});
