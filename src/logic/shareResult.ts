// src/logic/shareResult.ts
import {TileState} from './evaluateGuess';

export type ShareFormat = {
  text: string;
  title: string;
};

/**
 * Generate shareable text with emoji grid
 */
export function generateShareText(params: {
  length: number;
  maxRows: number;
  guesses: number;
  won: boolean;
  feedback: TileState[][];
  date: string; // ISO date
}): ShareFormat {
  const {length, maxRows, guesses, won, feedback, date} = params;

  // Format date (e.g., "Oct 26, 2024")
  const dateObj = new Date(date);
  const formattedDate = dateObj.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  // Build title
  const title = `WrathWord ${length}×${maxRows}`;

  // Build score line
  const scoreLine = won ? `${guesses}/${maxRows}` : `X/${maxRows}`;

  // Convert feedback to emoji grid
  const emojiGrid = feedback
    .map(row => {
      return row
        .map(state => {
          switch (state) {
            case 'correct':
              return '🟩';
            case 'present':
              return '🟨';
            case 'absent':
              return '⬛';
            default:
              return '⬜';
          }
        })
        .join('');
    })
    .join('\n');

  // Combine all parts
  const text = `${title}\n${formattedDate}\n${scoreLine}\n\n${emojiGrid}`;

  return {
    text,
    title,
  };
}

/**
 * Get result emoji based on score
 */
export function getResultEmoji(guesses: number, maxRows: number, won: boolean): string {
  if (!won) return '😔';

  const performance = guesses / maxRows;

  if (guesses === 1) return '🤯'; // Hole in one!
  if (performance <= 0.33) return '🎉'; // Brilliant (1-2 out of 6)
  if (performance <= 0.5) return '😎'; // Amazing
  if (performance <= 0.67) return '👏'; // Great
  return '✅'; // Nice

}

/**
 * Get result title based on score
 */
export function getResultTitle(guesses: number, maxRows: number, won: boolean): string {
  if (!won) return 'Better Luck Next Time';

  const performance = guesses / maxRows;

  if (guesses === 1) return 'Incredible!';
  if (performance <= 0.33) return 'Brilliant!';
  if (performance <= 0.5) return 'Amazing!';
  if (performance <= 0.67) return 'Great Job!';
  return 'Well Done!';
}
