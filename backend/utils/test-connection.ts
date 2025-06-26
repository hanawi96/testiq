import { supabase, supabaseConfig } from '../config/supabase';

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
    
    // Test 2: Check if profiles table and RPC functions exist
    console.log('Testing profiles table access...');
    try {
      // Try to call our RPC function to test if it exists
      const { data: rpcTest, error: rpcError } = await supabase.rpc('get_all_profiles');
      
      if (rpcError) {
        console.warn('⚠️ RPC functions not found. Database setup required.');
        return { 
          success: true, 
          needsSetup: true, 
          message: 'Database setup required' 
        };
      }

      console.log('✅ Database functions found');
      console.log('👥 Existing profiles:', rpcTest?.length || 0);

      return { 
        success: true, 
        needsSetup: false, 
        profilesCount: rpcTest?.length || 0 
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

    // Test RPC function instead of direct table access
    const { data, error } = await supabase.rpc('get_all_profiles');

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