# WrathWord Development Guide

This document provides essential context for AI assistants and developers working on WrathWord.

## Project Overview

WrathWord is a Wordle-style word guessing game built with React Native. It supports:

- Multiple word lengths (2-6 letters)
- Daily and free play modes
- Friend competitions and leaderboards
- Local-first architecture with optional cloud sync

## Development & Production Modes

### Critical: Dev/Prod Mode System

WrathWord operates in **two distinct modes** controlled by `src/config/environment.ts`:

```typescript
// Development Mode (default)
export const isDevelopment = true

// Production Mode
export const isDevelopment = false
```

**⚠️ IMPORTANT**: This is NOT just a flag - it fundamentally changes how the app works:

| Feature        | Dev Mode              | Prod Mode                     |
| -------------- | --------------------- | ----------------------------- |
| Authentication | Bypassed (auto-login) | Required (real Supabase auth) |
| Friends Data   | Mocked hardcoded data | Live from Supabase            |
| Leaderboards   | Fake static data      | Real user rankings            |
| Game Results   | Local MMKV only       | Synced to Supabase            |
| Network Calls  | None (all local)      | Active API requests           |
| Setup Required | None                  | Supabase project needed       |

### When to Use Each Mode

**Development Mode (default)**:

- UI/UX development
- Game logic changes
- Testing locally
- No internet needed
- Fast iteration
- No backend setup required

**Production Mode**:

- Testing real authentication
- Multi-user features
- Backend integration
- Testing data sync
- Pre-release testing
- Requires Supabase setup

### Switching Modes

**Method 1: Manual Toggle**

```typescript
// src/config/environment.ts
export const isDevelopment = false // ← Change this
```

**Method 2: Environment Detection**
The mode automatically uses `__DEV__` from React Native, but can be overridden.

**⚠️ After Switching**:

1. Restart Metro bundler: `npm start --reset-cache`
2. Rebuild app (sometimes required)
3. Clear app data if strange behavior occurs

## Architecture

### Service Layer Pattern

All data operations go through service interfaces that automatically route to the correct implementation:

```
Component
  ↓
Service Interface (e.g., friendsService)
  ↓
Mode Check (isDevelopment?)
  ↓
┌─────────────┬──────────────┐
│  Dev Mode   │  Prod Mode   │
│  Mock Impl  │  Supabase    │
└─────────────┴──────────────┘
```

### Key Services

1. **Auth Service** (`src/services/auth/`)

   - Dev: Mock authentication (always logged in)
   - Prod: Real Supabase authentication

2. **Profile Service** (`src/services/data/profileService.ts`)

   - Dev: MMKV local storage only
   - Prod: MMKV + Supabase sync

3. **Friends Service** (`src/services/data/friendsService.ts`)

   - Dev: Returns mock friends from `src/data/mockFriends.ts`
   - Prod: Queries Supabase friendships table

4. **Game Results Service** (`src/services/data/gameResultsService.ts`)
   - Dev: Local storage only
   - Prod: Local + cloud sync

### Data Flow

**Always use services, never direct imports:**

✅ **Correct:**

```typescript
import { friendsService } from '../services/data'
const friends = await friendsService.getFriends()
```

❌ **Incorrect:**

```typescript
import { MOCK_FRIENDS } from '../data/mockFriends'
const friends = MOCK_FRIENDS // Bypasses service layer!
```

## File Structure

```
src/
├── config/
│   └── environment.ts          # Mode configuration
├── services/
│   ├── auth/
│   │   ├── types.ts            # Auth interfaces
│   │   ├── supabaseAuthService.ts  # Prod implementation
│   │   ├── mockAuthService.ts      # Dev implementation
│   │   └── index.ts            # Auto-routing
│   ├── supabase/
│   │   └── client.ts           # Supabase initialization
│   └── data/
│       ├── profileService.ts   # Profile operations
│       ├── friendsService.ts   # Friends operations
│       ├── gameResultsService.ts   # Game results
│       └── index.ts            # Service exports
├── contexts/
│   └── AuthContext.tsx         # Auth state provider
├── storage/
│   ├── mmkv.ts                 # Local storage wrapper
│   ├── profile.ts              # Local profile logic
│   └── friendCode.ts           # Friend code generation
├── data/
│   ├── mockFriends.ts          # Dev mode friend data
│   ├── mockFriendRequests.ts  # Dev mode requests
│   └── mockGlobalUsers.ts     # Dev mode leaderboards
├── screens/
│   ├── Auth/                   # Sign in/up (prod only)
│   ├── GameScreen.tsx          # Main game
│   ├── StatsScreen.tsx         # Stats and settings
│   └── FriendsScreen/          # Friends and leaderboards
└── logic/
    ├── evaluateGuess.ts        # Game logic
    ├── selectDaily.ts          # Daily word selection
    └── words/                  # Word lists
```

## Common Tasks

### Adding a New Feature

1. **Check if it needs backend:**

   - If local-only: implement normally
   - If needs backend: create service interface

2. **Implement mock version:**

   - Add mock data in `src/data/`
   - Implement in mock service

3. **Implement prod version:**

   - Add Supabase table/function if needed
   - Implement in Supabase service

4. **Test both modes:**
   - Toggle `isDevelopment`
   - Test in dev mode
   - Test in prod mode (with Supabase)

### Modifying Game Logic

Game logic is **mode-independent** (works same in both):

- `src/logic/evaluateGuess.ts` - guess evaluation
- `src/logic/selectDaily.ts` - daily word selection
- `src/logic/words/` - word lists

