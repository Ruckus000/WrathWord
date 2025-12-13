# API Integration & Data Flow

This document explains how data flows through WrathWord's service layer, how to work with the API, and the differences between development and production modes.

## Architecture Overview

WrathWord uses a **service layer pattern** that abstracts data operations behind interfaces. This allows the app to seamlessly switch between local mocked data (dev mode) and cloud-synced data (prod mode).

```
┌─────────────────┐
│   React         │
│   Components    │
└────────┬────────┘
         │
         ├─ useAuth() hook
         │
         ├─ profileService
         │
         ├─ friendsService
         │
         └─ gameResultsService
         │
         │
    ┌────┴─────┐
    │  Mode    │
    │  Switch  │
    └────┬─────┘
         │
    ┌────┴──────────────┐
    │                   │
┌───▼────┐        ┌─────▼─────┐
│  DEV   │        │   PROD    │
│  MODE  │        │   MODE    │
│        │        │           │
│ MMKV   │        │ Supabase  │
│ Mocks  │        │ + MMKV    │
└────────┘        └───────────┘
```

## Development vs Production Mode

### Development Mode (isDevelopment = true)

**Characteristics:**
- No network calls to Supabase
- All data from mock files or local storage (MMKV)
- Authentication is bypassed (auto-login)
- Friend data returns hardcoded mock users
- Leaderboards show fake data
- Fast iteration without backend setup

**When to use:**
- Local development
- UI/UX iteration
- Testing without internet
- Before Supabase is configured

### Production Mode (isDevelopment = false)

**Characteristics:**
- Real authentication required
- Data synced with Supabase backend
- Network calls for friends, leaderboards, stats
- Local MMKV as cache/fallback
- Real-time friend activity
- Multi-device sync

**When to use:**
- Production builds
- Testing with real backend
- Multi-user features
- Data persistence across devices

### Switching Modes

Edit `src/config/environment.ts`:

```typescript
// Development mode (default)
export const isDevelopment = true;

// Production mode
export const isDevelopment = false;
```

**Auto-detection**: Mode automatically switches based on `__DEV__` flag in React Native.

## Service Layer Architecture

### Base Interfaces

All services implement TypeScript interfaces ensuring consistent APIs:

```typescript
// Example: Profile Service Interface
interface IProfileService {
  getProfile(): Promise<UserProfile>;
  updateProfile(updates: Partial<UserProfile>): Promise<void>;
  syncStats(): Promise<void>;
}
```

### Service Implementations

Each service has two implementations:

1. **Mock Service** (dev mode)
2. **Supabase Service** (prod mode)

The appropriate implementation is automatically selected based on environment.

## Services Guide

### Authentication Service

**Location**: `src/services/auth/`

**Methods:**
- `signUp(email, password, username)` - Create new account
- `signIn(email, password)` - Sign in existing user
- `signOut()` - Sign out current user
- `getCurrentUser()` - Get authenticated user
- `onAuthStateChange(callback)` - Listen for auth changes

**Dev Mode Behavior:**
- Always returns mock user
- No actual authentication
- Stored in MMKV as `mock.auth.session`

**Prod Mode Behavior:**
- Real Supabase authentication
- Creates profile in database
- Generates unique friend code
- Session persisted via MMKV

**Usage Example:**
```typescript
import {authService} from '../services/auth';

// Sign in
const result = await authService.signIn(email, password);
if (result.error) {
  console.error(result.error.message);
} else {
  console.log('Signed in:', result.data.user);
}
```

### Profile Service

**Location**: `src/services/data/profileService.ts`

**Methods:**
- `getProfile()` - Get user profile and stats
- `updateProfile(updates)` - Update profile fields
- `updatePreferences(prefs)` - Update user preferences
- `syncStats()` - Upload local stats to cloud
- `getStatsForLength(length)` - Get stats for word length
- `getTotalStats()` - Get aggregated stats

**Dev Mode Behavior:**
- Reads/writes to MMKV storage
- Uses existing `src/storage/profile.ts` functions
- No sync operation

**Prod Mode Behavior:**
- Primary: MMKV (offline-first)
- Sync: Upload to Supabase
- Fetches from cloud on login

**Usage Example:**
```typescript
import {profileService} from '../services/data';

// Get profile
const profile = await profileService.getProfile();

// Sync to cloud (prod mode only)
await profileService.syncStats();
```

### Friends Service

**Location**: `src/services/data/friendsService.ts`

**Methods:**
- `getFriends()` - Get user's friends list
- `searchUserByFriendCode(code)` - Find user by friend code
- `sendFriendRequest(userId)` - Send friend request
- `acceptFriendRequest(requestId)` - Accept incoming request
- `declineFriendRequest(requestId)` - Decline incoming request
- `getIncomingRequests()` - Get pending requests to user
- `getOutgoingRequests()` - Get sent requests
- `getGlobalLeaderboard(limit)` - Get global rankings
- `getFriendsLeaderboard()` - Get friends rankings

**Dev Mode Behavior:**
- Returns data from `src/data/mockFriends.ts`
- Returns data from `src/data/mockGlobalUsers.ts`
- Friend requests are no-ops (logged only)

**Prod Mode Behavior:**
- Queries Supabase `friendships` table
- Real-time friend status
- Actual request management
- Global leaderboard from all users

**Usage Example:**
```typescript
import {friendsService} from '../services/data';

// Get friends
const friends = await friendsService.getFriends();

// Search by code
const user = await friendsService.searchUserByFriendCode('WR4K-9NX7');

// Send request
await friendsService.sendFriendRequest(user.id);
```

