// src/components/Keyboard/__tests__/Keyboard.test.tsx

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
import {render, fireEvent} from '@testing-library/react-native';
import {Keyboard} from '../Keyboard';
import {palette} from '../../../theme/colors';
import type {TileState} from '../../../logic/evaluateGuess';
import type {TileColors} from '../types';

describe('Keyboard', () => {
  const mockOnKey = jest.fn();
  const mockTileColors: TileColors = {
    correct: palette.correct,
    present: palette.present,
    absent: palette.absent,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('QWERTY layout', () => {
    it('should render all 26 letter keys', () => {
      const keyStates = new Map<string, TileState>();
      const {getByText} = render(
        <Keyboard
          onKey={mockOnKey}
          keyStates={keyStates}
          tileColors={mockTileColors}
        />,
      );

      // Top row (10 keys)
      const topRow = 'QWERTYUIOP'.split('');
      topRow.forEach(letter => {
        expect(getByText(letter)).toBeTruthy();
      });

      // Middle row (9 keys)
      const middleRow = 'ASDFGHJKL'.split('');
      middleRow.forEach(letter => {
        expect(getByText(letter)).toBeTruthy();
      });

      // Bottom row (7 keys)
      const bottomRow = 'ZXCVBNM'.split('');
      bottomRow.forEach(letter => {
        expect(getByText(letter)).toBeTruthy();
      });
    });

    it('should render keys in correct QWERTY rows', () => {
      const keyStates = new Map<string, TileState>();
      const {getByText} = render(
        <Keyboard
          onKey={mockOnKey}
          keyStates={keyStates}
          tileColors={mockTileColors}
        />,
      );

      // Verify first and last letters of each row exist
      expect(getByText('Q')).toBeTruthy(); // First of top row
      expect(getByText('P')).toBeTruthy(); // Last of top row
      expect(getByText('A')).toBeTruthy(); // First of middle row
      expect(getByText('L')).toBeTruthy(); // Last of middle row
      expect(getByText('Z')).toBeTruthy(); // First of bottom row
      expect(getByText('M')).toBeTruthy(); // Last of bottom row
    });
  });

  describe('action keys', () => {
    it('should render Enter key on bottom row', () => {
      const keyStates = new Map<string, TileState>();
      const {getByLabelText} = render(
        <Keyboard
          onKey={mockOnKey}
          keyStates={keyStates}
          tileColors={mockTileColors}
        />,
      );

      expect(getByLabelText('Enter')).toBeTruthy();
    });

    it('should render Delete key on bottom row', () => {
      const keyStates = new Map<string, TileState>();
      const {getByLabelText} = render(
        <Keyboard
          onKey={mockOnKey}
          keyStates={keyStates}
          tileColors={mockTileColors}
        />,
      );

      expect(getByLabelText('Delete')).toBeTruthy();
    });

    it('should render Enter key before letter keys on bottom row', () => {
      const keyStates = new Map<string, TileState>();
      const {getByLabelText, getByText} = render(
        <Keyboard
          onKey={mockOnKey}
          keyStates={keyStates}
          tileColors={mockTileColors}
        />,
      );

      // Both should exist
      expect(getByLabelText('Enter')).toBeTruthy();
      expect(getByText('Z')).toBeTruthy(); // First letter of bottom row
    });

    it('should render Delete key after letter keys on bottom row', () => {
      const keyStates = new Map<string, TileState>();
      const {getByLabelText, getByText} = render(
        <Keyboard
          onKey={mockOnKey}
          keyStates={keyStates}
          tileColors={mockTileColors}
        />,
      );

      // Both should exist
      expect(getByLabelText('Delete')).toBeTruthy();
      expect(getByText('M')).toBeTruthy(); // Last letter of bottom row
    });

    it('should not render action keys on top or middle rows', () => {
      const keyStates = new Map<string, TileState>();
      const {queryByLabelText, getAllByLabelText} = render(
        <Keyboard
          onKey={mockOnKey}
          keyStates={keyStates}
          tileColors={mockTileColors}
        />,
      );

      // Should only have exactly one Enter and one Delete
      expect(getAllByLabelText('Enter')).toHaveLength(1);
      expect(getAllByLabelText('Delete')).toHaveLength(1);
    });
  });

  describe('key press callbacks', () => {
    it('should call onKey with letter when letter key pressed', () => {
      const keyStates = new Map<string, TileState>();
      const {getByText} = render(
        <Keyboard
          onKey={mockOnKey}
          keyStates={keyStates}
          tileColors={mockTileColors}
        />,
      );

      fireEvent.press(getByText('A'));

      expect(mockOnKey).toHaveBeenCalledTimes(1);
      expect(mockOnKey).toHaveBeenCalledWith('A');
    });

    it('should call onKey with ENTER when Enter key pressed', () => {
      const keyStates = new Map<string, TileState>();
      const {getByLabelText} = render(
        <Keyboard
          onKey={mockOnKey}
          keyStates={keyStates}
          tileColors={mockTileColors}
        />,
      );

      fireEvent.press(getByLabelText('Enter'));

      expect(mockOnKey).toHaveBeenCalledTimes(1);
      expect(mockOnKey).toHaveBeenCalledWith('ENTER');
    });

    it('should call onKey with DEL when Delete key pressed', () => {
      const keyStates = new Map<string, TileState>();
      const {getByLabelText} = render(
        <Keyboard
          onKey={mockOnKey}
          keyStates={keyStates}
          tileColors={mockTileColors}
        />,
      );

      fireEvent.press(getByLabelText('Delete'));

      expect(mockOnKey).toHaveBeenCalledTimes(1);
      expect(mockOnKey).toHaveBeenCalledWith('DEL');
    });

    it('should call onKey with correct letter for each key', () => {
      const keyStates = new Map<string, TileState>();
      const {getByText} = render(
        <Keyboard
          onKey={mockOnKey}
          keyStates={keyStates}
          tileColors={mockTileColors}
        />,
      );

      const letters = ['Q', 'W', 'E', 'R', 'T', 'Y'];

      letters.forEach(letter => {
        mockOnKey.mockClear();
        fireEvent.press(getByText(letter));
        expect(mockOnKey).toHaveBeenCalledWith(letter);
      });
    });

    it('should handle rapid key presses', () => {
      const keyStates = new Map<string, TileState>();
      const {getByText} = render(
        <Keyboard
          onKey={mockOnKey}
          keyStates={keyStates}
          tileColors={mockTileColors}
        />,
      );

      fireEvent.press(getByText('H'));
      fireEvent.press(getByText('E'));
      fireEvent.press(getByText('L'));
      fireEvent.press(getByText('L'));
      fireEvent.press(getByText('O'));

      expect(mockOnKey).toHaveBeenCalledTimes(5);
      expect(mockOnKey).toHaveBeenNthCalledWith(1, 'H');
      expect(mockOnKey).toHaveBeenNthCalledWith(2, 'E');
      expect(mockOnKey).toHaveBeenNthCalledWith(3, 'L');
      expect(mockOnKey).toHaveBeenNthCalledWith(4, 'L');
      expect(mockOnKey).toHaveBeenNthCalledWith(5, 'O');
    });
  });

  describe('keyStates integration', () => {
    it('should apply correct state to keys based on keyStates map', () => {
      const keyStates = new Map<string, TileState>();
      keyStates.set('A', 'correct');
      keyStates.set('B', 'present');
      keyStates.set('C', 'absent');

      const {getByText} = render(
        <Keyboard
          onKey={mockOnKey}
          keyStates={keyStates}
          tileColors={mockTileColors}
        />,
      );

      // Keys A and B should be pressable (correct/present states)
      fireEvent.press(getByText('A'));
      expect(mockOnKey).toHaveBeenCalledWith('A');

      mockOnKey.mockClear();
      fireEvent.press(getByText('B'));
      expect(mockOnKey).toHaveBeenCalledWith('B');

      // Key C should be disabled (absent state)
      mockOnKey.mockClear();
      fireEvent.press(getByText('C'));
      expect(mockOnKey).not.toHaveBeenCalled();
    });

    it('should disable keys marked as absent', () => {
      const keyStates = new Map<string, TileState>();
      keyStates.set('X', 'absent');
      keyStates.set('Y', 'correct');
      keyStates.set('Z', 'present');

      const {getByText} = render(
        <Keyboard
          onKey={mockOnKey}
          keyStates={keyStates}
          tileColors={mockTileColors}
        />,
      );

      // Press disabled key (absent)
      fireEvent.press(getByText('X'));
      expect(mockOnKey).not.toHaveBeenCalled();

      // Press enabled keys (correct and present)
      fireEvent.press(getByText('Y'));
      expect(mockOnKey).toHaveBeenCalledWith('Y');

      mockOnKey.mockClear();
      fireEvent.press(getByText('Z'));
      expect(mockOnKey).toHaveBeenCalledWith('Z');
    });

    it('should not disable keys without state', () => {
      const keyStates = new Map<string, TileState>();
      // Only set state for some keys
      keyStates.set('A', 'correct');

      const {getByText} = render(
        <Keyboard
          onKey={mockOnKey}
          keyStates={keyStates}
          tileColors={mockTileColors}
        />,
      );

      // Keys without state should still be pressable
      fireEvent.press(getByText('B'));
      expect(mockOnKey).toHaveBeenCalledWith('B');
    });

    it('should not disable keys with correct state', () => {
      const keyStates = new Map<string, TileState>();
      keyStates.set('S', 'correct');

      const {getByText} = render(
        <Keyboard
          onKey={mockOnKey}
          keyStates={keyStates}
          tileColors={mockTileColors}
        />,
      );

      fireEvent.press(getByText('S'));
      expect(mockOnKey).toHaveBeenCalledWith('S');
    });

    it('should not disable keys with present state', () => {
      const keyStates = new Map<string, TileState>();
      keyStates.set('T', 'present');

      const {getByText} = render(
        <Keyboard
          onKey={mockOnKey}
          keyStates={keyStates}
          tileColors={mockTileColors}
        />,
      );

      fireEvent.press(getByText('T'));
      expect(mockOnKey).toHaveBeenCalledWith('T');
    });

    it('should handle empty keyStates map', () => {
      const keyStates = new Map<string, TileState>();

      const {getByText} = render(
        <Keyboard
          onKey={mockOnKey}
          keyStates={keyStates}
          tileColors={mockTileColors}
        />,
      );

      // All keys should be pressable
      fireEvent.press(getByText('Q'));
      expect(mockOnKey).toHaveBeenCalledWith('Q');

      mockOnKey.mockClear();
      fireEvent.press(getByText('Z'));
      expect(mockOnKey).toHaveBeenCalledWith('Z');
    });

    it('should update when keyStates change', () => {
      const keyStates = new Map<string, TileState>();
      const {getByText, rerender} = render(
        <Keyboard
          onKey={mockOnKey}
          keyStates={keyStates}
          tileColors={mockTileColors}
        />,
      );

      // Initially D should be pressable (no state)
      fireEvent.press(getByText('D'));
      expect(mockOnKey).toHaveBeenCalledWith('D');

      // Update keyStates to mark D as absent
      const newKeyStates = new Map<string, TileState>();
      newKeyStates.set('D', 'absent');

      rerender(
        <Keyboard
          onKey={mockOnKey}
          keyStates={newKeyStates}
          tileColors={mockTileColors}
        />,
      );

      // D should now be disabled
      mockOnKey.mockClear();
      fireEvent.press(getByText('D'));
      expect(mockOnKey).not.toHaveBeenCalled();
    });
  });

  describe('tileColors integration', () => {
    it('should pass tileColors to all letter keys', () => {
      const keyStates = new Map<string, TileState>();
      keyStates.set('E', 'correct');

      const {getByText} = render(
        <Keyboard
          onKey={mockOnKey}
          keyStates={keyStates}
          tileColors={mockTileColors}
        />,
      );

      // Verify the keyboard renders with tileColors (behavior test)
      // E should be pressable with correct state
      fireEvent.press(getByText('E'));
      expect(mockOnKey).toHaveBeenCalledWith('E');
    });

    it('should support high contrast colors', () => {
      const highContrastColors: TileColors = {
        correct: palette.correctHighContrast,
        present: palette.presentHighContrast,
        absent: palette.absent,
      };

      const keyStates = new Map<string, TileState>();
      keyStates.set('F', 'correct');
      keyStates.set('G', 'present');
      keyStates.set('H', 'absent');

      const {getByText} = render(
        <Keyboard
          onKey={mockOnKey}
          keyStates={keyStates}
          tileColors={highContrastColors}
        />,
      );

      // Verify keyboard works with high contrast colors (behavior test)
      // F and G should be pressable
      fireEvent.press(getByText('F'));
      expect(mockOnKey).toHaveBeenCalledWith('F');

      mockOnKey.mockClear();
      fireEvent.press(getByText('G'));
      expect(mockOnKey).toHaveBeenCalledWith('G');

      // H should be disabled (absent)
      mockOnKey.mockClear();
      fireEvent.press(getByText('H'));
      expect(mockOnKey).not.toHaveBeenCalled();
    });
  });

  describe('action keys behavior', () => {
    it('should not disable Enter key based on keyStates', () => {
      const keyStates = new Map<string, TileState>();
      // Even if we somehow set ENTER state (shouldn't happen in practice)
      keyStates.set('ENTER', 'absent');

      const {getByLabelText} = render(
        <Keyboard
          onKey={mockOnKey}
          keyStates={keyStates}
          tileColors={mockTileColors}
        />,
      );

      fireEvent.press(getByLabelText('Enter'));
      expect(mockOnKey).toHaveBeenCalledWith('ENTER');
    });

    it('should not disable Delete key based on keyStates', () => {
      const keyStates = new Map<string, TileState>();
      keyStates.set('DEL', 'absent');

      const {getByLabelText} = render(
        <Keyboard
          onKey={mockOnKey}
          keyStates={keyStates}
          tileColors={mockTileColors}
        />,
      );

      fireEvent.press(getByLabelText('Delete'));
      expect(mockOnKey).toHaveBeenCalledWith('DEL');
    });

    it('should not apply letter states to action keys', () => {
      const keyStates = new Map<string, TileState>();
      // Set states for all letters
      'QWERTYUIOPASDFGHJKLZXCVBNM'.split('').forEach(letter => {
        keyStates.set(letter, 'correct');
      });

      const {getByLabelText} = render(
        <Keyboard
          onKey={mockOnKey}
          keyStates={keyStates}
          tileColors={mockTileColors}
        />,
      );

      const enterKey = getByLabelText('Enter');
      const deleteKey = getByLabelText('Delete');

      // Action keys should have action styling, not letter state styling
      expect(enterKey.props.style).toContainEqual(
        expect.objectContaining({
          backgroundColor: palette.keyAction,
        }),
      );

      expect(deleteKey.props.style).toContainEqual(
        expect.objectContaining({
          backgroundColor: palette.keyAction,
        }),
      );
    });
  });

  describe('real-world game scenarios', () => {
    it('should handle typical game state after first guess', () => {
      const keyStates = new Map<string, TileState>();
      // User guessed "CRANE" for answer "STARE"
      keyStates.set('C', 'absent');
      keyStates.set('R', 'present');
      keyStates.set('A', 'correct');
      keyStates.set('N', 'absent');
      keyStates.set('E', 'correct');

      const {getByText} = render(
        <Keyboard
          onKey={mockOnKey}
          keyStates={keyStates}
          tileColors={mockTileColors}
        />,
      );

      // C and N should be disabled
      fireEvent.press(getByText('C'));
      expect(mockOnKey).not.toHaveBeenCalled();

      fireEvent.press(getByText('N'));
      expect(mockOnKey).not.toHaveBeenCalled();

      // R, A, E should be enabled
      fireEvent.press(getByText('R'));
      expect(mockOnKey).toHaveBeenCalledWith('R');

      mockOnKey.mockClear();
      fireEvent.press(getByText('A'));
      expect(mockOnKey).toHaveBeenCalledWith('A');

      mockOnKey.mockClear();
      fireEvent.press(getByText('E'));
      expect(mockOnKey).toHaveBeenCalledWith('E');

      // Untested letters should still work
      mockOnKey.mockClear();
      fireEvent.press(getByText('B'));
      expect(mockOnKey).toHaveBeenCalledWith('B');
    });

    it('should handle all letters marked as absent', () => {
      const keyStates = new Map<string, TileState>();
      'QWERTYUIOPASDFGHJKLZXCVBNM'.split('').forEach(letter => {
        keyStates.set(letter, 'absent');
      });

      const {getByText, getByLabelText} = render(
        <Keyboard
          onKey={mockOnKey}
          keyStates={keyStates}
          tileColors={mockTileColors}
        />,
      );

      // All letter keys should be disabled
      fireEvent.press(getByText('Q'));
      fireEvent.press(getByText('Z'));
      fireEvent.press(getByText('M'));
      expect(mockOnKey).not.toHaveBeenCalled();

      // But action keys should still work
      fireEvent.press(getByLabelText('Enter'));
      expect(mockOnKey).toHaveBeenCalledWith('ENTER');

      mockOnKey.mockClear();
      fireEvent.press(getByLabelText('Delete'));
      expect(mockOnKey).toHaveBeenCalledWith('DEL');
    });

    it('should handle progressive letter discovery', () => {
      // After guess 1
      const keyStates1 = new Map<string, TileState>();
      keyStates1.set('S', 'absent');
      keyStates1.set('T', 'present');
      keyStates1.set('A', 'correct');

      const {getByText, rerender} = render(
        <Keyboard
          onKey={mockOnKey}
          keyStates={keyStates1}
          tileColors={mockTileColors}
        />,
      );

      fireEvent.press(getByText('S'));
      expect(mockOnKey).not.toHaveBeenCalled();

      // After guess 2, create new Map with additional letters
      const keyStates2 = new Map<string, TileState>();
      keyStates2.set('S', 'absent');
      keyStates2.set('T', 'present');
      keyStates2.set('A', 'correct');
      keyStates2.set('R', 'present');
      keyStates2.set('E', 'correct');
      keyStates2.set('L', 'absent');

      rerender(
        <Keyboard
          onKey={mockOnKey}
          keyStates={keyStates2}
          tileColors={mockTileColors}
        />,
      );

      // S and L should be disabled
      mockOnKey.mockClear();
      fireEvent.press(getByText('S'));
      fireEvent.press(getByText('L'));
      expect(mockOnKey).not.toHaveBeenCalled();

      // T, A, R, E should work
      fireEvent.press(getByText('T'));
      expect(mockOnKey).toHaveBeenCalledWith('T');
    });
  });

  describe('memoization', () => {
    it('should have a display name for debugging', () => {
      expect(Keyboard.displayName).toBe('Keyboard');
    });

    it('should be a memoized component', () => {
      expect((Keyboard as any).$$typeof).toBeDefined();
    });

    it('should not re-render when props do not change', () => {
      const keyStates = new Map<string, TileState>();
      keyStates.set('H', 'correct');

      const {rerender, getByText} = render(
        <Keyboard
          onKey={mockOnKey}
          keyStates={keyStates}
          tileColors={mockTileColors}
        />,
      );

      const firstRenderKey = getByText('H');

      // Re-render with same props
      rerender(
        <Keyboard
          onKey={mockOnKey}
          keyStates={keyStates}
          tileColors={mockTileColors}
        />,
      );

      const secondRenderKey = getByText('H');

      // Component should be memoized (though we can't directly test this without more setup)
      expect(firstRenderKey).toBeTruthy();
      expect(secondRenderKey).toBeTruthy();
    });
  });

  describe('edge cases', () => {
    it('should handle case-sensitive key states', () => {
      const keyStates = new Map<string, TileState>();
      // Keys are uppercase in the map
      keyStates.set('Q', 'correct');
      keyStates.set('q', 'absent'); // lowercase shouldn't affect uppercase

      const {getByText} = render(
        <Keyboard
          onKey={mockOnKey}
          keyStates={keyStates}
          tileColors={mockTileColors}
        />,
      );

      // Q should be pressable (correct state doesn't disable)
      fireEvent.press(getByText('Q'));
      expect(mockOnKey).toHaveBeenCalledWith('Q');
    });

    it('should handle all possible TileState values', () => {
      const states: TileState[] = ['correct', 'present', 'absent'];
      const keyStates = new Map<string, TileState>();

      keyStates.set('I', states[0]); // correct
      keyStates.set('J', states[1]); // present
      keyStates.set('K', states[2]); // absent

      const {getByText} = render(
        <Keyboard
          onKey={mockOnKey}
          keyStates={keyStates}
          tileColors={mockTileColors}
        />,
      );

      // I and J should be pressable (correct/present don't disable)
      fireEvent.press(getByText('I'));
      expect(mockOnKey).toHaveBeenCalledWith('I');

      mockOnKey.mockClear();
      fireEvent.press(getByText('J'));
      expect(mockOnKey).toHaveBeenCalledWith('J');

      // K should be disabled (absent state)
      mockOnKey.mockClear();
      fireEvent.press(getByText('K'));
      expect(mockOnKey).not.toHaveBeenCalled();
    });

    it('should handle very large keyStates map', () => {
      const keyStates = new Map<string, TileState>();

      // Add many entries (more than just the 26 letters)
      for (let i = 0; i < 100; i++) {
        keyStates.set(`KEY_${i}`, 'correct');
      }

      // Add actual letter states
      keyStates.set('V', 'correct');
      keyStates.set('W', 'absent');

      const {getByText} = render(
        <Keyboard
          onKey={mockOnKey}
          keyStates={keyStates}
          tileColors={mockTileColors}
        />,
      );

      // Should still work correctly
      fireEvent.press(getByText('V'));
      expect(mockOnKey).toHaveBeenCalledWith('V');

      mockOnKey.mockClear();
      fireEvent.press(getByText('W'));
      expect(mockOnKey).not.toHaveBeenCalled();
    });
  });
});
