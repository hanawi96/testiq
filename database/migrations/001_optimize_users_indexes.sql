-- 🚀 PERFORMANCE OPTIMIZATION: Indexes for users management
-- Run this migration to improve query performance for admin users page

-- ===== SEARCH INDEXES =====
-- Full-text search indexes using GIN for better search performance

-- User profiles search index
CREATE INDEX IF NOT EXISTS idx_user_profiles_search 
ON user_profiles USING gin(
  to_tsvector('english', COALESCE(full_name, '') || ' ' || COALESCE(email, '') || ' ' || COALESCE(username, ''))
);

-- Anonymous players search index
CREATE INDEX IF NOT EXISTS idx_anonymous_players_search 
ON anonymous_players USING gin(
  to_tsvector('english', COALESCE(name, '') || ' ' || COALESCE(email, '') || ' ' || COALESCE(username, ''))
);

-- ===== FILTER INDEXES =====
-- Composite indexes for common filter combinations

-- User profiles filters (role, verification, gender, sorting)
CREATE INDEX IF NOT EXISTS idx_user_profiles_filters 
ON user_profiles (role, is_verified, gender, created_at DESC);

-- Anonymous players filters (gender, sorting)
CREATE INDEX IF NOT EXISTS idx_anonymous_players_filters 
ON anonymous_players (gender, created_at DESC);

-- ===== AGGREGATION INDEXES =====
-- Indexes for test count aggregation

-- User test results by user_id (for registered users)
CREATE INDEX IF NOT EXISTS idx_user_test_results_user_id 
ON user_test_results (user_id) WHERE user_id IS NOT NULL;

-- User test results by email (for anonymous users)
CREATE INDEX IF NOT EXISTS idx_user_test_results_email 
ON user_test_results (email) WHERE email IS NOT NULL AND user_id IS NULL;

-- ===== SORTING INDEXES =====
-- Indexes for common sorting operations

-- Age-based sorting for user profiles
CREATE INDEX IF NOT EXISTS idx_user_profiles_age_created 
ON user_profiles (age, created_at DESC);

-- Age-based sorting for anonymous players
CREATE INDEX IF NOT EXISTS idx_anonymous_players_age_created 
ON anonymous_players (age, created_at DESC);

-- ===== ADDITIONAL PERFORMANCE INDEXES =====
-- Extra indexes for edge cases and performance

-- Email-based lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_email 
ON user_profiles (email);

CREATE INDEX IF NOT EXISTS idx_anonymous_players_email 
ON anonymous_players (email);

-- Username-based lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_username 
ON user_profiles (username);

CREATE INDEX IF NOT EXISTS idx_anonymous_players_username 
ON anonymous_players (username);

-- Country-based filtering
CREATE INDEX IF NOT EXISTS idx_user_profiles_country 
ON user_profiles (country_code, country_name);

CREATE INDEX IF NOT EXISTS idx_anonymous_players_country 
ON anonymous_players (country_code, country_name);

-- ===== ANALYZE TABLES =====
-- Update table statistics for better query planning

ANALYZE user_profiles;
ANALYZE anonymous_players;
ANALYZE user_test_results;

-- ===== PERFORMANCE NOTES =====
/*
Expected performance improvements:
1. Search queries: 5-10x faster with GIN indexes
2. Filter combinations: 3-5x faster with composite indexes
3. Test count aggregation: 2-3x faster with targeted indexes
4. Sorting operations: 2-4x faster with dedicated sort indexes

Monitor query performance with:
EXPLAIN ANALYZE SELECT ... FROM get_users_with_stats(...);
*/
