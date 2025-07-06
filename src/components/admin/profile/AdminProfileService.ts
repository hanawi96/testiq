import { supabase } from '@/backend/config/supabase';
import type { UserProfile } from '@/backend';

export interface AdminProfileData {
  id: string;
  email: string;
  full_name: string;
  role: string;
  created_at: string;
  updated_at?: string;
  avatar_url?: string;
}

/**
 * Admin Profile Service
 * Handles admin profile-specific operations
 */
export class AdminProfileService {
  
  /**
   * Get current admin profile
   */
  static async getCurrentAdminProfile(): Promise<{
    data: AdminProfileData | null;
    error: any;
  }> {
    try {
      console.log('AdminProfileService: Getting current admin profile...');

      // Get current user from auth
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.error('AdminProfileService: Auth error:', authError);
        return { data: null, error: authError || new Error('No authenticated user') };
      }

      console.log('AdminProfileService: User found:', user.email);

      // Get user profile from database
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('AdminProfileService: Profile error:', profileError);
        return { data: null, error: profileError };
      }

      if (!profile) {
        console.error('AdminProfileService: No profile found');
        return { data: null, error: new Error('Profile not found') };
      }

      console.log('AdminProfileService: Profile found:', profile.full_name);

      // Return formatted profile data
      const adminProfile: AdminProfileData = {
        id: profile.id,
        email: user.email || profile.email || '',
        full_name: profile.full_name || '',
        role: profile.role || 'user',
        created_at: profile.created_at || '',
        updated_at: profile.updated_at,
        avatar_url: profile.avatar_url
      };

      return { data: adminProfile, error: null };

    } catch (error) {
      console.error('AdminProfileService: Unexpected error:', error);
      return { data: null, error };
    }
  }

  /**
   * Update admin profile
   */
  static async updateAdminProfile(
    userId: string, 
    updates: Partial<AdminProfileData>
  ): Promise<{
    success: boolean;
    data?: AdminProfileData;
    error?: any;
  }> {
    try {
      console.log('AdminProfileService: Updating admin profile:', userId, updates);

      // Prepare update data
      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      if (updates.full_name !== undefined) {
        updateData.full_name = updates.full_name;
      }

      if (updates.email !== undefined) {
        updateData.email = updates.email;
      }

      if (updates.avatar_url !== undefined) {
        updateData.avatar_url = updates.avatar_url;
      }

      // Update profile in database
      const { data, error } = await supabase
        .from('user_profiles')
        .update(updateData)
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        console.error('AdminProfileService: Update error:', error);
        return { success: false, error };
      }

      if (!data) {
        console.error('AdminProfileService: No data returned from update');
        return { success: false, error: new Error('Update failed - no data returned') };
      }

      console.log('AdminProfileService: Profile updated successfully');

      // Return updated profile data
      const updatedProfile: AdminProfileData = {
        id: data.id,
        email: data.email || '',
        full_name: data.full_name || '',
        role: data.role || 'user',
        created_at: data.created_at || '',
        updated_at: data.updated_at,
        avatar_url: data.avatar_url
      };

      return { success: true, data: updatedProfile, error: null };

    } catch (error) {
      console.error('AdminProfileService: Unexpected error updating profile:', error);
      return { success: false, error };
    }
  }

  /**
   * Check if user has admin privileges
   */
  static async checkAdminPrivileges(userId: string): Promise<{
    isAdmin: boolean;
    role: string;
    error?: any;
  }> {
    try {
      console.log('AdminProfileService: Checking admin privileges for:', userId);

      const { data, error } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('AdminProfileService: Error checking privileges:', error);
        return { isAdmin: false, role: 'user', error };
      }

      const role = data?.role || 'user';
      const isAdmin = ['admin', 'editor', 'author', 'reviewer'].includes(role);

      console.log('AdminProfileService: User role:', role, 'isAdmin:', isAdmin);

      return { isAdmin, role, error: null };

    } catch (error) {
      console.error('AdminProfileService: Unexpected error checking privileges:', error);
      return { isAdmin: false, role: 'user', error };
    }
  }
}

export default AdminProfileService;
