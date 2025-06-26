import { supabase, TABLES } from '../config/supabase';
import { AdminService } from '../admin/service';

// Type for setup results
interface SetupResult {
  step: number;
  success: boolean;
  error?: string;
}

/**
 * Quick database setup for development
 * Creates the user_profiles table and basic setup
 */
export async function quickSetupDatabase() {
  console.log('🚀 Starting quick database setup...');

  const setupSteps = [
    {
      name: 'Check user_profiles table',
      execute: async () => {
        // Use direct SQL query instead of RPC
        const { data, error } = await supabase
          .from(TABLES.PROFILES)
          .select('id')
          .limit(1);
        
        // If table doesn't exist, we'll get an error
        if (error && error.message.includes('does not exist')) {
          // Table doesn't exist, need manual setup
          throw new Error('Table does not exist. Please run the SQL setup manually.');
        }
        
        return { success: true };
      }
    }
  ];

  const results: SetupResult[] = [];

  for (let i = 0; i < setupSteps.length; i++) {
    const step = setupSteps[i];
    console.log(`📝 Executing step ${i + 1}/${setupSteps.length}: ${step.name}...`);
    
    try {
      await step.execute();
      console.log(`✅ Step ${i + 1} completed`);
      results.push({ step: i + 1, success: true });
    } catch (err: any) {
      console.error(`❌ Step ${i + 1} failed:`, err.message);
      results.push({ step: i + 1, success: false, error: err.message });
    }
  }

  const successCount = results.filter(r => r.success).length;
  console.log(`\n🎯 Setup completed: ${successCount}/${results.length} steps successful`);

  return {
    success: successCount === results.length,
    results,
    successCount,
    totalCount: results.length,
    needsManualSetup: results.some(r => r.error?.includes('does not exist'))
  };
}

/**
 * Create an admin user (for testing)
 */
export async function createTestAdmin(email: string = 'admin@test.com', password: string = 'admin123') {
  console.log('👤 Creating test admin user...');

  try {
    // 1. Sign up the user
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: undefined // Disable email confirmation for testing
      }
    });

    if (signUpError) {
      console.error('❌ Admin signup failed:', signUpError.message);
      return { success: false, error: signUpError.message };
    }

    if (!authData.user) {
      console.error('❌ No user returned from signup');
      return { success: false, error: 'No user returned' };
    }

    console.log('✅ Admin auth user created:', authData.user.id);

    // 2. Create admin profile using AdminService
    const { success: profileSuccess, error: profileError } = await AdminService.createAdminUser(
      authData.user.id,
      authData.user.email || email,
      'Test Admin'
    );

    if (!profileSuccess || profileError) {
      console.error('❌ Could not create admin profile:', profileError);
      return { success: false, error: 'Could not create admin profile' };
    }

    console.log('✅ Admin profile created in user_profiles table');

    return {
      success: true,
      user: authData.user,
      credentials: { email, password }
    };

  } catch (err) {
    console.error('❌ Unexpected error creating admin:', err);
    return { success: false, error: 'Unexpected error' };
  }
} 