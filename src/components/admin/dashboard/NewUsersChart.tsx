import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { AdminService } from '../../../../backend';
import type { NewUsersStats } from '../../../../backend';
import { exportNewUsersToCSV, exportNewUsersToJSON } from '../../../utils/export-utils';

interface Props {
  className?: string;
}

export default function NewUsersChart({ className = '' }: Props) {
  const [data, setData] = useState<NewUsersStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    loadNewUsersData();
  }, []);

  const loadNewUsersData = useCallback(async (forceRefresh = false, retryAttempt = 0) => {
    const maxRetries = 3;
    const retryDelay = Math.min(1000 * Math.pow(2, retryAttempt), 5000); // Exponential backoff

    try {
      setIsLoading(true);
      setError('');

      console.log('NewUsersChart: Loading new users data', { forceRefresh, retryAttempt });

      // Clear cache if force refresh
      if (forceRefresh) {
        AdminService.clearNewUsersStatsCache();
      }

      const { data: newUsersData, error: newUsersError } = await AdminService.getNewUsersStats();

      if (newUsersError) {
        console.error('NewUsersChart: Error loading data:', newUsersError);

        // Retry logic for network errors
        if (retryAttempt < maxRetries && (
          newUsersError.message?.includes('network') ||
          newUsersError.message?.includes('timeout') ||
          newUsersError.code === 'PGRST301'
        )) {
          console.log(`NewUsersChart: Retrying in ${retryDelay}ms (attempt ${retryAttempt + 1}/${maxRetries})`);
          setTimeout(() => {
            loadNewUsersData(forceRefresh, retryAttempt + 1);
          }, retryDelay);
          return;
        }

        setError('Không thể tải dữ liệu thống kê');
        return;
      }

      if (newUsersData) {
        console.log('NewUsersChart: Data loaded successfully', newUsersData);
        setData(newUsersData);
      }
    } catch (err) {
      console.error('NewUsersChart: Exception loading data:', err);

      // Retry for unexpected errors
      if (retryAttempt < maxRetries) {
        console.log(`NewUsersChart: Retrying after exception in ${retryDelay}ms (attempt ${retryAttempt + 1}/${maxRetries})`);
        setTimeout(() => {
          loadNewUsersData(forceRefresh, retryAttempt + 1);
        }, retryDelay);
        return;
      }

      setError('Có lỗi xảy ra khi tải dữ liệu');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Hôm nay';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Hôm qua';
    } else {
      return date.toLocaleDateString('vi-VN', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  // Memoized chart data
  const chartData = useMemo(() => {
    return data?.dailyData.map(item => ({
      ...item,
      displayDate: formatDate(item.date)
    })) || [];
  }, [data]);

  // Simple SVG Chart Component
  const SimpleLineChart = useCallback(() => {
    if (!chartData.length) return null;

    const width = 600;
    const height = 280;
    const padding = 50;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    // Calculate scales
    const maxValue = Math.max(...chartData.map(d => Math.max(d.registeredUsers, d.anonymousUsers, d.total))) || 1;
    const xStep = chartWidth / (chartData.length - 1);

    // Generate path for each line
    const createPath = (dataKey: 'registeredUsers' | 'anonymousUsers' | 'total') => {
      return chartData.map((d, i) => {
        const x = padding + i * xStep;
        const y = padding + chartHeight - (d[dataKey] / maxValue) * chartHeight;
        return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
      }).join(' ');
    };

    return (
      <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
        <svg width="100%" height="280" viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
          {/* Background */}
          <rect width="100%" height="100%" fill="transparent" />

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

          {/* Lines */}
          <path d={createPath('registeredUsers')} fill="none" stroke="#3B82F6" strokeWidth="2" />
          <path d={createPath('anonymousUsers')} fill="none" stroke="#10B981" strokeWidth="2" />
          <path d={createPath('total')} fill="none" stroke="#8B5CF6" strokeWidth="3" strokeDasharray="5,5" />

          {/* Data points */}
          {chartData.map((d, i) => {
            const x = padding + i * xStep;
            return (
              <g key={i}>
                <circle cx={x} cy={padding + chartHeight - (d.registeredUsers / maxValue) * chartHeight} r="3" fill="#3B82F6" />
                <circle cx={x} cy={padding + chartHeight - (d.anonymousUsers / maxValue) * chartHeight} r="3" fill="#10B981" />
                <circle cx={x} cy={padding + chartHeight - (d.total / maxValue) * chartHeight} r="4" fill="#8B5CF6" />

                {/* Date labels */}
                <text
                  x={x}
                  y={height - 10}
                  textAnchor="middle"
                  fontSize="10"
                  fill="currentColor"
                  className="text-gray-600 dark:text-gray-400"
                >
                  {d.displayDate}
                </text>
              </g>
            );
          })}

          {/* Y-axis labels */}
          {[0, 1, 2, 3, 4].map(i => {
            const value = Math.round((maxValue / 4) * (4 - i));
            const y = padding + (chartHeight / 4) * i;
            return (
              <text
                key={`y-label-${i}`}
                x={padding - 10}
                y={y + 4}
                textAnchor="end"
                fontSize="10"
                fill="currentColor"
                className="text-gray-600 dark:text-gray-400"
              >
                {value}
              </text>
            );
          })}
        </svg>

        {/* Legend */}
        <div className="flex justify-center space-x-4 mt-3 text-xs">
          <div className="flex items-center">
            <div className="w-3 h-0.5 bg-blue-500 mr-1"></div>
            <span className="text-gray-600 dark:text-gray-400">Đăng ký</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-0.5 bg-green-500 mr-1"></div>
            <span className="text-gray-600 dark:text-gray-400">Ẩn danh</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-0.5 bg-purple-500 mr-1" style={{backgroundImage: 'repeating-linear-gradient(to right, #8B5CF6 0, #8B5CF6 3px, transparent 3px, transparent 6px)'}}></div>
            <span className="text-gray-600 dark:text-gray-400">Tổng cộng</span>
          </div>
        </div>
      </div>
    );
  }, [chartData]);

  // Memoized summary stats
  const summaryStats = useMemo(() => {
    if (!data?.dailyData) return { registered: 0, anonymous: 0, total: 0 };

    return {
      registered: data.dailyData.reduce((sum, day) => sum + day.registeredUsers, 0),
      anonymous: data.dailyData.reduce((sum, day) => sum + day.anonymousUsers, 0),
      total: data.totalNewUsers
    };
  }, [data]);

  // Loading skeleton component
  const LoadingSkeleton = () => (
    <div className={`bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 border border-gray-200 dark:border-gray-700 ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 space-y-2 sm:space-y-0">
        <div>
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-2 animate-pulse"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse"></div>
        </div>
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
      </div>

      {/* Chart skeleton */}
      <div className="h-64 bg-gray-100 dark:bg-gray-700 rounded-lg mb-6 animate-pulse flex items-center justify-center">
        <div className="text-gray-400 dark:text-gray-500 text-sm">Đang tải biểu đồ...</div>
      </div>

      {/* Stats skeleton */}
      <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        {[1, 2, 3].map(i => (
          <div key={i} className="text-center">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-12 mx-auto mb-2 animate-pulse"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16 mx-auto animate-pulse"></div>
          </div>
        ))}
      </div>
    </div>
  );

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 ${className}`}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Người dùng mới (7 ngày qua)
          </h3>
          <button
            onClick={() => loadNewUsersData(true)}
            className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 text-sm"
          >
            Thử lại
          </button>
        </div>
        <div className="h-64 flex items-center justify-center">
          <div className="text-center">
            <div className="text-red-500 dark:text-red-400 mb-2">⚠️</div>
            <div className="text-gray-500 dark:text-gray-400">{error}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 border border-gray-200 dark:border-gray-700 ${className}`}
      role="region"
      aria-label="Biểu đồ thống kê người dùng mới trong 7 ngày qua"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 space-y-2 sm:space-y-0">
        <div className="flex-1">
          <h3
            className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100"
            id="new-users-chart-title"
          >
            Người dùng mới (7 ngày qua)
          </h3>
          <p
            className="text-sm text-gray-600 dark:text-gray-400 mt-1"
            aria-describedby="new-users-chart-title"
          >
            Tổng cộng: <span className="font-medium text-blue-600 dark:text-blue-400">{data?.totalNewUsers || 0}</span> người dùng mới
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {/* Export Dropdown */}
          {data && (
            <div className="relative group">
              <button
                className="flex items-center space-x-1 px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                title="Xuất dữ liệu thống kê"
                aria-label="Xuất dữ liệu thống kê"
                aria-haspopup="true"
                aria-expanded="false"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="hidden sm:inline">Xuất</span>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown Menu */}
              <div
                className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10"
                role="menu"
                aria-label="Tùy chọn xuất dữ liệu"
              >
                <button
                  onClick={() => exportNewUsersToCSV(data)}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-t-lg transition-colors focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-700"
                  role="menuitem"
                  aria-label="Xuất dữ liệu dạng CSV"
                >
                  <div className="flex items-center space-x-2">
                    <span role="img" aria-label="Biểu đồ">📊</span>
                    <span>Xuất CSV</span>
                  </div>
                </button>
                <button
                  onClick={() => exportNewUsersToJSON(data)}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-b-lg transition-colors focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-700"
                  role="menuitem"
                  aria-label="Xuất dữ liệu dạng JSON"
                >
                  <div className="flex items-center space-x-2">
                    <span role="img" aria-label="Tài liệu">📄</span>
                    <span>Xuất JSON</span>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Refresh Button */}
          <button
            onClick={() => loadNewUsersData(true)}
            className="flex items-center space-x-1 px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
            title="Làm mới dữ liệu thống kê"
            aria-label="Làm mới dữ liệu thống kê"
            disabled={isLoading}
          >
            <svg
              className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span className="hidden sm:inline">{isLoading ? 'Đang tải...' : 'Làm mới'}</span>
          </button>
        </div>
      </div>

      {/* Chart */}
      <div
        className="mb-4"
        role="img"
        aria-labelledby="new-users-chart-title"
        aria-describedby="chart-description"
      >
        <div id="chart-description" className="sr-only">
          Biểu đồ đường thể hiện số lượng người dùng mới trong 7 ngày qua.
          Có 3 đường: người dùng đăng ký (màu xanh), người dùng ẩn danh (màu xanh lá),
          và tổng cộng (màu tím). Tổng cộng có {summaryStats.total} người dùng mới.
        </div>
        <SimpleLineChart />
      </div>

      {/* Summary Stats */}
      <div
        className="grid grid-cols-3 gap-2 sm:gap-4 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700"
        role="region"
        aria-label="Tóm tắt thống kê"
      >
        <motion.div
          className="text-center p-2 sm:p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20"
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.2 }}
          role="group"
          aria-label={`Người dùng đăng ký: ${summaryStats.registered}`}
        >
          <div
            className="text-lg sm:text-2xl font-bold text-blue-600 dark:text-blue-400"
            aria-label={`${summaryStats.registered} người dùng đăng ký`}
          >
            {summaryStats.registered}
          </div>
          <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Đăng ký</div>
        </motion.div>
        <motion.div
          className="text-center p-2 sm:p-3 rounded-lg bg-green-50 dark:bg-green-900/20"
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.2 }}
          role="group"
          aria-label={`Người dùng ẩn danh: ${summaryStats.anonymous}`}
        >
          <div
            className="text-lg sm:text-2xl font-bold text-green-600 dark:text-green-400"
            aria-label={`${summaryStats.anonymous} người dùng ẩn danh`}
          >
            {summaryStats.anonymous}
          </div>
          <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Ẩn danh</div>
        </motion.div>
        <motion.div
          className="text-center p-2 sm:p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20"
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.2 }}
          role="group"
          aria-label={`Tổng cộng: ${summaryStats.total}`}
        >
          <div
            className="text-lg sm:text-2xl font-bold text-purple-600 dark:text-purple-400"
            aria-label={`Tổng cộng ${summaryStats.total} người dùng mới`}
          >
            {summaryStats.total}
          </div>
          <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Tổng cộng</div>
        </motion.div>
      </div>
    </motion.div>
  );
}


