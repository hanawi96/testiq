import React, { useState, useEffect } from 'react';
import { AuthService, AdminService } from '../../../../backend';
import type { UserProfile, AdminStats } from '../../../../backend';
import NewUsersChart from './NewUsersChart';
import WeeklyNewUsersChart from './WeeklyNewUsersChart';
import WeeklyTestChart from './WeeklyTestChart';
import DailyTestChart from './DailyTestChart';
import EnhancedStatsCards from './EnhancedStatsCards';
import ArticleViewsChart from './ArticleViewsChart';

export default function AdminDashboard() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      console.log('AdminDashboard: loading dashboard data');

      const dashboardData = await AdminService.getDashboardData();

      if (!dashboardData.isAuthorized) {
        console.log('AdminDashboard: access denied, redirecting to login');
        setError(dashboardData.error || 'Bạn không có quyền truy cập');
        setTimeout(() => {
          window.location.href = '/admin/login';
        }, 2000);
        return;
      }

      console.log('AdminDashboard: dashboard data loaded successfully');
      setUser(dashboardData.user);
      setProfile(dashboardData.profile);
      setStats(dashboardData.stats);
    } catch (err) {
      console.error('AdminDashboard: error loading dashboard data:', err);
      setError('Có lỗi xảy ra khi tải dữ liệu');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      console.log('AdminDashboard: signing out');
      await AuthService.signOut();
      window.location.href = '/admin/login';
    } catch (err) {
      console.error('AdminDashboard: sign out error:', err);
    }
  };

  // Simplified skeleton components
  const SkeletonActivityItem = () => (
    <div className="flex items-center space-x-4 p-3 rounded-lg">
      <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-40 animate-pulse"></div>
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse"></div>
      </div>
    </div>
  );



  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-8 text-center">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-red-900 dark:text-red-100 mb-2">Lỗi truy cập</h3>
        <p className="text-red-700 dark:text-red-300">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 dark:from-blue-700 dark:to-indigo-800 rounded-2xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Chào mừng quay trở lại! 👋</h1>
            <p className="text-blue-100 dark:text-blue-200 text-lg">
              Xin chào, <span className="font-semibold">{profile?.email}</span>. Hôm nay bạn muốn làm gì?
            </p>
          </div>
        </div>
      </div>

      {/* Enhanced Stats Cards with Daily Comparison */}
      <EnhancedStatsCards />

      {/* Article Views Analytics */}
      <ArticleViewsChart className="mb-6 lg:mb-8 2xl:mb-10" />

      {/* New Users Charts Grid - Daily and Weekly */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 2xl:gap-10">
        <NewUsersChart className="lg:min-h-[400px] xl:min-h-[450px] 2xl:min-h-[500px]" />
        <WeeklyNewUsersChart className="lg:min-h-[400px] xl:min-h-[450px] 2xl:min-h-[500px]" />
      </div>

      {/* Test Charts Grid - Daily and Weekly Test Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 2xl:gap-10">
        <DailyTestChart className="lg:min-h-[400px] xl:min-h-[450px] 2xl:min-h-[500px]" />
        <WeeklyTestChart className="lg:min-h-[400px] xl:min-h-[450px] 2xl:min-h-[500px]" />
      </div>

      {/* Recent Activity */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">Hoạt động gần đây</h3>
        <div className="space-y-4">
          {[
            { action: 'Người dùng mới đăng ký', time: '2 phút trước', icon: '👤' },
            { action: 'Test IQ được hoàn thành', time: '5 phút trước', icon: '📊' },
            { action: 'Cập nhật câu hỏi', time: '10 phút trước', icon: '✏️' },
            { action: 'Backup dữ liệu', time: '1 giờ trước', icon: '💾' }
          ].map((activity, index) => (
            <div key={index} className="flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <div className="text-2xl">{activity.icon}</div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{activity.action}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 