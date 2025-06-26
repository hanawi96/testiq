import { supabase, supabaseConfig, TABLES } from '../config/supabase';

/**
 * Test Supabase connection and setup
 */
export async function testSupabaseConnection() {
  console.log('🔗 Testing Supabase connection...');
  console.log('📍 URL:', supabaseConfig.url);
  console.log('🔑 Key configured:', supabaseConfig.isConfigured);

  try {
    // Test 1: Basic connection with a simple query that doesn't trigger RLS
    console.log('Testing basic connection...');
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('❌ Connection test failed:', error.message);
      return { success: false, error: error.message };
    }

    console.log('✅ Supabase connection successful');
    
    // Test 2: Check if user_profiles table exists
    console.log('Testing user_profiles table access...');
    try {
      // Simple count query to test table access
      const { data: userProfiles, error: profileError } = await supabase
        .from(TABLES.PROFILES)
        .select('id', { count: 'exact' })
        .limit(1);
      
      if (profileError) {
        console.warn('⚠️ user_profiles table not found. Database setup required.');
        return { 
          success: true, 
          needsSetup: true, 
          message: 'Database setup required' 
        };
      }

      console.log('✅ user_profiles table found');
      console.log('👥 Table accessible');

      return { 
        success: true, 
        needsSetup: false, 
        message: 'Database ready'
      };

    } catch (tableErr) {
      console.warn('⚠️ Database not properly setup:', tableErr);
      return { 
        success: true, 
        needsSetup: true, 
        message: 'Database setup required' 
      };
    }

  } catch (err) {
    console.error('❌ Unexpected error:', err);
    return { success: false, error: 'Unexpected connection error' };
  }
}

/**
 * Check if database is properly set up
 */
export async function checkDatabaseSetup() {
  try {
    console.log('🔍 Checking database setup...');

    // Test user_profiles table access
    const { data, error } = await supabase
      .from(TABLES.PROFILES)
      .select('id')
      .limit(1);

    if (error) {
      console.log('Database setup check failed:', error.message);
      return { isSetup: false, error: error.message };
    }

    console.log('✅ Database structure verified');
    return { isSetup: true, error: null };

  } catch (err) {
    console.error('❌ Database check failed:', err);
    return { isSetup: false, error: 'Database check failed' };
  }
} 