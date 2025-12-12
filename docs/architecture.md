# WrathWord Architecture

This document provides detailed architectural context. For quick rules, see `CLAUDE.md` in the project root.

## Overview

WrathWord is a Wordle-style word guessing game with:
- Multiple word lengths (2-6 letters)
- Daily and Free Play modes
- Friend competitions and leaderboards
- Local-first architecture with optional cloud sync

## Dev/Prod Mode System

### How It Works

The app operates in two distinct modes controlled by `src/config/environment.ts`:

| Feature | Dev Mode | Prod Mode |
|---------|----------|-----------|
| Authentication | Bypassed (auto-login) | Required (real Supabase) |
| Friends Data | Mocked from `src/data/` | Live from Supabase |
| Leaderboards | Fake static data | Real user rankings |
| Game Results | Local MMKV only | MMKV + Supabase sync |
| Network Calls | None | Active API requests |

### Why This Exists

Dev mode enables rapid UI iteration without backend dependencies. Prod mode is for integration testing and release builds.

### Switching Modes

1. Edit `src/config/environment.ts`
2. Run `npm start --reset-cache`
3. Rebuild the app
4. Clear app data if behavior is strange

### Production Safety

**Problem**: Single boolean controls critical behavior. No safeguard against shipping wrong value.

**Mitigation**: Always verify mode before release builds:
```bash
grep isDevelopment src/config/environment.ts
```

Consider tying to build variants in future.

## Service Layer Architecture

```
Component
    ↓
Service Interface (friendsService, authService, etc.)
    ↓
Mode Check (isDevelopment?)
    ↓
┌─────────────┬──────────────┐
│  Dev Mode   │  Prod Mode   │
│  Mock Impl  │  Supabase    │
└─────────────┴──────────────┘
```

### Services

1. **Auth Service** (`src/services/auth/`)
   - Dev: Mock authentication (always logged in as test user)
   - Prod: Real Supabase authentication with email/password

2. **Profile Service** (`src/services/data/profileService.ts`)
   - Dev: MMKV local storage only
   - Prod: MMKV + Supabase sync

3. **Friends Service** (`src/services/data/friendsService.ts`)
   - Dev: Returns mock friends from `src/data/mockFriends.ts`
   - Prod: Queries Supabase friendships table

4. **Game Results Service** (`src/services/data/gameResultsService.ts`)
   - Dev: Local MMKV storage only
   - Prod: Local + cloud sync with `directInsert` pattern

### Correct Usage

```typescript
// ✅ Correct: Use service layer
import { friendsService } from '../services/data';
const friends = await friendsService.getFriends();

// ❌ Wrong: Direct Supabase access
import { supabase } from '../services/supabase/client';
const { data } = await supabase.from('friendships').select();

// ❌ Wrong: Direct mock import
import { MOCK_FRIENDS } from '../data/mockFriends';
```

## Database Schema

### profiles
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  display_name TEXT,
  friend_code TEXT UNIQUE,  -- Format: XXXX-XXXX
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: Users can read all profiles, write only their own
```

### game_stats
```sql
CREATE TABLE game_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  word_length INT CHECK (word_length BETWEEN 2 AND 6),
  mode TEXT CHECK (mode IN ('daily', 'free')),
  won BOOLEAN,
  guesses INT CHECK (guesses BETWEEN 1 AND 6),
  date_played DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, word_length, mode, date_played)
);

-- RLS: Users can only read/write their own rows
```

### friendships
```sql
CREATE TABLE friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  friend_id UUID REFERENCES auth.users(id),
  status TEXT CHECK (status IN ('pending', 'accepted')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, friend_id)
);

-- RLS: Users can read friendships where they are user_id or friend_id
```

## Key TypeScript Interfaces

```typescript
interface GameResult {
  wordLength: number;      // 2-6
  mode: 'daily' | 'free';
  won: boolean;
  guesses: number;         // 1-6
  date: string;            // ISO format YYYY-MM-DD
}

interface Friend {
  id: string;
  displayName: string;
  friendCode: string;      // XXXX-XXXX
}

interface Profile {
  id: string;
  displayName: string;
  friendCode: string;
}

