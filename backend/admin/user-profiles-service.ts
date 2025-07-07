import { supabase } from '../config/supabase';

export interface UserProfile {
  id: string;
  full_name: string;
  email?: string;
  role: string;
}

export interface AuthorOption {
  id: string;
  full_name: string;
  email?: string;
  role: string;
  role_badge_color: string;
  role_display_name: string;
}

export class UserProfilesService {
  /**
   * Get all user profiles that can be authors (admin, editor, author roles)
   */
  static async getAuthorOptions(): Promise<{
    data: AuthorOption[] | null;
    error: any;
  }> {
    try {
      console.log('UserProfilesService: Fetching author options');

      const { data: profiles, error } = await supabase
        .from('user_profiles')
        .select('id, full_name, email, role')
        .in('role', ['admin', 'editor', 'author'])
        .order('full_name', { ascending: true });

      if (error) {
        console.error('UserProfilesService: Error fetching author options:', error);
        return { data: null, error };
      }

      // Transform profiles to author options with role badges
      const authorOptions: AuthorOption[] = (profiles || []).map(profile => ({
        ...profile,
        role_badge_color: this.getRoleBadgeColor(profile.role),
        role_display_name: this.getRoleDisplayName(profile.role)
      }));

      console.log('UserProfilesService: Author options fetched successfully:', authorOptions.length);
      return { data: authorOptions, error: null };

    } catch (err) {
      console.error('UserProfilesService: Error fetching author options:', err);
      return { data: null, error: err };
    }
  }

  /**
   * Get role badge color for UI display
   */
  static getRoleBadgeColor(role: string): string {
    switch (role) {
      case 'admin':
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 border-red-200 dark:border-red-800';
      case 'editor':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 border-blue-200 dark:border-blue-800';
      case 'author':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 border-green-200 dark:border-green-800';
      default:
        return 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-800';
    }
  }

  /**
   * Get role display name in Vietnamese
   */
  static getRoleDisplayName(role: string): string {
    switch (role) {
      case 'admin':
        return 'Quản trị viên';
      case 'editor':
        return 'Biên tập viên';
      case 'author':
        return 'Tác giả';
      default:
        return 'Người dùng';
    }
  }
}
