import { supabase } from '../config/supabase';

export interface UserProfileData {
  full_name?: string;
  age?: number;
  country_name?: string;
  country_code?: string;
  email?: string;
  gender?: string;
}

/**
 * Update user profile information
 */
export async function updateUserProfile(userId: string, profileData: UserProfileData): Promise<{
  success: boolean;
  data?: any;
  error?: any;
}> {
  try {
    console.log('📝 Updating user profile:', userId, profileData);

    const { data, error } = await supabase
      .from('user_profiles')
      .update({
        full_name: profileData.full_name,
        age: profileData.age,
        country_name: profileData.country_name,
        country_code: profileData.country_code,
        email: profileData.email,
        gender: profileData.gender,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('❌ Error updating user profile:', error);
      return { success: false, error };
    }

    console.log('✅ User profile updated successfully:', data);
    console.log('✅ Updated country_name:', data?.country_name);
    return { success: true, data };

  } catch (err) {
    console.error('❌ Unexpected error updating user profile:', err);
    return { success: false, error: err };
  }
}

/**
 * Get user profile information
 */
export async function getUserProfile(userId: string): Promise<{
  success: boolean;
  data?: any;
  error?: any;
}> {
  try {
    console.log('👤 Getting user profile:', userId);

    const { data, error } = await supabase
      .from('user_profiles')
      .select('full_name, age, country_name, country_code, email, gender')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('❌ Error getting user profile:', error);
      return { success: false, error };
    }

    console.log('✅ User profile retrieved successfully');
    return { success: true, data };

  } catch (err) {
    console.error('❌ Unexpected error getting user profile:', err);
    return { success: false, error: err };
  }
} 