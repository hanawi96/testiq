-- Create RPC function for user profile creation
-- This function bypasses RLS and can be called from client-side code

CREATE OR REPLACE FUNCTION public.create_user_profile(
  user_id UUID,
  user_email TEXT,
  display_name TEXT,
  user_role TEXT DEFAULT 'user'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  -- Validate role
  IF user_role NOT IN ('user', 'admin', 'editor', 'author', 'reviewer') THEN
    user_role := 'user';
  END IF;

  -- Insert user profile
  INSERT INTO public.user_profiles (
    id,
    full_name,
    email,
    role,
    is_verified,
    created_at,
    updated_at
  ) VALUES (
    user_id,
    display_name,
    user_email,
    user_role,
    CASE WHEN user_role = 'admin' THEN true ELSE false END,
    NOW(),
    NOW()
  );

  -- Return success result
  SELECT json_build_object(
    'success', true,
    'user_id', user_id,
    'email', user_email,
    'role', user_role,
    'message', 'User profile created successfully'
  ) INTO result;

  RETURN result;

EXCEPTION
  WHEN unique_violation THEN
    -- Profile already exists, update it instead
    UPDATE public.user_profiles 
    SET 
      full_name = display_name,
      email = user_email,
      role = user_role,
      updated_at = NOW()
    WHERE id = user_id;

    SELECT json_build_object(
      'success', true,
      'user_id', user_id,
      'email', user_email,
      'role', user_role,
      'message', 'User profile updated successfully'
    ) INTO result;

    RETURN result;

  WHEN OTHERS THEN
    -- Return error
    SELECT json_build_object(
      'success', false,
      'error', SQLERRM,
      'message', 'Failed to create user profile'
    ) INTO result;

    RETURN result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.create_user_profile(UUID, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_user_profile(UUID, TEXT, TEXT, TEXT) TO anon;

-- Test the function (uncomment to test)
-- SELECT public.create_user_profile(
--   gen_random_uuid(),
--   'test@example.com',
--   'Test User',
--   'user'
-- );
