# Task 5.3: Remove Legacy Code (SEQUENTIAL - Wave 2)

## Agent Assignment
This task runs **after Task 5.2 completes**.
Task 5.4 depends on this task completing.

## Prerequisite
✅ Task 5.2 must be complete (App.tsx using new GameScreen location)

## Objective
Remove deprecated/legacy code that has been replaced by the new Clean Architecture implementation.

## Files to Delete
- `src/screens/GameScreen.tsx` (old 600+ line version)

## Files to Verify Still Work
- `src/logic/evaluateGuess.ts` - Keep this! Still used by existing code paths
- `src/logic/selectDaily.ts` - Keep this! Still used by useGameSession

## Why NOT Delete Logic Files Yet

The original plan suggested deleting `evaluateGuess.ts` and `selectDaily.ts`, but:

1. **useGameSession still uses them:**
```typescript
// src/presentation/screens/Game/useGameSession.ts
import { selectDaily } from '../../../logic/selectDaily';
```

2. **The domain services are created but not yet wired:**
   - `GuessEvaluator` in domain layer exists
   - But useGameSession uses the old `evaluateGuess` path indirectly through infrastructure

3. **Safe approach:** Only delete files with zero imports

## Implementation

### Step 1: Verify No Imports of Old GameScreen

```bash
# Search for imports of old GameScreen location
grep -r "from.*screens/GameScreen" src/ app/

# Should return NOTHING after Task 5.2 is complete
# If it returns results, Task 5.2 is not complete - STOP
```

### Step 2: Delete Old GameScreen

```bash
# Delete the old file
rm src/screens/GameScreen.tsx

# Verify deletion
ls src/screens/
# Should NOT contain GameScreen.tsx
```

### Step 3: Verify Build Still Works

```bash
# Type check
npx tsc --noEmit

# If this fails, something still imports the old file
# Restore and fix the import first
```

### Step 4: Run Tests

```bash
# All tests should still pass
npm test
```

## What Stays (For Now)

| File | Reason to Keep |
|------|----------------|
| `src/logic/evaluateGuess.ts` | Used by characterization tests and legacy paths |
| `src/logic/selectDaily.ts` | Used by `useGameSession.ts` |
| `src/logic/rng.ts` | Used by `selectDaily.ts` |
| `src/storage/mmkv.ts` | Used everywhere |
| `src/storage/dailyCompletion.ts` | Used by infrastructure layer |

## What Gets Deleted

| File | Reason to Delete |
|------|------------------|
| `src/screens/GameScreen.tsx` | Replaced by `src/presentation/screens/Game/GameScreen.tsx` |

## Safety Checks

Before deleting, verify:

```typescript
// 1. Check App.tsx import
// app/App.tsx should have:
import GameScreen from '../src/presentation/screens/Game/GameScreen';
// NOT:
import GameScreen from '../src/screens/GameScreen';

// 2. Check no other files import old location
// Run: grep -r "from.*screens/GameScreen" src/ app/
// Should return empty
```

## Rollback Plan

If something breaks after deletion:

```bash
# Restore from git
git checkout HEAD -- src/screens/GameScreen.tsx

# Fix the issue, then try again
```

## Verification

```bash
# 1. Verify file is deleted
test ! -f src/screens/GameScreen.tsx && echo "✅ Old GameScreen deleted"

# 2. Type check passes
npx tsc --noEmit && echo "✅ TypeScript OK"

# 3. All tests pass
npm test && echo "✅ Tests pass"

# 4. Verify new GameScreen exists
test -f src/presentation/screens/Game/GameScreen.tsx && echo "✅ New GameScreen exists"
```

## Line Count Comparison

| Version | Lines | Status |
|---------|-------|--------|
| Old `src/screens/GameScreen.tsx` | ~630 | ❌ DELETED |
| New `src/presentation/screens/Game/GameScreen.tsx` | ~188 | ✅ Active |
| New `src/presentation/screens/Game/useGameSession.ts` | ~708 | ✅ Active |

**Total reduction:** 630 lines of tangled UI+logic → 188 lines pure UI + 708 lines clean logic = better separation!

## Completion Criteria
- [ ] Old `src/screens/GameScreen.tsx` deleted
- [ ] No import errors
- [ ] TypeScript compiles successfully
- [ ] All tests pass
- [ ] App runs correctly (manual smoke test)

## Commit Message
```
chore: remove legacy GameScreen (replaced by presentation layer)

The old 630-line GameScreen has been replaced by:
- src/presentation/screens/Game/GameScreen.tsx (188 lines, pure UI)
- src/presentation/screens/Game/useGameSession.ts (708 lines, clean logic)

This achieves proper separation of concerns following Clean Architecture.
```
