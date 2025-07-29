-- 🚀 OPTIMIZED RPC function to get users with stats (registered + anonymous)
-- Performance improvements: Better indexing strategy, simplified query structure

CREATE OR REPLACE FUNCTION get_users_with_stats(
  page_limit INTEGER DEFAULT 10,
  page_offset INTEGER DEFAULT 0,
  role_filter TEXT DEFAULT NULL,
  search_term TEXT DEFAULT NULL,
  user_status_filter TEXT DEFAULT NULL,
  gender_filter TEXT DEFAULT NULL,
  sort_by TEXT DEFAULT 'created_desc'
)
RETURNS TABLE (
  id TEXT,
  full_name TEXT,
  email TEXT,
  username CHARACTER VARYING(30),
  role TEXT,
  is_verified BOOLEAN,
  last_login TIMESTAMP WITHOUT TIME ZONE,
  age INTEGER,
  country_name TEXT,
  country_code CHARACTER(2),
  gender TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITHOUT TIME ZONE,
  updated_at TIMESTAMP WITHOUT TIME ZONE,
  user_type TEXT,
  test_count INTEGER,
  total_count BIGINT
)
LANGUAGE plpgsql
AS $$
DECLARE
  total_rows BIGINT;
BEGIN
  -- 🔥 OPTIMIZATION: Get total count first with simpler query
  SELECT COUNT(*) INTO total_rows
  FROM (
    -- Count registered users
    SELECT 1 FROM user_profiles up
    WHERE 
      (role_filter IS NULL OR role_filter = 'all' OR up.role = role_filter)
      AND (search_term IS NULL OR search_term = '' OR 
           up.full_name ILIKE '%' || search_term || '%' OR
           up.email ILIKE '%' || search_term || '%' OR
           up.username ILIKE '%' || search_term || '%')
      AND (user_status_filter IS NULL OR user_status_filter = 'all' OR
           (user_status_filter = 'registered_verified' AND up.is_verified = true) OR
           (user_status_filter = 'registered_unverified' AND up.is_verified = false))
      AND (gender_filter IS NULL OR up.gender = gender_filter)
    
    UNION ALL
    
    -- Count anonymous users (only if not filtering by registered-only status)
    SELECT 1 FROM anonymous_players ap
    WHERE 
      (role_filter IS NULL OR role_filter = 'all' OR role_filter = 'user')
      AND (search_term IS NULL OR search_term = '' OR 
           ap.name ILIKE '%' || search_term || '%' OR
           ap.email ILIKE '%' || search_term || '%' OR
           ap.username ILIKE '%' || search_term || '%')
      AND (user_status_filter IS NULL OR user_status_filter = 'all' OR user_status_filter = 'anonymous')
      AND (gender_filter IS NULL OR ap.gender = gender_filter)
  ) combined_count;

  -- 🚀 OPTIMIZATION: Main query with pre-calculated total and simplified structure
  RETURN QUERY
  SELECT 
    final_users.id,
    final_users.full_name,
    final_users.email,
    final_users.username,
    final_users.role,
    final_users.is_verified,
    final_users.last_login,
    final_users.age,
    final_users.country_name,
    final_users.country_code,
    final_users.gender,
    final_users.avatar_url,
    final_users.created_at,
    final_users.updated_at,
    final_users.user_type,
    final_users.test_count,
    total_rows as total_count
  FROM (
    -- Registered users with test counts
    SELECT 
      up.id::TEXT as id,
      up.full_name,
      up.email,
      up.username,
      up.role,
      up.is_verified,
      up.last_login,
      up.age,
      up.country_name,
      up.country_code,
      up.gender,
      up.avatar_url,
      up.created_at,
      up.updated_at,
      'registered'::TEXT as user_type,
      COALESCE(tc.test_count, 0)::INTEGER as test_count,
      -- Simplified sorting field
      CASE 
        WHEN sort_by = 'age_asc' THEN up.age
        WHEN sort_by = 'age_desc' THEN -up.age
        WHEN sort_by = 'created_asc' THEN EXTRACT(EPOCH FROM up.created_at)::INTEGER
        ELSE -EXTRACT(EPOCH FROM up.created_at)::INTEGER
      END as sort_field
    FROM user_profiles up
    LEFT JOIN (
      SELECT user_id, COUNT(*)::INTEGER as test_count
      FROM user_test_results 
      WHERE user_id IS NOT NULL
      GROUP BY user_id
    ) tc ON up.id = tc.user_id
    WHERE 
      (role_filter IS NULL OR role_filter = 'all' OR up.role = role_filter)
      AND (search_term IS NULL OR search_term = '' OR 
           up.full_name ILIKE '%' || search_term || '%' OR
           up.email ILIKE '%' || search_term || '%' OR
           up.username ILIKE '%' || search_term || '%')
      AND (user_status_filter IS NULL OR user_status_filter = 'all' OR
           (user_status_filter = 'registered_verified' AND up.is_verified = true) OR
           (user_status_filter = 'registered_unverified' AND up.is_verified = false))
      AND (gender_filter IS NULL OR up.gender = gender_filter)
    
    UNION ALL
    
    -- Anonymous users with test counts
    SELECT 
      ap.id::TEXT as id,
      ap.name as full_name,
      ap.email,
      ap.username,
      'user'::TEXT as role,
      false as is_verified,
      NULL::TIMESTAMP as last_login,
      ap.age,
      ap.country_name,
      ap.country_code,
      ap.gender,
      NULL::TEXT as avatar_url,
      ap.created_at,
      ap.created_at as updated_at,
      'anonymous'::TEXT as user_type,
      COALESCE(etc.test_count, 0)::INTEGER as test_count,
      -- Simplified sorting field
      CASE 
        WHEN sort_by = 'age_asc' THEN ap.age
        WHEN sort_by = 'age_desc' THEN -ap.age
        WHEN sort_by = 'created_asc' THEN EXTRACT(EPOCH FROM ap.created_at)::INTEGER
        ELSE -EXTRACT(EPOCH FROM ap.created_at)::INTEGER
      END as sort_field
    FROM anonymous_players ap
    LEFT JOIN (
      SELECT utr.email, COUNT(*)::INTEGER as test_count
      FROM user_test_results utr
      WHERE utr.email IS NOT NULL AND utr.user_id IS NULL
      GROUP BY utr.email
    ) etc ON ap.email = etc.email
    WHERE 
      (role_filter IS NULL OR role_filter = 'all' OR role_filter = 'user')
      AND (search_term IS NULL OR search_term = '' OR 
           ap.name ILIKE '%' || search_term || '%' OR
           ap.email ILIKE '%' || search_term || '%' OR
           ap.username ILIKE '%' || search_term || '%')
      AND (user_status_filter IS NULL OR user_status_filter = 'all' OR user_status_filter = 'anonymous')
      AND (gender_filter IS NULL OR ap.gender = gender_filter)
  ) final_users
  ORDER BY final_users.sort_field
  LIMIT page_limit
  OFFSET page_offset;
