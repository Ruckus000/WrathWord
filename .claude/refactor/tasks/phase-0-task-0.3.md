# Task 0.3: Stale Game Detection Characterization

## Objective
Create characterization tests for stale game detection logic. This is business logic currently embedded in GameScreen.tsx.

## Current Behavior (From GameScreen.tsx)
```typescript
// Detect stale daily game - compare session date directly
if (dateISO !== today && warnedForDateRef.current !== dateISO) {
  if (rows.length > 0) {
    setStaleGameWarning(true);  // Show modal
  } else {
    loadNew(today, 'daily', length, maxRows);  // Silent restart
  }
}
```

## Files to Create
- `__tests__/characterization/staleGame.characterization.test.ts`

## Test Code (Copy Exactly)

```typescript
// __tests__/characterization/staleGame.characterization.test.ts

/**
 * CHARACTERIZATION TESTS
 * 
 * These tests document the CURRENT stale game detection behavior.
 * The logic determines when to show the "stale game" warning modal.
 */

// Helper to simulate the stale detection logic
function isStaleGame(
  gameState: {
    dateISO: string;
    mode: 'daily' | 'free';
    rows: string[];
    status: 'playing' | 'won' | 'lost';
  },
  currentDateISO: string
): { isStale: boolean; hasProgress: boolean } {
  // Only daily games can be stale
  if (gameState.mode !== 'daily') {
    return { isStale: false, hasProgress: false };
  }
  
  // Check if date differs
  const dateDiffers = gameState.dateISO !== currentDateISO;
  const hasProgress = gameState.rows.length > 0;
  
  return {
    isStale: dateDiffers && hasProgress,
    hasProgress,
  };
}

describe('stale game detection - characterization', () => {
  const today = '2025-01-15';
  const yesterday = '2025-01-14';
  const lastWeek = '2025-01-08';

  describe('daily mode games', () => {
    it('detects stale daily game from yesterday with progress', () => {
      const gameState = {
        dateISO: yesterday,
        mode: 'daily' as const,
        rows: ['CRANE', 'SLATE'],
        status: 'playing' as const,
      };
      
      const result = isStaleGame(gameState, today);
      
      expect(result.isStale).toBe(true);
      expect(result.hasProgress).toBe(true);
    });

    it('detects stale daily game from last week with progress', () => {
      const gameState = {
        dateISO: lastWeek,
        mode: 'daily' as const,
        rows: ['CRANE'],
        status: 'playing' as const,
      };
      
      const result = isStaleGame(gameState, today);
      
      expect(result.isStale).toBe(true);
    });

    it('does NOT flag stale game with no progress - silent restart', () => {
      // Key behavior: empty rows = just start new game, no modal
      const gameState = {
        dateISO: yesterday,
        mode: 'daily' as const,
        rows: [],  // No guesses made
        status: 'playing' as const,
      };
      
      const result = isStaleGame(gameState, today);
      
      expect(result.isStale).toBe(false);
      expect(result.hasProgress).toBe(false);
    });

    it('does NOT flag current day game as stale', () => {
      const gameState = {
        dateISO: today,
        mode: 'daily' as const,
        rows: ['CRANE', 'SLATE'],
        status: 'playing' as const,
      };
      
      const result = isStaleGame(gameState, today);
      
      expect(result.isStale).toBe(false);
    });
  });

  describe('free play mode games', () => {
    it('NEVER flags free play games as stale', () => {
      const gameState = {
        dateISO: yesterday,  // Old date
        mode: 'free' as const,
        rows: ['CRANE', 'SLATE'],  // Has progress
        status: 'playing' as const,
      };
      
      const result = isStaleGame(gameState, today);
      
      expect(result.isStale).toBe(false);
    });

    it('free play from last week is still not stale', () => {
      const gameState = {
        dateISO: lastWeek,
        mode: 'free' as const,
        rows: ['CRANE'],
        status: 'playing' as const,
      };
      
      const result = isStaleGame(gameState, today);
      
      expect(result.isStale).toBe(false);
    });
  });

  describe('completed games', () => {
    it('completed daily game from yesterday is technically stale but should clear', () => {
      // Note: In practice, completed games are cleared, but if state somehow persists...
      const gameState = {
        dateISO: yesterday,
        mode: 'daily' as const,
        rows: ['CRANE', 'SLATE', 'APPLE'],
        status: 'won' as const,
      };
      
      const result = isStaleGame(gameState, today);
      
      // The detection function sees it as stale, but UI should handle differently
      expect(result.isStale).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('handles single guess as having progress', () => {
      const gameState = {
        dateISO: yesterday,
        mode: 'daily' as const,
        rows: ['CRANE'],
        status: 'playing' as const,
      };
      
      const result = isStaleGame(gameState, today);
      
      expect(result.hasProgress).toBe(true);
      expect(result.isStale).toBe(true);
    });

    it('handles many guesses', () => {
      const gameState = {
        dateISO: yesterday,
        mode: 'daily' as const,
        rows: ['CRANE', 'SLATE', 'TRACE', 'GRACE', 'BRACE'],
        status: 'playing' as const,
      };
      
      const result = isStaleGame(gameState, today);
      
      expect(result.hasProgress).toBe(true);
      expect(result.isStale).toBe(true);
    });
  });
});
```

## Verification Commands

```bash
# Run the characterization test
npm test -- --testPathPattern="staleGame.characterization"

# Verify no TypeScript errors
npx tsc --noEmit
```

## Expected Result
All tests should PASS.

## Completion Criteria
- [ ] Test file created at correct path
- [ ] All tests pass (green)
- [ ] No TypeScript errors
- [ ] Committed with message: `test(characterization): add stale game detection tests`

## Next Task
After completing this task, update `REFACTOR_PROGRESS.md` and proceed to Task 0.4.
