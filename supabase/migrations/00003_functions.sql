-- WrathWord Helper Functions
-- Useful functions for common queries

-- ============================================================================
-- GET USER FRIENDS
-- Returns array of user IDs who are friends with the given user
-- ============================================================================

CREATE OR REPLACE FUNCTION get_user_friends(p_user_id UUID)
RETURNS TABLE (friend_id UUID) AS $$
BEGIN
  RETURN QUERY
  SELECT
    CASE
      WHEN user_id_1 = p_user_id THEN user_id_2
      ELSE user_id_1
    END AS friend_id
  FROM friendships
  WHERE status = 'accepted'
    AND (user_id_1 = p_user_id OR user_id_2 = p_user_id);
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- GET HEAD TO HEAD STATS
-- Returns head-to-head comparison between two users
-- ============================================================================

CREATE OR REPLACE FUNCTION get_head_to_head(
  p_user_id_1 UUID,
  p_user_id_2 UUID,
  p_word_length INTEGER DEFAULT NULL
)
RETURNS TABLE (
  user_1_wins INTEGER,
  user_2_wins INTEGER,
  user_1_avg_guesses NUMERIC,
  user_2_avg_guesses NUMERIC,
  total_games INTEGER
) AS $$
DECLARE
  v_user_1_wins INTEGER;
  v_user_2_wins INTEGER;
  v_user_1_avg NUMERIC;
  v_user_2_avg NUMERIC;
  v_total INTEGER;
