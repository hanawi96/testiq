import { supabase } from '../config/supabase';

export interface UserProfileData {
  full_name?: string;
  age?: number;
  location?: string;
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
        location: profileData.location,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('❌ Error updating user profile:', error);
      return { success: false, error };
    }

    console.log('✅ User profile updated successfully');
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
      .select('full_name, age, location')
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