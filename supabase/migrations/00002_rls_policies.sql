-- WrathWord Row Level Security Policies
-- Implements security policies for all tables

-- ============================================================================
-- PROFILES RLS
-- ============================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can view friends' profiles
CREATE POLICY "Users can view friends' profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM friendships
      WHERE status = 'accepted'
        AND (
          (user_id_1 = auth.uid() AND user_id_2 = profiles.user_id)
          OR (user_id_2 = auth.uid() AND user_id_1 = profiles.user_id)
        )
    )
  );

-- Anyone can search by friend code (for adding friends)
CREATE POLICY "Anyone can search by friend code"
  ON profiles FOR SELECT
  USING (true);

-- New users can insert their own profile
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- GAME STATS RLS
-- ============================================================================

ALTER TABLE game_stats ENABLE ROW LEVEL SECURITY;

-- Users can view their own stats
CREATE POLICY "Users can view own stats"
  ON game_stats FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own stats
CREATE POLICY "Users can insert own stats"
  ON game_stats FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own stats
CREATE POLICY "Users can update own stats"
  ON game_stats FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can view friends' stats
CREATE POLICY "Users can view friends' stats"
  ON game_stats FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM friendships
      WHERE status = 'accepted'
        AND (
          (user_id_1 = auth.uid() AND user_id_2 = game_stats.user_id)
          OR (user_id_2 = auth.uid() AND user_id_1 = game_stats.user_id)
        )
    )
  );

-- ============================================================================
-- GAME RESULTS RLS
-- ============================================================================

ALTER TABLE game_results ENABLE ROW LEVEL SECURITY;

-- Users can view their own game results
CREATE POLICY "Users can view own game results"
  ON game_results FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own game results
CREATE POLICY "Users can insert own game results"
  ON game_results FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can view friends' game results
CREATE POLICY "Users can view friends' game results"
  ON game_results FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM friendships
      WHERE status = 'accepted'
        AND (
          (user_id_1 = auth.uid() AND user_id_2 = game_results.user_id)
          OR (user_id_2 = auth.uid() AND user_id_1 = game_results.user_id)
        )
    )
  );

-- ============================================================================
-- FRIENDSHIPS RLS
-- ============================================================================

ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;

-- Users can view their friendships
CREATE POLICY "Users can view own friendships"
  ON friendships FOR SELECT
  USING (auth.uid() = user_id_1 OR auth.uid() = user_id_2);

-- Users can insert friendships (when accepting request)
CREATE POLICY "Users can insert friendships"
  ON friendships FOR INSERT
  WITH CHECK (auth.uid() = user_id_1 OR auth.uid() = user_id_2);

-- Users can update friendships (to change status)
CREATE POLICY "Users can update friendships"
  ON friendships FOR UPDATE
  USING (auth.uid() = user_id_1 OR auth.uid() = user_id_2);

-- Users can delete their friendships
CREATE POLICY "Users can delete friendships"
  ON friendships FOR DELETE
  USING (auth.uid() = user_id_1 OR auth.uid() = user_id_2);

-- ============================================================================
-- FRIEND REQUESTS RLS
-- ============================================================================

ALTER TABLE friend_requests ENABLE ROW LEVEL SECURITY;

-- Users can view requests they sent or received
CREATE POLICY "Users can view own friend requests"
  ON friend_requests FOR SELECT
  USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

-- Users can send friend requests
CREATE POLICY "Users can send friend requests"
  ON friend_requests FOR INSERT
  WITH CHECK (auth.uid() = from_user_id);

-- Recipients can update requests (accept/decline)
CREATE POLICY "Recipients can update friend requests"
  ON friend_requests FOR UPDATE
  USING (auth.uid() = to_user_id);

-- Users can delete requests they sent
CREATE POLICY "Senders can delete friend requests"
  ON friend_requests FOR DELETE
  USING (auth.uid() = from_user_id);













