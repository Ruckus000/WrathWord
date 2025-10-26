// src/logic/evaluateGuess.ts
export type TileState = 'correct' | 'present' | 'absent';

export function evaluateGuess(answer: string, guess: string): TileState[] {
  // Normalize to lowercase for case-insensitive comparison
  const ans = answer.toLowerCase();
  const gss = guess.toLowerCase();
  const n = ans.length;
  const res: TileState[] = Array(n).fill('absent');
  const remaining: Record<string, number> = {};

  // First pass: mark correct positions
  for (let i = 0; i < n; i++) {
    if (gss[i] === ans[i]) {
      res[i] = 'correct';
    } else {
      remaining[ans[i]] = (remaining[ans[i]] || 0) + 1;
    }
  }

  // Second pass: mark present letters
  for (let i = 0; i < n; i++) {
    if (res[i] === 'correct') continue;
    const ch = gss[i];
    if (remaining[ch] > 0) {
      res[i] = 'present';
      remaining[ch]--;
    }
  }

  return res;
}
