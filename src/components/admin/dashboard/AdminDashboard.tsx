import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AuthService, AdminService } from '../../../../backend';
import type { UserProfile, AdminStats, AdminAction } from '../../../../backend';
import NewUsersChart from './NewUsersChart';
import WeeklyNewUsersChart from './WeeklyNewUsersChart';
import WeeklyTestChart from './WeeklyTestChart';
import DailyTestChart from './DailyTestChart';
import EnhancedStatsCards from './EnhancedStatsCards';

export default function AdminDashboard() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [actions, setActions] = useState<AdminAction[]>([]);
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
      setActions(dashboardData.actions);
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Đang tải dữ liệu...</p>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-red-900 dark:text-red-100 mb-2">Lỗi truy cập</h3>
          <p className="text-red-700 dark:text-red-300">{error}</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-blue-600 to-indigo-700 dark:from-blue-700 dark:to-indigo-800 rounded-2xl p-8 text-white"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Chào mừng quay trở lại! 👋</h1>
            <p className="text-blue-100 dark:text-blue-200 text-lg">
              Xin chào, <span className="font-semibold">{profile?.email}</span>. Hôm nay bạn muốn làm gì?
            </p>
          </div>

        </div>
      </motion.div>

      {/* Enhanced Stats Cards with Daily Comparison */}
      <EnhancedStatsCards />

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Thao tác nhanh</h3>
          <span className="text-sm text-gray-500 dark:text-gray-400">{actions.length} chức năng</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {actions.map((action, index) => (
            <motion.a
              key={action.id}
              href={action.href}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 + index * 0.05 }}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="group bg-gray-50 dark:bg-gray-700 hover:bg-gradient-to-br hover:from-blue-50 hover:to-indigo-50 dark:hover:from-blue-900/30 dark:hover:to-indigo-900/30 border border-gray-200 dark:border-gray-600 hover:border-blue-200 dark:hover:border-blue-700 rounded-lg p-4 "
            >
              <div className="flex items-start space-x-4">
                <div className="text-3xl group-hover:scale-110 transition-transform duration-200">
                  {action.icon}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-900 dark:group-hover:text-blue-200 mb-1">
                    {action.title}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 group-hover:text-blue-700 dark:group-hover:text-blue-300">
                    {action.description}
                  </p>
                  <div className="mt-2 flex items-center text-xs text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    Nhấn để truy cập
                    <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            </motion.a>
          ))}
        </div>
      </motion.div>

      {/* New Users Charts Grid - Daily and Weekly */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        {/* Daily New Users Chart */}
        <NewUsersChart />

        {/* Weekly New Users Chart */}
        <WeeklyNewUsersChart />
      </div>

      {/* Test Charts Grid - Daily and Weekly Test Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        {/* Daily Test Chart */}
        <DailyTestChart />

        {/* Weekly Test Chart */}
        <WeeklyTestChart />
      </div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8"
      >
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
      </motion.div>
    </div>
  );
} 