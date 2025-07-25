import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { AdminService } from '../../../../backend';
import type { DailyTestStats, TestTimeRange } from '../../../../backend';

interface Props {
  className?: string;
  defaultTimeRange?: TestTimeRange;
}

export default function ResultsTestChart({ className = '', defaultTimeRange = '1m' }: Props) {
  const [data, setData] = useState<DailyTestStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);
  const [timeRange, setTimeRange] = useState<TestTimeRange>(defaultTimeRange);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Time range options
  const getTimeRangeOptions = () => [
    { value: '7d' as TestTimeRange, label: '7 ngày' },
    { value: '1m' as TestTimeRange, label: '1 tháng' },
    { value: '3m' as TestTimeRange, label: '3 tháng' },
    { value: '6m' as TestTimeRange, label: '6 tháng' }
  ];

  const getTimeRangeLabel = (range: TestTimeRange) => {
    const option = getTimeRangeOptions().find(opt => opt.value === range);
    return option?.label || '1 tháng';
  };

  const getChartTitle = (range: TestTimeRange) => {
    switch (range) {
      case '7d': return 'Lượt test (7 ngày qua)';
      case '1m': return 'Lượt test (1 tháng qua)';
      case '3m': return 'Lượt test (3 tháng qua)';
      case '6m': return 'Lượt test (6 tháng qua)';
      default: return 'Lượt test (1 tháng qua)';
    }
  };

  // Helper function for smart label sampling - responsive
  const getVisibleLabelIndices = (dataLength: number, timeRange: TestTimeRange, screenWidth: number) => {
    if (dataLength <= 7) return Array.from({ length: dataLength }, (_, i) => i);

    const isMobile = screenWidth < 640;
    const isTablet = screenWidth >= 640 && screenWidth < 1024;

    let skipFactor = 3; // Default for desktop

    if (isMobile) {
      skipFactor = timeRange === '7d' ? 1 : timeRange === '1m' ? 5 : timeRange === '3m' ? 10 : 15;
    } else if (isTablet) {
      skipFactor = timeRange === '7d' ? 1 : timeRange === '1m' ? 4 : timeRange === '3m' ? 8 : 12;
    } else {
      skipFactor = timeRange === '7d' ? 1 : timeRange === '1m' ? 3 : timeRange === '3m' ? 7 : 14;
    }

    return Array.from({ length: dataLength }, (_, i) => i).filter((_, i) => i % skipFactor === 0 || i === dataLength - 1);
  };

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    // Set loading immediately when timeRange changes to prevent flash
    setIsLoading(true);
    setData(null); // Clear old data immediately to prevent flash
    loadDailyTestData();
  }, [timeRange]);

  const loadDailyTestData = useCallback(async (forceRefresh = false, retryAttempt = 0) => {
    const maxRetries = 3;
    const retryDelay = 1000 * (retryAttempt + 1);

    try {
      setIsLoading(true);
      setError('');

      if (forceRefresh) {
        AdminService.clearDailyTestStatsCache(timeRange);
      }

      const { data: dailyData, error: dailyError } = await AdminService.getDailyTestStats(timeRange);
      
      if (dailyError) {
        console.error('ResultsTestChart: Error loading data:', dailyError);
        
        if (retryAttempt < maxRetries && (
          dailyError.message?.includes('network') || 
          dailyError.message?.includes('timeout') ||
          dailyError.code === 'PGRST301'
        )) {
          console.log(`ResultsTestChart: Retrying in ${retryDelay}ms (attempt ${retryAttempt + 1}/${maxRetries})`);
          setTimeout(() => {
            loadDailyTestData(forceRefresh, retryAttempt + 1);
          }, retryDelay);
          return;
        }
        
        setError('Không thể tải dữ liệu thống kê ngày');
        return;
      }
      
      if (dailyData) {
        console.log('ResultsTestChart: Data loaded successfully', dailyData);
        setData(dailyData);
      }
    } catch (err) {
      console.error('ResultsTestChart: Exception loading data:', err);
      setError('Có lỗi xảy ra khi tải dữ liệu');
    } finally {
      setIsLoading(false);
    }
  }, [timeRange]);

  // Chart calculations
  const chartData = useMemo(() => {
    if (!data?.dailyData) return [];
    return data.dailyData;
  }, [data]);

  const maxValue = useMemo(() => {
    if (!chartData.length) return 10;
    const max = Math.max(...chartData.map(d => d.testCount));
    return Math.max(max, 1);
  }, [chartData]);

  // State for responsive recalculation
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);
  const [containerWidth, setContainerWidth] = useState(1200);
  const chartContainerRef = useRef<HTMLDivElement>(null);

  // Handle window resize and container size changes
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateDimensions = () => {
      setWindowWidth(window.innerWidth);

      if (chartContainerRef.current) {
        const rect = chartContainerRef.current.getBoundingClientRect();
        setContainerWidth(rect.width);
      }
    };

    const timer = setTimeout(updateDimensions, 100);

    let resizeTimer: NodeJS.Timeout;
    const debouncedResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(updateDimensions, 150);
    };

    window.addEventListener('resize', debouncedResize);

    let resizeObserver: ResizeObserver | null = null;

    if (chartContainerRef.current && 'ResizeObserver' in window) {
      resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          setContainerWidth(entry.contentRect.width);
        }
      });
      resizeObserver.observe(chartContainerRef.current);
    }

    return () => {
      clearTimeout(timer);
      clearTimeout(resizeTimer);
      window.removeEventListener('resize', debouncedResize);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, []);

  // Calculate visible label indices for smart sampling
  const visibleLabelIndices = useMemo(() => {
    return getVisibleLabelIndices(chartData.length, timeRange, windowWidth);
  }, [chartData.length, timeRange, windowWidth]);

  // Responsive dimensions
  const responsiveDimensions = useMemo(() => {
    const isMobile = windowWidth < 640;
    const isTablet = windowWidth >= 640 && windowWidth < 1024;

    return {
      height: isMobile ? 280 : isTablet ? 320 : 360,
      padding: isMobile ? 35 : 40,
      fontSize: {
        axis: isMobile ? 10 : 11,
        tooltip: isMobile ? 11 : 12,
        tooltipSub: isMobile ? 9 : 10
      },
      pointRadius: isMobile ? 3 : 4,
      pointRadiusHover: isMobile ? 5 : 6,
      strokeWidth: isMobile ? 2.5 : 3
    };
  }, [windowWidth]);

  // Loading Skeleton Component - Fast, smooth, lightweight
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
                  key={i} 
                  className="absolute h-full border-l border-gray-300 dark:border-gray-600"
                  style={{ left: `${(i + 1) * 16.66}%` }}
                />
              ))}
            </div>
          </div>

          {/* Professional loading indicator with smooth animation */}
          <div className="flex items-center space-x-3 bg-white/95 dark:bg-gray-800/95 rounded-lg px-5 py-3 shadow-sm border border-gray-200/50 dark:border-gray-700/50">
            {/* Elegant spinner */}
            <div className="relative w-4 h-4">
              <div className="absolute inset-0 border-2 border-blue-200 dark:border-blue-800 rounded-full"></div>
              <div className="absolute inset-0 border-2 border-transparent border-t-blue-500 rounded-full animate-spin"></div>
            </div>

            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Đang tải dữ liệu...
            </span>
          </div>
        </div>
      </div>
    );
  }, [responsiveDimensions.height]);

  // SVG Line Chart Component - Optimized for Results page
  const LineChart = useCallback(() => {
    if (!chartData.length) {
      return (
        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 flex items-center justify-center"
             style={{ height: responsiveDimensions.height }}>
          <div className="text-center">
            <svg className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Chưa có dữ liệu test</p>
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

    // Calculate points for the line
    const points = chartData.map((d, i) => {
      const x = padding + (i * (chartWidth / (chartData.length - 1)));
      const y = padding + chartHeight - ((d.testCount / maxValue) * chartHeight);
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
              <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.1" />
            </linearGradient>
          </defs>

          {/* Main line */}
          <path
            d={pathData}
            fill="none"
            stroke="#3B82F6"
            strokeWidth={responsiveDimensions.strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="drop-shadow-sm"
          />

          {/* Data points */}
          {points.map((point, i) => {
            // Smart tooltip positioning to avoid overflow
            const tooltipWidth = 70;
            const tooltipHeight = 30;
            const tooltipX = Math.max(
              tooltipWidth / 2,
              Math.min(point.x, width - tooltipWidth / 2)
            ) - tooltipWidth / 2;
            const tooltipY = point.y > tooltipHeight + 10 ? point.y - 45 : point.y + 20;

            return (
              <g key={i}>
                {/* Point circle */}
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={hoveredPoint === i ? responsiveDimensions.pointRadiusHover : responsiveDimensions.pointRadius}
                  fill="#3B82F6"
                  stroke="white"
                  strokeWidth="2"
                  className="cursor-pointer transition-all duration-200 drop-shadow-sm"
                  onMouseEnter={() => setHoveredPoint(i)}
                  onMouseLeave={() => setHoveredPoint(null)}
                />

                {/* Hover tooltip */}
                {hoveredPoint === i && (
                  <g>
                    {/* Tooltip background */}
                    <rect
                      x={tooltipX}
                      y={tooltipY}
                      width={tooltipWidth}
                      height={tooltipHeight}
                      fill="rgba(0, 0, 0, 0.8)"
                      rx="4"
                      className="drop-shadow-lg"
                    />
                    {/* Tooltip text */}
                    <text
                      x={tooltipX + tooltipWidth / 2}
                      y={tooltipY + 15}
                      textAnchor="middle"
                      fontSize={responsiveDimensions.fontSize.tooltip}
                      fill="white"
                      className="font-medium"
                    >
                      {point.data.testCount} tests
                    </text>
                    <text
                      x={tooltipX + tooltipWidth / 2}
                      y={tooltipY + 25}
                      textAnchor="middle"
                      fontSize={responsiveDimensions.fontSize.tooltipSub}
                      fill="white"
                      opacity="0.8"
                    >
                      {point.data.dateLabel}
                    </text>
                  </g>
                )}

                {/* Date label - Smart sampling for readability */}
                {visibleLabelIndices.includes(i) && (
                  <text
                    x={point.x}
                    y={height - 10}
                    textAnchor="middle"
                    fontSize={responsiveDimensions.fontSize.axis}
                    fill="currentColor"
                    className="text-gray-600 dark:text-gray-400"
                    pointerEvents="none"
                  >
                    {point.data.dateLabel}
                  </text>
                )}
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
                fontSize={responsiveDimensions.fontSize.axis}
                fill="currentColor"
                className="text-gray-600 dark:text-gray-400"
              >
                {value.toLocaleString()}
              </text>
            );
          })}
        </svg>
      </div>
    );
  }, [chartData, maxValue, hoveredPoint, visibleLabelIndices, timeRange, containerWidth, responsiveDimensions]);

  // Error state
  if (error) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 ${className}`}>
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 text-red-500">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-200 mb-2">Lỗi tải dữ liệu</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <button
            onClick={() => loadDailyTestData(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full ${className}`}>
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-50/50 via-indigo-50/30 to-purple-50/50 dark:from-blue-950/20 dark:via-indigo-950/10 dark:to-purple-950/20 rounded-t-lg p-3 sm:p-4 border border-blue-100 dark:border-blue-800/30 border-b-0 w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
          <div className="flex items-center space-x-3 sm:space-x-4">
            {/* Modern Chart Icon */}
            <div className="relative w-10 h-10 sm:w-12 sm:h-12">
              {/* Background with modern gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 rounded-xl shadow-lg"></div>

              {/* Subtle inner glow */}
              <div className="absolute inset-0.5 bg-gradient-to-br from-blue-400/20 to-transparent rounded-xl"></div>

              {/* Chart icon with modern design */}
              <div className="absolute inset-0 flex items-center justify-center">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white drop-shadow-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>

              {/* Subtle highlight */}
              <div className="absolute top-1 left-1 w-2 h-2 bg-white/30 rounded-full blur-sm"></div>
            </div>

            {/* Title and Description */}
            <div>
              <h3
                id="results-test-chart-title"
                className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-200"
              >
                {getChartTitle(timeRange)}
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 hidden sm:block">
                Phân tích xu hướng và tăng trưởng số lượt test
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Time Range Selector */}
            <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-2 text-xs sm:text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600"
            >
              <span className="text-gray-700 dark:text-gray-300">{getTimeRangeLabel(timeRange)}</span>
              <svg className={`w-3 h-3 sm:w-4 sm:h-4 text-gray-500 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-40 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-10 transition-all duration-200">
                {getTimeRangeOptions().map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setTimeRange(option.value);
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-600 first:rounded-t-lg last:rounded-b-lg ${
                      timeRange === option.value
                        ? 'bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
                        : 'text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>

            <button
              onClick={() => loadDailyTestData(true)}
              disabled={isLoading}
              className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg disabled:opacity-50"
              title="Làm mới dữ liệu"
            >
              <svg className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span className="hidden sm:inline">{isLoading ? 'Đang tải...' : 'Làm mới'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div
        ref={chartContainerRef}
        className="bg-white dark:bg-gray-800 rounded-b-lg border border-blue-100 dark:border-blue-800/30 border-t-0 p-2 w-full"
      >
        {/* Chart */}
        <div
          className="mb-4 w-full"
          role="img"
          aria-labelledby="results-test-chart-title"
          aria-describedby="results-chart-description"
        >
          <div id="results-chart-description" className="sr-only">
            Biểu đồ đường thể hiện số lượt làm bài test trong {getTimeRangeLabel(timeRange)}.
            {!isLoading && data && `Tổng cộng có ${data.totalTests || 0} lượt test được thực hiện.`}
          </div>
          {isLoading ? (
            <LoadingSkeleton />
          ) : (
            <LineChart />
          )}
        </div>

        {/* Summary Stats */}
        <div
          className="grid grid-cols-2 gap-3 sm:gap-4 mt-4 pt-3 border-t border-gray-200 dark:border-gray-700"
          role="region"
          aria-label="Tóm tắt thống kê test"
        >
          {isLoading ? (
            <>
              {/* Clean loading skeleton for stats - exact same dimensions */}
              <div className="text-center p-2 sm:p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                <div className="h-6 sm:h-7 lg:h-8 bg-blue-200/50 dark:bg-blue-700/50 rounded-md mb-2"></div>
                <div className="h-3 sm:h-4 bg-gray-200/50 dark:bg-gray-600/50 rounded w-16 mx-auto"></div>
              </div>
              <div className="text-center p-2 sm:p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
                <div className="h-6 sm:h-7 lg:h-8 bg-green-200/50 dark:bg-green-700/50 rounded-md mb-2"></div>
                <div className="h-3 sm:h-4 bg-gray-200/50 dark:bg-gray-600/50 rounded w-16 mx-auto"></div>
              </div>
            </>
          ) : (
            <>
              <div
                className="text-center p-2 sm:p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20"
                role="group"
                aria-label={`Tổng số test: ${data?.totalTests || 0}`}
              >
                <div
                  className="text-base sm:text-lg lg:text-2xl font-bold text-blue-600 dark:text-blue-400"
                  aria-label={`${data?.totalTests || 0} lượt test tổng cộng`}
                >
                  {data?.totalTests || 0}
                </div>
                <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Tổng test</div>
              </div>
              <div
                className="text-center p-2 sm:p-3 rounded-lg bg-green-50 dark:bg-green-900/20"
                role="group"
                aria-label={`Trung bình mỗi ngày: ${data?.averagePerDay || 0}`}
              >
                <div
                  className="text-base sm:text-lg lg:text-2xl font-bold text-green-600 dark:text-green-400"
                  aria-label={`${data?.averagePerDay || 0} test trung bình mỗi ngày`}
                >
                  {data?.averagePerDay || 0}
                </div>
                <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">TB/ngày</div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
