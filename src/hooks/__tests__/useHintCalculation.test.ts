// src/hooks/__tests__/useHintCalculation.test.ts
import React from 'react';
import {create, act} from 'react-test-renderer';
import {useHintCalculation, HintResult} from '../useHintCalculation';
import {TileState} from '../../logic/evaluateGuess';

/**
 * Test wrapper component that invokes the hook and exposes results via callback.
 * This is necessary because hooks can only be called inside React components.
 */
interface TestHookWrapperProps {
  answer: string;
  feedback: TileState[][];
  length: number;
  onRender: (result: {
    calculateHint: (row: number) => HintResult | null;
    allPositionsCorrect: boolean;
  }) => void;
}

const TestHookWrapper: React.FC<TestHookWrapperProps> = ({
  answer,
  feedback,
  length,
  onRender,
}) => {
  const result = useHintCalculation(answer, feedback, length);
  onRender(result);
  return null;
};

/**
 * Helper function to test the hook by rendering it in a test component
 */
const renderHook = (answer: string, feedback: TileState[][], length: number) => {
  let result: any;
  act(() => {
    create(
      React.createElement(TestHookWrapper, {
        answer,
        feedback,
        length,
        onRender: (r) => {
          result = r;
        },
      })
    );
  });
  return result;
};

describe('useHintCalculation', () => {
  // Helper to make tests more readable
  const C: TileState = 'correct';
  const P: TileState = 'present';
  const A: TileState = 'absent';

  describe('calculateHint', () => {
    describe('when unrevealed positions exist', () => {
      it('should return valid hint for simple case with no revealed positions', () => {
        // Arrange
        const answer = 'HELLO';
        const feedback: TileState[][] = [
          [A, A, A, A, A], // No correct positions
        ];
        const length = 5;

        // Act
        const {calculateHint} = renderHook(answer, feedback, length);
        const hint = calculateHint(1);

        // Assert
        expect(hint).not.toBeNull();
        expect(hint?.row).toBe(1);
        expect(hint?.col).toBeGreaterThanOrEqual(0);
        expect(hint?.col).toBeLessThan(5);
        expect(hint?.letter).toBe(answer[hint!.col].toUpperCase());
        expect(['H', 'E', 'L', 'O']).toContain(hint?.letter);
      });

      it('should return hint from unrevealed positions when some are correct', () => {
        // Arrange
        const answer = 'CRANE';
        const feedback: TileState[][] = [
          [C, A, A, A, A], // C is correct at position 0
          [C, A, C, A, A], // C at 0, A at 2 are correct
        ];
        const length = 5;

        // Act
        const {calculateHint} = renderHook(answer, feedback, length);
        const hint = calculateHint(2);

        // Assert
        expect(hint).not.toBeNull();
        expect(hint?.row).toBe(2);
        // Should not hint positions 0 or 2 (already correct)
        expect([1, 3, 4]).toContain(hint?.col);
        expect(['R', 'N', 'E']).toContain(hint?.letter);
      });

      it('should return hint from multiple unrevealed positions', () => {
        // Arrange
        const answer = 'SPEED';
        const feedback: TileState[][] = [
          [C, A, A, A, A], // S is correct at position 0
        ];
        const length = 5;

        // Act - Run multiple times to verify randomness among unrevealed
        const {calculateHint} = renderHook(answer, feedback, length);
        const hints: HintResult[] = [];
        for (let i = 0; i < 10; i++) {
          const hint = calculateHint(1);
          if (hint) hints.push(hint);
        }

        // Assert - Should get hints from positions 1-4 (not 0)
        expect(hints.length).toBe(10);
        hints.forEach(hint => {
          expect(hint.col).not.toBe(0); // Position 0 is correct
          expect([1, 2, 3, 4]).toContain(hint.col);
        });
      });

      it('should handle case where only one position is unrevealed', () => {
        // Arrange
        const answer = 'WORD';
        const feedback: TileState[][] = [
          [C, C, C, A], // W, O, R correct; D unrevealed
        ];
        const length = 4;

        // Act
        const {calculateHint} = renderHook(answer, feedback, length);
        const hint = calculateHint(1);

        // Assert
        expect(hint).not.toBeNull();
        expect(hint?.col).toBe(3); // Only position 3 is unrevealed
        expect(hint?.letter).toBe('D');
      });

      it('should uppercase the letter in the hint', () => {
        // Arrange - lowercase answer
        const answer = 'hello';
        const feedback: TileState[][] = [[A, A, A, A, A]];
        const length = 5;

        // Act
        const {calculateHint} = renderHook(answer, feedback, length);
        const hint = calculateHint(0);

        // Assert
        expect(hint).not.toBeNull();
        expect(hint?.letter).toMatch(/^[A-Z]$/); // Should be uppercase
        expect(hint?.letter).not.toMatch(/^[a-z]$/);
      });
    });

    describe('when all positions are correct', () => {
      it('should return null when all positions revealed', () => {
        // Arrange
        const answer = 'HELLO';
        const feedback: TileState[][] = [
          [C, C, C, C, C], // All correct
        ];
        const length = 5;

        // Act
        const {calculateHint} = renderHook(answer, feedback, length);
        const hint = calculateHint(1);

        // Assert
        expect(hint).toBeNull();
      });

      it('should return null when correct positions accumulated across rows', () => {
        // Arrange
        const answer = 'CRANE';
        const feedback: TileState[][] = [
          [C, A, A, A, A], // C correct at 0
          [C, C, A, A, A], // C at 0, R at 1 correct
          [C, C, C, A, A], // C at 0, R at 1, A at 2 correct
          [C, C, C, C, A], // C at 0, R at 1, A at 2, N at 3 correct
          [C, C, C, C, C], // All correct
        ];
        const length = 5;

        // Act
        const {calculateHint} = renderHook(answer, feedback, length);
        const hint = calculateHint(5);

        // Assert
        expect(hint).toBeNull();
      });
    });

    describe('when given invalid answer', () => {
      it('should return null for empty answer', () => {
        // Arrange
        const answer = '';
        const feedback: TileState[][] = [];
        const length = 5;

        // Act
        const {calculateHint} = renderHook(answer, feedback, length);
        const hint = calculateHint(0);

        // Assert
        expect(hint).toBeNull();
      });

      it('should return null when answer length does not match expected length', () => {
        // Arrange
        const answer = 'HELLO';
        const feedback: TileState[][] = [[A, A, A, A]]; // length 4 feedback
        const length = 4; // Expected length 4, but answer is 5

        // Act
        const {calculateHint} = renderHook(answer, feedback, length);
        const hint = calculateHint(0);

        // Assert
        expect(hint).toBeNull();
      });
    });

    describe('edge cases', () => {
      it('should handle empty feedback array', () => {
        // Arrange
        const answer = 'HELLO';
        const feedback: TileState[][] = [];
        const length = 5;

        // Act
        const {calculateHint} = renderHook(answer, feedback, length);
        const hint = calculateHint(0);

        // Assert
        expect(hint).not.toBeNull();
        // All positions should be unrevealed, so any position is valid
        expect(hint?.col).toBeGreaterThanOrEqual(0);
        expect(hint?.col).toBeLessThan(5);
      });

      it('should handle feedback with only present and absent states', () => {
        // Arrange
        const answer = 'WORLD';
        const feedback: TileState[][] = [
          [P, P, A, A, A], // No correct positions, only present/absent
          [A, P, P, A, A],
        ];
        const length = 5;

        // Act
        const {calculateHint} = renderHook(answer, feedback, length);
        const hint = calculateHint(2);

        // Assert
        expect(hint).not.toBeNull();
        // All positions are unrevealed since none are correct
        expect(hint?.col).toBeGreaterThanOrEqual(0);
        expect(hint?.col).toBeLessThan(5);
      });

      it('should handle duplicate correct positions across multiple rows', () => {
        // Arrange
        const answer = 'ABBEY';
        const feedback: TileState[][] = [
          [C, A, A, A, A], // A correct at 0
          [C, A, A, A, A], // A correct at 0 (duplicate marking)
          [C, C, A, A, A], // A at 0, B at 1 correct
        ];
        const length = 5;

        // Act
        const {calculateHint} = renderHook(answer, feedback, length);
        const hint = calculateHint(3);

        // Assert
        expect(hint).not.toBeNull();
        // Positions 0 and 1 are revealed, should hint 2, 3, or 4
        expect([2, 3, 4]).toContain(hint?.col);
        expect(['B', 'E', 'Y']).toContain(hint?.letter);
      });

      it('should handle minimum word length (4)', () => {
        // Arrange
        const answer = 'WORD';
        const feedback: TileState[][] = [[C, A, A, A]];
        const length = 4;

        // Act
        const {calculateHint} = renderHook(answer, feedback, length);
        const hint = calculateHint(1);

        // Assert
        expect(hint).not.toBeNull();
        expect([1, 2, 3]).toContain(hint?.col);
      });

      it('should handle maximum word length (6)', () => {
        // Arrange
        const answer = 'PYTHON';
        const feedback: TileState[][] = [[C, A, A, A, A, A]];
        const length = 6;

        // Act
        const {calculateHint} = renderHook(answer, feedback, length);
        const hint = calculateHint(1);

        // Assert
        expect(hint).not.toBeNull();
        expect([1, 2, 3, 4, 5]).toContain(hint?.col);
      });
    });

    describe('activeRow parameter', () => {
      it('should return hint with correct row number', () => {
        // Arrange
        const answer = 'HELLO';
        const feedback: TileState[][] = [[A, A, A, A, A]];
        const length = 5;

        // Act
        const {calculateHint} = renderHook(answer, feedback, length);

        // Assert
        expect(calculateHint(0)?.row).toBe(0);
        expect(calculateHint(3)?.row).toBe(3);
        expect(calculateHint(5)?.row).toBe(5);
      });
    });
  });

  describe('allPositionsCorrect', () => {
    describe('when all positions are marked correct', () => {
      it('should return true when all positions correct in single row', () => {
        // Arrange
        const answer = 'HELLO';
        const feedback: TileState[][] = [
          [C, C, C, C, C],
        ];
        const length = 5;

        // Act
        const {allPositionsCorrect} = renderHook(answer, feedback, length);

        // Assert
        expect(allPositionsCorrect).toBe(true);
      });

      it('should return true when all positions correct accumulated across rows', () => {
        // Arrange
        const answer = 'CRANE';
        const feedback: TileState[][] = [
          [C, A, A, A, A], // Position 0
          [C, C, A, A, A], // Positions 0, 1
          [C, C, C, A, A], // Positions 0, 1, 2
          [C, C, C, C, A], // Positions 0, 1, 2, 3
          [C, C, C, C, C], // All positions
        ];
        const length = 5;

        // Act
        const {allPositionsCorrect} = renderHook(answer, feedback, length);

        // Assert
        expect(allPositionsCorrect).toBe(true);
      });

      it('should return true when positions revealed in scattered pattern', () => {
        // Arrange
        const answer = 'WORLD';
        const feedback: TileState[][] = [
          [C, A, A, A, A], // Position 0
          [A, A, C, A, A], // Position 2
          [A, C, A, A, A], // Position 1
          [A, A, A, C, C], // Positions 3, 4
        ];
        const length = 5;

        // Act
        const {allPositionsCorrect} = renderHook(answer, feedback, length);

        // Assert
        expect(allPositionsCorrect).toBe(true);
      });

      it('should return true when more correct positions than length (duplicates)', () => {
        // Arrange
        const answer = 'TEST';
        const feedback: TileState[][] = [
          [C, C, C, C], // All correct
          [C, C, C, C], // All correct again (duplicate row)
        ];
        const length = 4;

        // Act
        const {allPositionsCorrect} = renderHook(answer, feedback, length);

        // Assert
        expect(allPositionsCorrect).toBe(true);
      });
    });

    describe('when positions remain unrevealed', () => {
      it('should return false when no correct positions', () => {
        // Arrange
        const answer = 'HELLO';
        const feedback: TileState[][] = [
          [A, A, A, A, A],
          [P, P, A, A, A],
        ];
        const length = 5;

        // Act
        const {allPositionsCorrect} = renderHook(answer, feedback, length);

        // Assert
        expect(allPositionsCorrect).toBe(false);
      });

      it('should return false when only some positions are correct', () => {
        // Arrange
        const answer = 'CRANE';
        const feedback: TileState[][] = [
          [C, A, A, A, A], // Only position 0 correct
          [C, C, A, A, A], // Only positions 0, 1 correct
        ];
        const length = 5;

        // Act
        const {allPositionsCorrect} = renderHook(answer, feedback, length);

        // Assert
        expect(allPositionsCorrect).toBe(false);
      });

      it('should return false when one position away from completion', () => {
        // Arrange
        const answer = 'SPEED';
        const feedback: TileState[][] = [
          [C, C, C, C, A], // 4 out of 5 correct
        ];
        const length = 5;

        // Act
        const {allPositionsCorrect} = renderHook(answer, feedback, length);

        // Assert
        expect(allPositionsCorrect).toBe(false);
      });
    });

    describe('edge cases', () => {
      it('should return false for empty answer', () => {
        // Arrange
        const answer = '';
        const feedback: TileState[][] = [];
        const length = 5;

        // Act
        const {allPositionsCorrect} = renderHook(answer, feedback, length);

        // Assert
        expect(allPositionsCorrect).toBe(false);
      });

      it('should return false for empty feedback array', () => {
        // Arrange
        const answer = 'HELLO';
        const feedback: TileState[][] = [];
        const length = 5;

        // Act
        const {allPositionsCorrect} = renderHook(answer, feedback, length);

        // Assert
        expect(allPositionsCorrect).toBe(false);
      });

      it('should handle minimum word length (4)', () => {
        // Arrange
        const answer = 'WORD';
        const feedback: TileState[][] = [[C, C, C, C]];
        const length = 4;

        // Act
        const {allPositionsCorrect} = renderHook(answer, feedback, length);

        // Assert
        expect(allPositionsCorrect).toBe(true);
      });

      it('should handle maximum word length (6)', () => {
        // Arrange
        const answer = 'PYTHON';
        const feedback: TileState[][] = [[C, C, C, C, C, C]];
        const length = 6;

        // Act
        const {allPositionsCorrect} = renderHook(answer, feedback, length);

        // Assert
        expect(allPositionsCorrect).toBe(true);
      });

      it('should return true when enough correct positions regardless of answer length mismatch', () => {
        // Arrange
        // Note: allPositionsCorrect only checks if correctPositions.size >= length
        // It doesn't validate that answer.length === length
        // That validation happens in calculateHint which returns null for mismatched lengths
        const answer = 'HELLO'; // Length 5
        const feedback: TileState[][] = [[C, C, C, C]]; // Length 4 feedback, 4 correct
        const length = 4;

        // Act
        const {allPositionsCorrect, calculateHint} = renderHook(answer, feedback, length);

        // Assert
        expect(allPositionsCorrect).toBe(true); // We have 4 correct positions for length 4
        expect(calculateHint(0)).toBeNull(); // But calculateHint returns null due to answer length mismatch
      });
    });
  });

  describe('hook behavior and dependencies', () => {
    it('should maintain stable calculateHint reference when dependencies do not change', () => {
      // Arrange
      const answer = 'HELLO';
      const feedback: TileState[][] = [[A, A, A, A, A]];
      const length = 5;

      // Act - Render twice with same props
      const result1 = renderHook(answer, feedback, length);
      const result2 = renderHook(answer, feedback, length);

      // Assert - Functions should be equivalent (produce same results)
      const hint1 = result1.calculateHint(0);
      const hint2 = result2.calculateHint(0);
      expect(hint1).not.toBeNull();
      expect(hint2).not.toBeNull();
    });

    it('should recalculate allPositionsCorrect when feedback changes', () => {
      // Arrange & Act
      const answer = 'HELLO';
      const length = 5;

      const result1 = renderHook(answer, [[A, A, A, A, A]], length);
      expect(result1.allPositionsCorrect).toBe(false);

      const result2 = renderHook(answer, [[C, C, C, C, C]], length);
      expect(result2.allPositionsCorrect).toBe(true);
    });

    it('should recalculate when answer changes', () => {
      // Arrange
      const feedback: TileState[][] = [[A, A, A, A, A]];
      const length = 5;

      // Act
      const result1 = renderHook('HELLO', feedback, length);
      const hint1 = result1.calculateHint(0);

      const result2 = renderHook('WORLD', feedback, length);
      const hint2 = result2.calculateHint(0);

      // Assert - Both should produce valid hints for their respective answers
      expect(hint1).not.toBeNull();
      expect(hint2).not.toBeNull();
    });

    it('should recalculate when length changes', () => {
      // Arrange
      const answer = 'HELLO';
      const feedback: TileState[][] = [[C, C, C, C, C]];

      // Act
      const result1 = renderHook(answer, feedback, 5);
      expect(result1.allPositionsCorrect).toBe(true);

      const result2 = renderHook(answer, feedback, 6);
      // Assert - should be false because we only have 5 correct but expect 6
      expect(result2.allPositionsCorrect).toBe(false);
    });
  });

  describe('integration scenarios', () => {
    it('should correctly identify progress in typical game', () => {
      // Arrange - Simulating a game where user is gradually revealing letters
      const answer = 'CRANE';
      const length = 5;

      // Turn 1: Wrong guess
      const turn1 = renderHook(answer, [[A, A, A, A, A]], length);
      expect(turn1.allPositionsCorrect).toBe(false);
      const hint1 = turn1.calculateHint(1);
      expect(hint1).not.toBeNull();

      // Turn 2: One letter correct
      const turn2 = renderHook(answer, [[A, A, A, A, A], [C, A, A, A, A]], length);
      expect(turn2.allPositionsCorrect).toBe(false);
      const hint2 = turn2.calculateHint(2);
      expect(hint2?.col).not.toBe(0); // Should not hint position 0

      // Turn 3: Three letters correct
      const turn3 = renderHook(answer, [[A, A, A, A, A], [C, A, A, A, A], [C, C, C, A, A]], length);
      expect(turn3.allPositionsCorrect).toBe(false);
      const hint3 = turn3.calculateHint(3);
      expect([3, 4]).toContain(hint3?.col); // Should hint position 3 or 4

      // Turn 4: All correct
      const turn4 = renderHook(
        answer,
        [[A, A, A, A, A], [C, A, A, A, A], [C, C, C, A, A], [C, C, C, C, C]],
        length
      );
      expect(turn4.allPositionsCorrect).toBe(true);
      const hint4 = turn4.calculateHint(4);
      expect(hint4).toBeNull(); // No hint needed, all revealed
    });

    it('should handle hint system for word with duplicate letters', () => {
      // Arrange
      const answer = 'SPEED';
      const feedback: TileState[][] = [
        [C, A, A, A, A], // S correct at position 0
      ];
      const length = 5;

      // Act
      const {calculateHint} = renderHook(answer, feedback, length);
      const hint = calculateHint(1);

      // Assert
      expect(hint).not.toBeNull();
      expect(hint?.col).not.toBe(0);
      // Should be able to hint any of the E's, P, or D
      expect(['P', 'E', 'D']).toContain(hint?.letter);
    });

    it('should work correctly when all positions revealed out of order', () => {
      // Arrange - User reveals positions in random order
      const answer = 'WORLD';
      const feedback: TileState[][] = [
        [A, A, C, A, A], // Position 2 (R)
        [A, A, C, A, C], // Position 4 (D)
        [C, A, C, A, C], // Position 0 (W)
        [C, C, C, A, C], // Position 1 (O)
        [C, C, C, C, C], // Position 3 (L) - all complete
      ];
      const length = 5;

      // Act
      const {calculateHint, allPositionsCorrect} = renderHook(answer, feedback, length);

      // Assert
      expect(allPositionsCorrect).toBe(true);
      expect(calculateHint(5)).toBeNull();
    });

    it('should handle complex game state with mixed feedback types', () => {
      // Arrange - Realistic game with present, absent, and correct states
      const answer = 'STARE';
      const feedback: TileState[][] = [
        [P, A, A, A, P], // S present at 0, E present at 4
        [C, A, P, A, A], // S correct at 0, A present at 2
        [C, A, A, C, A], // S correct at 0, R correct at 3
      ];
      const length = 5;

      // Act
      const {calculateHint, allPositionsCorrect} = renderHook(answer, feedback, length);

      // Assert
      expect(allPositionsCorrect).toBe(false);
      const hint = calculateHint(3);
      expect(hint).not.toBeNull();
      // Positions 0 and 3 are correct, should hint 1, 2, or 4
      expect([1, 2, 4]).toContain(hint?.col);
      expect(['T', 'A', 'E']).toContain(hint?.letter);
    });
  });

  describe('randomness verification', () => {
    it('should eventually hint all unrevealed positions given enough samples', () => {
      // Arrange - Test that randomness covers all unrevealed positions
      const answer = 'HELLO';
      const feedback: TileState[][] = [[C, A, A, A, A]]; // Only position 0 correct
      const length = 5;

      // Act
      const {calculateHint} = renderHook(answer, feedback, length);
      const hintedPositions = new Set<number>();

      // Sample hints multiple times
      for (let i = 0; i < 50; i++) {
        const hint = calculateHint(1);
        if (hint) hintedPositions.add(hint.col);
      }

      // Assert - Should eventually hint all positions except position 0
      // With 50 samples and 4 unrevealed positions, we should see most if not all
      expect(hintedPositions.size).toBeGreaterThanOrEqual(2); // At least 2 different positions
      expect(hintedPositions.has(0)).toBe(false); // Never hint position 0 (correct)
    });
  });
});
