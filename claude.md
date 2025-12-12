# WrathWord

React Native word puzzle game (iOS-focused) with Supabase backend.

## Commands

```bash
npm start                    # Start Metro bundler
npm start --reset-cache      # Clear cache (use after mode switch)
npm run ios                  # Run iOS simulator
cd ios && pod install        # Install iOS dependencies
npx react-native clean       # Clean build artifacts
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

**Never ship with wrong mode** - verify before release builds.

## Database

### Key Tables
- `profiles`: user_id, display_name, friend_code (XXXX-XXXX format)
- `game_stats`: user_id, word_length (2-6), mode, won, guesses, date_played
- `friendships`: user_id, friend_id, status (pending/accepted)

### RLS Behavior
- RLS returns **empty results** for unauthorized access (not errors)
- Query hangs = network/session issue, not RLS

## Known Issues & Workarounds

### Session Hangs
`supabase.auth.getSession()` can hang indefinitely. Use cached session pattern:
```typescript
// Use directInsert/directUpsert with raw fetch + AbortController timeout
// See src/services/data/gameResultsService.ts for implementation
```

### Empty Leaderboards
Historical local games don't auto-sync. Sync-on-login needed to push MMKV data.

### Auth Callback Deadlocks
Never call async Supabase methods inside `onAuthStateChange()` callbacks.

## Game Logic

### Duplicate Letter Algorithm (evaluateGuess.ts)
Two-pass evaluation:
1. Pass 1: Mark exact matches (green), decrement letter counts
2. Pass 2: Mark present (yellow) only if letter count > 0

### Daily Word Selection
Deterministic via `seededIndex(\`${dateISO}:${len}\`, answers.length)` using FNV-1a + Mulberry32.

## File Locations

| Purpose | Location |
|---------|----------|
| Mode config | `src/config/environment.ts` |
| Services | `src/services/data/`, `src/services/auth/` |
| Game logic | `src/logic/evaluateGuess.ts`, `src/logic/selectDaily.ts` |
| Word lists | `src/logic/words/answers-*.json`, `allowed-*.json` |
| Local storage | `src/storage/mmkv.ts` |
| Mock data (dev) | `src/data/mock*.ts` |

## Don'ts

- Don't bypass service layer with direct Supabase imports
- Don't modify `environment.ts` without explicit discussion
- Don't log auth tokens, session data, or user credentials
- Don't use `new MMKV()` - use `createMMKV()`
- Don't call async in `onAuthStateChange` callbacks
- Don't assume RLS errors = query will fail (they return empty)

## Testing Checklist

Before PR:
- [ ] Works in dev mode (isDevelopment = true)
- [ ] Works in prod mode (isDevelopment = false)
- [ ] No TypeScript errors: `npx tsc --noEmit`
- [ ] Game logic handles duplicate letters correctly
- [ ] Service layer used for all data operations
