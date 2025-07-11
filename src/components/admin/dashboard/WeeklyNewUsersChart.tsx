import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { AdminService } from '../../../../backend';
import type { WeeklyNewUsersStats } from '../../../../backend';

interface Props {
  className?: string;
}

export default function WeeklyNewUsersChart({ className = '' }: Props) {
  const [data, setData] = useState<WeeklyNewUsersStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);

  useEffect(() => {
    loadWeeklyNewUsersData();
  }, []);

  const loadWeeklyNewUsersData = useCallback(async (forceRefresh = false, retryAttempt = 0) => {
    const maxRetries = 3;
    const retryDelay = 1000 * (retryAttempt + 1); // 1s, 2s, 3s

    try {
      setIsLoading(true);
      setError('');
      
      if (forceRefresh) {
        AdminService.clearWeeklyNewUsersStatsCache();
      }
      
      const { data: weeklyData, error: weeklyError } = await AdminService.getWeeklyNewUsersStats();
      
      if (weeklyError) {
        console.error('WeeklyNewUsersChart: Error loading data:', weeklyError);
        
        if (retryAttempt < maxRetries && (
          weeklyError.message?.includes('network') || 
          weeklyError.message?.includes('timeout') ||
          weeklyError.code === 'PGRST301'
        )) {
          console.log(`WeeklyNewUsersChart: Retrying in ${retryDelay}ms (attempt ${retryAttempt + 1}/${maxRetries})`);
          setTimeout(() => {
            loadWeeklyNewUsersData(forceRefresh, retryAttempt + 1);
          }, retryDelay);
          return;
        }
        
        setError('Không thể tải dữ liệu người dùng mới theo tuần');
        return;
      }
      
      if (weeklyData) {
        console.log('WeeklyNewUsersChart: Data loaded successfully', weeklyData);
        setData(weeklyData);
      }
    } catch (err) {
      console.error('WeeklyNewUsersChart: Exception loading data:', err);
      setError('Có lỗi xảy ra khi tải dữ liệu');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Chart calculations
  const chartData = useMemo(() => {
    if (!data?.weeklyData) return [];
    
    return data.weeklyData.map(item => ({
      ...item,
      // Create shorter week label for display
      shortLabel: item.weekLabel.length > 12 ? 
        item.weekLabel.substring(0, 12) + '...' : 
        item.weekLabel
    }));
  }, [data]);

  const maxValue = useMemo(() => {
    if (!chartData.length) return 10;
    const max = Math.max(...chartData.map(d => d.total));
    return Math.max(max, 1); // Ensure minimum of 1
  }, [chartData]);

  // SVG Bar Chart Component
  const BarChart = useCallback(() => {
    if (!chartData.length) {
      return (
        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 flex items-center justify-center h-60 lg:h-72 xl:h-80 2xl:h-96">
          <div className="text-center">
            <svg className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Chưa có dữ liệu người dùng theo tuần</p>
          </div>
        </div>
      );
    }

    // Responsive chart dimensions
    const width = 800;
    const height = 260;
    const padding = 45;
    const chartWidth = width - (padding * 2);
    const chartHeight = height - (padding * 2);

    // Calculate bar dimensions
    const barWidth = chartWidth / chartData.length * 0.7; // 70% width for bars, 30% for spacing
    const barSpacing = chartWidth / chartData.length * 0.3;

    return (
      <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
        <svg
          width="100%"
          height="260"
          viewBox={`0 0 ${width} ${height}`}
          className="overflow-visible h-60 lg:h-72 xl:h-80 2xl:h-96"
          preserveAspectRatio="xMidYMid meet"
        >
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
          
          {/* Gradient definition */}
          <defs>
            <linearGradient id="barGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.6" />
            </linearGradient>
          </defs>
          
          {/* Bars */}
          {chartData.map((item, i) => {
            const barHeight = (item.total / maxValue) * chartHeight;
            const x = padding + (i * (chartWidth / chartData.length)) + (barSpacing / 2);
            const y = padding + chartHeight - barHeight;
            
            return (
              <g key={i}>
                {/* Bar */}
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  fill={hoveredBar === i ? "#8B5CF6" : "url(#barGradient)"}
                  rx="4"
                  ry="4"
                  className="cursor-pointer transition-all duration-200 drop-shadow-sm"
                  onMouseEnter={() => setHoveredBar(i)}
                  onMouseLeave={() => setHoveredBar(null)}
                />
                
                {/* Tooltip on hover */}
                {hoveredBar === i && (
                  <g>
                    {/* Tooltip background */}
                    <rect
                      x={x + barWidth/2 - 45}
                      y={y - 80}
                      width="90"
                      height="70"
                      fill="rgba(0, 0, 0, 0.9)"
                      rx="6"
                      className="animate-in fade-in duration-200 drop-shadow-lg"
                    />
                    {/* Tooltip text - total */}
                    <text 
                      x={x + barWidth/2} 
                      y={y - 60} 
                      textAnchor="middle" 
                      fontSize="12" 
                      fill="white"
                      className="font-bold animate-in fade-in duration-200"
                    >
                      Tổng: {item.total}
                    </text>
                    {/* Tooltip text - registered */}
                    <text 
                      x={x + barWidth/2} 
                      y={y - 45} 
                      textAnchor="middle" 
                      fontSize="10" 
                      fill="rgba(255, 255, 255, 0.8)"
                      className="animate-in fade-in duration-200"
                    >
                      Đã ĐK: {item.registeredUsers}
                    </text>
                    {/* Tooltip text - anonymous */}
                    <text 
                      x={x + barWidth/2} 
                      y={y - 30} 
                      textAnchor="middle" 
                      fontSize="10" 
                      fill="rgba(255, 255, 255, 0.8)"
                      className="animate-in fade-in duration-200"
                    >
                      Chưa ĐK: {item.anonymousUsers}
                    </text>
                    {/* Tooltip text - week */}
                    <text 
                      x={x + barWidth/2} 
                      y={y - 15} 
                      textAnchor="middle" 
                      fontSize="9" 
                      fill="rgba(255, 255, 255, 0.6)"
                      className="animate-in fade-in duration-200"
                    >
                      {item.weekLabel}
                    </text>
                  </g>
                )}
                
                {/* Week label */}
                <text 
                  x={x + barWidth/2} 
                  y={height - 10} 
                  textAnchor="middle" 
                  fontSize="10" 
                  fill="currentColor" 
                  className="text-gray-600 dark:text-gray-400"
                >
                  {item.shortLabel}
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
      </div>
    );
  }, [chartData, maxValue, hoveredBar]);

  // Loading skeleton component
  const LoadingSkeleton = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 ${className}`}
    >
      {/* Header skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-2 animate-pulse"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-64 animate-pulse"></div>
        </div>
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse"></div>
      </div>
      
      {/* Chart skeleton */}
      <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 mb-4">
        <div className="h-60 lg:h-72 xl:h-80 2xl:h-96 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
      </div>
      
      {/* Stats skeleton */}
      <div className="grid grid-cols-2 gap-2 sm:gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="text-center p-2 sm:p-3 rounded-lg bg-gray-100 dark:bg-gray-700/50">
          <div className="h-8 bg-gray-200 dark:bg-gray-600 rounded w-12 mx-auto mb-2 animate-pulse"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-16 mx-auto animate-pulse"></div>
        </div>
        <div className="text-center p-2 sm:p-3 rounded-lg bg-gray-100 dark:bg-gray-700/50">
          <div className="h-8 bg-gray-200 dark:bg-gray-600 rounded w-12 mx-auto mb-2 animate-pulse"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-16 mx-auto animate-pulse"></div>
        </div>
      </div>
    </motion.div>
  );

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 ${className}`}
      >
        <div className="text-center">
          <div className="text-red-500 dark:text-red-400 mb-2">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Lỗi tải dữ liệu</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <button
            onClick={() => loadWeeklyNewUsersData(true)}
            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg"
          >
            Thử lại
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 ${className}`}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h3 
            id="weekly-new-users-chart-title"
            className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2"
          >
            Người dùng mới (6 tuần qua)
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Thống kê số lượng người dùng mới theo tuần
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => loadWeeklyNewUsersData(true)}
            disabled={isLoading}
            className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg disabled:opacity-50"
            title="Làm mới dữ liệu"
          >
            <svg className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        aria-labelledby="weekly-new-users-chart-title"
        aria-describedby="weekly-new-users-chart-description"
      >
        <div id="weekly-new-users-chart-description" className="sr-only">
          Biểu đồ cột thể hiện số lượng người dùng mới trong 6 tuần gần nhất. 
          Tổng cộng có {data?.totalNewUsers || 0} người dùng mới.
        </div>
        <BarChart />
      </div>

      {/* Summary Stats */}
      <div
        className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700"
        role="region"
        aria-label="Tóm tắt thống kê người dùng mới theo tuần"
      >
        <motion.div
          className="text-center p-2 sm:p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20"
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.2 }}
          role="group"
          aria-label={`Tổng số người dùng mới: ${data?.totalNewUsers || 0}`}
        >
          <div
            className="text-lg sm:text-2xl font-bold text-purple-600 dark:text-purple-400"
            aria-label={`${data?.totalNewUsers || 0} người dùng mới tổng cộng`}
          >
            {data?.totalNewUsers || 0}
          </div>
          <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Tổng mới</div>
        </motion.div>
        <motion.div
          className="text-center p-2 sm:p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20"
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.2 }}
          role="group"
          aria-label={`Trung bình mỗi tuần: ${data?.averagePerWeek || 0}`}
        >
          <div
            className="text-lg sm:text-2xl font-bold text-blue-600 dark:text-blue-400"
            aria-label={`${data?.averagePerWeek || 0} người dùng trung bình mỗi tuần`}
          >
            {data?.averagePerWeek || 0}
          </div>
          <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">TB/tuần</div>
        </motion.div>
        <motion.div
          className="text-center p-2 sm:p-3 rounded-lg bg-green-50 dark:bg-green-900/20"
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.2 }}
          role="group"
          aria-label={`Số người dùng đăng ký: ${data?.weeklyData?.reduce((sum, week) => sum + week.registeredUsers, 0) || 0}`}
        >
          <div
            className="text-lg sm:text-2xl font-bold text-green-600 dark:text-green-400"
            aria-label={`${data?.weeklyData?.reduce((sum, week) => sum + week.registeredUsers, 0) || 0} người dùng đăng ký`}
          >
            {data?.weeklyData?.reduce((sum, week) => sum + week.registeredUsers, 0) || 0}
          </div>
          <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Đăng ký</div>
        </motion.div>
        <motion.div
          className="text-center p-2 sm:p-3 rounded-lg bg-orange-50 dark:bg-orange-900/20"
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.2 }}
          role="group"
          aria-label={`Số người dùng chưa đăng ký: ${data?.weeklyData?.reduce((sum, week) => sum + week.anonymousUsers, 0) || 0}`}
        >
          <div
            className="text-lg sm:text-2xl font-bold text-orange-600 dark:text-orange-400"
            aria-label={`${data?.weeklyData?.reduce((sum, week) => sum + week.anonymousUsers, 0) || 0} người dùng chưa đăng ký`}
          >
            {data?.weeklyData?.reduce((sum, week) => sum + week.anonymousUsers, 0) || 0}
          </div>
          <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Chưa đăng ký</div>
        </motion.div>
      </div>
    </motion.div>
  );
};
