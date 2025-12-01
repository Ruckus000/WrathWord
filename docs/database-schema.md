# WrathWord Database Schema

This document describes the Supabase database schema for WrathWord's backend services.

## Overview

The database consists of 5 main tables that handle user profiles, game statistics, game results, and friend relationships.

## Tables

### `profiles`

Stores user profile information including username and friend code.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `user_id` | UUID | PRIMARY KEY, REFERENCES auth.users(id) | User's auth ID |
| `username` | TEXT | UNIQUE, NOT NULL | Unique username |
| `display_name` | TEXT | NOT NULL | Display name shown to friends |
| `friend_code` | TEXT | UNIQUE, NOT NULL | 8-char code for friend discovery (e.g., "WR4K-9NX7") |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Account creation timestamp |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Last profile update timestamp |

**Indexes:**
- Primary key on `user_id`
- Unique index on `username`
- Unique index on `friend_code`

**RLS Policies:**
- Users can read their own profile
- Users can update their own profile
- Users can read profiles of their friends
- Public can search by friend_code (for friend requests)

---

### `game_stats`

Stores aggregated game statistics per user per word length.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `user_id` | UUID | PRIMARY KEY (composite), REFERENCES profiles(user_id) | User's ID |
| `word_length` | INTEGER | PRIMARY KEY (composite), CHECK (2-6) | Word length (2, 3, 4, 5, or 6) |
| `games_played` | INTEGER | NOT NULL, DEFAULT 0 | Total games played |
| `games_won` | INTEGER | NOT NULL, DEFAULT 0 | Total games won |
| `current_streak` | INTEGER | NOT NULL, DEFAULT 0 | Current win streak in days |
| `max_streak` | INTEGER | NOT NULL, DEFAULT 0 | Best win streak ever |
| `guess_distribution` | JSONB | NOT NULL, DEFAULT '{}' | Distribution of wins by guess count |
| `used_words` | TEXT[] | NOT NULL, DEFAULT '{}' | Array of words already used |
| `current_cycle` | INTEGER | NOT NULL, DEFAULT 0 | Word cycle counter |
| `last_played_date` | DATE | NULL | Last date played (for streak tracking) |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | First game timestamp |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Last update timestamp |

**Indexes:**
- Composite primary key on (`user_id`, `word_length`)
- Index on `user_id` for quick user lookups

**RLS Policies:**
- Users can read/write their own stats
- Users can read friends' stats for comparison

---

### `game_results`

Stores individual game results for head-to-head comparisons and history.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique result ID |
| `user_id` | UUID | NOT NULL, REFERENCES profiles(user_id) | User who played |
| `word_length` | INTEGER | NOT NULL, CHECK (2-6) | Word length |
| `won` | BOOLEAN | NOT NULL | Whether the game was won |
| `guesses` | INTEGER | NOT NULL | Number of guesses used |
| `max_rows` | INTEGER | NOT NULL | Maximum rows allowed |
| `date` | DATE | NOT NULL | Date played (ISO format) |
| `feedback` | JSONB | NOT NULL | Array of tile states for each guess |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Result creation timestamp |

**Indexes:**
- Primary key on `id`
- Index on (`user_id`, `date`) for efficient date-based queries
- Index on `user_id` for user's game history

**RLS Policies:**
- Users can insert their own game results
- Users can read their own game results
- Users can read friends' game results for head-to-head

---

### `friendships`

Stores friend relationships between users.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique friendship ID |
| `user_id_1` | UUID | NOT NULL, REFERENCES profiles(user_id) | First user (lower UUID) |
| `user_id_2` | UUID | NOT NULL, REFERENCES profiles(user_id) | Second user (higher UUID) |
| `status` | TEXT | NOT NULL, CHECK IN ('pending', 'accepted') | Friendship status |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Request creation timestamp |
| `accepted_at` | TIMESTAMPTZ | NULL | When friendship was accepted |

**Constraints:**
- `UNIQUE(user_id_1, user_id_2)` - Prevent duplicate friendships
- `CHECK(user_id_1 < user_id_2)` - Ensure consistent ordering

**Indexes:**
- Primary key on `id`
- Unique composite index on (`user_id_1`, `user_id_2`)
- Index on `user_id_1` for finding user's friends
- Index on `user_id_2` for finding user's friends

**RLS Policies:**
- Users can read friendships where they are user_id_1 or user_id_2
- Users can insert friendships where they are user_id_1 or user_id_2
- Users can update friendships where they are user_id_1 or user_id_2

---

### `friend_requests`

Stores friend requests with directional relationship (who sent to whom).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique request ID |
| `from_user_id` | UUID | NOT NULL, REFERENCES profiles(user_id) | User who sent request |
| `to_user_id` | UUID | NOT NULL, REFERENCES profiles(user_id) | User who received request |
| `status` | TEXT | NOT NULL, DEFAULT 'pending', CHECK IN ('pending', 'accepted', 'declined') | Request status |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Request creation timestamp |

**Constraints:**
- `UNIQUE(from_user_id, to_user_id)` - Prevent duplicate requests
- `CHECK(from_user_id != to_user_id)` - Can't friend yourself

**Indexes:**
- Primary key on `id`
- Index on `from_user_id` for sent requests
- Index on `to_user_id` for received requests
- Index on (`to_user_id`, `status`) for pending requests

**RLS Policies:**
- Users can read requests where they are sender or recipient
- Users can insert requests where they are the sender
- Users can update requests where they are the recipient (accept/decline)

---

## Row Level Security (RLS)

All tables have RLS enabled. Key security principles:

1. **Own Data**: Users can always read and write their own data
2. **Friends Only**: Users can only see friends' game results and stats
3. **Public Friend Codes**: Friend codes are searchable for discovery
4. **Request Privacy**: Only sender and recipient can see friend requests

## Migrations

SQL migration files are located in `supabase/migrations/`:

- `00001_initial_schema.sql` - Creates all tables and indexes
- `00002_rls_policies.sql` - Sets up row level security
- `00003_functions.sql` - Helper functions and triggers

## Helper Functions

### `get_user_friends(user_id UUID)`

Returns array of user IDs who are friends with the given user.

### `calculate_global_rank(user_id UUID)`

Calculates user's global rank based on win rate and total games.

### `get_head_to_head(user_id_1 UUID, user_id_2 UUID)`

Returns head-to-head statistics between two users.

## Triggers

### `update_updated_at_timestamp`

Automatically updates `updated_at` column on any row modification for:
- `profiles`
- `game_stats`

## Data Types

### TileState (in feedback JSONB)

```typescript
type TileState = 'correct' | 'present' | 'absent';
type Feedback = TileState[][];
```

### GuessDistribution (in game_stats JSONB)

```typescript
type GuessDistribution = {
  1?: number;  // wins in 1 guess
  2?: number;  // wins in 2 guesses
  3?: number;  // wins in 3 guesses
  4?: number;  // wins in 4 guesses
  5?: number;  // wins in 5 guesses
  6?: number;  // wins in 6 guesses
};
```



