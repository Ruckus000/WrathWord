# Task 2.0: CORRECTIONS - Fix Phase 1 Issues

## Priority: HIGH - Do this BEFORE other Phase 2 tasks

Two issues were identified in the Phase 1 review that must be fixed.

---

## Correction 1: Move Use Cases to Application Layer

### Problem
`SubmitGuessUseCase.ts` was placed in `src/domain/game/usecases/` but Clean Architecture requires use cases in the **Application Layer**, not the Domain Layer.

### Actions

```bash
# 1. Create application layer directory
mkdir -p src/application/game

# 2. Move the use case file
mv src/domain/game/usecases/SubmitGuessUseCase.ts src/application/game/SubmitGuessUseCase.ts

# 3. Move the test file
mkdir -p __tests__/application/game
mv __tests__/domain/game/usecases/SubmitGuessUseCase.test.ts __tests__/application/game/SubmitGuessUseCase.test.ts

# 4. Remove empty directories
rmdir src/domain/game/usecases
rmdir __tests__/domain/game/usecases
```

### Update Imports in SubmitGuessUseCase.ts

Change:
```typescript
import { GameSession } from '../entities/GameSession';
import { IWordList } from '../repositories/IWordList';
import { IGameRepository, PersistedGameState } from '../repositories/IGameRepository';
import { ICompletionRepository } from '../repositories/ICompletionRepository';
import { ValidLength } from '../value-objects/GameConfig';
```

To:
```typescript
import { GameSession } from '../../domain/game/entities/GameSession';
import { IWordList } from '../../domain/game/repositories/IWordList';
import { IGameRepository, PersistedGameState } from '../../domain/game/repositories/IGameRepository';
import { ICompletionRepository } from '../../domain/game/repositories/ICompletionRepository';
import { ValidLength } from '../../domain/game/value-objects/GameConfig';
```

### Update Imports in Test File

Change test imports to point to new location:
```typescript
import { SubmitGuessUseCase } from '../../../src/application/game/SubmitGuessUseCase';
```

---

## Correction 2: Update ICompletionRepository Signature

### Problem
`ICompletionRepository` is missing `maxRows` parameter. The existing `dailyCompletion.ts` includes `maxRows` in key calculation because different puzzle configurations (e.g., 6 rows vs 4 rows) are separate dailies.

### Update ICompletionRepository.ts

Replace the file content with:

```typescript
// src/domain/game/repositories/ICompletionRepository.ts

import { ValidLength } from '../value-objects/GameConfig';

/**
 * Interface for tracking daily puzzle completion.
 * Prevents replaying the same daily puzzle.
 * 
 * IMPORTANT: maxRows is part of the key because different puzzle
 * configurations (e.g., 6 rows vs 4 rows) are separate dailies.
 */
export interface ICompletionRepository {
  /**
   * Check if the daily puzzle for a given configuration is completed.
   * @param length Word length (4, 5, or 6)
   * @param maxRows Maximum guesses allowed
   * @param dateISO Date in ISO format (YYYY-MM-DD)
   */
  isDailyCompleted(length: ValidLength, maxRows: number, dateISO: string): boolean;

  /**
   * Mark the daily puzzle as completed.
   * @param length Word length (4, 5, or 6)
   * @param maxRows Maximum guesses allowed
   * @param dateISO Date in ISO format (YYYY-MM-DD)
   */
  markDailyCompleted(length: ValidLength, maxRows: number, dateISO: string): void;

  /**
   * Get all completed dates for a given length and maxRows.
   */
  getCompletedDates(length: ValidLength, maxRows: number): string[];

  /**
   * Clear completion status for a specific configuration (for testing).
   */
  clearCompletion(length: ValidLength, maxRows: number, dateISO: string): void;
}
```

### Update SubmitGuessUseCase.ts

Find this code:
```typescript
if (newSession.isGameOver() && newSession.config.isDaily()) {
  this.completionRepository.markDailyCompleted(
    newSession.config.dateISO,
    newSession.config.length,
  );
}
```

Change to:
```typescript
if (newSession.isGameOver() && newSession.config.isDaily()) {
  this.completionRepository.markDailyCompleted(
    newSession.config.length,
    newSession.config.maxRows,
    newSession.config.dateISO,
  );
}
```

### Update Repository Tests

Update `__tests__/domain/game/repositories/repositories.test.ts` to use the new signature.

---

## Verification

```bash
# Run all tests to ensure nothing broke
npm test

# Type check
npx tsc --noEmit
```

## Completion Criteria

- [ ] `src/application/game/SubmitGuessUseCase.ts` exists (moved from domain)
- [ ] `src/domain/game/usecases/` directory deleted
- [ ] `ICompletionRepository` has `maxRows` parameter in all methods
- [ ] `SubmitGuessUseCase` passes `maxRows` to completion repository
- [ ] All tests pass
- [ ] No TypeScript errors

## Next Task

After completing these corrections, proceed to Task 2.2: StartGameUseCase (Task 2.1 is now just "verify SubmitGuessUseCase works after move").
