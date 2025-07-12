/**
 * Auth Debug Utility
 * Kiểm tra và debug authentication issues
 */

import { supabase } from '../backend/config/supabase';

export async function debugAuth() {
  console.log('🔍 Starting Auth Debug...');
  
  try {
    // 1. Check Supabase connection
    console.log('1. Testing Supabase connection...');
    const { data: testData, error: testError } = await supabase
      .from('articles')
      .select('id')
      .limit(1);
    
    if (testError) {
      console.error('❌ Supabase connection failed:', testError);
      return false;
    } else {
      console.log('✅ Supabase connection OK');
    }

    // 2. Check current session
    console.log('2. Checking current session...');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ Session check failed:', sessionError);
    } else if (session) {
      console.log('✅ Active session found:', {
        userId: session.user.id,
        email: session.user.email,
        expiresAt: new Date(session.expires_at * 1000).toLocaleString()
      });
    } else {
      console.log('⚠️ No active session');
    }

    // 3. Check user_profiles table
    console.log('3. Checking user_profiles table...');
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('id, email, role')
      .limit(5);
    
    if (profilesError) {
      console.error('❌ user_profiles check failed:', profilesError);
    } else {
      console.log('✅ user_profiles accessible:', profiles?.length || 0, 'profiles found');
      if (profiles && profiles.length > 0) {
        console.log('Sample profiles:', profiles);
      }
    }

    // 4. Check for admin users
    console.log('4. Checking for admin users...');
    const { data: adminUsers, error: adminError } = await supabase
      .from('user_profiles')
      .select('id, email, role')
      .eq('role', 'admin');
    
    if (adminError) {
      console.error('❌ Admin users check failed:', adminError);
    } else {
      console.log('✅ Admin users found:', adminUsers?.length || 0);
      if (adminUsers && adminUsers.length > 0) {
        console.log('Admin users:', adminUsers);
      }
    }

    // 5. Test login with known credentials
    console.log('5. Testing login capabilities...');
    console.log('Auth URL:', supabase.supabaseUrl);
    console.log('Auth Key length:', supabase.supabaseKey?.length || 0);

    return true;

  } catch (error) {
    console.error('❌ Auth debug failed:', error);
    return false;
  }
}

export async function testLogin(email: string, password: string) {
  console.log('🔐 Testing login for:', email);
  
  try {
    // 1. Attempt sign in
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      console.error('❌ Login failed:', error);
      return { success: false, error };
    }

    console.log('✅ Login successful:', {
      userId: data.user?.id,
      email: data.user?.email
    });

    // 2. Check user profile
    if (data.user) {
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (profileError) {
        console.error('❌ Profile check failed:', profileError);
      } else {
        console.log('✅ User profile:', profile);
      }
    }

    return { success: true, user: data.user };

  } catch (error) {
    console.error('❌ Login test failed:', error);
    return { success: false, error };
  }
}

export async function createTestAdmin() {
  console.log('👤 Creating test admin user...');
  
  try {
    // 1. Create auth user
    const { data, error } = await supabase.auth.signUp({
      email: 'admin@test.com',
      password: 'admin123456',
      options: {
        data: {
          full_name: 'Test Admin'
        }
      }
    });

    if (error) {
      console.error('❌ Admin creation failed:', error);
      return false;
    }

    console.log('✅ Auth user created:', data.user?.id);

    // 2. Create profile with admin role
    if (data.user) {
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          id: data.user.id,
          email: data.user.email,
          full_name: 'Test Admin',
          role: 'admin',
          created_at: new Date().toISOString()
        });

      if (profileError) {
        console.error('❌ Profile creation failed:', profileError);
        return false;
      }

      console.log('✅ Admin profile created');
    }

    return true;

  } catch (error) {
    console.error('❌ Test admin creation failed:', error);
    return false;
  }
}

export async function quickAuthFix() {
  console.log('🔧 Running quick auth fix...');
  
  try {
    // 1. Clear any existing sessions
    await supabase.auth.signOut();
    
    // 2. Check if we can access the database
    const { data, error } = await supabase
      .from('user_profiles')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('❌ Database access failed:', error);
      return false;
    }

    console.log('✅ Database accessible');

    // 3. Try to create a simple admin user if none exists
    const { data: existingAdmins } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('role', 'admin')
      .limit(1);

    if (!existingAdmins || existingAdmins.length === 0) {
      console.log('⚠️ No admin users found, creating test admin...');
      await createTestAdmin();
    } else {
      console.log('✅ Admin users exist');
    }

    return true;

  } catch (error) {
    console.error('❌ Quick auth fix failed:', error);
    return false;
  }
}

// Make functions available globally for console testing
if (typeof window !== 'undefined') {
  (window as any).debugAuth = debugAuth;
  (window as any).testLogin = testLogin;
  (window as any).createTestAdmin = createTestAdmin;
  (window as any).quickAuthFix = quickAuthFix;
  
  console.log('🔧 Auth debug tools loaded:');
  console.log('  debugAuth() - Full auth system check');
  console.log('  testLogin(email, password) - Test login');
  console.log('  createTestAdmin() - Create test admin user');
  console.log('  quickAuthFix() - Quick fix common issues');
}