BEGIN
  -- Get games where user 1 won and user 2 played on same day
  WITH same_day_games AS (
    SELECT
      gr1.user_id AS user_1_id,
      gr1.date,
      gr1.won AS user_1_won,
      gr1.guesses AS user_1_guesses,
      gr2.won AS user_2_won,
      gr2.guesses AS user_2_guesses
    FROM game_results gr1
    INNER JOIN game_results gr2
      ON gr1.date = gr2.date
      AND gr1.word_length = gr2.word_length
      AND gr1.user_id = p_user_id_1
      AND gr2.user_id = p_user_id_2
    WHERE (p_word_length IS NULL OR gr1.word_length = p_word_length)
      AND gr1.won = true
      AND gr2.won = true
  )
  SELECT
    COUNT(*) FILTER (WHERE user_1_guesses < user_2_guesses) INTO v_user_1_wins,
    COUNT(*) FILTER (WHERE user_2_guesses < user_1_guesses) INTO v_user_2_wins,
    AVG(user_1_guesses) INTO v_user_1_avg,
    AVG(user_2_guesses) INTO v_user_2_avg,
    COUNT(*) INTO v_total
  FROM same_day_games;

  -- Return results
  RETURN QUERY SELECT
    COALESCE(v_user_1_wins, 0),
    COALESCE(v_user_2_wins, 0),
    COALESCE(v_user_1_avg, 0),
    COALESCE(v_user_2_avg, 0),
    COALESCE(v_total, 0);
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- CALCULATE GLOBAL RANK
-- Returns user's global rank based on win rate and games played
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_global_rank(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_rank INTEGER;
BEGIN
  WITH user_total_stats AS (
    SELECT
      user_id,
      SUM(games_played) AS total_played,
      SUM(games_won) AS total_won,
      CASE
        WHEN SUM(games_played) > 0
        THEN (SUM(games_won)::NUMERIC / SUM(games_played)::NUMERIC)
        ELSE 0
      END AS win_rate
    FROM game_stats
    GROUP BY user_id
  )
  SELECT COUNT(*) + 1 INTO v_rank
  FROM user_total_stats
  WHERE (
    win_rate > (SELECT win_rate FROM user_total_stats WHERE user_id = p_user_id)
    OR (
      win_rate = (SELECT win_rate FROM user_total_stats WHERE user_id = p_user_id)
      AND total_played > (SELECT total_played FROM user_total_stats WHERE user_id = p_user_id)
    )
  );

  RETURN COALESCE(v_rank, 1);
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- GET LEADERBOARD
-- Returns global or friends leaderboard
-- ============================================================================

CREATE OR REPLACE FUNCTION get_leaderboard(
  p_user_id UUID,
  p_friends_only BOOLEAN DEFAULT false,
  p_period TEXT DEFAULT 'alltime', -- 'today', 'week', 'alltime'
  p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
  user_id UUID,
  username TEXT,
  display_name TEXT,
  friend_code TEXT,
  rank INTEGER,
  games_played INTEGER,
  games_won INTEGER,
  win_rate NUMERIC,
  current_streak INTEGER,
  max_streak INTEGER
) AS $$
BEGIN
  RETURN QUERY
  WITH filtered_users AS (
    SELECT p.user_id
    FROM profiles p
    WHERE (
      p_friends_only = false
      OR p.user_id = p_user_id
      OR EXISTS (
        SELECT 1 FROM friendships f
        WHERE f.status = 'accepted'
          AND ((f.user_id_1 = p_user_id AND f.user_id_2 = p.user_id)
            OR (f.user_id_2 = p_user_id AND f.user_id_1 = p.user_id))
      )
    )
  ),
  user_stats AS (
    SELECT
      gs.user_id,
      SUM(gs.games_played) AS total_played,
      SUM(gs.games_won) AS total_won,
      CASE
        WHEN SUM(gs.games_played) > 0
        THEN ROUND((SUM(gs.games_won)::NUMERIC / SUM(gs.games_played)::NUMERIC) * 100, 1)
        ELSE 0
      END AS win_rate,
      MAX(gs.current_streak) AS current_streak,
      MAX(gs.max_streak) AS max_streak
    FROM game_stats gs
    INNER JOIN filtered_users fu ON gs.user_id = fu.user_id
    GROUP BY gs.user_id
  ),
  ranked_users AS (
    SELECT
      us.*,
      ROW_NUMBER() OVER (ORDER BY us.win_rate DESC, us.total_played DESC) AS rank
    FROM user_stats us
    WHERE us.total_played >= 5 -- Minimum games for ranking
  )
  SELECT
    ru.user_id,
    p.username,
    p.display_name,
    p.friend_code,
    ru.rank::INTEGER,
    ru.total_played::INTEGER,
    ru.total_won::INTEGER,
    ru.win_rate,
    ru.current_streak::INTEGER,
    ru.max_streak::INTEGER
  FROM ranked_users ru
  INNER JOIN profiles p ON ru.user_id = p.user_id
  ORDER BY ru.rank
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- ACCEPT FRIEND REQUEST
-- Helper function to accept a friend request and create friendship
-- ============================================================================

CREATE OR REPLACE FUNCTION accept_friend_request(p_request_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_from_user UUID;
  v_to_user UUID;
  v_user_1 UUID;
  v_user_2 UUID;
BEGIN
  -- Get request details
  SELECT from_user_id, to_user_id
  INTO v_from_user, v_to_user
  FROM friend_requests
  WHERE id = p_request_id
    AND status = 'pending'
    AND to_user_id = auth.uid();

  IF v_from_user IS NULL THEN
    RETURN false;
  END IF;

  -- Ensure user_id_1 < user_id_2 for friendships table
  IF v_from_user < v_to_user THEN
    v_user_1 := v_from_user;
    v_user_2 := v_to_user;
  ELSE
    v_user_1 := v_to_user;
    v_user_2 := v_from_user;
  END IF;

  -- Update request status
  UPDATE friend_requests
  SET status = 'accepted'
  WHERE id = p_request_id;

  -- Create friendship
  INSERT INTO friendships (user_id_1, user_id_2, status, accepted_at)
  VALUES (v_user_1, v_user_2, 'accepted', NOW())
  ON CONFLICT (user_id_1, user_id_2) DO NOTHING;

  RETURN true;
END;
$$ LANGUAGE plpgsql;