END;
$$;

-- 🚀 PERFORMANCE INDEXES: Create optimized indexes for better query performance
-- These indexes will significantly improve search and filter performance

-- Index for user_profiles search operations
CREATE INDEX IF NOT EXISTS idx_user_profiles_search 
ON user_profiles USING gin(
  to_tsvector('english', COALESCE(full_name, '') || ' ' || COALESCE(email, '') || ' ' || COALESCE(username, ''))
);

-- Index for anonymous_players search operations  
CREATE INDEX IF NOT EXISTS idx_anonymous_players_search 
ON anonymous_players USING gin(
  to_tsvector('english', COALESCE(name, '') || ' ' || COALESCE(email, '') || ' ' || COALESCE(username, ''))
);

-- Composite indexes for common filter combinations
CREATE INDEX IF NOT EXISTS idx_user_profiles_filters 
ON user_profiles (role, is_verified, gender, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_anonymous_players_filters 
ON anonymous_players (gender, created_at DESC);

-- Index for test results aggregation
CREATE INDEX IF NOT EXISTS idx_user_test_results_user_id 
ON user_test_results (user_id) WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_user_test_results_email 
ON user_test_results (email) WHERE email IS NOT NULL AND user_id IS NULL;

-- Age-based sorting indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_age_created 
ON user_profiles (age, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_anonymous_players_age_created 
ON anonymous_players (age, created_at DESC);