### Game Results Service

**Location**: `src/services/data/gameResultsService.ts`

**Methods:**
- `saveGameResult(result)` - Save completed game
- `getRecentGames(limit)` - Get recent game history
- `getGamesForDate(date)` - Get games for specific date

**Dev Mode Behavior:**
- Saves to local storage only
- Uses `recordGameResult()` from `src/storage/profile.ts`
- No history retrieval (returns empty)

**Prod Mode Behavior:**
- Saves locally first (offline support)
- Syncs to Supabase `game_results` table
- Enables head-to-head comparisons
- Full game history available

**Usage Example:**
```typescript
import {gameResultsService} from '../services/data';

// Save game (automatically syncs in prod)
await gameResultsService.saveGameResult({
  wordLength: 5,
  won: true,
  guesses: 4,
  maxRows: 6,
  date: '2025-11-30',
  feedback: [[/* tile states */]],
});

// Get recent games (prod mode only)
const games = await gameResultsService.getRecentGames(10);
```

## Data Flow Examples

### Completing a Game

**Dev Mode Flow:**
```
User completes game
  → gameResultsService.saveGameResult()
    → recordGameResult() (local)
      → MMKV storage updated
        → Stats updated locally
```

**Prod Mode Flow:**
```
User completes game
  → gameResultsService.saveGameResult()
    → recordGameResult() (local)
      → MMKV storage updated
        → Supabase insert
          → game_results table updated
            → Friends can see result
```

### Loading Friends

**Dev Mode Flow:**
```
FriendsScreen mounts
  → friendsService.getFriends()
    → Returns MOCK_FRIENDS array
      → Instant response, no network
```

**Prod Mode Flow:**
```
FriendsScreen mounts
  → friendsService.getFriends()
    → Supabase query: SELECT from friendships
      → Join with profiles table
        → Fetch recent game results
          → Transform to Friend[]
            → Component renders
```

### Signing In

**Dev Mode Flow:**
```
App starts
  → AuthContext initializes
    → mockAuthService.getSession()
      → Returns mock session from MMKV
        → User auto-logged in
```

**Prod Mode Flow:**
```
App starts
  → AuthContext initializes
    → supabaseAuthService.getSession()
      → Check Supabase session
        → If valid: fetch user profile
        → If invalid: show sign-in screen
```

## Error Handling

### Network Errors

All production services handle network failures gracefully:

```typescript
try {
  await friendsService.getFriends();
} catch (err) {
  // Returns empty array, logs error
  // UI shows "no friends" state
}
```

### Offline Support

Game results and stats save locally first:

```typescript
// Always succeeds locally
await gameResultsService.saveGameResult(result);

// Sync happens in background
// Retries on reconnection
```

### Authentication Errors

Auth service returns structured errors:

```typescript
const result = await authService.signIn(email, password);

if (result.error) {
  // result.error.message: user-friendly string
  // result.error.code: machine-readable code
}
```

## Migration Guide

### Moving from Local to Cloud

When you're ready to enable prod mode:

1. **Set up Supabase** (see `supabase-setup.md`)

2. **Test authentication:**
   ```typescript
   // Toggle in environment.ts
   export const isDevelopment = false;
   ```

3. **Sync existing data:**
   ```typescript
   // In StatsScreen
   await profileService.syncStats();
   ```

4. **Verify in Supabase:**
   - Check `game_stats` table has data
   - Check `profiles` table has user

5. **Test friends features:**
   - Search for friends by code
   - Send/accept friend requests
   - View leaderboards

### Rollback to Dev Mode

If issues occur, simply toggle back:

```typescript
export const isDevelopment = true;
```

All local data remains intact. No data loss.

## Best Practices

### Service Usage

✅ **Do:**
- Import services from `src/services/data`
- Handle loading states in components
- Show offline indicators if needed
- Cache data where appropriate

❌ **Don't:**
- Import Supabase client directly in components
- Assume network calls always succeed
- Block UI on sync operations
- Hard-code mode checks in components

### Testing

**Dev Mode Testing:**
```bash
# Test UI and game logic
npm run ios
# or
npm run android
```

**Prod Mode Testing:**
```bash
# 1. Set isDevelopment = false
# 2. Rebuild app (required!)
npm run ios
# or
npm run android
```

### Data Consistency

When working with services:

1. **Always save locally first**
2. **Sync to cloud in background**
3. **Handle conflicts** (last write wins)
4. **Provide feedback** on sync status

## Performance Considerations

### Caching

Services use MMKV as cache:
- Instant reads from local storage
- Periodic background sync
- Reduces network calls

### Lazy Loading

Friends and leaderboards:
- Load on demand (not at app start)
- Paginated queries (limit results)
- Show loading indicators

### Offline First

Critical features work offline:
- Playing games
- Viewing stats
- Local leaderboards

Sync happens when online:
- Friend updates
- Global leaderboards
- Profile changes

## Debugging

### Enable Logging

Add console logs in services:

```typescript
// src/services/data/friendsService.ts
console.log('[FriendsService] Fetching friends...');
```

### Check Network Calls

Use React Native Debugger:
1. Enable network inspection
2. Look for supabase.co requests
3. Check request/response payloads

### Verify Mode

Add debug UI in app:

```typescript
import {isDevelopment} from '../config/environment';

<Text>Mode: {isDevelopment ? 'DEV' : 'PROD'}</Text>
```

## Support

For issues or questions:
- Review service implementations in `src/services/`
- Check Supabase logs in dashboard
- Verify RLS policies are correct
- Test in dev mode first, then prod













