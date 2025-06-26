-- Simple fix: Tạm thời tắt RLS để test admin login
-- Chạy trong Supabase SQL Editor

-- Tắt RLS tạm thời
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Hoặc nếu muốn giữ RLS, tạo policy đơn giản
-- DROP POLICY IF EXISTS "Allow all for testing" ON public.profiles;
-- CREATE POLICY "Allow all for testing" ON public.profiles FOR ALL USING (true); 