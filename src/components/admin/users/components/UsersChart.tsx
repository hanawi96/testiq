import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { NewUsersStats, NewUsersTimeRange } from '../../../../../backend';

interface Props {
  className?: string;
  defaultTimeRange?: NewUsersTimeRange;
}

export default function UsersChart({ className = '', defaultTimeRange = '1m' }: Props) {
  const [data, setData] = useState<NewUsersStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);
  const [timeRange, setTimeRange] = useState<NewUsersTimeRange>(defaultTimeRange);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(400);

  // Time range options
  const timeRangeOptions = [
    { value: '7d' as NewUsersTimeRange, label: '7 ngày', description: 'Tuần này' },
    { value: '1m' as NewUsersTimeRange, label: '30 ngày', description: 'Tháng này' },
    { value: '3m' as NewUsersTimeRange, label: '90 ngày', description: '3 tháng' }
  ];

  const getTimeRangeLabel = (range: NewUsersTimeRange): string => {
    const option = timeRangeOptions.find(opt => opt.value === range);
    return option ? option.label : '7 ngày';
  };

  // Load data
  const loadUsersData = useCallback(async (forceRefresh = false, retryAttempt = 0) => {
    const maxRetries = 3;
    const retryDelay = 1000 * (retryAttempt + 1);

    try {
      setIsLoading(true);
      setError('');

      if (forceRefresh) {
        const { AdminService } = await import('../../../../../backend');
        AdminService.clearNewUsersStatsCache(timeRange);
      }

      const { AdminService } = await import('../../../../../backend');
      const { data: usersData, error: usersError } = await AdminService.getNewUsersStats(timeRange);
      
      if (usersError) {
        console.error('UsersChart: Error loading data:', usersError);
        
        if (retryAttempt < maxRetries && (
          usersError.message?.includes('network') || 
          usersError.message?.includes('timeout') ||
          usersError.code === 'PGRST301'
        )) {
          console.log(`UsersChart: Retrying in ${retryDelay}ms (attempt ${retryAttempt + 1}/${maxRetries})`);
          setTimeout(() => {
            loadUsersData(forceRefresh, retryAttempt + 1);
          }, retryDelay);
          return;
        }
        
        setError('Không thể tải dữ liệu người dùng');
        return;
      }
      
      if (usersData) {
        console.log('UsersChart: Data loaded successfully', usersData);
        setData(usersData);
      }
    } catch (err) {
      console.error('UsersChart: Exception loading data:', err);
      setError('Có lỗi xảy ra khi tải dữ liệu');
    } finally {
      setIsLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    loadUsersData();
  }, [loadUsersData]);

  // Handle container resize
  useEffect(() => {
    const handleResize = () => {
      if (chartContainerRef.current) {
        setContainerWidth(chartContainerRef.current.offsetWidth);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Chart calculations
  const chartData = useMemo(() => {
    if (!data?.dailyData) return [];

    return data.dailyData.map(item => {
      const date = new Date(item.date);
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
    return Math.max(max, 1);
  }, [chartData]);

  // Responsive dimensions
  const responsiveDimensions = useMemo(() => {
    const isMobile = containerWidth < 640;
    return {
      height: isMobile ? 200 : 260,
      padding: isMobile ? 35 : 45
    };
  }, [containerWidth]);

  // Chart dimensions
  const chartDimensions = useMemo(() => {
    const width = Math.max(400, containerWidth - 16);
    const height = responsiveDimensions.height;
    return { width, height };
  }, [containerWidth, responsiveDimensions.height]);

  // Loading Skeleton Component - Professional, giống ResultsTestChart
  const LoadingSkeleton = useCallback(() => {
    return (
      <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 w-full"
           style={{ height: responsiveDimensions.height }}>
        <div className="relative w-full h-full flex items-center justify-center">
          {/* Simple grid background */}
          <div className="absolute inset-4 opacity-15">
            <div className="w-full h-full border-l border-b border-gray-300 dark:border-gray-600">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-full border-t border-gray-300 dark:border-gray-600"
                  style={{ top: `${(i + 1) * 20}%` }}
                />
              ))}
              {[...Array(6)].map((_, i) => (
                <div
                  key={`v-${i}`}
                  className="absolute h-full border-l border-gray-300 dark:border-gray-600"
                  style={{ left: `${(i + 1) * 15}%` }}
                />
              ))}
            </div>
          </div>

          {/* Professional loading indicator with smooth animation */}
          <div className="flex items-center space-x-3 bg-white/95 dark:bg-gray-800/95 rounded-lg px-5 py-3 shadow-sm border border-gray-200/50 dark:border-gray-700/50">
            {/* Elegant spinner */}
            <div className="relative w-4 h-4">
              <div className="absolute inset-0 border-2 border-purple-200 dark:border-purple-800 rounded-full"></div>
              <div className="absolute inset-0 border-2 border-transparent border-t-purple-500 rounded-full animate-spin"></div>
            </div>

            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Đang tải dữ liệu người dùng...
            </span>
          </div>
        </div>
      </div>
    );
  }, [responsiveDimensions.height]);

  // Smart label sampling to avoid overcrowding
  const getVisibleLabelIndices = useCallback((dataLength: number) => {
    if (dataLength === 0) return [];

    // For 7 days, show all labels
    if (timeRange === '7d') {
      return Array.from({ length: dataLength }, (_, i) => i);
    }

    // For 1 month (30 days), show every 5th day
    if (timeRange === '1m') {
      const step = Math.max(1, Math.floor(dataLength / 6));
      return Array.from({ length: Math.min(6, dataLength) }, (_, i) => i * step).filter(i => i < dataLength);
    }

    // For 3 months (90 days), show every 15th day
    if (timeRange === '3m') {
      const step = Math.max(1, Math.floor(dataLength / 6));
      return Array.from({ length: Math.min(6, dataLength) }, (_, i) => i * step).filter(i => i < dataLength);
    }

    return [0, dataLength - 1]; // Show first and last
  }, [timeRange]);

  // SVG Line Chart Component
  const LineChart = useCallback(() => {
    if (!chartData.length) {
      return (
        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 flex items-center justify-center"
             style={{ height: responsiveDimensions.height }}>
          <div className="text-center">
            <svg className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Chưa có dữ liệu người dùng</p>
          </div>
        </div>
      );
    }

    // Responsive dimensions
    const width = Math.max(400, containerWidth - 16);
    const height = responsiveDimensions.height;
    const padding = responsiveDimensions.padding;
    const chartWidth = width - (padding * 2);
    const chartHeight = height - (padding * 2);

    // Y-axis labels (5 levels)
    const yAxisLabels = [];
    for (let i = 0; i <= 4; i++) {
      const value = Math.round((maxValue * (4 - i)) / 4);
      yAxisLabels.push(value);
    }

    // X-axis visible labels
    const visibleLabelIndices = getVisibleLabelIndices(chartData.length);

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

    // Create area path
    const areaPath = `${pathData} L ${points[points.length - 1].x} ${height - padding} L ${padding} ${height - padding} Z`;

    return (
      <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-1 sm:p-2 w-full overflow-hidden">
        <svg
          width="100%"
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          className="w-full touch-pan-y"
          preserveAspectRatio="xMidYMid meet"
          style={{
            minWidth: '100%',
            maxWidth: '100%',
            height: 'auto',
            userSelect: 'none'
          }}
        >
          {/* Background */}
          <rect width="100%" height="100%" fill="transparent" />

          {/* Y-axis labels and grid lines */}
          {yAxisLabels.map((label, i) => {
            const y = padding + (chartHeight / 4) * i;
            return (
              <g key={`y-axis-${i}`}>
                {/* Grid line */}
                <line
                  x1={padding}
                  y1={y}
                  x2={width - padding}
                  y2={y}
                  stroke="currentColor"
                  strokeWidth="1"
                  className="text-gray-200 dark:text-gray-700"
                  opacity="0.3"
                />
                {/* Y-axis label */}
                <text
                  x={padding - 12}
                  y={y + 4}
                  textAnchor="end"
                  className="text-xs fill-gray-500 dark:fill-gray-400"
                  fontSize="11"
                >
                  {label}
                </text>
              </g>
            );
          })}

          {/* Gradient definition */}
          <defs>
            <linearGradient id="usersGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgb(147, 51, 234)" stopOpacity="0.3" />
              <stop offset="100%" stopColor="rgb(147, 51, 234)" stopOpacity="0.05" />
            </linearGradient>
          </defs>

          {/* Area under the line */}
          <path
            d={areaPath}
            fill="url(#usersGradient)"
            opacity="0.3"
          />

          {/* Main line */}
          <path
            d={pathData}
            fill="none"
            stroke="rgb(147, 51, 234)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="drop-shadow-sm"
          />

          {/* X-axis labels */}
          {visibleLabelIndices.map((dataIndex) => {
            const point = points[dataIndex];
            if (!point) return null;

            return (
              <text
                key={`x-label-${dataIndex}`}
                x={point.x}
                y={height - padding + 24}
                textAnchor="middle"
                className="text-xs fill-gray-500 dark:fill-gray-400"
                fontSize="10"
              >
                {chartData[dataIndex].dateLabel}
              </text>
            );
          })}

          {/* Data points */}
          {points.map((point, i) => (
            <circle
              key={i}
              cx={point.x}
              cy={point.y}
              r={hoveredPoint === i ? "6" : "4"}
              fill="rgb(147, 51, 234)"
              stroke="white"
              strokeWidth="2"
              className="cursor-pointer transition-all duration-200 drop-shadow-sm"
              onMouseEnter={() => setHoveredPoint(i)}
              onMouseLeave={() => setHoveredPoint(null)}
            />
          ))}

          {/* Tooltip */}
          {hoveredPoint !== null && (
            <g>
              <rect
                x={points[hoveredPoint].x - 35}
                y={points[hoveredPoint].y - 45}
                width="70"
                height="35"
                rx="6"
                fill="rgb(31, 41, 55)"
                opacity="0.9"
              />
              <text
                x={points[hoveredPoint].x}
                y={points[hoveredPoint].y - 30}
                textAnchor="middle"
                className="text-xs fill-white font-medium"
              >
                {chartData[hoveredPoint].total} người
              </text>
              <text
                x={points[hoveredPoint].x}
                y={points[hoveredPoint].y - 18}
                textAnchor="middle"
                className="text-xs fill-gray-300"
              >
                {chartData[hoveredPoint].dateLabel}
              </text>
            </g>
          )}
        </svg>
      </div>
    );
  }, [chartData, maxValue, containerWidth, responsiveDimensions, hoveredPoint, getVisibleLabelIndices]);

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden ${className}`}>
      {/* Header Section */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Icon */}
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            
            {/* Title */}
            <div>
              <h3 
                id="users-chart-title"
                className="text-lg font-semibold text-gray-900 dark:text-gray-100"
              >
                Người dùng mới
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Thống kê người dùng đăng ký trong {getTimeRangeLabel(timeRange)}
              </p>
            </div>
          </div>

          {/* Time Range Selector */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
              aria-haspopup="true"
              aria-expanded={isDropdownOpen}
            >
              {getTimeRangeLabel(timeRange)}
              <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            <AnimatePresence>
              {isDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-700 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 z-50"
                >
                  <div className="py-1">
                    {timeRangeOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setTimeRange(option.value);
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors ${
                          timeRange === option.value
                            ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'
                            : 'text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        <div className="font-medium">{option.label}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{option.description}</div>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div
        ref={chartContainerRef}
        className="bg-white dark:bg-gray-800 rounded-b-lg border border-purple-100 dark:border-purple-800/30 border-t-0 p-2 w-full"
      >
        {/* Chart */}
        <div
          className="mb-4 w-full"
          role="img"
          aria-labelledby="users-chart-title"
          aria-describedby="users-chart-description"
        >
          <div id="users-chart-description" className="sr-only">
            Biểu đồ đường thể hiện số lượng người dùng mới trong {getTimeRangeLabel(timeRange)}.
            {!isLoading && data && `Tổng cộng có ${data.totalNewUsers || 0} người dùng mới.`}
          </div>
          {isLoading ? (
            <LoadingSkeleton />
          ) : (
            <LineChart />
          )}
        </div>

        {/* Optimized Stats Summary - Single Row */}
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
          {isLoading ? (
            <div className="flex items-center justify-between animate-pulse">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gray-200/70 dark:bg-gray-600/70 rounded-full"></div>
                  <div>
                    <div className="h-5 bg-gray-200/70 dark:bg-gray-600/70 rounded w-14 mb-2"></div>
                    <div className="h-3 bg-gray-200/50 dark:bg-gray-600/50 rounded w-20"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-between">
              {/* Tổng người dùng mới */}
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                </div>
                <div>
                  <div className="text-xl font-bold text-gray-900 dark:text-white">
                    {data?.totalNewUsers || 0}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Tổng người dùng mới
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="h-10 w-px bg-gray-300 dark:bg-gray-600"></div>

              {/* Đã đăng ký */}
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <div className="text-xl font-bold text-gray-900 dark:text-white">
                    {data?.dailyData?.reduce((sum, day) => sum + day.registeredUsers, 0) || 0}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Đã đăng ký
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="h-10 w-px bg-gray-300 dark:bg-gray-600"></div>

              {/* Chưa đăng ký (Anonymous) */}
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <div className="text-xl font-bold text-gray-900 dark:text-white">
                    {data?.dailyData?.reduce((sum, day) => sum + day.anonymousUsers, 0) || 0}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Chưa đăng ký
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="h-10 w-px bg-gray-300 dark:bg-gray-600"></div>

              {/* Trung bình/ngày */}
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <div className="text-xl font-bold text-gray-900 dark:text-white">
                    {Math.round((data?.totalNewUsers || 0) / (timeRange === '7d' ? 7 : timeRange === '1m' ? 30 : 90))}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Trung bình/ngày
                  </div>
                </div>
              </div>

              {/* Growth Badge */}
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1 px-3 py-1.5 bg-green-100 dark:bg-green-900/30 rounded-full border border-green-200 dark:border-green-800">
                  <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  <span className="text-sm font-medium text-green-600 dark:text-green-400">
                    {getTimeRangeLabel(timeRange)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Error State */}
        {error && (
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm text-red-700 dark:text-red-400">{error}</span>
              <button
                onClick={() => loadUsersData(true)}
                className="ml-auto text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 font-medium"
              >
                Thử lại
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
