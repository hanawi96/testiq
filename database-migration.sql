-- Migration script: Move data from anonymous_players to user_test_results
-- Run this script AFTER implementing the new code to migrate existing data

-- 1. Insert existing anonymous_players data into user_test_results
INSERT INTO public.user_test_results (
  user_id,
  test_type,
  score,
  accuracy,
  duration_seconds,
  test_data,
  guest_name,
  guest_age,
  guest_location,
  tested_at
)
SELECT 
  NULL as user_id,
  'iq' as test_type,
  test_score as score,
  CASE 
    WHEN test_result->'detailed'->>'accuracy' IS NOT NULL 
    THEN (test_result->'detailed'->>'accuracy')::numeric 
    ELSE NULL 
  END as accuracy,
  test_duration as duration_seconds,
  test_result as test_data,
  name as guest_name,
  age as guest_age,
  location as guest_location,
  created_at as tested_at
FROM public.anonymous_players
WHERE NOT EXISTS (
  -- Avoid duplicates by checking if guest data already exists
  SELECT 1 FROM public.user_test_results 
  WHERE guest_name = anonymous_players.name 
    AND guest_age = anonymous_players.age 
    AND guest_location = anonymous_players.location
    AND test_data = anonymous_players.test_result
);

-- 2. Optional: Drop anonymous_players table after migration (uncomment if needed)
-- DROP TABLE IF EXISTS public.anonymous_players;

-- 3. Add comment to user_test_results table
COMMENT ON TABLE public.user_test_results IS 'Unified table for all test results - both authenticated users (user_id set) and anonymous users (user_id = NULL, guest_* fields used)';

-- 4. Verify migration
SELECT 
  COUNT(*) as total_results,
  COUNT(user_id) as authenticated_results,
  COUNT(*) - COUNT(user_id) as anonymous_results
FROM public.user_test_results; 