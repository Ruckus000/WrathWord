-- Migration: Add account deletion function
-- This function allows authenticated users to delete their own account
-- Explicitly deletes from all tables to avoid CASCADE dependency issues

-- Create function to delete the calling user's account
-- Explicitly create in public schema for PostgREST visibility
CREATE OR REPLACE FUNCTION public.delete_own_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Prefer auth.uid() in Supabase runtime.
  v_user_id := auth.uid();

  -- Fallback for contexts where auth.uid() is not populated.
  IF v_user_id IS NULL THEN
    v_user_id := NULLIF(current_setting('request.jwt.claim.sub', true), '')::uuid;
  END IF;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '28000';
  END IF;

  -- Explicitly delete from all tables in correct order
  -- (child tables first, then parent tables)

  -- Delete friend requests (where user is sender or receiver)
  DELETE FROM friend_requests WHERE from_user_id = v_user_id OR to_user_id = v_user_id;

  -- Delete friendships (where user is either party)
  DELETE FROM friendships WHERE user_id_1 = v_user_id OR user_id_2 = v_user_id;

  -- Delete game results
  DELETE FROM game_results WHERE user_id = v_user_id;

  -- Delete game stats
  DELETE FROM game_stats WHERE user_id = v_user_id;

  -- Delete profile
  DELETE FROM profiles WHERE user_id = v_user_id;

  -- Finally, delete from auth.users
  DELETE FROM auth.users WHERE id = v_user_id;
END;
$$;

-- Ensure authenticated role has USAGE on public schema (required for function execution)
GRANT USAGE ON SCHEMA public TO authenticated;

-- Grant execute permission to authenticated users only
-- Explicitly qualify with schema name to avoid permission issues
GRANT EXECUTE ON FUNCTION public.delete_own_account() TO authenticated;

-- Revoke from public/anon for security
REVOKE EXECUTE ON FUNCTION public.delete_own_account() FROM anon;
REVOKE EXECUTE ON FUNCTION public.delete_own_account() FROM public;
