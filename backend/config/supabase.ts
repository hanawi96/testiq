import { createClient } from '@supabase/supabase-js';

// Environment variables - using provided credentials
const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL || 'https://qovhiztkfgjppfiqtake.supabase.co';
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvdmhpenRrZmdqcHBmaXF0YWtlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5MDIzMjYsImV4cCI6MjA2NjQ3ODMyNn0.0ALtY_sAoCEAqJoov1u5NSqj26yxKsEvYSTZECqaaEE';
const supabaseServiceKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvdmhpenRrZmdqcHBmaXF0YWtlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDkwMjMyNiwiZXhwIjoyMDY2NDc4MzI2fQ.OcrF64On2jtMwvZqJsSyXRN8EAawwPg9FmAe5MIWy60';

// Validate configuration
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase configuration missing. Please check your environment variables.');
} else {
  console.log('✅ Supabase configuration loaded successfully');
}

if (!supabaseServiceKey) {
  console.warn('⚠️ Supabase Service Role Key missing. Admin operations will not work.');
} else {
  console.log('✅ Supabase Service Role Key loaded successfully');
}

// Create Supabase client with FIXED auth configuration
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,  // ✅ Enable auto refresh for login persistence
    persistSession: true,    // ✅ Enable session persistence
    detectSessionInUrl: true, // ✅ Enable URL session detection
    flowType: 'pkce'         // ✅ Use PKCE flow for security
  },
  global: {
    headers: {
      'apikey': supabaseAnonKey,
    },
  },
  db: {
    schema: 'public',
  },
  realtime: {
    params: {
      eventsPerSecond: 2,
    },
  },
});

// Create admin client with service role key for admin operations
export const supabaseAdmin = supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
  global: {
    headers: {
      'apikey': supabaseServiceKey,
      'Authorization': `Bearer ${supabaseServiceKey}`,
    },
  },
}) : null;

// Storage configuration
export const storageConfig = {
  avatarsBucket: 'avatars',
  defaultAvatarSize: 200,
  maxUploadSizeMB: 2,
  allowedImageTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
};

// Configuration object
export const supabaseConfig = {
  url: supabaseUrl,
  anonKey: supabaseAnonKey,
  isConfigured: Boolean(supabaseUrl && supabaseAnonKey),
};

// Database table names
export const TABLES = {
  PROFILES: 'user_profiles',
  TEST_RESULTS: 'user_test_results',
  QUESTIONS: 'questions',
  CATEGORIES: 'categories',
  ARTICLES: 'articles',
  TAGS: 'tags',
  ARTICLE_TAGS: 'article_tags',
  COUNTRIES: 'countries',
  ANONYMOUS_PLAYERS: 'anonymous_players',
} as const;