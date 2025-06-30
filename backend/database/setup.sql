-- Supabase Database Setup for IQ Test Admin System
-- Execute these commands in your Supabase SQL Editor

-- 1. Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create test_results table (for future use)
CREATE TABLE IF NOT EXISTS test_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  time_spent INTEGER NOT NULL, -- in seconds
  answers JSONB NOT NULL,
  user_info JSONB, -- name, age, location
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create questions table (for future use)
CREATE TABLE IF NOT EXISTS questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  question_text TEXT NOT NULL,
  options JSONB NOT NULL, -- array of options
  correct_answer INTEGER NOT NULL, -- index of correct option
  difficulty TEXT DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  category TEXT DEFAULT 'general',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS Policies for profiles
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update all profiles" ON profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 6. Create RLS Policies for test_results
CREATE POLICY "Users can view own test results" ON test_results
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own test results" ON test_results
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all test results" ON test_results
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 7. Create RLS Policies for questions
CREATE POLICY "Everyone can view active questions" ON questions
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage questions" ON questions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 8. Create function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (NEW.id, NEW.email, 'user');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 10. Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 11. Create triggers for updated_at
CREATE TRIGGER handle_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_questions_updated_at
  BEFORE UPDATE ON questions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 12. Insert sample admin user (REPLACE WITH YOUR ACTUAL USER ID)
-- First, register a user through Supabase Auth, then run this:
-- INSERT INTO profiles (id, email, role)
-- VALUES ('your-user-uuid-here', 'admin@example.com', 'admin')
-- ON CONFLICT (id) DO UPDATE SET role = 'admin';

-- 13. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_test_results_user_id ON test_results(user_id);
CREATE INDEX IF NOT EXISTS idx_test_results_created_at ON test_results(created_at);
CREATE INDEX IF NOT EXISTS idx_questions_is_active ON questions(is_active);
CREATE INDEX IF NOT EXISTS idx_questions_difficulty ON questions(difficulty);

-- 14. OPTIMIZED: Add indexes for user_test_results leaderboard queries
CREATE INDEX IF NOT EXISTS idx_user_test_results_score_desc ON user_test_results(score DESC);
CREATE INDEX IF NOT EXISTS idx_user_test_results_tested_at_desc ON user_test_results(tested_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_test_results_score_tested_at ON user_test_results(score DESC, tested_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_test_results_user_id_score ON user_test_results(user_id, score DESC);

-- 15. OPTIMIZED: Add indexes for anonymous_players
CREATE INDEX IF NOT EXISTS idx_anonymous_players_test_score_desc ON anonymous_players(test_score DESC);
CREATE INDEX IF NOT EXISTS idx_anonymous_players_created_at_desc ON anonymous_players(created_at DESC);

-- Migration: Add gender column to anonymous_players table
-- This script is safe to run multiple times
ALTER TABLE public.anonymous_players ADD COLUMN IF NOT EXISTS gender text;

-- Migration: Add gender column to user_profiles table
-- This script is safe to run multiple times
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS gender text;

-- Verify the columns were added
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'anonymous_players' 
        AND column_name = 'gender'
        AND table_schema = 'public'
    ) THEN
        RAISE NOTICE 'Gender column successfully added to anonymous_players table';
    ELSE
        RAISE EXCEPTION 'Failed to add gender column to anonymous_players table';
    END IF;
    
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'user_profiles' 
        AND column_name = 'gender'
        AND table_schema = 'public'
    ) THEN
        RAISE NOTICE 'Gender column successfully added to user_profiles table';
    ELSE
        RAISE EXCEPTION 'Failed to add gender column to user_profiles table';
    END IF;
END $$;

-- Setup complete! 
-- Remember to:
-- 1. Enable Email authentication in Supabase Auth settings
-- 2. Configure your environment variables
-- 3. Create your first admin user 