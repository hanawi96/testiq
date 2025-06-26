import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AuthService, AdminService } from '../../../backend';
import type { UserProfile, AdminStats, AdminAction } from '../../../backend';

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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Đang kiểm tra quyền truy cập...</p>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-900 via-slate-900 to-red-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Lỗi truy cập</h1>
          <p className="text-red-300">{error}</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/10 backdrop-blur-xl border-b border-white/20"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h1 className="text-xl font-semibold text-white">Admin Dashboard</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-slate-300">Xin chào,</p>
                <p className="text-white font-medium">{profile?.email}</p>
              </div>
              <button
                onClick={handleSignOut}
                className="bg-red-500/20 hover:bg-red-500/30 text-red-300 hover:text-red-200 px-3 py-2 rounded-lg transition-colors flex items-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Đăng xuất
              </button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-white/20 mb-8"
        >
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              🎉 Chào mừng đến với Admin Dashboard!
            </h2>
            <p className="text-slate-300 text-lg">
              Bạn đã đăng nhập thành công với quyền quản trị viên
            </p>
          </div>
        </motion.div>

        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[
              { title: 'Tổng số test', value: stats.totalTests.toLocaleString(), icon: '📊', color: 'from-blue-500 to-cyan-500' },
              { title: 'Người dùng', value: stats.totalUsers.toLocaleString(), icon: '👥', color: 'from-green-500 to-emerald-500' },
              { title: 'Test hôm nay', value: stats.testsToday.toLocaleString(), icon: '📈', color: 'from-purple-500 to-pink-500' },
              { title: 'Điểm trung bình', value: stats.averageScore.toString(), icon: '🧠', color: 'from-orange-500 to-red-500' }
            ].map((stat, index) => (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.1 }}
                className="bg-white/10 backdrop-blur-xl rounded-xl p-6 border border-white/20"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-300 text-sm">{stat.title}</p>
                    <p className="text-2xl font-bold text-white">{stat.value}</p>
                  </div>
                  <div className={`w-12 h-12 bg-gradient-to-r ${stat.color} rounded-lg flex items-center justify-center text-2xl`}>
                    {stat.icon}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-white/20"
        >
          <h3 className="text-xl font-semibold text-white mb-6">Thao tác nhanh</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {actions.map((action, index) => (
              <motion.a
                key={action.id}
                href={action.href}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.7 + index * 0.05 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl p-4 transition-all duration-200 group"
              >
                <div className="flex items-start space-x-3">
                  <div className="text-2xl group-hover:scale-110 transition-transform">
                    {action.icon}
                  </div>
                  <div>
                    <h4 className="text-white font-medium mb-1">{action.title}</h4>
                    <p className="text-slate-400 text-sm">{action.description}</p>
                  </div>
                </div>
              </motion.a>
            ))}
          </div>
        </motion.div>
      </main>
    </div>
  );
} 