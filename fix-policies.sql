-- Fix Infinite Recursion in RLS Policies
-- Copy và chạy script này trong Supabase SQL Editor

-- 1. Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admin can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admin can update any profile" ON public.profiles;

-- 2. Create simple, non-recursive policies

-- Policy: Users can view their own profile (no recursion)
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Policy: Users can update their own profile (no recursion)  
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Policy: Allow INSERT for new user profiles (needed for signup)
CREATE POLICY "Allow profile creation"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 3. Create a simple function to check admin role without recursion
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if current user has admin role using a direct query
  -- This avoids the RLS recursion issue
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create admin policies using the function (still might cause recursion)
-- We'll use a different approach: bypass RLS for admin operations

-- Alternative: Use service role for admin operations instead of RLS
-- This is cleaner and avoids recursion entirely

-- For now, let's use a simpler approach:
-- Admin policies will be handled in the application layer, not RLS 