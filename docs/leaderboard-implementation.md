# Leaderboard Implementation Summary

## Overview

The leaderboard system has been fully implemented with proper dev/prod mode separation. The system automatically switches between mock data (dev) and real Supabase data (prod) based on the `isDevelopment` flag.

## How It Works

### Mode Switching

**Location:** [`src/config/environment.ts`](../src/config/environment.ts)

```typescript
const FORCE_DEV_MODE = true;  // Change this to toggle modes
export const isDevelopment = FORCE_DEV_MODE;
```

### Service Architecture

**Location:** [`src/services/data/friendsService.ts`](../src/services/data/friendsService.ts)

```typescript
export function getFriendsService(): IFriendsService {
  return isDevelopment
    ? new MockFriendsService()      // Dev: Returns mock data
    : new SupabaseFriendsService(); // Prod: Fetches from Supabase
}
```

### Dev Mode (isDevelopment = true)

**Data Source:** Mock files
- `MOCK_FRIENDS` from [`src/data/mockFriends.ts`](../src/data/mockFriends.ts)
- `MOCK_GLOBAL_USERS` from [`src/data/mockGlobalUsers.ts`](../src/data/mockGlobalUsers.ts)

**Features:**
- No network calls
- Instant data loading (300ms simulated delay)
- Consistent test data
- No authentication required

### Prod Mode (isDevelopment = false)

**Data Source:** Supabase PostgreSQL database

**Database Function:** `get_leaderboard()`
- **Location:** [`supabase/migrations/00004_fix_leaderboard_period.sql`](../supabase/migrations/00004_fix_leaderboard_period.sql)
- **Supports period filtering:**
  - `'today'` - Shows today's results, ranked by fewest guesses
  - `'week'` - Shows last 7 days, ranked by win rate
  - `'alltime'` - Shows all-time stats, ranked by win rate

**Features:**
- Real-time data from database
- Today's game results fetched separately and merged
- Proper ranking algorithms
- Friends-only or global scope

## Data Flow

### Leaderboard Component
**Location:** [`src/screens/FriendsScreen/Leaderboard.tsx`](../src/screens/FriendsScreen/Leaderboard.tsx)

```typescript
const loadGlobalLeaderboard = async () => {
  setLoadingGlobal(true);
  try {
    const data = await friendsService.getGlobalLeaderboard(50);
    setGlobalUsers(data);
  } catch (err) {
    console.error('Failed to load global leaderboard:', err);
  } finally {
    setLoadingGlobal(false);
  }
};
```

### Service Methods

#### `getGlobalLeaderboard(limit)`
- Dev: Returns `MOCK_GLOBAL_USERS.slice(0, limit)`
- Prod: Calls `get_leaderboard(p_friends_only: false)`

#### `getFriendsLeaderboard()`
- Dev: Returns `MOCK_FRIENDS` filtered by today's players
- Prod: Calls `get_leaderboard(p_friends_only: true, p_period: 'today')`

#### `getFriends()`
- Dev: Returns `MOCK_FRIENDS`
- Prod: Calls `get_leaderboard(p_friends_only: true, p_period: 'alltime')`

## Database Schema

### Key Tables

**profiles:**
- `user_id`, `username`, `display_name`, `friend_code`

**game_results:**
- `user_id`, `won`, `guesses`, `date`, `feedback`
- Used for today's results and time-based leaderboards

**game_stats:**
- `user_id`, `word_length`, `games_played`, `games_won`, `current_streak`, `max_streak`
- Aggregated stats for all-time leaderboards

**friendships:**
- `user_id_1`, `user_id_2`, `status`, `accepted_at`

### SQL Function Returns

```typescript
{
  user_id: UUID,
  username: string,
  display_name: string,
  friend_code: string,
  rank: number,
  games_played: number,
  games_won: number,
  win_rate: number,
  current_streak: number,
  max_streak: number,
  avg_guesses: number  // New field added in migration 00004
}
```

## Data Transformation

The Supabase service transforms database results into the `Friend` type:

```typescript
{
  id: row.user_id,
  name: row.display_name || row.username,
  letter: name.charAt(0).toUpperCase(),
  friendCode: row.friend_code,
  streak: row.current_streak || 0,
  lastPlayed: todayResult ? 'today' : 'inactive',
  todayResult: {
    won: todayResult.won,
    guesses: todayResult.guesses,
    feedback: todayResult.feedback,
  },
  stats: {
    played: row.games_played || 0,
    won: row.games_won || 0,
    winRate: parseFloat(row.win_rate) || 0,
    avgGuesses: parseFloat(row.avg_guesses) || 0,
    maxStreak: row.max_streak || 0,
  },
  h2h: {yourWins: 0, theirWins: 0},
}
```

## Testing

### Test Dev Mode
1. Set `FORCE_DEV_MODE = true` in [`src/config/environment.ts`](../src/config/environment.ts)
2. Restart Metro bundler
3. Navigate to Friends screen → Leaderboard
4. Switch between "Friends" and "Global" scopes
5. Verify mock data is displayed instantly

### Test Prod Mode
1. Set `FORCE_DEV_MODE = false` in [`src/config/environment.ts`](../src/config/environment.ts)
2. Ensure Supabase credentials are in `.env`
3. Restart Metro bundler
4. Sign in with a real account
5. Navigate to Friends screen → Leaderboard
6. Verify real data is fetched (loading indicator should appear)
7. Verify today's results are shown correctly

### Expected Behavior

| Feature | Dev Mode | Prod Mode |
|---------|----------|-----------|
| Data source | Mock files | Supabase DB |
| Network calls | None | Yes |
| Loading time | 300ms (simulated) | Variable (network) |
| Today's results | Hardcoded in mocks | Real from database |
| Period filtering | Client-side sort | Server-side SQL filter |
| Authentication | Bypassed | Required |

## Troubleshooting

### Leaderboard shows no data in prod mode
- Check Supabase credentials in `.env`
- Verify migrations were applied (check Supabase dashboard)
- Check console for error messages
- Ensure user is authenticated

### Mock data not showing in dev mode
- Verify `FORCE_DEV_MODE = true`
- Restart Metro bundler
- Check that mock files exist

### Today's results not showing
- In dev: Check mock data has `todayResult` field
- In prod: Verify `game_results` table has entries for today's date
- Check date format is `YYYY-MM-DD`

## Future Enhancements

1. **Real-time updates:** Use Supabase subscriptions to update leaderboard when friends complete games
2. **Head-to-head stats:** Implement `get_head_to_head()` function and populate `h2h` field
3. **Caching:** Store leaderboard data locally and refresh periodically
4. **Optimistic updates:** Update UI immediately when user completes game, then sync to server
5. **Period persistence:** Remember user's selected period (today/week/alltime)
6. **Pull to refresh:** Add gesture to manually refresh leaderboard data











