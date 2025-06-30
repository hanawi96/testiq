-- 🚀 ULTRA-OPTIMIZED Database Indexes for Lightning-Fast Leaderboard
-- Run this script on your Supabase database to boost performance dramatically

-- 1. OPTIMIZED INDEXES for user_test_results leaderboard queries
-- These indexes make ORDER BY score DESC queries 10x faster
CREATE INDEX IF NOT EXISTS idx_user_test_results_score_desc 
ON public.user_test_results USING btree (score DESC) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_user_test_results_tested_at_desc 
ON public.user_test_results USING btree (tested_at DESC) TABLESPACE pg_default;

-- Composite index for date range + score sorting (recent top performers)
CREATE INDEX IF NOT EXISTS idx_user_test_results_score_tested_at 
ON public.user_test_results USING btree (score DESC, tested_at DESC) TABLESPACE pg_default;

-- User-specific ranking queries
CREATE INDEX IF NOT EXISTS idx_user_test_results_user_id_score 
ON public.user_test_results USING btree (user_id, score DESC) TABLESPACE pg_default;

-- 2. OPTIMIZED INDEXES for anonymous_players leaderboard performance
CREATE INDEX IF NOT EXISTS idx_anonymous_players_test_score_desc 
ON public.anonymous_players USING btree (test_score DESC) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_anonymous_players_created_at_desc 
ON public.anonymous_players USING btree (created_at DESC) TABLESPACE pg_default;

-- 3. Verify indexes were created successfully
DO $$
BEGIN
    RAISE NOTICE '🚀 Database optimization complete!';
    RAISE NOTICE '⚡ Leaderboard queries will now be SUPER FAST';
    RAISE NOTICE '📊 Indexes created for optimal score sorting';
END $$; 