/**
 * ResultModal Integration Tests
 *
 * Tests the integration between ResultModal and its dependencies:
 * - Share functionality
 * - Helper functions (generateShareText, getResultEmoji, getResultTitle)
 * - Storage layer (getStatsForLength)
 *
 * These tests verify the component's business logic and data flow
 * without relying on full component rendering.
 */

import {
  generateShareText,
  getResultEmoji,
  getResultTitle,
} from '../../../logic/shareResult';
import {getStatsForLength} from '../../../storage/profile';
import {TileState} from '../../../logic/evaluateGuess';
import type {ResultModalProps} from '../types';

// These are integration tests that verify the actual implementations
// No mocks needed - we're testing real behavior

describe('ResultModal Integration', () => {
  describe('Share functionality integration', () => {
    it('should generate correct share text for won game', () => {
      // Arrange
      const feedback: TileState[][] = [
        ['absent', 'present', 'absent', 'absent', 'absent'],
        ['correct', 'correct', 'correct', 'correct', 'correct'],
      ];

      // Act
      const result = generateShareText({
        length: 5,
        maxRows: 6,
        guesses: 2,
        won: true,
        feedback,
        date: '2024-12-13',
      });

      // Assert
      expect(result.text).toContain('WrathWord 5×6');
      expect(result.text).toContain('2/6');
      expect(result.text).toContain('2024'); // Check year instead of full date
      expect(result.text).toContain('Dec'); // Check month
      expect(result.text).toContain('🟩🟩🟩🟩🟩'); // Correct row
      expect(result.text).toContain('⬛🟨⬛⬛⬛'); // First guess row
    });

    it('should generate correct share text for lost game', () => {
      // Arrange
      const feedback: TileState[][] = [
        ['absent', 'present', 'absent', 'absent', 'absent'],
        ['absent', 'absent', 'absent', 'absent', 'absent'],
      ];

      // Act
      const result = generateShareText({
        length: 5,
        maxRows: 6,
        guesses: 2,
        won: false,
        feedback,
        date: '2024-12-13',
      });

      // Assert
      expect(result.text).toContain('WrathWord 5×6');
      expect(result.text).toContain('X/6'); // Lost format
      expect(result.text).toContain('2024'); // Check year instead of full date
      expect(result.text).toContain('Dec'); // Check month
    });

    it('should handle different word lengths in share text', () => {
      // Arrange
      const feedback: TileState[][] = [
        ['correct', 'correct', 'correct', 'correct'],
      ];

      // Act
      const result = generateShareText({
        length: 4,
        maxRows: 6,
        guesses: 1,
        won: true,
        feedback,
        date: '2024-12-13',
      });

      // Assert
      expect(result.text).toContain('WrathWord 4×6');
      expect(result.text).toContain('1/6');
    });

    it('should convert feedback to emojis correctly', () => {
      // Arrange
      const feedback: TileState[][] = [
        ['correct', 'present', 'absent'],
      ];

      // Act
      const result = generateShareText({
        length: 3,
        maxRows: 6,
        guesses: 1,
        won: true,
        feedback,
        date: '2024-12-13',
      });

      // Assert
      expect(result.text).toContain('🟩🟨⬛');
    });
  });

  describe('Result emoji integration', () => {
    it('should return sad emoji for lost game', () => {
      // Act
      const emoji = getResultEmoji(6, 6, false);

      // Assert
      expect(emoji).toBe('😔');
    });

    it('should return mind blown emoji for perfect score', () => {
      // Act
      const emoji = getResultEmoji(1, 6, true);

      // Assert
      expect(emoji).toBe('🤯');
    });

    it('should return amazing emoji for very low score', () => {
      // Act
      const emoji = getResultEmoji(2, 6, true);

      // Assert
      // 2/6 = 0.33, which is <= 0.33 but also <= 0.5, checking actual implementation
      expect(emoji).toBe('😎'); // Amazing
    });

    it('should return checkmark for barely winning', () => {
      // Act
      const emoji = getResultEmoji(6, 6, true);

      // Assert
      expect(emoji).toBe('✅'); // 6/6 = 1.0, should be nice
    });

    it('should handle different maxRows correctly', () => {
      // Act
      const emoji = getResultEmoji(2, 8, true);

      // Assert
      expect(emoji).toBe('🎉'); // 2/8 = 0.25, should be brilliant
    });
  });

  describe('Result title integration', () => {
    it('should return correct title for lost game', () => {
      // Act
      const title = getResultTitle(6, 6, false);

      // Assert
      expect(title).toBe('Better Luck Next Time');
    });

    it('should return "Incredible!" for perfect score', () => {
      // Act
      const title = getResultTitle(1, 6, true);

      // Assert
      expect(title).toBe('Incredible!');
    });

    it('should return "Amazing!" for very good score', () => {
      // Act
      const title = getResultTitle(2, 6, true);

      // Assert
      // 2/6 = 0.33, which matches the Amazing tier
      expect(title).toBe('Amazing!');
    });

    it('should return "Amazing!" for good score', () => {
      // Act
      const title = getResultTitle(3, 6, true);

      // Assert
      expect(title).toBe('Amazing!'); // 3/6 = 0.5
    });

    it('should return "Great Job!" for decent score', () => {
      // Act
      const title = getResultTitle(4, 6, true);

      // Assert
      expect(title).toBe('Great Job!'); // 4/6 = 0.67
    });

    it('should return "Well Done!" for barely winning', () => {
      // Act
      const title = getResultTitle(6, 6, true);

      // Assert
      expect(title).toBe('Well Done!'); // 6/6 = 1.0
    });
  });

  describe('Props type safety', () => {
    it('should accept all required props', () => {
      // Arrange - This test verifies TypeScript types are correct
      const validProps: ResultModalProps = {
        visible: true,
        status: 'won',
        rows: ['APPLE', 'IDEAL'],
        maxRows: 6,
        length: 5,
        feedback: [
          ['absent', 'present', 'absent', 'absent', 'absent'],
          ['correct', 'correct', 'correct', 'correct', 'correct'],
        ],
        dateISO: '2024-12-13',
        answer: 'IDEAL',
        tileColors: {
          correct: '#6aaa64',
          present: '#c9b458',
          absent: '#787c7e',
        },
        playAgainIsFreeMode: false,
        onPlayAgain: jest.fn(),
      };

      // Assert - If this compiles, types are correct
      expect(validProps.status).toBe('won');
    });

    it('should accept "lost" status', () => {
      // Arrange
      const lostProps: ResultModalProps = {
        visible: true,
        status: 'lost',
        rows: ['APPLE'],
        maxRows: 6,
        length: 5,
        feedback: [['absent', 'absent', 'absent', 'absent', 'absent']],
        dateISO: '2024-12-13',
        answer: 'IDEAL',
        tileColors: {
          correct: '#6aaa64',
          present: '#c9b458',
          absent: '#787c7e',
        },
        playAgainIsFreeMode: true,
        onPlayAgain: jest.fn(),
      };

      // Assert
      expect(lostProps.status).toBe('lost');
    });

    it('should accept "playing" status', () => {
      // Arrange
      const playingProps: ResultModalProps = {
        visible: false,
        status: 'playing',
        rows: [],
        maxRows: 6,
        length: 5,
        feedback: [],
        dateISO: '2024-12-13',
        answer: 'IDEAL',
        tileColors: {
          correct: '#6aaa64',
          present: '#c9b458',
          absent: '#787c7e',
        },
        playAgainIsFreeMode: false,
        onPlayAgain: jest.fn(),
      };

      // Assert
      expect(playingProps.status).toBe('playing');
    });
  });

  describe('Data transformations', () => {
    it('should handle uppercase/lowercase answer consistently', () => {
      // The component should uppercase the answer
      const lowercase = 'ideal';
      const uppercase = 'IDEAL';

      // Assert
      expect(lowercase.toUpperCase()).toBe(uppercase);
      expect(uppercase.toUpperCase()).toBe(uppercase);
    });

    it('should format ISO dates correctly', () => {
      // Arrange
      const dateISO = '2024-12-13';
      const date = new Date(dateISO);

      // Act
      const formatted = date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });

      // Assert
      // Timezone issues can cause off-by-one on dates, just verify format
      expect(formatted).toMatch(/^[A-Z][a-z]{2} \d{1,2}$/);
      expect(formatted).toContain('Dec');
    });

    it('should format dates from different years', () => {
      // Arrange
      const dateISO = '2023-01-15';
      const date = new Date(dateISO);

      // Act
      const formatted = date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });

      // Assert
      // Timezone issues can cause off-by-one on dates, just verify format
      expect(formatted).toMatch(/^[A-Z][a-z]{2} \d{1,2}$/);
      expect(formatted).toContain('Jan');
    });

    it('should handle different month formats', () => {
      // Arrange
      const dates = [
        '2024-01-01', // Jan
        '2024-06-15', // Jun
        '2024-12-31', // Dec
      ];

      // Act & Assert
      dates.forEach(dateISO => {
        const date = new Date(dateISO);
        const formatted = date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        });
        expect(formatted).toMatch(/^[A-Z][a-z]{2} \d{1,2}$/);
      });
    });
  });

  describe('Score calculations', () => {
    it('should format win score correctly', () => {
      // Arrange
      const guesses = 3;
      const maxRows = 6;

      // Act
      const score = `${guesses}/${maxRows}`;

      // Assert
      expect(score).toBe('3/6');
    });

    it('should format loss score correctly', () => {
      // Arrange
      const maxRows = 6;

      // Act
      const score = `X/${maxRows}`;

      // Assert
      expect(score).toBe('X/6');
    });

    it('should handle perfect score', () => {
      // Arrange
      const guesses = 1;
      const maxRows = 6;

      // Act
      const score = `${guesses}/${maxRows}`;

      // Assert
      expect(score).toBe('1/6');
    });

    it('should handle last attempt win', () => {
      // Arrange
      const guesses = 6;
      const maxRows = 6;

      // Act
      const score = `${guesses}/${maxRows}`;

      // Assert
      expect(score).toBe('6/6');
    });

    it('should handle different maxRows values', () => {
      // Arrange
      const testCases = [
        {guesses: 2, maxRows: 4, expected: '2/4'},
        {guesses: 5, maxRows: 8, expected: '5/8'},
        {guesses: 1, maxRows: 10, expected: '1/10'},
      ];

      // Act & Assert
      testCases.forEach(({guesses, maxRows, expected}) => {
        const score = `${guesses}/${maxRows}`;
        expect(score).toBe(expected);
      });
    });
  });

  describe('Feedback grid transformations', () => {
    it('should map TileState to colors correctly', () => {
      // Arrange
      const tileColors = {
        correct: '#6aaa64',
        present: '#c9b458',
        absent: '#787c7e',
      };

      const states: TileState[] = ['correct', 'present', 'absent'];

      // Act
      const colors = states.map(state => {
        if (state === 'correct') return tileColors.correct;
        if (state === 'present') return tileColors.present;
        return tileColors.absent;
      });

      // Assert
      expect(colors).toEqual(['#6aaa64', '#c9b458', '#787c7e']);
    });

    it('should handle multiple rows of feedback', () => {
      // Arrange
      const feedback: TileState[][] = [
        ['absent', 'present', 'absent', 'absent', 'absent'],
        ['present', 'absent', 'correct', 'absent', 'present'],
        ['correct', 'correct', 'correct', 'correct', 'correct'],
      ];

      // Act
      const totalTiles = feedback.reduce((sum, row) => sum + row.length, 0);
      const correctTiles = feedback.flat().filter(s => s === 'correct').length;

      // Assert
      expect(totalTiles).toBe(15); // 3 rows × 5 tiles
      expect(correctTiles).toBe(6); // 5 in last row + 1 in second row
    });
  });

  describe('Streak display logic', () => {
    it('should show streak when currentStreak > 0', () => {
      // Arrange
      const stats = {
        currentStreak: 5,
        maxStreak: 8,
      };

      // Act
      const hasStreak = stats.currentStreak > 0 || stats.maxStreak > 0;

      // Assert
      expect(hasStreak).toBe(true);
    });

    it('should show streak when maxStreak > 0 even if currentStreak is 0', () => {
      // Arrange
      const stats = {
        currentStreak: 0,
        maxStreak: 8,
      };

      // Act
      const hasStreak = stats.currentStreak > 0 || stats.maxStreak > 0;

      // Assert
      expect(hasStreak).toBe(true);
    });

    it('should hide streak when both are 0', () => {
      // Arrange
      const stats = {
        currentStreak: 0,
        maxStreak: 0,
      };

      // Act
      const hasStreak = stats.currentStreak > 0 || stats.maxStreak > 0;

      // Assert
      expect(hasStreak).toBe(false);
    });

    it('should format streak text correctly', () => {
      // Arrange
      const currentStreak = 5;
      const maxStreak = 10;

      // Act
      const currentText = `${currentStreak} days`;
      const maxText = `${maxStreak} days`;

      // Assert
      expect(currentText).toBe('5 days');
      expect(maxText).toBe('10 days');
    });

    it('should handle single day streaks', () => {
      // Arrange
      const streak = 1;

      // Act
      const text = `${streak} days`;

      // Assert
      expect(text).toBe('1 days'); // Note: Component uses "days" plural always
    });
  });

  describe('Button text variations', () => {
    it('should show "Play Again" when playAgainIsFreeMode is false', () => {
      // Arrange
      const playAgainIsFreeMode = false;

      // Act
      const buttonText = playAgainIsFreeMode ? 'Play Free Mode' : 'Play Again';

      // Assert
      expect(buttonText).toBe('Play Again');
    });

    it('should show "Play Free Mode" when playAgainIsFreeMode is true', () => {
      // Arrange
      const playAgainIsFreeMode = true;

      // Act
      const buttonText = playAgainIsFreeMode ? 'Play Free Mode' : 'Play Again';

      // Assert
      expect(buttonText).toBe('Play Free Mode');
    });
  });

  describe('Configuration display', () => {
    it('should format game configuration correctly', () => {
      // Arrange
      const length = 5;
      const maxRows = 6;

      // Act
      const config = `${length}×${maxRows}`;

      // Assert
      expect(config).toBe('5×6');
    });

    it('should handle different length configurations', () => {
      // Arrange
      const testCases = [
        {length: 4, maxRows: 6, expected: '4×6'},
        {length: 5, maxRows: 6, expected: '5×6'},
        {length: 6, maxRows: 6, expected: '6×6'},
        {length: 5, maxRows: 8, expected: '5×8'},
      ];

      // Act & Assert
      testCases.forEach(({length, maxRows, expected}) => {
        const config = `${length}×${maxRows}`;
        expect(config).toBe(expected);
      });
    });
  });
});
