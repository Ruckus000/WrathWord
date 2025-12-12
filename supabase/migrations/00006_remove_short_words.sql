-- Migration: Remove support for 2 and 3-letter words
-- Updates CHECK constraints to enforce minimum word length of 4
-- IMPORTANT: Deploy app update BEFORE running this migration

-- Update game_stats constraint
-- Drop the existing constraint and add new one with valid range 4-6
ALTER TABLE game_stats DROP CONSTRAINT IF EXISTS game_stats_word_length_check;
ALTER TABLE game_stats ADD CONSTRAINT game_stats_word_length_check
  CHECK (word_length >= 4 AND word_length <= 6);

-- Update game_results constraint
-- Drop the existing constraint and add new one with valid range 4-6
ALTER TABLE game_results DROP CONSTRAINT IF EXISTS game_results_word_length_check;
ALTER TABLE game_results ADD CONSTRAINT game_results_word_length_check
  CHECK (word_length >= 4 AND word_length <= 6);

-- Note: Existing data for word_length 2 and 3 will remain in the database
-- (orphaned but harmless). No data loss for 4/5/6-letter game history.

COMMENT ON CONSTRAINT game_stats_word_length_check ON game_stats IS 'Valid word lengths are 4-6 letters';
COMMENT ON CONSTRAINT game_results_word_length_check ON game_results IS 'Valid word lengths are 4-6 letters';
