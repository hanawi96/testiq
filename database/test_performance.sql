-- 🚀 PERFORMANCE TEST: Compare old vs new RPC function
-- Run this to test the performance improvements

-- ===== TEST 1: Basic pagination =====
EXPLAIN ANALYZE 
SELECT * FROM get_users_with_stats(10, 0);

-- ===== TEST 2: Search query =====
EXPLAIN ANALYZE 
SELECT * FROM get_users_with_stats(10, 0, NULL, 'john');

-- ===== TEST 3: Role filter =====
EXPLAIN ANALYZE 
SELECT * FROM get_users_with_stats(10, 0, 'admin');

-- ===== TEST 4: Complex filters =====
EXPLAIN ANALYZE 
SELECT * FROM get_users_with_stats(10, 0, 'user', 'test', 'registered_verified', 'male', 'age_desc');

-- ===== TEST 5: Large offset (pagination) =====
EXPLAIN ANALYZE 
SELECT * FROM get_users_with_stats(10, 100);

-- ===== BENCHMARK QUERIES =====
-- Run these multiple times to get average performance

-- Simple count query
\timing on
SELECT COUNT(*) FROM (
  SELECT 1 FROM user_profiles 
  UNION ALL 
  SELECT 1 FROM anonymous_players
) combined;

-- Search performance test
SELECT COUNT(*) FROM (
  SELECT 1 FROM user_profiles 
  WHERE full_name ILIKE '%john%' OR email ILIKE '%john%' OR username ILIKE '%john%'
  UNION ALL
  SELECT 1 FROM anonymous_players 
  WHERE name ILIKE '%john%' OR email ILIKE '%john%' OR username ILIKE '%john%'
) search_results;

-- Filter performance test
SELECT COUNT(*) FROM (
  SELECT 1 FROM user_profiles 
  WHERE role = 'user' AND is_verified = true AND gender = 'male'
  UNION ALL
  SELECT 1 FROM anonymous_players 
  WHERE gender = 'male'
) filter_results;

\timing off

-- ===== INDEX USAGE CHECK =====
-- Verify that indexes are being used

-- Check if search indexes are used
EXPLAIN (ANALYZE, BUFFERS) 
SELECT * FROM user_profiles 
WHERE to_tsvector('english', COALESCE(full_name, '') || ' ' || COALESCE(email, '') || ' ' || COALESCE(username, '')) 
@@ plainto_tsquery('english', 'john');

-- Check if filter indexes are used
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM user_profiles 
WHERE role = 'user' AND is_verified = true AND gender = 'male'
ORDER BY created_at DESC;

-- ===== PERFORMANCE COMPARISON =====
-- Compare with simple queries

-- Old approach (multiple queries)
\timing on
SELECT COUNT(*) FROM user_profiles;
SELECT COUNT(*) FROM anonymous_players;
SELECT user_id, COUNT(*) FROM user_test_results WHERE user_id IS NOT NULL GROUP BY user_id;
\timing off

-- New approach (single RPC call)
\timing on
SELECT COUNT(*) FROM get_users_with_stats(10, 0);
\timing off
