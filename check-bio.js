// Quick script to check bio data in database
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://your-project.supabase.co';
const supabaseKey = 'your-anon-key';

// You need to replace with your actual Supabase credentials
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkBioData() {
  try {
    console.log('🔍 Checking bio data in user_profiles...');
    
    const { data: users, error } = await supabase
      .from('user_profiles')
      .select('id, full_name, email, bio, role')
      .in('role', ['admin', 'editor', 'author']);

    if (error) {
      console.error('❌ Error:', error);
      return;
    }

    console.log('📊 Found users:', users?.length || 0);
    
    users?.forEach(user => {
      console.log(`👤 ${user.full_name}:`);
      console.log(`   Email: ${user.email || 'No email'}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Bio: ${user.bio || 'NO BIO'}`);
      console.log(`   Bio length: ${user.bio?.length || 0}`);
      console.log('---');
    });

  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

checkBioData();
