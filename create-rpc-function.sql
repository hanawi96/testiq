-- ✅ RPC function để lấy users với email từ auth.users
CREATE OR REPLACE FUNCTION public.get_users_with_email(
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
    location TEXT,
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
            up.location
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
        ORDER BY au.created_at DESC -- Dùng created_at từ auth.users
    )
    SELECT 
        fu.*,
        (SELECT COUNT(*) FROM filtered_users) as total_count
    FROM filtered_users fu
    LIMIT page_limit
    OFFSET page_offset;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_users_with_email(INTEGER, INTEGER, TEXT, TEXT, BOOLEAN) TO authenticated, anon;
