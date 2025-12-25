# Task 0.4: Keyboard State Characterization

## Objective
Create characterization tests for keyboard state tracking logic. The key rule is: states can UPGRADE (absent→present→correct) but NEVER downgrade.

## Current Behavior
The keyboard tracks the "best" state for each letter across all guesses:
- `correct` > `present` > `absent`
- Once a letter is marked `correct`, it stays `correct`
- Once a letter is marked `present`, it can upgrade to `correct` but not downgrade to `absent`

## Files to Create
- `__tests__/characterization/keyboardState.characterization.test.ts`

## Test Code (Copy Exactly)

```typescript
// __tests__/characterization/keyboardState.characterization.test.ts

import { TileState } from '../../src/logic/evaluateGuess';

/**
 * CHARACTERIZATION TESTS
 * 
 * These tests document the keyboard state tracking behavior.
 * Rule: States only upgrade, never downgrade.
 * Precedence: correct > present > absent
 */

// Helper to simulate keyboard state updates (mirrors GameScreen logic)
function updateKeyboardStates(
  currentStates: Map<string, TileState>,
  guess: string,
  feedback: TileState[]
): Map<string, TileState> {
  const newStates = new Map(currentStates);
  const precedence: Record<TileState, number> = {
    absent: 0,
    present: 1,
    correct: 2,
  };

  for (let i = 0; i < guess.length; i++) {
    const letter = guess[i].toUpperCase();
    const newState = feedback[i];
    const currentState = newStates.get(letter);

    // Only update if new state has higher precedence
    if (!currentState || precedence[newState] > precedence[currentState]) {
      newStates.set(letter, newState);
    }
  }

  return newStates;
}

describe('keyboard state - characterization', () => {
  describe('precedence ordering', () => {
    it('correct > present > absent', () => {
      const precedence = { absent: 0, present: 1, correct: 2 };
      expect(precedence.correct).toBeGreaterThan(precedence.present);
      expect(precedence.present).toBeGreaterThan(precedence.absent);
    });
  });

  describe('initial state', () => {
    it('starts with empty map - no letters have state', () => {
      const states = new Map<string, TileState>();
      expect(states.size).toBe(0);
      expect(states.get('A')).toBeUndefined();
    });
  });

  describe('first guess updates', () => {
    it('sets initial states for all letters in guess', () => {
      const states = new Map<string, TileState>();
      const feedback: TileState[] = ['correct', 'present', 'absent', 'absent', 'correct'];
      
      const newStates = updateKeyboardStates(states, 'CRANE', feedback);
      
      expect(newStates.get('C')).toBe('correct');
      expect(newStates.get('R')).toBe('present');
      expect(newStates.get('A')).toBe('absent');
      expect(newStates.get('N')).toBe('absent');
      expect(newStates.get('E')).toBe('correct');
    });
  });

  describe('upgrade behavior', () => {
    it('upgrades absent to present', () => {
      const states = new Map<string, TileState>([['A', 'absent']]);
      const feedback: TileState[] = ['present', 'absent', 'absent', 'absent', 'absent'];
      
      const newStates = updateKeyboardStates(states, 'ABCDE', feedback);
      
      expect(newStates.get('A')).toBe('present');
    });

    it('upgrades absent to correct', () => {
      const states = new Map<string, TileState>([['A', 'absent']]);
      const feedback: TileState[] = ['correct', 'absent', 'absent', 'absent', 'absent'];
      
      const newStates = updateKeyboardStates(states, 'ABCDE', feedback);
      
      expect(newStates.get('A')).toBe('correct');
    });

    it('upgrades present to correct', () => {
      const states = new Map<string, TileState>([['A', 'present']]);
      const feedback: TileState[] = ['correct', 'absent', 'absent', 'absent', 'absent'];
      
      const newStates = updateKeyboardStates(states, 'ABCDE', feedback);
      
      expect(newStates.get('A')).toBe('correct');
    });
  });

  describe('NO downgrade behavior - CRITICAL', () => {
    it('does NOT downgrade correct to present', () => {
      const states = new Map<string, TileState>([['A', 'correct']]);
      const feedback: TileState[] = ['present', 'absent', 'absent', 'absent', 'absent'];
      
      const newStates = updateKeyboardStates(states, 'ABCDE', feedback);
      
      expect(newStates.get('A')).toBe('correct'); // Stays correct!
    });

    it('does NOT downgrade correct to absent', () => {
      const states = new Map<string, TileState>([['A', 'correct']]);
      const feedback: TileState[] = ['absent', 'absent', 'absent', 'absent', 'absent'];
      
      const newStates = updateKeyboardStates(states, 'ABCDE', feedback);
      
      expect(newStates.get('A')).toBe('correct'); // Stays correct!
    });

    it('does NOT downgrade present to absent', () => {
      const states = new Map<string, TileState>([['A', 'present']]);
      const feedback: TileState[] = ['absent', 'absent', 'absent', 'absent', 'absent'];
      
      const newStates = updateKeyboardStates(states, 'ABCDE', feedback);
      
      expect(newStates.get('A')).toBe('present'); // Stays present!
    });
  });

  describe('multi-guess scenarios', () => {
    it('accumulates best states across multiple guesses', () => {
      let states = new Map<string, TileState>();
      
      // Guess 1: CRANE -> some feedback
      states = updateKeyboardStates(states, 'CRANE', 
        ['absent', 'absent', 'present', 'absent', 'correct']);
      
      expect(states.get('C')).toBe('absent');
      expect(states.get('A')).toBe('present');
      expect(states.get('E')).toBe('correct');
      
      // Guess 2: SLATE -> A becomes correct
      states = updateKeyboardStates(states, 'SLATE', 
        ['absent', 'absent', 'correct', 'absent', 'correct']);
      
      expect(states.get('A')).toBe('correct'); // Upgraded from present
      expect(states.get('S')).toBe('absent');
      expect(states.get('L')).toBe('absent');
      
      // Guess 3: SHARE -> A appears as absent, but should stay correct
      states = updateKeyboardStates(states, 'SHARE', 
        ['absent', 'absent', 'absent', 'absent', 'correct']);
      
      expect(states.get('A')).toBe('correct'); // STILL correct, not downgraded
    });

    it('handles same letter appearing multiple times in one guess', () => {
      const states = new Map<string, TileState>();
      // Guess: LLAMA, Answer: APPLE
      // First L = present, Second L = absent
      // The higher state (present) should win for the letter L
      const feedback: TileState[] = ['present', 'absent', 'correct', 'absent', 'correct'];
      
      const newStates = updateKeyboardStates(states, 'LLAMA', feedback);
      
      // L appears twice with different feedback - should take the best
      // Actually, they process in order, so first L=present, second L tries to set absent
      // But absent < present, so it stays present
      expect(newStates.get('L')).toBe('present');
    });
  });

  describe('case insensitivity', () => {
    it('treats lowercase guess as uppercase for keyboard', () => {
      const states = new Map<string, TileState>();
      const feedback: TileState[] = ['correct', 'absent', 'absent', 'absent', 'absent'];
      
      const newStates = updateKeyboardStates(states, 'crane', feedback);
      
      expect(newStates.get('C')).toBe('correct');
      expect(newStates.has('c')).toBe(false); // Stored as uppercase
    });
  });
});
```

## Verification Commands

```bash
# Run the characterization test
npm test -- --testPathPattern="keyboardState.characterization"

# Verify no TypeScript errors
npx tsc --noEmit
```

## Expected Result
All tests should PASS.

## Completion Criteria
- [ ] Test file created at correct path
- [ ] All tests pass (green)
- [ ] No TypeScript errors
- [ ] Committed with message: `test(characterization): add keyboard state tests`

## Next Task
After completing this task, update `REFACTOR_PROGRESS.md` and proceed to Task 0.5.
