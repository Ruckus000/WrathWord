-- ============================================================================
-- FIX GET LEADERBOARD - Add Period Filtering Support
-- This migration replaces the get_leaderboard function to properly handle
-- the p_period parameter for 'today', 'week', and 'alltime' filtering
-- ============================================================================

-- Drop the existing function first
DROP FUNCTION IF EXISTS get_leaderboard(UUID, BOOLEAN, TEXT, INTEGER);

-- Recreate with updated return type
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
  max_streak INTEGER,
  avg_guesses NUMERIC
) AS $$
DECLARE
  v_date_filter DATE;
BEGIN
  -- Determine date filter based on period
  IF p_period = 'today' THEN
    v_date_filter := CURRENT_DATE;
  ELSIF p_period = 'week' THEN
    v_date_filter := CURRENT_DATE - INTERVAL '7 days';
  ELSE
    v_date_filter := NULL; -- No date filter for alltime
  END IF;

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
    -- For period-based queries, use game_results table
    SELECT
      gr.user_id,
      COUNT(*)::INTEGER AS total_played,
      COUNT(*) FILTER (WHERE gr.won = true)::INTEGER AS total_won,
      CASE
        WHEN COUNT(*) > 0
        THEN ROUND((COUNT(*) FILTER (WHERE gr.won = true)::NUMERIC / COUNT(*)::NUMERIC) * 100, 1)
        ELSE 0
      END AS win_rate,
      ROUND(AVG(gr.guesses), 1) AS avg_guesses,
      0 AS current_streak, -- Streak calculation would be complex for time periods
      0 AS max_streak
    FROM game_results gr
    INNER JOIN filtered_users fu ON gr.user_id = fu.user_id
    WHERE (
      v_date_filter IS NULL -- alltime
      OR (p_period = 'today' AND gr.date = v_date_filter)
      OR (p_period = 'week' AND gr.date >= v_date_filter)
    )
    GROUP BY gr.user_id
    HAVING COUNT(*) >= CASE 
      WHEN p_period = 'today' THEN 1
      WHEN p_period = 'week' THEN 3
      ELSE 5 -- alltime minimum
    END
  ),
  -- Get streak data from game_stats if alltime
  streak_data AS (
    SELECT
      gs.user_id,
      MAX(gs.current_streak) AS current_streak,
      MAX(gs.max_streak) AS max_streak
    FROM game_stats gs
    INNER JOIN filtered_users fu ON gs.user_id = fu.user_id
    WHERE p_period = 'alltime'
    GROUP BY gs.user_id
  ),
  ranked_users AS (
    SELECT
      us.*,
      COALESCE(sd.current_streak, 0) AS final_current_streak,
      COALESCE(sd.max_streak, 0) AS final_max_streak,
      ROW_NUMBER() OVER (
        ORDER BY 
          CASE WHEN p_period = 'today' THEN us.avg_guesses ELSE NULL END ASC,
          CASE WHEN p_period != 'today' THEN us.win_rate ELSE NULL END DESC,
          us.total_played DESC
      ) AS rank
    FROM user_stats us
    LEFT JOIN streak_data sd ON us.user_id = sd.user_id
  )
  SELECT
    ru.user_id,
    p.username,
    p.display_name,
    p.friend_code,
    ru.rank::INTEGER,
    ru.total_played,
    ru.total_won,
    ru.win_rate,
    ru.final_current_streak::INTEGER,
    ru.final_max_streak::INTEGER,
    ru.avg_guesses
  FROM ranked_users ru
  INNER JOIN profiles p ON ru.user_id = p.user_id
  ORDER BY ru.rank
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- Add helpful comment
COMMENT ON FUNCTION get_leaderboard IS 'Returns leaderboard data with period filtering support (today/week/alltime). For today period, ranks by fewest guesses. For others, ranks by win rate.';

