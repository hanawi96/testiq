import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { AdminService } from '../../../../backend';
import type { DailyComparisonStats } from '../../../../backend';

interface Props {
  className?: string;
}

export default function EnhancedStatsCards({ className = '' }: Props) {
  const [data, setData] = useState<DailyComparisonStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    loadDailyStats();
  }, []);

  const loadDailyStats = useCallback(async (forceRefresh = false) => {
    try {
      setIsLoading(true);
      setError('');
      
      if (forceRefresh) {
        AdminService.clearDailyComparisonStatsCache();
      }
      
      const { data: dailyData, error: dailyError } = await AdminService.getDailyComparisonStats();
      
      if (dailyError) {
        console.error('EnhancedStatsCards: Error loading data:', dailyError);
        setError('Không thể tải dữ liệu thống kê');
        return;
      }
      
      if (dailyData) {
        setData(dailyData);
      }
    } catch (err) {
      console.error('EnhancedStatsCards: Exception loading data:', err);
      setError('Có lỗi xảy ra khi tải dữ liệu');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Format number with commas
  const formatNumber = (num: number) => {
    return num.toLocaleString('vi-VN');
  };

  // Format change display
  const formatChange = (change: number, changePercent: number) => {
    const sign = change >= 0 ? '+' : '';
    const color = change >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
    const icon = change >= 0 ? '↗' : '↘';
    
    return (
      <span className={`${color} text-sm font-medium`}>
        {icon} {sign}{change} ({sign}{changePercent}%)
      </span>
    );
  };

  // Individual stat card component
  const StatCard = ({ 
    title, 
    icon, 
    today, 
    yesterday, 
    total, 
    change, 
    changePercent,
    bgColor,
    iconColor 
  }: {
    title: string;
    icon: string;
    today: number;
    yesterday: number;
    total: number;
    change: number;
    changePercent: number;
    bgColor: string;
    iconColor: string;
  }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`${bgColor} rounded-xl p-4 sm:p-6 border border-gray-200 dark:border-gray-700`}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</h3>
        <div className={`w-8 h-8 ${iconColor} rounded-lg flex items-center justify-center text-white text-lg`}>
          {icon}
        </div>
      </div>
      
      {/* Today's value */}
      <div className="mb-3">
        <div className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
          {formatNumber(today)}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">hôm nay</div>
      </div>
      
      {/* Comparison with yesterday */}
      <div className="mb-3 pb-3 border-b border-gray-200 dark:border-gray-600">
        {formatChange(change, changePercent)}
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          so với hôm qua ({formatNumber(yesterday)})
        </div>
      </div>
      
      {/* Total accumulated */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500 dark:text-gray-400">Tổng cộng</span>
        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          {formatNumber(total)}
        </span>
      </div>
    </motion.div>
  );

  // Loading skeleton
  const LoadingSkeleton = () => (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 ${className}`}>
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse"></div>
            <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
          </div>
          <div className="mb-3">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16 mb-2 animate-pulse"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-12 animate-pulse"></div>
          </div>
          <div className="mb-3 pb-3 border-b border-gray-200 dark:border-gray-600">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-1 animate-pulse"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse"></div>
          </div>
          <div className="flex items-center justify-between">
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16 animate-pulse"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-12 animate-pulse"></div>
          </div>
        </div>
      ))}
    </div>
  );

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-xl p-6 border border-red-200 dark:border-red-700 ${className}`}>
        <div className="text-center">
          <div className="text-red-500 dark:text-red-400 mb-2">⚠️</div>
          <div className="text-gray-500 dark:text-gray-400 mb-4">{error}</div>
          <button
            onClick={() => loadDailyStats(true)}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors text-sm"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 ${className}`}>
      {/* Tests Today */}
      <StatCard
        title="Bài test hôm nay"
        icon="📝"
        today={data.testsToday.today}
        yesterday={data.testsToday.yesterday}
        total={data.testsToday.total}
        change={data.testsToday.change}
        changePercent={data.testsToday.changePercent}
        bgColor="bg-white dark:bg-gray-800"
        iconColor="bg-blue-500"
      />
      
      {/* Registered Users Today */}
      <StatCard
        title="User đăng ký hôm nay"
        icon="👤"
        today={data.registeredUsersToday.today}
        yesterday={data.registeredUsersToday.yesterday}
        total={data.registeredUsersToday.total}
        change={data.registeredUsersToday.change}
        changePercent={data.registeredUsersToday.changePercent}
        bgColor="bg-white dark:bg-gray-800"
        iconColor="bg-green-500"
      />
      
      {/* Anonymous Users Today */}
      <StatCard
        title="User ẩn danh hôm nay"
        icon="👥"
        today={data.anonymousUsersToday.today}
        yesterday={data.anonymousUsersToday.yesterday}
        total={data.anonymousUsersToday.total}
        change={data.anonymousUsersToday.change}
        changePercent={data.anonymousUsersToday.changePercent}
        bgColor="bg-white dark:bg-gray-800"
        iconColor="bg-purple-500"
      />
      
      {/* Average Score Today */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 border border-gray-200 dark:border-gray-700"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Điểm TB hôm nay</h3>
          <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center text-white text-lg">
            🎯
          </div>
        </div>
        
        {/* Today's average */}
        <div className="mb-3">
          <div className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
            {data.averageScoreToday.today}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">điểm trung bình</div>
        </div>
        
        {/* Comparison with yesterday */}
        <div className="mb-3 pb-3 border-b border-gray-200 dark:border-gray-600">
          {formatChange(data.averageScoreToday.change, data.averageScoreToday.changePercent)}
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            so với hôm qua ({data.averageScoreToday.yesterday})
          </div>
        </div>
        
        {/* Performance indicator */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500 dark:text-gray-400">Hiệu suất</span>
          <span className={`text-sm font-semibold ${
            data.averageScoreToday.today >= 120 
              ? 'text-green-600 dark:text-green-400' 
              : data.averageScoreToday.today >= 100 
                ? 'text-yellow-600 dark:text-yellow-400'
                : 'text-red-600 dark:text-red-400'
          }`}>
            {data.averageScoreToday.today >= 120 ? 'Xuất sắc' : 
             data.averageScoreToday.today >= 100 ? 'Tốt' : 'Cần cải thiện'}
          </span>
        </div>
      </motion.div>
      
      {/* Refresh button (spans full width on mobile, hidden on larger screens) */}
      <div className="md:hidden col-span-1 flex justify-center mt-4">
        <button
          onClick={() => loadDailyStats(true)}
          className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-200"
          disabled={isLoading}
        >
          <svg 
            className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Làm mới thống kê</span>
        </button>
      </div>
    </div>
  );
}
