import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AdminService } from '../../../../backend';
import type { NewUsersStats, NewUsersTimeRange } from '../../../../backend';

interface Props {
  className?: string;
}

export default function NewUsersChart({ className = '' }: Props) {
  const [data, setData] = useState<NewUsersStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);
  const [timeRange, setTimeRange] = useState<NewUsersTimeRange>('7d');
  const [showTimeFilter, setShowTimeFilter] = useState(false);

  useEffect(() => {
    loadNewUsersData();
  }, [timeRange]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showTimeFilter) {
        const target = event.target as Element;
        if (!target.closest('[data-time-filter]')) {
          setShowTimeFilter(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showTimeFilter]);

  const loadNewUsersData = useCallback(async (forceRefresh = false, retryAttempt = 0) => {
    const maxRetries = 3;
    const retryDelay = 1000 * (retryAttempt + 1); // 1s, 2s, 3s

    try {
      setIsLoading(true);
      setError('');

      if (forceRefresh) {
        AdminService.clearNewUsersStatsCache(timeRange);
      }

      const { data: newUsersData, error: newUsersError } = await AdminService.getNewUsersStats(timeRange);

      if (newUsersError) {
        console.error('NewUsersChart: Error loading data:', newUsersError);

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

        setError('Không thể tải dữ liệu người dùng mới');
        return;
      }

      if (newUsersData) {
        console.log('NewUsersChart: Data loaded successfully', newUsersData);
        setData(newUsersData);
      }
    } catch (err) {
      console.error('NewUsersChart: Exception loading data:', err);
      setError('Có lỗi xảy ra khi tải dữ liệu');
    } finally {
      setIsLoading(false);
    }
  }, [timeRange]);

  // Time range helper functions
  const getTimeRangeLabel = (range: NewUsersTimeRange): string => {
    const labels = {
      '7d': '7 ngày qua',
      '1m': '1 tháng qua',
      '3m': '3 tháng qua',
      '6m': '6 tháng qua'
    };
    return labels[range];
  };

  const getTimeRangeOptions = (): Array<{ value: NewUsersTimeRange; label: string }> => [
    { value: '7d', label: '7 ngày' },
    { value: '1m', label: '1 tháng' },
    { value: '3m', label: '3 tháng' },
    { value: '6m', label: '6 tháng' }
  ];

  const handleTimeRangeChange = (newRange: NewUsersTimeRange) => {
    setTimeRange(newRange);
    setShowTimeFilter(false);
  };

  // Chart calculations
  const chartData = useMemo(() => {
    if (!data?.dailyData) return [];

    return data.dailyData.map(item => {
      const date = new Date(item.date);
      // Create date label (e.g., "T2 15/1", "T3 16/1")
      const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
      const dayName = dayNames[date.getDay()];
      const dateLabel = `${dayName} ${date.getDate()}/${date.getMonth() + 1}`;

      return {
        ...item,
        dateLabel
      };
    });
  }, [data]);

  const maxValue = useMemo(() => {
    if (!chartData.length) return 10;
    const max = Math.max(...chartData.map(d => d.total));
    return Math.max(max, 1); // Ensure minimum of 1
  }, [chartData]);

  // SVG Line Chart Component
  const LineChart = useCallback(() => {
    if (!chartData.length) {
      return (
        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 flex items-center justify-center h-60 lg:h-72 xl:h-80 2xl:h-96">
          <div className="text-center">
            <svg className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Chưa có dữ liệu người dùng</p>
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

    // Calculate points for the line
    const points = chartData.map((d, i) => {
      const x = padding + (i * (chartWidth / (chartData.length - 1)));
      const y = padding + chartHeight - ((d.total / maxValue) * chartHeight);
      return { x, y, data: d };
    });

    // Create path string for the line
    const pathData = points.reduce((path, point, i) => {
      const command = i === 0 ? 'M' : 'L';
      return `${path} ${command} ${point.x} ${point.y}`;
    }, '');

    // Create area path (filled area under the line)
    const areaPath = `${pathData} L ${points[points.length - 1].x} ${padding + chartHeight} L ${padding} ${padding + chartHeight} Z`;

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

          {/* Area under the line */}
          <path
            d={areaPath}
            fill="url(#gradient)"
            opacity="0.3"
          />

          {/* Gradient definition */}
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.1" />
            </linearGradient>
          </defs>

          {/* Main line */}
          <path
            d={pathData}
            fill="none"
            stroke="#8B5CF6"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="drop-shadow-sm"
          />

          {/* Data points */}
          {points.map((point, i) => (
            <g key={i}>
              {/* Point circle */}
              <circle
                cx={point.x}
                cy={point.y}
                r={hoveredPoint === i ? "6" : "4"}
                fill="#8B5CF6"
                stroke="white"
                strokeWidth="2"
                className="cursor-pointer transition-all duration-200 drop-shadow-sm"
                onMouseEnter={() => setHoveredPoint(i)}
                onMouseLeave={() => setHoveredPoint(null)}
              />

              {/* Tooltip on hover */}
              {hoveredPoint === i && (
                <g>
                  {/* Tooltip background */}
                  <rect
                    x={point.x - 40}
                    y={point.y - 70}
                    width="80"
                    height="60"
                    fill="rgba(0, 0, 0, 0.9)"
                    rx="6"
                    className="animate-in fade-in duration-200 drop-shadow-lg"
                  />
                  {/* Tooltip text - total */}
                  <text
                    x={point.x}
                    y={point.y - 50}
                    textAnchor="middle"
                    fontSize="12"
                    fill="white"
                    className="font-bold animate-in fade-in duration-200"
                  >
                    Tổng: {point.data.total}
                  </text>
                  {/* Tooltip text - registered */}
                  <text
                    x={point.x}
                    y={point.y - 35}
                    textAnchor="middle"
                    fontSize="10"
                    fill="rgba(255, 255, 255, 0.8)"
                    className="animate-in fade-in duration-200"
                  >
                    Đã ĐK: {point.data.registeredUsers}
                  </text>
                  {/* Tooltip text - anonymous */}
                  <text
                    x={point.x}
                    y={point.y - 22}
                    textAnchor="middle"
                    fontSize="10"
                    fill="rgba(255, 255, 255, 0.8)"
                    className="animate-in fade-in duration-200"
                  >
                    Chưa ĐK: {point.data.anonymousUsers}
                  </text>
                  {/* Tooltip text - date */}
                  <text
                    x={point.x}
                    y={point.y - 10}
                    textAnchor="middle"
                    fontSize="9"
                    fill="rgba(255, 255, 255, 0.6)"
                    className="animate-in fade-in duration-200"
                  >
                    {point.data.dateLabel}
                  </text>
                </g>
              )}

              {/* Date label */}
              <text
                x={point.x}
                y={height - 10}
                textAnchor="middle"
                fontSize="10"
                fill="currentColor"
                className="text-gray-600 dark:text-gray-400"
              >
                {point.data.dateLabel}
              </text>
            </g>
          ))}

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
  }, [chartData, maxValue, hoveredPoint]);

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
            onClick={() => loadNewUsersData(true)}
            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
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
      transition={{ delay: 0.2 }}
      className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 ${className}`}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h3
            id="new-users-chart-title"
            className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2"
          >
            Người dùng mới ({getTimeRangeLabel(timeRange)})
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Thống kê số lượng người dùng mới theo ngày
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {/* Time Range Filter */}
          <div className="relative" data-time-filter>
            <button
              onClick={() => setShowTimeFilter(!showTimeFilter)}
              disabled={isLoading}
              className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
              title="Chọn khoảng thời gian"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="hidden sm:inline">{getTimeRangeOptions().find(opt => opt.value === timeRange)?.label}</span>
              <svg className={`w-3 h-3 transition-transform duration-200 ${showTimeFilter ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Time Filter Dropdown */}
            <AnimatePresence>
              {showTimeFilter && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 top-full mt-2 w-32 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50"
                >
                  {getTimeRangeOptions().map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleTimeRangeChange(option.value)}
                      className={`w-full text-left px-3 py-2 text-sm transition-colors first:rounded-t-lg last:rounded-b-lg ${
                        timeRange === option.value
                          ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Refresh Button */}
          <button
            onClick={() => loadNewUsersData(true)}
            disabled={isLoading}
            className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
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
        aria-labelledby="new-users-chart-title"
        aria-describedby="new-users-chart-description"
      >
        <div id="new-users-chart-description" className="sr-only">
          Biểu đồ đường thể hiện số lượng người dùng mới trong 7 ngày gần nhất.
          Tổng cộng có {data?.totalNewUsers || 0} người dùng mới.
        </div>
        <LineChart />
      </div>

      {/* Summary Stats */}
      <div
        className="grid grid-cols-2 gap-2 sm:gap-4 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700"
        role="region"
        aria-label="Tóm tắt thống kê người dùng mới"
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
          aria-label={`Trung bình mỗi ngày: ${Math.round((data?.totalNewUsers || 0) / 7)}`}
        >
          <div
            className="text-lg sm:text-2xl font-bold text-blue-600 dark:text-blue-400"
            aria-label={`${Math.round((data?.totalNewUsers || 0) / 7)} người dùng trung bình mỗi ngày`}
          >
            {Math.round((data?.totalNewUsers || 0) / 7)}
          </div>
          <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">TB/ngày</div>
        </motion.div>
      </div>
    </motion.div>
  );
};