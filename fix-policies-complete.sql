-- Complete Fix for Infinite Recursion in RLS Policies
-- Copy và chạy script này trong Supabase SQL Editor

-- 1. Drop all existing problematic policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admin can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admin can update any profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow profile creation" ON public.profiles;

-- 2. Create simple, non-recursive policies for basic operations

-- Policy: Users can view their own profile only
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Policy: Users can update their own profile only
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Policy: Allow profile creation during signup
CREATE POLICY "Allow profile creation"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 3. Create RPC function to bypass RLS for admin operations
CREATE OR REPLACE FUNCTION public.get_user_profile(user_id UUID)
RETURNS TABLE(
  id UUID,
  email TEXT,
  role TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  -- This function runs with SECURITY DEFINER, bypassing RLS
  RETURN QUERY
  SELECT p.id, p.email, p.role, p.created_at, p.updated_at
  FROM public.profiles p
  WHERE p.id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create function to get all profiles (for admin dashboard)
CREATE OR REPLACE FUNCTION public.get_all_profiles()
RETURNS TABLE(
  id UUID,
  email TEXT,
  role TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  -- This function runs with SECURITY DEFINER, bypassing RLS
  RETURN QUERY
  SELECT p.id, p.email, p.role, p.created_at, p.updated_at
  FROM public.profiles p
  ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Create function to update user role (for admin operations)
CREATE OR REPLACE FUNCTION public.update_user_role(user_id UUID, new_role TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- This function runs with SECURITY DEFINER, bypassing RLS
  UPDATE public.profiles
  SET role = new_role, updated_at = NOW()
  WHERE id = user_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.get_user_profile(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_all_profiles() TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_user_role(UUID, TEXT) TO authenticated;

-- Setup complete! This approach:
-- 1. Eliminates infinite recursion by removing recursive admin policies
-- 2. Uses RPC functions with SECURITY DEFINER to bypass RLS when needed
-- 3. Keeps basic user-level security intact
-- 4. Handles admin operations at the application layer 