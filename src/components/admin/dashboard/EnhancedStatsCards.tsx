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

  // Compact horizontal stat card component
  const CompactStatCard = ({
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
      className={`${bgColor} rounded-lg p-3 sm:p-4 border border-gray-200 dark:border-gray-700`}
    >
      {/* Header with title and icon */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 truncate">{title}</h3>
        <div className={`w-6 h-6 sm:w-7 sm:h-7 ${iconColor} rounded-md flex items-center justify-center text-white text-sm sm:text-base flex-shrink-0 ml-2`}>
          {icon}
        </div>
      </div>

      {/* Horizontal layout for 3-layer info */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {/* Today's value */}
        <div className="text-center">
          <div className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 leading-tight">
            {formatNumber(today)}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">hôm nay</div>
        </div>

        {/* Comparison with yesterday */}
        <div className="text-center border-x border-gray-200 dark:border-gray-600 px-1">
          <div className="flex flex-col items-center">
            {formatChange(change, changePercent)}
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              vs {formatNumber(yesterday)}
            </div>
          </div>
        </div>

        {/* Total accumulated */}
        <div className="text-center">
          <div className="text-lg sm:text-xl font-bold text-gray-700 dark:text-gray-300 leading-tight">
            {total >= 1000 ? `${Math.round(total/1000)}k` : formatNumber(total)}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">tổng</div>
        </div>
      </div>
    </motion.div>
  );

  // Compact loading skeleton
  const CompactLoadingSkeleton = () => (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 ${className}`}>
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4 border border-gray-200 dark:border-gray-700">
          {/* Header skeleton */}
          <div className="flex items-center justify-between mb-3">
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse"></div>
            <div className="w-6 h-6 sm:w-7 sm:h-7 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse"></div>
          </div>

          {/* 3-column grid skeleton */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {[1, 2, 3].map(j => (
              <div key={j} className="text-center">
                <div className="h-5 sm:h-6 bg-gray-200 dark:bg-gray-700 rounded w-8 mx-auto mb-1 animate-pulse"></div>
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-10 mx-auto animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  if (isLoading) {
    return <CompactLoadingSkeleton />;
  }

  if (error) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg p-4 border border-red-200 dark:border-red-700 ${className}`}>
        <div className="text-center">
          <div className="text-red-500 dark:text-red-400 mb-2 text-lg">⚠️</div>
          <div className="text-gray-500 dark:text-gray-400 mb-3 text-sm">{error}</div>
          <button
            onClick={() => loadDailyStats(true)}
            className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors text-xs"
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
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 ${className}`}>
      {/* Tests Today */}
      <CompactStatCard
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
      <CompactStatCard
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
      <CompactStatCard
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
      
      {/* Average Score Today - Compact Version */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4 border border-gray-200 dark:border-gray-700"
      >
        {/* Header with title and icon */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 truncate">Điểm TB hôm nay</h3>
          <div className="w-6 h-6 sm:w-7 sm:h-7 bg-orange-500 rounded-md flex items-center justify-center text-white text-sm sm:text-base flex-shrink-0 ml-2">
            🎯
          </div>
        </div>

        {/* Horizontal layout for 3-layer info */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {/* Today's average */}
          <div className="text-center">
            <div className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 leading-tight">
              {data.averageScoreToday.today}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">hôm nay</div>
          </div>

          {/* Comparison with yesterday */}
          <div className="text-center border-x border-gray-200 dark:border-gray-600 px-1">
            <div className="flex flex-col items-center">
              {formatChange(data.averageScoreToday.change, data.averageScoreToday.changePercent)}
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                vs {data.averageScoreToday.yesterday}
              </div>
            </div>
          </div>

          {/* Performance indicator */}
          <div className="text-center">
            <div className={`text-xs sm:text-sm font-bold leading-tight ${
              data.averageScoreToday.today >= 120
                ? 'text-green-600 dark:text-green-400'
                : data.averageScoreToday.today >= 100
                  ? 'text-yellow-600 dark:text-yellow-400'
                  : 'text-red-600 dark:text-red-400'
            }`}>
              {data.averageScoreToday.today >= 120 ? 'Xuất sắc' :
               data.averageScoreToday.today >= 100 ? 'Tốt' : 'Cần cải thiện'}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">hiệu suất</div>
          </div>
        </div>
      </motion.div>
      
      {/* Compact refresh button (spans full width on mobile, hidden on larger screens) */}
      <div className="md:hidden col-span-1 flex justify-center mt-2">
        <button
          onClick={() => loadDailyStats(true)}
          className="flex items-center space-x-1 px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-all duration-200"
          disabled={isLoading}
        >
          <svg
            className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Làm mới</span>
        </button>
      </div>
    </div>
  );
}
