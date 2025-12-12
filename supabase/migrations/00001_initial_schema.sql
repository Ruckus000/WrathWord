-- WrathWord Initial Schema Migration
-- Creates all base tables for user profiles, stats, game results, and friendships

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- PROFILES TABLE
-- ============================================================================
CREATE TABLE profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL CHECK (length(username) >= 3 AND length(username) <= 20),
  display_name TEXT NOT NULL CHECK (length(display_name) >= 1 AND length(display_name) <= 50),
  friend_code TEXT UNIQUE NOT NULL CHECK (length(friend_code) = 9 AND friend_code ~ '^[A-Z0-9]{4}-[A-Z0-9]{4}$'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for profiles
CREATE INDEX idx_profiles_username ON profiles(username);
CREATE INDEX idx_profiles_friend_code ON profiles(friend_code);

-- ============================================================================
-- GAME STATS TABLE
-- ============================================================================
CREATE TABLE game_stats (
  user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  word_length INTEGER NOT NULL CHECK (word_length >= 2 AND word_length <= 6),
  games_played INTEGER NOT NULL DEFAULT 0 CHECK (games_played >= 0),
  games_won INTEGER NOT NULL DEFAULT 0 CHECK (games_won >= 0 AND games_won <= games_played),
  current_streak INTEGER NOT NULL DEFAULT 0 CHECK (current_streak >= 0),
  max_streak INTEGER NOT NULL DEFAULT 0 CHECK (max_streak >= 0),
  guess_distribution JSONB NOT NULL DEFAULT '{}'::jsonb,
  used_words TEXT[] NOT NULL DEFAULT '{}',
  current_cycle INTEGER NOT NULL DEFAULT 0 CHECK (current_cycle >= 0),
  last_played_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, word_length)
);

-- Indexes for game_stats
CREATE INDEX idx_game_stats_user_id ON game_stats(user_id);

-- ============================================================================
-- GAME RESULTS TABLE
-- ============================================================================
CREATE TABLE game_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  word_length INTEGER NOT NULL CHECK (word_length >= 2 AND word_length <= 6),
  won BOOLEAN NOT NULL,
  guesses INTEGER NOT NULL CHECK (guesses > 0),
  max_rows INTEGER NOT NULL CHECK (max_rows > 0),
  date DATE NOT NULL,
  feedback JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for game_results
CREATE INDEX idx_game_results_user_id ON game_results(user_id);
CREATE INDEX idx_game_results_user_date ON game_results(user_id, date DESC);
CREATE INDEX idx_game_results_date ON game_results(date DESC);

-- ============================================================================
-- FRIENDSHIPS TABLE
-- ============================================================================
CREATE TABLE friendships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id_1 UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  user_id_2 UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  CONSTRAINT friendship_users_different CHECK (user_id_1 < user_id_2),
  CONSTRAINT friendship_unique UNIQUE (user_id_1, user_id_2)
);

-- Indexes for friendships
CREATE INDEX idx_friendships_user_1 ON friendships(user_id_1);
CREATE INDEX idx_friendships_user_2 ON friendships(user_id_2);
CREATE INDEX idx_friendships_status ON friendships(status);

-- ============================================================================
-- FRIEND REQUESTS TABLE
-- ============================================================================
CREATE TABLE friend_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT request_users_different CHECK (from_user_id != to_user_id),
  CONSTRAINT request_unique UNIQUE (from_user_id, to_user_id)
);

-- Indexes for friend_requests
CREATE INDEX idx_friend_requests_from ON friend_requests(from_user_id);
CREATE INDEX idx_friend_requests_to ON friend_requests(to_user_id);
CREATE INDEX idx_friend_requests_to_status ON friend_requests(to_user_id, status);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to profiles
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to game_stats
CREATE TRIGGER update_game_stats_updated_at
  BEFORE UPDATE ON game_stats
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE profiles IS 'User profile information including username and friend code';
COMMENT ON TABLE game_stats IS 'Aggregated game statistics per user per word length';
COMMENT ON TABLE game_results IS 'Individual game results for history and head-to-head';
COMMENT ON TABLE friendships IS 'Friend relationships between users';
COMMENT ON TABLE friend_requests IS 'Pending, accepted, or declined friend requests';












