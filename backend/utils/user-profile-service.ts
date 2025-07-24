import { supabase } from '../config/supabase';

export interface UserProfileData {
  full_name?: string;
  age?: number;
  country_name?: string;
  country_code?: string;
  email?: string;
  gender?: string;
  avatar_url?: string;
  cover_photo_url?: string;
  bio?: string;
  username?: string;
  is_profile_public?: boolean;
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
        avatar_url: profileData.avatar_url,
        cover_photo_url: profileData.cover_photo_url,
        bio: profileData.bio,
        username: profileData.username,
        is_profile_public: profileData.is_profile_public,
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
      .select('full_name, age, country_name, country_code, email, gender, avatar_url, cover_photo_url, bio, username, is_profile_public')
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