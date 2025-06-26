-- Supabase Database Setup Script for IQ Test Admin System
-- Copy toàn bộ nội dung file này và paste vào Supabase SQL Editor

-- =====================================================
-- 1. CREATE PROFILES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 2. ENABLE ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 3. CREATE RLS POLICIES
-- =====================================================

-- Policy: Users can view their own profile
CREATE POLICY IF NOT EXISTS "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Policy: Users can update their own profile  
CREATE POLICY IF NOT EXISTS "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Policy: Admins can view all profiles
CREATE POLICY IF NOT EXISTS "Admins can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policy: Admins can update all profiles
CREATE POLICY IF NOT EXISTS "Admins can update all profiles" ON profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =====================================================
-- 4. CREATE FUNCTION FOR NEW USER SIGNUP
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (NEW.id, NEW.email, 'user');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 5. CREATE TRIGGER FOR NEW USERS
-- =====================================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- 6. CREATE INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- =====================================================
-- SETUP COMPLETE!
-- =====================================================
-- Sau khi chạy script này thành công:
-- 1. Quay lại http://localhost:4322/admin/test
-- 2. Nhấn "🧪 Test lại" để kiểm tra
-- 3. Nhấn "👑 Tạo Admin" để tạo tài khoản admin
-- 4. Lưu thông tin đăng nhập và truy cập /admin/login 