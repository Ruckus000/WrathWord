// src/logic/__tests__/evaluateGuess.test.ts
import { evaluateGuess, TileState } from '../evaluateGuess';

describe('evaluateGuess', () => {
  // Helper to make tests more readable
  const C: TileState = 'correct';
  const P: TileState = 'present';
  const A: TileState = 'absent';

  describe('basic cases', () => {
    test('all correct letters', () => {
      expect(evaluateGuess('hello', 'hello')).toEqual([C, C, C, C, C]);
    });

    test('all absent letters', () => {
      expect(evaluateGuess('hello', 'stark')).toEqual([A, A, A, A, A]);
    });

    test('mixed correct and absent', () => {
      // answer: HELLO (H at 0, E at 1, L at 2,3, O at 4)
      // guess:  HASTE (H at 0, A at 1, S at 2, T at 3, E at 4)
      // H matches position 0 (correct), E is in answer but wrong position (present)
      expect(evaluateGuess('hello', 'haste')).toEqual([C, A, A, A, P]);
    });
  });

  describe('duplicate letter handling', () => {
    test('ROBOT vs FLOOR - duplicate O handling', () => {
      // answer: ROBOT (R at 0, O at 1, B at 2, O at 3, T at 4)
      // guess:  FLOOR (F at 0, L at 1, O at 2, O at 3, R at 4)
      // Expected: F=absent, L=absent, O1=present, O2=correct (position 3), R=present
      expect(evaluateGuess('robot', 'floor')).toEqual([A, A, P, C, P]);
    });

    test('ABBEY vs KEBAB - duplicate B handling', () => {
      // answer: ABBEY (A at 0, B at 1, B at 2, E at 3, Y at 4)
      // guess:  KEBAB (K at 0, E at 1, B at 2, A at 3, B at 4)
      // Expected: K=absent, E=present, B=correct (position 2), A=present, B=present (2 Bs in answer, one used for correct)
      expect(evaluateGuess('abbey', 'kebab')).toEqual([A, P, C, P, P]);
    });

    test('SPEED vs ERASE - duplicate E handling', () => {
      // answer: SPEED (S at 0, P at 1, E at 2, E at 3, D at 4)
      // guess:  ERASE (E at 0, R at 1, A at 2, S at 3, E at 4)
      // Expected: E=present, R=absent, A=absent, S=present, E=present (2 Es in answer, both used)
      expect(evaluateGuess('speed', 'erase')).toEqual([P, A, A, P, P]);
    });

    test('ESSES vs SEES - multiple duplicate handling', () => {
      // answer: ESSES (E at 0, S at 1, S at 2, E at 3, S at 4) - 2 Es, 3 Ss
      // guess:  SEES  (S at 0, E at 1, E at 2, S at 3) - 2 Es, 2 Ss (length 4)
      // Expected: S=present, E=present, E=present, S=present, absent (5th position doesn't exist in guess)
      // But wait, guess is length 4, answer is length 5. This is actually:
      // S=present (matches S at 1,2,4), E=present (matches E at 0,3), E=present, S=present
      expect(evaluateGuess('esses', 'sees')).toEqual([P, P, P, P, A]);
    });

    test('exact match wins over present', () => {
      // answer: SPLIT (S at 0, P at 1, L at 2, I at 3, T at 4)
      // guess:  PILLS (P at 0, I at 1, L at 2, L at 3, S at 4)
      // Expected: P=present, I=present, L=correct, L=absent (only 1 L in answer, used for correct), S=present
      expect(evaluateGuess('split', 'pills')).toEqual([P, P, C, A, P]);
    });

    test('duplicate in guess but single in answer', () => {
      // answer: SOLID
      // guess:  LLAMA
      // Expected: L=present, L=absent, A=absent, M=absent, A=absent
      expect(evaluateGuess('solid', 'llama')).toEqual([P, A, A, A, A]);
    });

    test('correct position takes precedence', () => {
      // answer: SKILL (S at 0, K at 1, I at 2, L at 3, L at 4)
      // guess:  LLAMA (L at 0, L at 1, A at 2, M at 3, A at 4)
      // Expected: L=present, L=present (2 Ls in answer at positions 3,4), A=absent, M=absent, A=absent
      expect(evaluateGuess('skill', 'llama')).toEqual([P, P, A, A, A]);
    });
  });

  describe('word lengths 2-6', () => {
    test('length 2', () => {
      expect(evaluateGuess('at', 'at')).toEqual([C, C]);
      expect(evaluateGuess('at', 'ta')).toEqual([P, P]);
    });

    test('length 3', () => {
      // CAT vs ACT: A=present, C=present, T=correct
      expect(evaluateGuess('cat', 'act')).toEqual([P, P, C]);
      expect(evaluateGuess('cat', 'car')).toEqual([C, C, A]);
    });

    test('length 4', () => {
      expect(evaluateGuess('word', 'worm')).toEqual([C, C, C, A]);
    });

    test('length 5', () => {
      expect(evaluateGuess('crane', 'crate')).toEqual([C, C, C, A, C]);
    });

    test('length 6', () => {
      // PYTHON vs IPHONY: I=absent, P=present, H=present, O=present, N=present, Y=present
      expect(evaluateGuess('python', 'iphony')).toEqual([A, P, P, P, P, P]);
    });
  });

  describe('edge cases', () => {
    test('all same letter in answer and guess', () => {
      expect(evaluateGuess('aaaa', 'aaaa')).toEqual([C, C, C, C]);
    });

    test('all same letter in guess, different answer', () => {
      // TEST vs EEEE: T has 2 Es, so first E is absent, second E is correct, rest absent
      expect(evaluateGuess('test', 'eeee')).toEqual([A, C, A, A]);
    });

    test('reversed word', () => {
      expect(evaluateGuess('star', 'rats')).toEqual([P, P, P, P]);
    });

    test('case insensitivity', () => {
      expect(evaluateGuess('HELLO', 'hello')).toEqual([C, C, C, C, C]);
      expect(evaluateGuess('hello', 'HELLO')).toEqual([C, C, C, C, C]);
      expect(evaluateGuess('HeLLo', 'hEllO')).toEqual([C, C, C, C, C]);
    });
  });

  describe('real-world Wordle examples', () => {
    test('classic Wordle puzzle', () => {
      // answer: CRANE (C at 0, R at 1, A at 2, N at 3, E at 4)
      // guess:  STARE (S at 0, T at 1, A at 2, R at 3, E at 4)
      // Expected: S=absent, T=absent, A=correct, R=present, E=correct
      expect(evaluateGuess('crane', 'stare')).toEqual([A, A, C, P, C]);
      // answer: CRANE (C at 0, R at 1, A at 2, N at 3, E at 4)
      // guess:  TRACE (T at 0, R at 1, A at 2, C at 3, E at 4)
      // Expected: T=absent, R=correct, A=correct, C=present, E=correct
      expect(evaluateGuess('crane', 'trace')).toEqual([A, C, C, P, C]);
    });

    test('tricky duplicate scenario', () => {
      // answer: VIVID (V at 0, I at 1, V at 2, I at 3, D at 4)
      // guess:  VALVE (V at 0, A at 1, L at 2, V at 3, E at 4)
      // Expected: V=correct (position 0), A=absent, L=absent, V=present (matches position 2), E=absent
      expect(evaluateGuess('vivid', 'valve')).toEqual([C, A, A, P, A]);
    });

    test('no matches at all', () => {
      // answer: QUICK
      // guess:  NYMPH
      expect(evaluateGuess('quick', 'nymph')).toEqual([A, A, A, A, A]);
    });
  });
});
