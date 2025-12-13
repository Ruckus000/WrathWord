// src/hooks/useHintCalculation.ts
import {useCallback, useMemo} from 'react';
import {TileState} from '../logic/evaluateGuess';

export type HintResult = {
  row: number;
  col: number;
  letter: string;
};

/**
 * Pure calculation hook for hint system.
 * Returns calculation functions, does NOT own state.
 * State management stays in the component.
 */
export function useHintCalculation(
  answer: string,
  feedback: TileState[][],
  length: number
) {
  // NO early returns before hooks - violates Rules of Hooks

  const calculateHint = useCallback((activeRow: number): HintResult | null => {
    // Safety checks INSIDE the callback
    if (!answer || answer.length !== length) return null;

    const correctPositions = new Set<number>();
    feedback.forEach(fb => {
      fb.forEach((state, idx) => {
        if (state === 'correct') correctPositions.add(idx);
      });
    });

    const unrevealed: number[] = [];
    for (let i = 0; i < length; i++) {
      if (!correctPositions.has(i)) unrevealed.push(i);
    }

    if (unrevealed.length === 0) return null;

    const position = unrevealed[Math.floor(Math.random() * unrevealed.length)];
    return {
      row: activeRow,
      col: position,
      letter: answer[position].toUpperCase(),
    };
  }, [answer, feedback, length]);

  const allPositionsCorrect = useMemo(() => {
    // Safety checks INSIDE the memo
    if (!answer || feedback.length === 0) return false;

    const correctPositions = new Set<number>();
    feedback.forEach(fb => {
      fb.forEach((state, idx) => {
        if (state === 'correct') correctPositions.add(idx);
      });
    });
    return correctPositions.size >= length;
  }, [answer, feedback, length]);

  return {calculateHint, allPositionsCorrect};
}
