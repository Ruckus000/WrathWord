# WrathWord

React Native word puzzle game (iOS-focused) with Supabase backend.

---

## 🚨 ACTIVE REFACTORING IN PROGRESS

**If you're here to continue the TDD refactoring, read `.claude/refactor/REFACTOR_RUNNER.md` first.**

Quick start for refactoring:
```
Read .claude/refactor/REFACTOR_PROGRESS.md to find the current task,
then read the corresponding task file in .claude/refactor/tasks/
and execute it following the test-first protocol.
```

---

## Commands

```bash
npm start                    # Start Metro bundler
npm start --reset-cache      # Clear cache (use after mode switch)
npm run ios                  # Run iOS simulator
cd ios && pod install        # Install iOS dependencies
npm test                     # Run all tests
npm test -- --testPathPattern="<pattern>"  # Run specific tests
npx tsc --noEmit             # Type check
```

## Code Style

- TypeScript strict mode, no `any`
- ES modules (import/export), not CommonJS
- React.memo for tiles, keys, list items
- useCallback for event handlers passed as props
- Destructure imports: `import { useState } from 'react'`

## Architecture Rules

- **Service layer is mandatory** - never import Supabase client directly in components
- All data ops through: `authService`, `friendsService`, `profileService`, `gameResultsService`
- Local storage through `getJSON`/`setJSON` from `src/storage/mmkv.ts`
- MMKV v4 API: `createMMKV()` constructor, `kv.remove(key)` for deletion

## Dev/Prod Mode

⚠️ **CRITICAL**: `src/config/environment.ts` controls app behavior

```typescript
export const isDevelopment = true  // Dev: mocked data, no network
export const isDevelopment = false // Prod: real Supabase, auth required
```

**After changing**: Must run `npm start --reset-cache` and rebuild.

## Database

### Key Tables
- `profiles`: user_id, display_name, friend_code (XXXX-XXXX format)
- `game_stats`: user_id, word_length (2-6), mode, won, guesses, date_played
- `friendships`: user_id, friend_id, status (pending/accepted)

## Game Logic

### Duplicate Letter Algorithm (evaluateGuess.ts)
Two-pass evaluation:
1. Pass 1: Mark exact matches (green), decrement letter counts
2. Pass 2: Mark present (yellow) only if letter count > 0

### Daily Word Selection
**CRITICAL**: `selectDaily(len, maxRows, dateISO, answers)` - maxRows is part of the seed!

## File Locations

| Purpose | Location |
|---------|----------|
| Mode config | `src/config/environment.ts` |
| Game config | `src/config/gameConfig.ts` (VALID_LENGTHS, etc.) |
| Services | `src/services/data/`, `src/services/auth/` |
| Game logic | `src/logic/evaluateGuess.ts`, `src/logic/selectDaily.ts` |
| Word lists | `src/logic/words/answers-*.json`, `allowed-*.json` |
| Local storage | `src/storage/mmkv.ts` |
| User scoping | `src/storage/userScope.ts` (getScopedKey) |

## Testing

```bash
npm test                                    # All tests
npm test -- --testPathPattern="<pattern>"   # Specific tests
npm test -- --coverage                      # With coverage
```

### Test Locations
- Domain tests: `__tests__/domain/`
- Characterization tests: `__tests__/characterization/`
- Component tests: `src/components/X/__tests__/`
- Hook tests: `src/hooks/__tests__/`

## Don'ts

- Don't bypass service layer with direct Supabase imports
- Don't modify `environment.ts` without explicit discussion
- Don't log auth tokens, session data, or user credentials
- Don't use `new MMKV()` - use `createMMKV()`
- Don't call async in `onAuthStateChange` callbacks
