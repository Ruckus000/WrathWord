# WrathWord: Test-Driven Refactoring Plan (v2.1)

## Quick Reference

- **Total Tasks:** 29 tasks across 6 phases
- **Estimated Duration:** 44-60 hours
- **Start With:** Phase 0 (Characterization Tests) - MANDATORY

## Revision Notes

This plan incorporates findings from critical review of the actual codebase:

| Finding | Original Assumption | Actual State | Resolution |
|---------|---------------------|--------------|------------|
| `selectDaily` signature | `(len, dateISO, answers)` | `(len, maxRows, dateISO, answers)` | WordSelector accepts GameConfig |
| Navigation | Needs React Navigation | State-based navigation works | Keep abstracted state navigation |
| Session management | Needs new SessionManager | `getValidAccessToken()` already exists | Refactor/relocate, don't recreate |
| Test location | Root `__tests__/` only | Co-located tests exist | Hybrid strategy documented |
| Stale game detection | Not captured | Complex modal logic exists | Added characterization tests |
| Cloud sync | Simple "record stats" | Multi-step local→cloud flow | Orchestration documented |
| Time estimates | 2-3 hours per phase | Unrealistic | Revised to 8-12 hours per phase |

---

## Phase Overview

```
Phase 0: Characterization Tests (4 hrs)
    ↓ [MUST COMPLETE FIRST]
Phase 1: Domain Layer (10-14 hrs)
    ↓
Phase 2: Application Layer (8-12 hrs)
    ↓
Phase 3: Infrastructure Layer (6-8 hrs)
    ↓
Phase 4: Presentation Layer (12-16 hrs)
    ↓
Phase 5: Integration & Cleanup (4-6 hrs)
```

---

## Phase 0: Characterization Tests (MANDATORY)

**These tests MUST be written and passing BEFORE any refactoring begins.**

### Task 0.1: evaluateGuess Characterization
```typescript
describe('evaluateGuess - characterization', () => {
  it('marks exact matches as correct');
  it('handles duplicate letters - LEVER vs HELLO');
  it('handles duplicate letters - LLAMA vs HELLO');
  it('prioritizes correct over present - ABBEY vs BABES');
  it('is case insensitive');
  it('handles all absent');
});
```

### Task 0.2: selectDaily Characterization
```typescript
describe('selectDaily - characterization', () => {
  it('is deterministic for same inputs');
  it('varies by date');
  it('varies by maxRows - CRITICAL');
  it('varies by length');
});
```

### Task 0.3: Stale Game Detection
```typescript
describe('stale game - characterization', () => {
  it('detects stale daily game from previous date with progress');
  it('does not flag stale game with no progress');
  it('does not flag free play games as stale');
});
```

### Task 0.4: Keyboard State Precedence
```typescript
describe('keyboard state - characterization', () => {
  it('upgrades key state: absent -> present -> correct');
  it('never downgrades key state');
  it('tracks best state per letter across multiple guesses');
});
```

### Task 0.5: Game Persistence
```typescript
describe('game persistence - characterization', () => {
  it('saves game state after each guess');
  it('restores game state on mount');
  it('uses user-scoped storage key');
  it('clears game state after completion');
  it('restores hint state');
});
```

### Task 0.6: Stats Recording
```typescript
describe('stats recording - characterization', () => {
  it('saves to local storage (recordGameResult)');
  it('then syncs to Supabase (directInsert)');
  it('local save succeeds even if cloud fails');
  it('updates guess distribution on win');
  it('updates streak correctly');
  it('marks words as used');
});
```

---

## Phase 1: Domain Layer

### Value Objects
- **Task 1.1:** TileState (comparison, precedence)
- **Task 1.2:** Feedback (isWin, toShareEmoji)
- **Task 1.3:** GameConfig (validation via VALID_LENGTHS, toSeedString)

### Domain Services
- **Task 1.4:** GuessEvaluator (two-pass algorithm, returns Feedback)
- **Task 1.5:** WordSelector (accepts GameConfig for proper seed)
- **Task 1.7:** HintProvider (skip correct positions)

### Interfaces
- **Task 1.6:** IWordList, IGameRepository, ICompletionRepository

### Aggregate Root
- **Task 1.8:** GameSession (all game state and rules)

---

## Phase 2: Application Layer

### Use Cases
- **Task 2.1:** SubmitGuessUseCase (local→cloud sync flow)
- **Task 2.2:** StartGameUseCase (stale game detection)
- **Task 2.3:** UseHintUseCase
- **Task 2.4:** AbandonGameUseCase

---

## Phase 3: Infrastructure Layer

### Existing Pattern Reference
```typescript
// FOLLOW THIS PATTERN from gameResultsService.ts
export function getGameResultsService(): IGameResultsService {
  return isDevelopment ? new MockGameResultsService() : new SupabaseGameResultsService();
}
```

### Tasks
- **Task 3.1:** StaticWordList (O(1) lookups via Set)
- **Task 3.2:** MMKVGameRepository (uses getScopedKey)
- **Task 3.3:** MMKVCompletionRepository (wraps dailyCompletion.ts)
- **Task 3.4:** SessionManager (refactor existing, don't recreate)

---

## Phase 4: Presentation Layer

### Navigation Decision
**Keep state-based navigation, abstract behind interface.**

### Tasks
- **Task 4.1:** useGameSession hook (extract 630 lines → hook)
- **Task 4.2:** GameScreen refactor (<200 lines)
- **Task 4.3:** Navigation abstraction (NavigationProvider)

---

## Phase 5: Integration & Cleanup

- **Task 5.1:** Wire up dependency injection
- **Task 5.2:** Remove deprecated delegations
- **Task 5.3:** Final E2E test suite
- **Task 5.4:** Documentation update

---

## Agent Execution Protocol

### Before Each Task
```bash
git status          # Clean state
npm test            # All tests pass
npx tsc --noEmit    # No TypeScript errors
```

### During Task
1. Write tests FIRST
2. Run tests (should fail)
3. Implement minimum code
4. Verify tests pass
5. Run full suite

### After Task
```bash
npm test
npx tsc --noEmit
git commit -m "feat(domain): add TileState value object"
```

---

## Verification Checklist

### After Each Phase
```
□ All new tests passing
□ All existing tests passing
□ All characterization tests passing
□ No TypeScript errors
□ Manual smoke test completed
```

### Final Verification
```
□ All unit tests pass (100+)
□ All integration tests pass (~30)
□ All E2E tests pass (~10)
□ Existing features work identically
```

---

**Full detailed plan:** See wrathword-tdd-refactoring-plan-v2.md in outputs
