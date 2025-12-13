// src/components/Keyboard/__tests__/Key.test.tsx

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
import {Key} from '../Key';
import {palette} from '../../../theme/colors';
import type {TileState} from '../../../logic/evaluateGuess';
import type {TileColors} from '../types';

describe('Key', () => {
  const mockOnPress = jest.fn();
  const mockTileColors: TileColors = {
    correct: palette.correct,
    present: palette.present,
    absent: palette.absent,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('basic rendering', () => {
    it('should render the label text', () => {
      const {getByText} = render(
        <Key label="A" onPress={mockOnPress} />,
      );

      expect(getByText('A')).toBeTruthy();
    });

    it('should render with uppercase text transform', () => {
      const {getByText} = render(
        <Key label="q" onPress={mockOnPress} />,
      );

      const text = getByText('q');
      expect(text.props.style).toContainEqual(
        expect.objectContaining({
          textTransform: 'uppercase',
        }),
      );
    });

    it('should have button accessibility role', () => {
      const {getByRole} = render(
        <Key label="B" onPress={mockOnPress} />,
      );

      expect(getByRole('button')).toBeTruthy();
    });
  });

  describe('onPress callback', () => {
    it('should call onPress when pressed', () => {
      const {getByRole} = render(
        <Key label="C" onPress={mockOnPress} />,
      );

      fireEvent.press(getByRole('button'));

      expect(mockOnPress).toHaveBeenCalledTimes(1);
    });

    it('should not call onPress when disabled', () => {
      const {getByRole} = render(
        <Key label="D" onPress={mockOnPress} disabled />,
      );

      fireEvent.press(getByRole('button'));

      expect(mockOnPress).not.toHaveBeenCalled();
    });

    it('should allow multiple presses', () => {
      const {getByRole} = render(
        <Key label="E" onPress={mockOnPress} />,
      );

      const button = getByRole('button');
      fireEvent.press(button);
      fireEvent.press(button);
      fireEvent.press(button);

      expect(mockOnPress).toHaveBeenCalledTimes(3);
    });
  });

  describe('state-based styling', () => {
    it('should apply correct state background color', () => {
      const {getByRole} = render(
        <Key
          label="F"
          onPress={mockOnPress}
          state="correct"
          tileColors={mockTileColors}
        />,
      );

      const button = getByRole('button');
      expect(button.props.style).toContainEqual(
        expect.objectContaining({
          backgroundColor: palette.correct,
        }),
      );
    });

    it('should apply present state background color', () => {
      const {getByRole} = render(
        <Key
          label="G"
          onPress={mockOnPress}
          state="present"
          tileColors={mockTileColors}
        />,
      );

      const button = getByRole('button');
      expect(button.props.style).toContainEqual(
        expect.objectContaining({
          backgroundColor: palette.present,
        }),
      );
    });

    it('should apply absent state background color', () => {
      const {getByRole} = render(
        <Key
          label="H"
          onPress={mockOnPress}
          state="absent"
          tileColors={mockTileColors}
        />,
      );

      const button = getByRole('button');
      expect(button.props.style).toContainEqual(
        expect.objectContaining({
          backgroundColor: palette.absent,
        }),
      );
    });

    it('should use default styling when no state provided', () => {
      const {getByRole} = render(
        <Key label="I" onPress={mockOnPress} />,
      );

      const button = getByRole('button');
      // Should not have any state-specific background color
      const styles = button.props.style.flat();
      const hasStateColor = styles.some(
        (s: any) =>
          s?.backgroundColor === palette.correct ||
          s?.backgroundColor === palette.present ||
          s?.backgroundColor === palette.absent,
      );
      expect(hasStateColor).toBe(false);
    });

    it('should not apply state colors when tileColors not provided', () => {
      const {getByRole} = render(
        <Key label="J" onPress={mockOnPress} state="correct" />,
      );

      const button = getByRole('button');
      const styles = button.props.style.flat();
      const hasCorrectColor = styles.some(
        (s: any) => s?.backgroundColor === palette.correct,
      );
      expect(hasCorrectColor).toBe(false);
    });
  });

  describe('high contrast color support', () => {
    const highContrastColors: TileColors = {
      correct: palette.correctHighContrast,
      present: palette.presentHighContrast,
      absent: palette.absent,
    };

    it('should apply high contrast correct color', () => {
      const {getByRole} = render(
        <Key
          label="K"
          onPress={mockOnPress}
          state="correct"
          tileColors={highContrastColors}
        />,
      );

      const button = getByRole('button');
      expect(button.props.style).toContainEqual(
        expect.objectContaining({
          backgroundColor: palette.correctHighContrast,
        }),
      );
    });

    it('should apply high contrast present color', () => {
      const {getByRole} = render(
        <Key
          label="L"
          onPress={mockOnPress}
          state="present"
          tileColors={highContrastColors}
        />,
      );

      const button = getByRole('button');
      expect(button.props.style).toContainEqual(
        expect.objectContaining({
          backgroundColor: palette.presentHighContrast,
        }),
      );
    });
  });

  describe('disabled state', () => {
    it('should set accessibility state to disabled', () => {
      const {getByRole} = render(
        <Key label="M" onPress={mockOnPress} disabled />,
      );

      const button = getByRole('button');
      expect(button.props.accessibilityState).toEqual({disabled: true});
    });

    it('should apply disabled styling', () => {
      const {getByRole, getByText} = render(
        <Key label="N" onPress={mockOnPress} disabled />,
      );

      const button = getByRole('button');
      expect(button.props.style).toContainEqual(
        expect.objectContaining({
          backgroundColor: palette.keyDisabled,
        }),
      );

      const text = getByText('N');
      expect(text.props.style).toContainEqual(
        expect.objectContaining({
          color: palette.keyAction,
        }),
      );
    });

    it('should not have disabled accessibility state when not disabled', () => {
      const {getByRole} = render(
        <Key label="O" onPress={mockOnPress} />,
      );

      const button = getByRole('button');
      // When disabled is false, React Native may not set it or set it to false
      expect(button.props.accessibilityState.disabled).toBeFalsy();
    });
  });

  describe('action keys', () => {
    it('should apply action styling when isAction is true', () => {
      const {getByRole, getByText} = render(
        <Key label="↵" onPress={mockOnPress} isAction />,
      );

      const button = getByRole('button');
      expect(button.props.style).toContainEqual(
        expect.objectContaining({
          backgroundColor: palette.keyAction,
        }),
      );

      const text = getByText('↵');
      expect(text.props.style).toContainEqual(
        expect.objectContaining({
          fontSize: 12,
        }),
      );
    });

    it('should apply custom flex value', () => {
      const {getByRole} = render(
        <Key label="⌫" onPress={mockOnPress} isAction flex={2} />,
      );

      const button = getByRole('button');
      expect(button.props.style).toContainEqual(
        expect.objectContaining({
          flex: 2,
        }),
      );
    });

    it('should default to flex 1 when not specified', () => {
      const {getByRole} = render(
        <Key label="P" onPress={mockOnPress} />,
      );

      const button = getByRole('button');
      expect(button.props.style).toContainEqual(
        expect.objectContaining({
          flex: 1,
        }),
      );
    });
  });

  describe('accessibility labels', () => {
    it('should use custom accessibility label when provided', () => {
      const {getByLabelText} = render(
        <Key
          label="↵"
          onPress={mockOnPress}
          accessibilityLabel="Enter"
        />,
      );

      expect(getByLabelText('Enter')).toBeTruthy();
    });

    it('should use label as accessibility label when custom not provided', () => {
      const {getByLabelText} = render(
        <Key label="Q" onPress={mockOnPress} />,
      );

      expect(getByLabelText('Q')).toBeTruthy();
    });

    it('should prefer custom accessibility label over label', () => {
      const {getByLabelText, queryByLabelText} = render(
        <Key
          label="⌫"
          onPress={mockOnPress}
          accessibilityLabel="Delete"
        />,
      );

      expect(getByLabelText('Delete')).toBeTruthy();
      expect(queryByLabelText('⌫')).toBeNull();
    });
  });

  describe('combined states', () => {
    it('should handle disabled + state correctly', () => {
      const {getByRole} = render(
        <Key
          label="R"
          onPress={mockOnPress}
          state="absent"
          disabled
          tileColors={mockTileColors}
        />,
      );

      const button = getByRole('button');
      fireEvent.press(button);

      // Should not call onPress
      expect(mockOnPress).not.toHaveBeenCalled();

      // Should have disabled styling
      expect(button.props.style).toContainEqual(
        expect.objectContaining({
          backgroundColor: palette.keyDisabled,
        }),
      );
    });

    it('should handle action + flex correctly', () => {
      const {getByRole} = render(
        <Key
          label="ENTER"
          onPress={mockOnPress}
          isAction
          flex={3}
        />,
      );

      const button = getByRole('button');

      // Check flex separately since it's in its own object
      expect(button.props.style).toContainEqual(
        expect.objectContaining({flex: 3}),
      );

      // Check action background color
      expect(button.props.style).toContainEqual(
        expect.objectContaining({
          backgroundColor: palette.keyAction,
        }),
      );
    });

    it('should handle state + action correctly (state should override)', () => {
      const {getByRole} = render(
        <Key
          label="S"
          onPress={mockOnPress}
          state="correct"
          isAction
          tileColors={mockTileColors}
        />,
      );

      const button = getByRole('button');

      // State color should appear in styles
      expect(button.props.style).toContainEqual(
        expect.objectContaining({
          backgroundColor: palette.correct,
        }),
      );
    });
  });

  describe('edge cases', () => {
    it('should handle empty label', () => {
      const {getByRole} = render(
        <Key label="" onPress={mockOnPress} />,
      );

      expect(getByRole('button')).toBeTruthy();
    });

    it('should handle special characters in label', () => {
      const specialChars = ['↵', '⌫', '←', '→', '✓', '×'];

      specialChars.forEach(char => {
        const {getByText} = render(
          <Key label={char} onPress={mockOnPress} />,
        );
        expect(getByText(char)).toBeTruthy();
      });
    });

    it('should handle rapid successive presses', () => {
      const {getByRole} = render(
        <Key label="T" onPress={mockOnPress} />,
      );

      const button = getByRole('button');

      for (let i = 0; i < 10; i++) {
        fireEvent.press(button);
      }

      expect(mockOnPress).toHaveBeenCalledTimes(10);
    });
  });

  describe('memoization', () => {
    it('should have a display name for debugging', () => {
      expect(Key.displayName).toBe('Key');
    });

    it('should be a memoized component', () => {
      // React.memo components have a $$typeof of REACT_MEMO_TYPE
      expect((Key as any).$$typeof).toBeDefined();
    });
  });

  describe('all TileState values', () => {
    const states: TileState[] = ['correct', 'present', 'absent'];

    states.forEach(state => {
      it(`should handle "${state}" state correctly`, () => {
        const {getByRole} = render(
          <Key
            label="U"
            onPress={mockOnPress}
            state={state}
            tileColors={mockTileColors}
          />,
        );

        const button = getByRole('button');
        const expectedColor = mockTileColors[state];

        expect(button.props.style).toContainEqual(
          expect.objectContaining({
            backgroundColor: expectedColor,
          }),
        );
      });
    });
  });
});
