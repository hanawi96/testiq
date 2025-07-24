import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { getAnonymousUserInfo } from '@/utils/testing/iq-test/core';
import LoginPopup from '@/components/auth/login/LoginPopup';

interface TestHistoryItem {
  id: number;
  date: string;
  score: number;
  percentile: number;
  timeTaken: number;
  accuracy: number;
  improvement: number;
  timestamp?: string;
}

interface Props {
  initialData?: any;
}

// Simple skeleton với dark mode support
const Skeleton = ({ className = '' }: { className?: string }) => (
  <div className={`bg-gray-200 dark:bg-gray-700 animate-pulse rounded ${className}`} />
);

// Anonymous User Warning Component
const AnonymousUserWarning = ({ onRegisterClick }: { onRegisterClick: () => void }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-6"
  >
    <div className="flex items-start space-x-4">
      <div className="flex-shrink-0">
        <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/50 rounded-full flex items-center justify-center">
          <span className="text-lg">⚠️</span>
        </div>
      </div>
      <div className="flex-1">
        <h3 className="text-lg font-semibold text-amber-800 dark:text-amber-200 mb-2">
          Tài khoản tạm thời
        </h3>
        <p className="text-amber-700 dark:text-amber-300 mb-4 leading-relaxed">
          Dữ liệu test của bạn đang được lưu tạm thời trên thiết bị này.
          Để đồng bộ và bảo vệ dữ liệu trên mọi thiết bị, hãy tạo tài khoản.
        </p>
        <button
          onClick={onRegisterClick}
          className="inline-flex items-center px-4 py-2 bg-amber-600 hover:bg-amber-700 dark:bg-amber-700 dark:hover:bg-amber-600 text-white rounded-xl font-medium"
        >
          <span className="mr-2">🔐</span>
          Đăng ký tài khoản để lưu dữ liệu
        </button>
      </div>
    </div>
  </motion.div>
);

