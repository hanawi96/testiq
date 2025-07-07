-- Migration: Rename column location to country_name in user_profiles table
-- Date: 2025-01-07
-- Description: Update database schema to use country_name instead of location

BEGIN;

-- 1. Rename column location to country_name in user_profiles table
ALTER TABLE user_profiles 
RENAME COLUMN location TO country_name;

-- 2. Update the RPC function get_users_paginated to use new column name
CREATE OR REPLACE FUNCTION get_users_paginated(
    page_limit INTEGER DEFAULT 10,
    page_offset INTEGER DEFAULT 0,
    role_filter TEXT DEFAULT NULL,
    search_term TEXT DEFAULT NULL,
    verified_filter BOOLEAN DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    email TEXT,
    email_confirmed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ,
    last_sign_in_at TIMESTAMPTZ,
    full_name TEXT,
    role TEXT,
    is_verified BOOLEAN,
    last_login TIMESTAMP,
    age INTEGER,
    country_name TEXT,
    total_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH filtered_users AS (
        SELECT
            up.id,
            au.email::TEXT, -- Cast to TEXT để tránh type mismatch
            au.email_confirmed_at, -- từ auth.users (timestamptz)
            au.created_at, -- từ auth.users (timestamptz)
            au.last_sign_in_at, -- từ auth.users (timestamptz)
            up.full_name,
            up.role,
            up.is_verified,
            up.last_login, -- từ user_profiles (timestamp without time zone)
            up.age,
            up.country_name
        FROM user_profiles up
        INNER JOIN auth.users au ON up.id = au.id
        WHERE
            -- Filter by role
            (role_filter IS NULL OR up.role = role_filter)
            -- Filter by verification status
            AND (verified_filter IS NULL OR up.is_verified = verified_filter)
            -- Search in full_name or email
            AND (
                search_term IS NULL
                OR up.full_name ILIKE '%' || search_term || '%'
                OR au.email ILIKE '%' || search_term || '%'
            )
    )
    SELECT 
        fu.*,
        COUNT(*) OVER() as total_count
    FROM filtered_users fu
    ORDER BY fu.created_at DESC
    LIMIT page_limit
    OFFSET page_offset;
END;
$$;

-- 3. Add comment to document the change
COMMENT ON COLUMN user_profiles.country_name IS 'Country name of the user (renamed from location on 2025-01-07)';

-- 4. Verify the change
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
AND column_name IN ('location', 'country_name');

COMMIT;