No special mode handling needed.

### Adding Mock Data

For dev mode testing, add to:

- `src/data/mockFriends.ts` - friends
- `src/data/mockGlobalUsers.ts` - leaderboards
- `src/data/mockFriendRequests.ts` - friend requests

### Updating Supabase Schema

1. Create SQL migration in `supabase/migrations/`
2. Run migration (see `docs/supabase-setup.md`)
3. Update TypeScript types in `src/services/supabase/client.ts`
4. Update service implementations

## Testing

### Dev Mode Testing (No Setup)

```bash
# Ensure dev mode
# isDevelopment = true in environment.ts

npm run ios
# or
npm run android
```

**What to test:**

- Game mechanics
- UI/UX
- Offline functionality
- Mock friend interactions

### Prod Mode Testing (Requires Supabase)

```bash
# 1. Set up Supabase (see docs/supabase-setup.md)
# 2. Switch mode
# isDevelopment = false in environment.ts

# 3. Rebuild (important!)
npm start --reset-cache
npm run ios  # or android
```

**What to test:**

- Authentication flows
- Data sync
- Real friend requests
- Leaderboards
- Multi-device sync

## Environment Variables

Required for prod mode:

```env
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
```

See `docs/supabase-setup.md` for details.

## Common Issues

### "Supabase not configured" error

**Cause**: Prod mode enabled but env vars missing.

**Fix**: Either:

1. Add Supabase credentials (`.env` file)
2. OR switch back to dev mode

### Friend data not loading

**Cause**: Service layer bypassed or mode mismatch.

**Fix**:

1. Verify using `friendsService.getFriends()`
2. Check `isDevelopment` matches your intent
3. Restart app after mode change

### Auth screen shows unexpectedly

**Cause**: Prod mode active with no session.

**Fix**:

1. Sign in with credentials
2. OR switch to dev mode for testing

### Changes not taking effect

**Cause**: Metro cache stale.

**Fix**:

```bash
npm start --reset-cache
# Then rebuild app
```

## Code Style

### Imports

```typescript
// Services (always use these)
import { authService } from '../services/auth'
import { friendsService, profileService } from '../services/data'

// Hooks
import { useAuth } from '../contexts/AuthContext'

// Storage (only when service doesn't exist)
import { getJSON, setJSON } from '../storage/mmkv'
```

### Service Usage

```typescript
// ✅ Good: Uses service layer
const friends = await friendsService.getFriends()

// ❌ Bad: Direct Supabase access
import { supabase } from '../services/supabase/client'
const { data } = await supabase.from('friendships').select()

// ❌ Bad: Hardcoded mode check
if (isDevelopment) {
  // ...dev logic
} else {
  // ...prod logic
}
// Services handle this automatically!
```

### Component Patterns

```typescript
// Use auth hook for auth state
const {isAuthenticated, user, isDevelopmentMode} = useAuth();

// Show mode-appropriate UI
{isDevelopmentMode && <Text>Dev Mode</Text>}
{isAuthenticated && <Button onPress={handleSignOut}>Sign Out</Button>}
```

## Key Principles

1. **Offline-First**: Local storage is primary, cloud is sync
2. **Service Layer**: Never bypass services
3. **Mode Awareness**: Understand which mode you're in
4. **Mock Data**: Use realistic mock data for dev mode
5. **Error Handling**: All services handle failures gracefully
6. **Avoid Technical Debt**: Complete migrations fully rather than leaving hybrid patterns. When introducing a new pattern, migrate all relevant code to maintain consistency.

## Keyboard Handling

The app uses `react-native-keyboard-controller` for consistent keyboard behavior across iOS and Android.

### Setup

- `KeyboardProvider` wraps the app at the root level (`app/App.tsx`)
- All screens/modals with `TextInput` use `KeyboardAwareScrollView`

### Pattern

```typescript
import {KeyboardAwareScrollView} from 'react-native-keyboard-controller';

// In component:
<KeyboardAwareScrollView
  style={styles.container}
  contentContainerStyle={styles.content}
  keyboardShouldPersistTaps="handled"
  bottomOffset={insets.bottom}>
  {/* TextInputs and other content */}
</KeyboardAwareScrollView>
```

### Where It's Used

- `SignInScreen` - Email/password form
- `SignUpScreen` - Registration form
- `AddFriendsModal` - Friend search input

### Game Keyboard

The game uses a **custom keyboard UI** (Pressable buttons in `GameScreen.tsx`), not native `TextInput`. No keyboard handling needed there.

## Documentation

- `docs/database-schema.md` - Supabase schema reference
- `docs/supabase-setup.md` - Backend setup guide
- `docs/api-integration.md` - Service layer details
- This file - Development guide

## Getting Started

**For UI Development:**

1. Keep `isDevelopment = true`
2. Run `npm start`
3. Work normally with hot reload

**For Backend Development:**

**Option A - With Supabase MCP (Recommended)**:

1. Configure Supabase MCP in Cursor
2. Ask AI to run migrations and setup
3. Set `isDevelopment = false`
4. Rebuild app
5. Test with real data

**Option B - Manual Setup**:

1. Follow `docs/supabase-setup.md` manually
2. Set `isDevelopment = false`
3. Rebuild app
4. Test with real data

## Questions?

When working on this project, always consider:

- Am I in dev or prod mode?
- Should I use the service layer?
- Do I need to test both modes?
- Is my mock data realistic?

For mode-specific behavior, check the service implementations to understand exactly what happens in each mode.