const TestHistoryComponent: React.FC<Props> = () => {
  // 🚀 SIMPLE STATES - CHỈ 2 STATE CHÍNH
  const [isLoading, setIsLoading] = useState(true);
  const [testHistory, setTestHistory] = useState<TestHistoryItem[]>([]);

  // Helper functions
  const getTimeAgo = useCallback((date: Date): string => {
    const diffDays = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Hôm nay';
    if (diffDays === 1) return 'Hôm qua';
    if (diffDays < 7) return `${diffDays} ngày trước`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} tuần trước`;
    return `${Math.floor(diffDays / 30)} tháng trước`;
  }, []);

  const getScoreGradient = useCallback((score: number) => {
    if (score >= 140) return 'from-purple-500 via-pink-500 to-red-500';
    if (score >= 130) return 'from-blue-500 via-purple-500 to-pink-500';
    if (score >= 120) return 'from-cyan-500 via-blue-500 to-purple-500';
    if (score >= 110) return 'from-green-500 via-cyan-500 to-blue-500';
    if (score >= 100) return 'from-yellow-500 via-green-500 to-cyan-500';
    return 'from-gray-400 via-gray-500 to-gray-600';
  }, []);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  // Popup states
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [prefilledEmail, setPrefilledEmail] = useState('');
  
  // UI states
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'highest' | 'lowest'>('newest');
  const itemsPerPage = 10;

  // 🔥 SINGLE DATA LOADING - SIÊU ĐỠN GIẢN (page reload on auth change)
  useEffect(() => {
    let mounted = true;
    
    const loadData = async () => {
      try {
        setIsLoading(true);

        // Import utils
        const testUtils = await import('@/utils/testing/iq-test/core');

        // Check authentication
        const backend = await import('@/backend').catch(() => null);
        const isAuth = await (backend?.AuthService?.getCurrentUser?.()
          .then(result => !!result?.user)
          .catch(() => false)) || false;

        if (mounted) {
          setIsAuthenticated(isAuth);
        }
        
        // Get data - CHỈ 1 NGUỒN DUY NHẤT
        const rawHistory = await testUtils.getUserRealTestHistory() || [];
        
        // Format data - LOGIC ĐƠN GIẢN
        const formattedHistory = rawHistory.map((test: any, index: number) => ({
          id: test.timestamp ? new Date(test.timestamp).getTime() : Date.now() - index,
          date: test.timestamp ? new Date(test.timestamp).toLocaleDateString('vi-VN') : new Date().toLocaleDateString('vi-VN'),
          score: test.iq || 0,
          percentile: test.percentile || Math.round((test.iq - 70) * 1.2),
          timeTaken: test.timeSpent || test.duration_seconds || 0,
          accuracy: test.accuracy || Math.round(70 + (test.iq - 70) * 0.8),
          improvement: index < rawHistory.length - 1 ? test.iq - rawHistory[index + 1].iq : 0,
          timestamp: test.timestamp
        }));

        if (mounted) {
          setTestHistory(formattedHistory);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Load failed:', error);
        if (mounted) setIsLoading(false);
      }
    };

    // Delay để có hiệu ứng loading
    setTimeout(loadData, 800);
    
    return () => { 
      mounted = false; 
    };
  }, []);

  // Handle popup functions
  const handleOpenRegisterPopup = async () => {
    try {
      const anonymousUserInfo = getAnonymousUserInfo();
      if (anonymousUserInfo?.email) {
        setPrefilledEmail(anonymousUserInfo.email);
      }
      setShowLoginPopup(true);
    } catch (error) {
      console.warn('⚠️ Could not get anonymous user info:', error);
      setShowLoginPopup(true);
    }
  };

  const handleAuthSuccess = () => {
    setShowLoginPopup(false);
    window.location.reload(); // Reload để cập nhật auth state
  };

  // Helper functions
  const formatTime = useCallback((seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return m > 0 ? `${m}p ${s}s` : `${s}s`;
  }, []);

  const getIQLevel = useCallback((score: number) => {
    if (score >= 140) return { label: 'Thiên tài', icon: '🧠', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' };
    if (score >= 130) return { label: 'Xuất sắc', icon: '⭐', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' };
    if (score >= 120) return { label: 'Cao', icon: '🚀', color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300' };
    if (score >= 110) return { label: 'Khá', icon: '💪', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' };
    if (score >= 100) return { label: 'Trung bình', icon: '👍', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' };
    return { label: 'Cần cải thiện', icon: '📚', color: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300' };
  }, []);

  // Computed data
  const filteredHistory = useMemo(() => {
    return testHistory
      .filter(test => !searchTerm || test.score.toString().includes(searchTerm))
      .sort((a, b) => {
        switch (sortBy) {
          case 'newest': return new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime();
          case 'oldest': return new Date(a.timestamp || 0).getTime() - new Date(b.timestamp || 0).getTime();
          case 'highest': return b.score - a.score;
          case 'lowest': return a.score - b.score;
          default: return 0;
        }
      });
  }, [testHistory, searchTerm, sortBy]);

  const stats = useMemo(() => ({
    total: testHistory.length,
    average: testHistory.length ? Math.round(testHistory.reduce((sum, test) => sum + test.score, 0) / testHistory.length) : 0,
    best: testHistory.length ? Math.max(...testHistory.map(test => test.score)) : 0,
    improvement: testHistory.length > 1 ? testHistory[0].score - testHistory[testHistory.length - 1].score : 0
  }), [testHistory]);

  const { totalPages, currentItems } = useMemo(() => {
    const total = Math.ceil(filteredHistory.length / itemsPerPage);
    const start = (currentPage - 1) * itemsPerPage;
    const items = filteredHistory.slice(start, start + itemsPerPage);
    return { totalPages: total, currentItems: items };
  }, [filteredHistory, currentPage]);

  // 🎨 LOADING UI - DARK MODE SUPPORT
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 pt-24 pb-8">
        <div className="max-w-6xl mx-auto px-4 space-y-6">

          {/* Hero Skeleton */}
          <div className="bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-gray-800 dark:via-gray-800 dark:to-gray-700 rounded-3xl p-8 text-center">
            <Skeleton className="w-12 h-12 rounded-xl mx-auto mb-4" />
            <Skeleton className="h-8 w-64 mx-auto mb-2" />
            <Skeleton className="h-4 w-48 mx-auto mb-6" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl mx-auto">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white/80 dark:bg-gray-800/80 rounded-xl p-3 border border-gray-200 dark:border-gray-700">
                  <Skeleton className="h-6 w-8 mx-auto mb-1" />
                  <Skeleton className="h-3 w-12 mx-auto" />
                </div>
              ))}
            </div>
          </div>

          {/* Filters Skeleton */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-4">
            <div className="flex gap-3 justify-between">
              <Skeleton className="h-10 flex-1 max-w-md" />
              <Skeleton className="h-10 w-32" />
            </div>
          </div>

          {/* List Skeleton */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-4">
            <Skeleton className="h-6 w-48 mb-4" />
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Skeleton className="w-12 h-12 rounded-lg" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Skeleton className="w-20 h-4" />
                          <Skeleton className="w-16 h-5 rounded-md" />
                        </div>
                        <div className="flex items-center gap-3">
                          <Skeleton className="w-12 h-3" />
                          <Skeleton className="w-2 h-3" />
                          <Skeleton className="w-16 h-3" />
                          <Skeleton className="w-2 h-3" />
                          <Skeleton className="w-12 h-3" />
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Skeleton className="w-12 h-6 rounded-md" />
                      <Skeleton className="w-20 h-6 rounded-lg" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 🎯 MAIN UI - CLEAN & SIMPLE với dark mode support
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 pt-24 pb-8">
      <div className="max-w-6xl mx-auto px-4 space-y-6">

        {/* 🚀 BREAKTHROUGH HERO SECTION - WOW DESIGN */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative overflow-hidden"
        >
          {/* Background with animated gradients */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-purple-600/10 to-pink-600/10 dark:from-blue-400/20 dark:via-purple-400/20 dark:to-pink-400/20"></div>
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/50 to-transparent dark:via-gray-800/50"></div>

          {/* Floating particles animation */}
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className={`absolute w-2 h-2 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full opacity-30`}
                style={{
                  left: `${20 + i * 15}%`,
                  top: `${10 + i * 10}%`,
                }}
                animate={{
                  y: [-10, 10, -10],
                  x: [-5, 5, -5],
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  duration: 3 + i * 0.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            ))}
          </div>

          <div className="relative z-10 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl border border-white/20 dark:border-gray-700/30 shadow-2xl">
            <div className="p-8 md:p-12 text-center">

              {/* Animated Icon with glow effect */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ duration: 0.8, delay: 0.2, type: "spring", bounce: 0.4 }}
                className="relative mx-auto mb-8"
              >
                <div className="w-20 h-20 mx-auto relative">
                  {/* Glow effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-2xl blur-xl opacity-60 animate-pulse"></div>
                  {/* Main icon */}
                  <div className="relative w-full h-full bg-gradient-to-br from-blue-500 via-purple-600 to-pink-600 rounded-2xl flex items-center justify-center shadow-2xl">
                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                    </svg>
                  </div>
                  {/* Orbiting elements */}
                  <motion.div
                    className="absolute -top-2 -right-2 w-4 h-4 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                  />
                  <motion.div
                    className="absolute -bottom-2 -left-2 w-3 h-3 bg-gradient-to-r from-green-400 to-cyan-500 rounded-full"
                    animate={{ rotate: -360 }}
                    transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                  />
                </div>
              </motion.div>

              {/* Title with gradient text */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="mb-6"
              >
                <h1 className="text-4xl md:text-5xl font-black mb-3">
                  <span className="bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 dark:from-white dark:via-blue-200 dark:to-purple-200 bg-clip-text text-transparent">
                    Lịch sử{' '}
                  </span>
                  <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                    Test IQ
                  </span>
                </h1>
                <motion.p
                  className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  Khám phá hành trình phát triển trí tuệ của bạn qua từng bài test
                  <br />
                  <span className="text-blue-600 dark:text-blue-400 font-semibold">Mỗi con số là một bước tiến</span>
                </motion.p>
              </motion.div>

              {/* Enhanced Stats Cards */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto"
              >
                {[
                  {
                    value: stats.total,
                    label: 'Tổng test',
                    icon: '📊',
                    gradient: 'from-blue-500 to-cyan-500',
                    bg: 'from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20'
                  },
                  {
                    value: stats.best,
                    label: 'Cao nhất',
                    icon: '🏆',
                    gradient: 'from-purple-500 to-pink-500',
                    bg: 'from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20'
                  },
                  {
                    value: stats.average,
                    label: 'Trung bình',
                    icon: '📈',
                    gradient: 'from-green-500 to-emerald-500',
                    bg: 'from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20'
                  },
                  {
                    value: `+${stats.improvement}`,
                    label: 'Cải thiện',
                    icon: '🚀',
                    gradient: 'from-orange-500 to-red-500',
                    bg: 'from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20'
                  }
                ].map((stat, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.8, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.8 + index * 0.1 }}
                    whileHover={{ scale: 1.05, y: -5 }}
                    className="group relative"
                  >
                    {/* Glow effect on hover */}
                    <div className={`absolute inset-0 bg-gradient-to-r ${stat.gradient} rounded-2xl blur-xl opacity-0 group-hover:opacity-30 transition-opacity duration-300`}></div>

                    {/* Card */}
                    <div className={`relative bg-gradient-to-br ${stat.bg} backdrop-blur-sm rounded-2xl p-6 border border-white/30 dark:border-gray-700/30 shadow-lg hover:shadow-xl transition-all duration-300 text-center`}>
                      {/* Icon với background gradient - căn giữa */}
                      <div className={`w-14 h-14 bg-gradient-to-br ${stat.gradient} rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl transform hover:scale-110 transition-transform duration-300`}>
                        <span className="text-2xl filter drop-shadow-lg">{stat.icon}</span>
                      </div>

                      {/* Value with counter animation - căn giữa */}
                      <motion.div
                        className={`text-3xl md:text-4xl font-black bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent mb-2`}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.5, delay: 1 + index * 0.1, type: "spring", bounce: 0.6 }}
                      >
                        {stat.value}
                      </motion.div>

                      {/* Label - căn giữa */}
                      <div className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                        {stat.label}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>



            </div>
          </div>
        </motion.section>

        {/* IQ Trend Chart - Separate Box */}
        {testHistory.length > 1 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                {/* Icon với background màu xanh giống trong ảnh */}
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="drop-shadow-sm"
                  >
                    <path d="M3 3v18h18" />
                    <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3" />
                  </svg>
                </div>

                {/* Tiêu đề và mô tả */}
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                    Xu hướng điểm IQ
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                    Theo dõi sự tiến bộ qua tất cả {testHistory.length} lần test
                  </p>
                </div>
              </div>

              {/* Action button (tùy chọn) */}
              <div className="text-sm text-blue-600 dark:text-blue-400 font-medium cursor-pointer hover:text-blue-700 dark:hover:text-blue-300 transition-colors">
                Xem thêm
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-6">
              <svg
                width="100%"
                height="280"
                viewBox="0 0 800 280"
                className="overflow-visible"
                preserveAspectRatio="xMidYMid meet"
              >
                {/* Background */}
                <rect width="100%" height="100%" fill="transparent" />

                {(() => {
                  // 🚀 OPTIMIZED: Hiển thị tất cả tests, tối ưu cho performance
                  const chartData = [...testHistory].reverse(); // All tests, oldest first
                  const width = 800;
                  const height = 280;
                  const padding = 50;
                  const chartWidth = width - (padding * 2);
                  const chartHeight = height - (padding * 2);

                  const maxValue = Math.max(...chartData.map(d => d.score)) || 160;
                  const minValue = Math.min(...chartData.map(d => d.score)) || 80;
                  const valueRange = maxValue - minValue || 80;

                  // 🚀 SMART CALCULATION: Tối ưu cho mọi số lượng tests
                  const points = chartData.map((test, i) => {
                    const x = padding + (i * (chartWidth / Math.max(chartData.length - 1, 1)));
                    const y = padding + chartHeight - ((test.score - minValue) / valueRange * chartHeight);
                    return { x, y, score: test.score, index: i };
                  });

                  // Create path string for the line
                  const pathData = points.reduce((path, point, i) => {
                    const command = i === 0 ? 'M' : 'L';
                    return `${path} ${command} ${point.x} ${point.y}`;
                  }, '');

                  // Create area path
                  const areaPath = `${pathData} L ${points[points.length - 1]?.x || padding} ${height - padding} L ${padding} ${height - padding} Z`;

                  // Y-axis labels (5 levels)
                  const yAxisLabels = [];
                  for (let i = 0; i <= 4; i++) {
                    const value = minValue + (valueRange * (4 - i) / 4);
                    yAxisLabels.push(Math.round(value));
                  }

                  return (
                    <>
                      {/* Grid lines */}
                      {[0, 1, 2, 3, 4].map(i => {
                        const y = padding + (chartHeight / 4) * i;
                        return (
                          <line
                            key={`grid-${i}`}
                            x1={padding}
                            y1={y}
                            x2={width - padding}
                            y2={y}
                            stroke="currentColor"
                            strokeWidth="1"
                            className="text-gray-200 dark:text-gray-700"
                            opacity="0.3"
                          />
                        );
                      })}

                      {/* Y-axis labels */}
                      {yAxisLabels.map((value, i) => (
                        <text
                          key={`y-label-${i}`}
                          x={padding - 15}
                          y={padding + (chartHeight / 4) * i + 5}
                          textAnchor="end"
                          fontSize="12"
                          fill="currentColor"
                          className="text-gray-600 dark:text-gray-400 font-medium"
                        >
                          {value}
                        </text>
                      ))}

                      {/* Gradient definition */}
                      <defs>
                        <linearGradient id="iqTrendGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.4" />
                          <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.1" />
                        </linearGradient>
                      </defs>

                      {/* Area under the line */}
                      <motion.path
                        d={areaPath}
                        fill="url(#iqTrendGradient)"
                        opacity="0.3"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.3 }}
                        transition={{ duration: 1, delay: 0.5 }}
                      />

                      {/* Main line */}
                      <motion.path
                        d={pathData}
                        fill="none"
                        stroke="#8B5CF6"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="drop-shadow-sm"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 1.5, delay: 0.5, ease: "easeInOut" }}
                      />

                      {/* Data points */}
                      {points.map((point, i) => (
                        <motion.g key={i}>
                          <motion.circle
                            cx={point.x}
                            cy={point.y}
                            r="5"
                            fill="#8B5CF6"
                            stroke="white"
                            strokeWidth="3"
                            className="cursor-pointer transition-all duration-200 drop-shadow-sm hover:r-6"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ duration: 0.3, delay: 0.7 + i * 0.1 }}
                          />

                          {/* Score label */}
                          <motion.text
                            x={point.x}
                            y={point.y - 15}
                            textAnchor="middle"
                            fontSize="12"
                            fill="currentColor"
                            className="text-gray-700 dark:text-gray-300 font-semibold"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 1 + i * 0.1 }}
                          >
                            {point.score}
                          </motion.text>
                        </motion.g>
                      ))}

                      {/* X-axis labels (smart spacing) */}
                      {points.map((point, i) => {
                        // 🚀 SMART LABELING: Chỉ hiển thị label khi có đủ space
                        const shouldShowLabel = chartData.length <= 20 || i % Math.ceil(chartData.length / 10) === 0;

                        return shouldShowLabel ? (
                          <text
                            key={`x-label-${i}`}
                            x={point.x}
                            y={height - 15}
                            textAnchor="middle"
                            fontSize="11"
                            fill="currentColor"
                            className="text-gray-600 dark:text-gray-400 font-medium"
                          >
                            #{i + 1}
                          </text>
                        ) : null;
                      })}
                    </>
                  );
                })()}
              </svg>
            </div>
          </motion.section>
        )}

        {/* Anonymous User Warning */}
        {isAuthenticated === false && (
          <AnonymousUserWarning onRegisterClick={handleOpenRegisterPopup} />
        )}

        {/* Filters với dark mode styling */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-4"
        >
          <div className="flex flex-col md:flex-row gap-3 justify-between">
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                placeholder="Tìm kiếm theo điểm số..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400"
              />
              <svg className="absolute left-3 top-2.5 w-4 h-4 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"
            >
              <option value="newest">Mới nhất</option>
              <option value="oldest">Cũ nhất</option>
              <option value="highest">Cao nhất</option>
              <option value="lowest">Thấp nhất</option>
            </select>
          </div>
        </motion.div>

        {/* Test List với dark mode styling */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-4"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              {/* Icon với background màu tím cho danh sách */}
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="drop-shadow-sm"
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14,2 14,8 20,8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10,9 9,9 8,9" />
                </svg>
              </div>

              {/* Tiêu đề và mô tả */}
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  Danh sách bài test
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                  Lịch sử chi tiết {filteredHistory.length} bài test đã hoàn thành
                </p>
              </div>
            </div>

            {/* Stats summary */}
            <div className="flex items-center space-x-4 text-sm">
              <div className="text-center">
                <div className="font-semibold text-gray-900 dark:text-gray-100">{stats.total}</div>
                <div className="text-gray-500 dark:text-gray-400">Tổng test</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-gray-900 dark:text-gray-100">{stats.average}</div>
                <div className="text-gray-500 dark:text-gray-400">Điểm TB</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-gray-900 dark:text-gray-100">{stats.best}</div>
                <div className="text-gray-500 dark:text-gray-400">Cao nhất</div>
              </div>
            </div>
          </div>

          {currentItems.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">📝</div>
              <h4 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-200">
                {searchTerm ? 'Không tìm thấy' : 'Chưa có bài test'}
              </h4>
              {!searchTerm && (
                <button
                  onClick={() => window.location.href = '/test/iq'}
                  className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700"
                >
                  Làm bài test ngay
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {currentItems.map((test, index) => {
                const iqLevel = getIQLevel(test.score);
                const globalIndex = (currentPage - 1) * itemsPerPage + index;
                const testNumber = filteredHistory.length - globalIndex;
                const date = new Date(test.timestamp || Date.now());
                const timeAgo = getTimeAgo(date);

                return (
                  <motion.div
                    key={test.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="group relative bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                  >
                    <div className="p-4">
                      <div className="flex items-center justify-between">
                        {/* Left side - Score & Basic Info */}
                        <div className="flex items-center gap-4">
                          {/* Score Circle - Compact */}
                          <div className="relative">
                            <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${getScoreGradient(test.score)} p-0.5`}>
                              <div className="w-full h-full bg-white dark:bg-gray-800 rounded-lg flex items-center justify-center">
                                <span className="text-sm font-bold text-gray-900 dark:text-white">
                                  {test.score}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Test Info - Compact */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                                Test #{testNumber}
                              </h4>
                              <div className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${iqLevel.color}`}>
                                <span className="mr-1">{iqLevel.icon}</span>
                                {iqLevel.label}
                              </div>
                            </div>

                            <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                              <span>
                                {date.toLocaleDateString('vi-VN', {
                                  day: '2-digit',
                                  month: '2-digit'
                                })}
                              </span>
                              <span>•</span>
                              <span>{timeAgo}</span>
                              <span>•</span>
                              <span>{formatTime(test.timeTaken)}</span>
                              <span>•</span>
                              <span>{test.accuracy}% chính xác</span>
                            </div>
                          </div>
                        </div>

                        {/* Right side - Performance & Action */}
                        <div className="flex items-center gap-3">
                          {/* Performance indicator - Compact */}
                          {index > 0 && currentItems[index - 1] && (
                            <div className={`flex items-center text-xs px-2 py-1 rounded-md ${
                              test.score > currentItems[index - 1].score
                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                : test.score < currentItems[index - 1].score
                                ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                            }`}>
                              {test.score > currentItems[index - 1].score ? '↗' :
                               test.score < currentItems[index - 1].score ? '↘' : '→'}
                              <span className="ml-1">
                                {test.score > currentItems[index - 1].score ? '+' : ''}
                                {test.score - currentItems[index - 1].score}
                              </span>
                            </div>
                          )}

                          {/* View Details Button */}
                          <a
                            href={`/result?score=${test.score}&percentile=${test.percentile || 50}&time=${test.timeTaken || 1800}&correct=${Math.round(test.score / 10)}&accuracy=${test.accuracy || 75}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
                          >
                            <span>Xem chi tiết</span>
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </a>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Pagination với dark mode styling */}
        {totalPages > 1 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-4"
          >
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Trang {currentPage}/{totalPages} • {filteredHistory.length} kết quả
              </div>

              <div className="flex space-x-1">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="w-8 h-8 flex items-center justify-center border border-gray-300 dark:border-gray-700 rounded hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 text-gray-700 dark:text-gray-300"
                >
                  ←
                </button>

                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = i + Math.max(1, currentPage - 2);
                  if (page > totalPages) return null;

                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-8 h-8 flex items-center justify-center rounded ${
                        currentPage === page
                          ? 'bg-blue-600 text-white'
                          : 'border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}

                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="w-8 h-8 flex items-center justify-center border border-gray-300 dark:border-gray-700 rounded hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 text-gray-700 dark:text-gray-300"
                >
                  →
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Login Popup */}
      <LoginPopup
        isOpen={showLoginPopup}
        onClose={() => setShowLoginPopup(false)}
        onAuthSuccess={handleAuthSuccess}
        initialMode="register"
        prefilledEmail={prefilledEmail}
      />
    </div>
  );
};

export default TestHistoryComponent; 