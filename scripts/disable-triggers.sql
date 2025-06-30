-- 🔧 DISABLE PROBLEMATIC TRIGGERS FOR DEVELOPMENT
-- Run this in Supabase SQL Editor if you encounter materialized view permission errors

-- 1. Disable auto refresh trigger
DROP TRIGGER IF EXISTS auto_refresh_leaderboard ON public.user_test_results;

-- 2. Optionally, drop materialized views if not needed
-- DROP MATERIALIZED VIEW IF EXISTS leaderboard_cache;
-- DROP MATERIALIZED VIEW IF EXISTS leaderboard_stats_cache;

-- 3. Remove refresh functions if not needed
-- DROP FUNCTION IF EXISTS refresh_leaderboard_cache();
-- DROP FUNCTION IF EXISTS trigger_smart_cache_refresh();
-- DROP FUNCTION IF EXISTS needs_cache_refresh();

-- 4. Verify triggers are removed
SELECT 
  trigger_name, 
  event_manipulation, 
  event_object_table,
  action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'user_test_results';

-- If no results, all triggers are disabled ✅ 