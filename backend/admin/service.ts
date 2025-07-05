import { supabase, TABLES } from '../config/supabase';
import { AuthService } from '../auth/service';
import type { AdminStats, AdminAction } from '../types';

/**
 * Admin Service
 * Handles admin-specific operations and data
 */
export class AdminService {

  /**
   * Get admin dashboard statistics
   */
  static async getStats(): Promise<{ stats: AdminStats | null; error: any }> {
    try {
      console.log('AdminService: Fetching dashboard stats');
      
      // Mock data for now - replace with real queries later
      const stats: AdminStats = {
        totalTests: 1234,
        totalUsers: 567,
        testsToday: 89,
        averageScore: 125,
      };

      // TODO: Replace with real database queries
      // const { data: testCount } = await supabase.from(TABLES.TEST_RESULTS).select('count');
      // const { data: userCount } = await supabase.from(TABLES.PROFILES).select('count');
      
      console.log('AdminService: Stats retrieved successfully');
      return { stats, error: null };
    } catch (err) {
      console.error('AdminService: Error fetching stats:', err);
      return { stats: null, error: err };
    }
  }

  /**
   * Get admin quick actions
   */
  static getQuickActions(): AdminAction[] {
    return [
      {
        id: 'create-article',
        title: 'Đăng bài viết',
        description: 'Viết bài mới với editor SEO',
        icon: '📝',
        href: '/admin/articles/create',
        category: 'content'
      },
      {
        id: 'manage-articles',
        title: 'Quản lý bài viết',
        description: 'Xem, sửa, xóa các bài viết',
        icon: '📰',
        href: '/admin/articles',
        category: 'content'
      },
      {
        id: 'manage-questions',
        title: 'Quản lý câu hỏi',
        description: 'Thêm, sửa, xóa câu hỏi test',
        icon: '❓',
        href: '/admin/questions',
        category: 'management'
      },
      {
        id: 'view-results',
        title: 'Xem kết quả',
        description: 'Thống kê và phân tích kết quả',
        icon: '📋',
        href: '/admin/results',
        category: 'analytics'
      },
      {
        id: 'manage-users',
        title: 'Quản lý người dùng',
        description: 'Quản lý tài khoản người dùng',
        icon: '👤',
        href: '/admin/users',
        category: 'management'
      },
      {
        id: 'system-settings',
        title: 'Cài đặt hệ thống',
        description: 'Cấu hình các thông số',
        icon: '⚙️',
        href: '/admin/settings',
        category: 'system'
      },
      {
        id: 'reports',
        title: 'Báo cáo',
        description: 'Xuất báo cáo chi tiết',
        icon: '📊',
        href: '/admin/reports',
        category: 'analytics'
      },
      {
        id: 'backup',
        title: 'Backup dữ liệu',
        description: 'Sao lưu và khôi phục',
        icon: '💾',
        href: '/admin/backup',
        category: 'system'
      }
    ];
  }

  /**
   * Verify admin access and get dashboard data
   */
  static async getDashboardData(): Promise<{
    isAuthorized: boolean;
    user: any;
    profile: any;
    stats: AdminStats | null;
    actions: AdminAction[];
    error?: any;
  }> {
    try {
      console.log('AdminService: Getting dashboard data');
      
      // Verify admin access
      const { isAdmin, user, profile, error: authError } = await AuthService.verifyAdminAccess();
      
      if (authError || !isAdmin) {
        console.log('AdminService: Access denied or auth error');
        return {
          isAuthorized: false,
          user: null,
          profile: null,
          stats: null,
          actions: [],
          error: authError || 'Access denied'
        };
      }

      // Get stats and actions
      const { stats, error: statsError } = await this.getStats();
      const actions = this.getQuickActions();

      console.log('AdminService: Dashboard data retrieved successfully');
      return {
        isAuthorized: true,
        user,
        profile,
        stats,
        actions,
        error: statsError
      };
    } catch (err) {
      console.error('AdminService: Error getting dashboard data:', err);
      return {
        isAuthorized: false,
        user: null,
        profile: null,
        stats: null,
        actions: [],
        error: err
      };
    }
  }

  /**
   * Create initial admin user (for setup)
   */
  static async createAdminUser(userId: string, email: string, fullName?: string): Promise<{ success: boolean; error: any }> {
    try {
      console.log('AdminService: Creating admin user profile');
      
      const { data, error } = await supabase
        .from(TABLES.PROFILES)
        .insert({
          id: userId,
          full_name: fullName || email.split('@')[0] + ' (Admin)',
          role: 'admin',
          is_verified: true, // Admins are auto-verified
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('AdminService: Error creating admin profile:', error);
        return { success: false, error };
      }

      console.log('AdminService: Admin profile created successfully');
      return { success: true, error: null };
    } catch (err) {
      console.error('AdminService: Unexpected error creating admin:', err);
      return { success: false, error: err };
    }
  }

  /**
   * Promote existing user to admin role
   */
  static async promoteUserToAdmin(userId: string): Promise<{ success: boolean; error: any }> {
    try {
      console.log('AdminService: Promoting user to admin:', userId);
      
      const { data, error } = await supabase
        .from(TABLES.PROFILES)
        .update({
          role: 'admin',
          is_verified: true, // Auto-verify when promoting to admin
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        console.error('AdminService: Error promoting user to admin:', error);
        return { success: false, error };
      }

      if (!data) {
        console.error('AdminService: User profile not found');
        return { success: false, error: { message: 'User profile not found' } };
      }

      console.log('AdminService: User promoted to admin successfully');
      return { success: true, error: null };
    } catch (err) {
      console.error('AdminService: Unexpected error promoting user:', err);
      return { success: false, error: err };
    }
  }

  /**
   * Demote admin to regular user
   */
  static async demoteAdminToUser(userId: string): Promise<{ success: boolean; error: any }> {
    try {
      console.log('AdminService: Demoting admin to user:', userId);
      
      const { data, error } = await supabase
        .from(TABLES.PROFILES)
        .update({
          role: 'user',
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        console.error('AdminService: Error demoting admin to user:', error);
        return { success: false, error };
      }

      if (!data) {
        console.error('AdminService: Admin profile not found');
        return { success: false, error: { message: 'Admin profile not found' } };
      }

      console.log('AdminService: Admin demoted to user successfully');
      return { success: true, error: null };
    } catch (err) {
      console.error('AdminService: Unexpected error demoting admin:', err);
      return { success: false, error: err };
    }
  }
} 