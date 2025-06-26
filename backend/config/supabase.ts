import { createClient } from '@supabase/supabase-js';

// Environment variables - using provided credentials
const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL || 'https://qovhiztkfgjppfiqtake.supabase.co';
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvdmhpenRrZmdqcHBmaXF0YWtlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5MDIzMjYsImV4cCI6MjA2NjQ3ODMyNn0.0ALtY_sAoCEAqJoov1u5NSqj26yxKsEvYSTZECqaaEE';

// Validate configuration
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase configuration missing. Please check your environment variables.');
} else {
  console.log('✅ Supabase configuration loaded successfully');
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

// Configuration object
export const supabaseConfig = {
  url: supabaseUrl,
  anonKey: supabaseAnonKey,
  isConfigured: Boolean(supabaseUrl && supabaseAnonKey),
};

// Database table names
export const TABLES = {
  PROFILES: 'profiles',
  TEST_RESULTS: 'test_results',
  QUESTIONS: 'questions',
} as const; 