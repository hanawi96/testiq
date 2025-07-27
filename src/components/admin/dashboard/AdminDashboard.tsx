import React, { useState, useEffect } from 'react';
import { AuthService, AdminService } from '../../../../backend';
import type { UserProfile, AdminStats } from '../../../../backend';
import NewUsersChart from './NewUsersChart';
import WeeklyNewUsersChart from './WeeklyNewUsersChart';
import WeeklyTestChart from './WeeklyTestChart';
import DailyTestChart from './DailyTestChart';
import DailyArticleLikesChart from './DailyArticleLikesChart';
import EnhancedStatsCards from './EnhancedStatsCards';
import ArticleViewsChart from './ArticleViewsChart';
import TopArticlesWidget from './TopArticlesWidget';
import { UsersByCountry } from '../users/components/UsersByCountry';

export default function AdminDashboard() {
  console.log('🎬 AdminDashboard: Component mounting/rendering', {
    timestamp: new Date().toISOString()
  });

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

      // 🚀 Try SSR hydration first for instant display
      if (typeof window !== 'undefined' && (window as any).__ADMIN_DASHBOARD_DATA__) {
        const ssrData = (window as any).__ADMIN_DASHBOARD_DATA__;

        if (ssrData && ssrData.isAuthorized) {
          console.log('⚡ SSR DASHBOARD HYDRATION: Using pre-loaded data');
          setUser(ssrData.user);
          setProfile(ssrData.profile);
          setStats(ssrData.stats);
          setIsLoading(false);
          return;
        }
      }

      // Fallback to client-side loading if no SSR data
      console.log('🔄 AdminDashboard: No SSR data, loading client-side');
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

      {/* Top Articles Widget */}
      <TopArticlesWidget className="mb-6 lg:mb-8 2xl:mb-10" />

      {/* Test Charts Grid - Daily and Weekly Test Charts (Moved up - Higher Priority) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-5 2xl:gap-6 mb-6 lg:mb-8 2xl:mb-10">
        <DailyTestChart />
        <WeeklyTestChart />
      </div>

      {/* New Users Charts Grid - Daily and Weekly */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-5 2xl:gap-6 mb-4">
        <NewUsersChart />
        <WeeklyNewUsersChart />
      </div>

      {/* Article Analytics Grid - Views and Likes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-5 2xl:gap-6 mb-6 lg:mb-8 2xl:mb-10">
        <ArticleViewsChart className="" />
        <DailyArticleLikesChart />
      </div>

      {/* Users by Country */}
      <UsersByCountry />
    </div>
  );
} 