interface FriendRequest {
  id: string;
  fromUser: Profile;
  status: 'pending' | 'accepted';
  createdAt: string;
}
```

## Known Issues & Technical Debt

### 1. Session Hangs (Critical)

**Problem**: `supabase.auth.getSession()` can hang indefinitely, blocking UI.

**Root Cause**: Unclear - possibly network issues or Supabase client internals.

**Workaround**: Cached session pattern with `directInsert`/`directUpsert`:
```typescript
// Uses raw fetch with AbortController timeout (5s)
// Bypasses problematic Supabase client calls
// See gameResultsService.ts for implementation
```

**Risk**: Token refresh not handled by raw fetch. Monitor for auth failures.

### 2. Empty Leaderboards on Fresh Install

**Problem**: Leaderboard shows zero results after first login.

**Root Cause**: Historical local games in MMKV never synced to `game_stats` table.

**Solution Needed**: Sync-on-login to push MMKV game history to Supabase.

### 3. Auth Callback Deadlocks

**Problem**: App freezes when calling async Supabase methods inside `onAuthStateChange()`.

**Root Cause**: Callback is synchronous context; async operations can deadlock.

**Solution**: Never call async Supabase methods in auth callbacks. Use state flags instead.

### 4. RLS vs Query Hang Confusion

**Problem**: Hard to diagnose why queries return no data.

**Key Insight**:
- RLS policy violation → Returns empty result set (no error)
- Network/session issue → Query hangs indefinitely

Test RLS policies directly in Supabase SQL Editor with user JWT.

## Game Logic Details

### Duplicate Letter Handling

The `evaluateGuess` function uses a two-pass algorithm:

```typescript
// Pass 1: Mark exact matches, count remaining letters
for (let i = 0; i < n; i++) {
  if (guess[i] === answer[i]) {
    result[i] = 'correct';
  } else {
    remaining[answer[i]] = (remaining[answer[i]] || 0) + 1;
  }
}

// Pass 2: Mark present only if letter still available
for (let i = 0; i < n; i++) {
  if (result[i] === 'correct') continue;
  if (remaining[guess[i]] > 0) {
    result[i] = 'present';
    remaining[guess[i]]--;
  }
}
```

**Example**: Answer "LLAMA", Guess "LABEL"
- L at position 0: correct (exact match)
- A at position 1: present (A exists elsewhere)
- B at position 2: absent (not in answer)
- E at position 3: absent (not in answer)
- L at position 4: absent (only one L remaining after position 0)

### Daily Word Selection

Deterministic selection using seeded PRNG:
```typescript
// Same date + length = same word across all users
const index = seededIndex(`${dateISO}:${wordLength}`, answers.length);
const dailyWord = answers[index];
```

Uses FNV-1a hash → Mulberry32 PRNG for consistent cross-platform results.

## React Native Configuration

### Architecture
- **Legacy Architecture** (Bridge-based), not New Architecture
- Compatible with all current dependencies
- No JSI/Fabric/TurboModules

### Key Dependencies
| Package | Version | Notes |
|---------|---------|-------|
| react-native-mmkv | 4.x | Uses Nitro; `createMMKV()` constructor |
| react-native-reanimated | 3.x | Works on Legacy; v4 requires New Arch |
| react-native-keyboard-controller | 1.x | For auth screens with TextInput |

### MMKV v4 API
```typescript
// Import
import { createMMKV } from 'react-native-mmkv';

// Create instance
const kv = createMMKV();

// Delete (not .delete())
kv.remove(key);
```

## Debugging Tips

### Check Current Mode
```bash
grep isDevelopment src/config/environment.ts
```

### Test RLS Policies
```sql
-- In Supabase SQL Editor
SET request.jwt.claim.sub = 'user-uuid-here';
SELECT * FROM game_stats;
```

### Diagnose Query Hangs
Add timeout wrapper:
```typescript
const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T> => {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms)
  );
  return Promise.race([promise, timeout]);
};
```

### Check Auth State
```typescript
const { data: { session } } = await supabase.auth.getSession();
console.log('Session:', session ? 'Active' : 'None');
console.log('User:', session?.user?.id);
```

## File Structure

```
src/
├── config/
│   └── environment.ts          # Dev/prod mode switch
├── services/
│   ├── auth/
│   │   ├── types.ts
│   │   ├── supabaseAuthService.ts
│   │   ├── mockAuthService.ts
│   │   └── index.ts
│   ├── supabase/
│   │   └── client.ts
│   └── data/
│       ├── profileService.ts
│       ├── friendsService.ts
│       ├── gameResultsService.ts
│       └── index.ts
├── contexts/
│   └── AuthContext.tsx
├── storage/
│   ├── mmkv.ts                 # MMKV wrapper
│   ├── profile.ts
│   └── friendCode.ts           # XXXX-XXXX generation
├── data/
│   ├── mockFriends.ts
│   ├── mockFriendRequests.ts
│   └── mockGlobalUsers.ts
├── screens/
│   ├── Auth/
│   ├── GameScreen.tsx
│   ├── StatsScreen.tsx
│   └── FriendsScreen/
└── logic/
    ├── evaluateGuess.ts
    ├── selectDaily.ts
    └── words/
        ├── answers-2.json ... answers-6.json
        └── allowed-2.json ... allowed-6.json
```

## Environment Variables

Required for prod mode (`.env` file):
```env
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
```

Never commit `.env` to version control.
