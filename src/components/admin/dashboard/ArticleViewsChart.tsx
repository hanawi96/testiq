import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ViewTrackingService } from '../../../../backend/utils/view-tracking-service';

interface DailyViews {
  date: string;
  views: number;
  dateLabel: string;
}

interface TopArticle {
  title: string;
  views: number;
  slug: string;
}

interface ViewsAnalytics {
  dailyViews: DailyViews[];
  topArticles: TopArticle[];
  summary: {
    totalViews: number;
    averageViews: number;
    growthRate: number;
    articlesCount: number;
  };
}

interface ArticleViewsChartProps {
  className?: string;
}

type TimeRange = '7d' | '1m' | '3m' | '6m';

const TIME_RANGE_OPTIONS = [
  { value: '7d', label: '7 ngày' },
  { value: '1m', label: '1 tháng' },
  { value: '3m', label: '3 tháng' },
  { value: '6m', label: '6 tháng' }
] as const;

// Smart aggregation configuration
function getAggregationConfig(timeRange: TimeRange) {
  switch (timeRange) {
    case '7d':
      return { groupSize: 1, maxPoints: 7, aggregateByWeek: false }; // Daily
    case '1m':
      return { groupSize: 1, maxPoints: 30, aggregateByWeek: false }; // Daily
    case '3m':
      return { groupSize: 1, maxPoints: 12, aggregateByWeek: true }; // Weekly
    case '6m':
      return { groupSize: 1, maxPoints: 24, aggregateByWeek: true }; // Weekly
    default:
      return { groupSize: 1, maxPoints: 7, aggregateByWeek: false };
  }
}

// Aggregate views data intelligently
function aggregateViewsData(
  rawData: any[],
  totalDays: number,
  config: { groupSize: number; maxPoints: number; aggregateByWeek: boolean },
  timeRange: TimeRange
) {
  // Helper function to format date
  const formatDate = (date: Date) => date.toISOString().split('T')[0];

  // Calculate date range
  const endDate = new Date();
  const startDate = new Date(endDate);
  startDate.setDate(endDate.getDate() - totalDays + 1);

  if (config.aggregateByWeek) {
    // Weekly aggregation for 3m and 6m
    const weeklyData: Map<string, { views: number; startDate: Date; endDate: Date }> = new Map();

    // First, create all weeks in the time range
    const currentWeekStart = new Date(startDate);
    // Get Monday of the start week
    const dayOfWeek = currentWeekStart.getDay();
    const diff = currentWeekStart.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    currentWeekStart.setDate(diff);
    currentWeekStart.setHours(0, 0, 0, 0);

    // Generate all weeks in the range
    while (currentWeekStart <= endDate) {
      const weekKey = formatDate(currentWeekStart);
      const sunday = new Date(currentWeekStart);
      sunday.setDate(currentWeekStart.getDate() + 6);

      weeklyData.set(weekKey, {
        views: 0,
        startDate: new Date(currentWeekStart),
        endDate: sunday
      });

      // Move to next week
      currentWeekStart.setDate(currentWeekStart.getDate() + 7);
    }

    // Then, map raw data to weeks
    rawData.forEach(item => {
      const itemDate = new Date(item.date);

      // Get Monday of the week (ISO week)
      const monday = new Date(itemDate);
      const dayOfWeek = monday.getDay();
      const diff = monday.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
      monday.setDate(diff);
      monday.setHours(0, 0, 0, 0);

      const weekKey = formatDate(monday);

      // Add views to existing week if it exists in our range
      if (weeklyData.has(weekKey)) {
        weeklyData.get(weekKey)!.views += item.views || 0;
      }
    });

    // Convert to array and sort
    const sortedWeeks = Array.from(weeklyData.entries())
      .sort(([a], [b]) => a.localeCompare(b));

    return sortedWeeks.map(([weekStart, weekData]) => {
      const startDateObj = weekData.startDate;
      const endDateObj = weekData.endDate;

      // Format week label
      const dateLabel = `${startDateObj.getDate()}/${startDateObj.getMonth() + 1} - ${endDateObj.getDate()}/${endDateObj.getMonth() + 1}`;

      return {
        date: weekStart,
        dateLabel,
        views: weekData.views
      };
    });
  } else {
    // Daily aggregation for 7d and 1m
    const dailyData = [];
    for (let i = 0; i < totalDays; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      const dateStr = formatDate(currentDate);

      // Format date label based on time range
      let dateLabel: string;
      if (timeRange === '7d') {
        dateLabel = currentDate.toLocaleDateString('vi-VN', {
          weekday: 'short',
          day: 'numeric',
          month: 'numeric'
        });
      } else {
        dateLabel = currentDate.toLocaleDateString('vi-VN', {
          day: 'numeric',
          month: 'numeric'
        });
      }

      // Find views for this day
      const existingData = rawData.find(d => d.date === dateStr);
      const views = existingData ? existingData.views : 0;

      dailyData.push({
        date: dateStr,
        dateLabel,
        views
      });
    }

    return dailyData;
  }
}

export default function ArticleViewsChart({ className = '' }: ArticleViewsChartProps) {
  const [data, setData] = useState<ViewsAnalytics | null>(null);
  const [isChartLoading, setIsChartLoading] = useState(true);
  const [chartError, setChartError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>('7d');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isDropdownOpen]);

  // Helper functions for dropdowns
  const getTimeRangeLabel = (range: TimeRange) => {
    const option = TIME_RANGE_OPTIONS.find(opt => opt.value === range);
    return option?.label || '7 ngày';
  };



  // Fetch analytics data
  const fetchAnalytics = useCallback(async (timeRange: TimeRange) => {
    try {
      setIsChartLoading(true);
      setChartError(null);

      // Convert time range to days for backend
      const days = timeRange === '7d' ? 7 : timeRange === '1m' ? 30 : timeRange === '3m' ? 90 : 180;

      // Get real analytics data from ViewTrackingService
      const { data: analyticsData, error: analyticsError } = await ViewTrackingService.getArticleViewsAnalytics(days);

      if (analyticsError || !analyticsData) {
        throw new Error('Không thể tải dữ liệu thống kê');
      }

      // Smart aggregation based on time range
      const aggregationConfig = getAggregationConfig(timeRange);
      const dailyViewsData = aggregateViewsData(analyticsData.dailyViews, days, aggregationConfig, timeRange);

      // Process top articles
      const topArticles: TopArticle[] = analyticsData.topArticles.map(article => ({
        title: article.title.length > 30 ? article.title.substring(0, 30) + '...' : article.title,
        views: article.views,
        slug: article.slug
      }));

      // Calculate real statistics
      const totalViews = analyticsData.totalViews;
      const articlesCount = analyticsData.topArticles.length;
      const averageViews = articlesCount > 0 ? Math.round(totalViews / articlesCount) : 0;
      const growthRate = analyticsData.growthRate;



      setData({
        dailyViews: dailyViewsData,
        topArticles,
        summary: {
          totalViews,
          averageViews,
          growthRate,
          articlesCount
        }
      });

    } catch (err) {
      console.error('Error fetching article analytics:', err);
      setChartError(err instanceof Error ? err.message : 'Có lỗi xảy ra');
    } finally {
      setIsChartLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics(timeRange);
  }, [timeRange, fetchAnalytics]);

  const handleTimeRangeChange = (newTimeRange: TimeRange) => {
    setTimeRange(newTimeRange);
  };

  // State for responsive recalculation
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);

  // Handle window resize for responsive label calculation
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Calculate visible label indices for smart sampling
  const visibleLabelIndices = useMemo(() => {
    if (!data?.dailyViews.length) return [];

    // Use same logic as DailyArticleLikesChart
    const dataLength = data.dailyViews.length;
    const timeRangeForSampling = timeRange;

    if (dataLength === 0) return [];

    // For 7 days, show all labels (current behavior is fine)
    if (timeRangeForSampling === '7d') {
      return Array.from({ length: dataLength }, (_, i) => i);
    }

    // Target optimal label count based on time range and screen size
    let targetLabels: number;
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;

    switch (timeRangeForSampling) {
      case '1m':
        targetLabels = isMobile ? 4 : 6;
        break;
      case '3m':
        targetLabels = isMobile ? 5 : 7;
        break;
      case '6m':
        targetLabels = isMobile ? 5 : 8;
        break;
      default:
        targetLabels = isMobile ? 5 : 7;
        break;
    }

    // Always include first and last indices
    const visibleIndices = new Set<number>();
    visibleIndices.add(0); // First
    if (dataLength > 1) {
      visibleIndices.add(dataLength - 1); // Last
    }

    // If we have very few data points, show all
    if (dataLength <= targetLabels) {
      for (let i = 0; i < dataLength; i++) {
        visibleIndices.add(i);
      }
    } else {
      // Calculate evenly distributed intermediate points
      const intermediateCount = targetLabels - 2; // Subtract first and last

      if (intermediateCount > 0) {
        const step = (dataLength - 1) / (intermediateCount + 1);

        for (let i = 1; i <= intermediateCount; i++) {
          const index = Math.round(step * i);
          // Ensure we don't duplicate first or last and stay within bounds
          if (index > 0 && index < dataLength - 1) {
            visibleIndices.add(index);
          }
        }
      }
    }

    return Array.from(visibleIndices).sort((a, b) => a - b);
  }, [data?.dailyViews.length, timeRange, windowWidth]);

  // SVG Line Chart Component
  const LineChart = useCallback(() => {
    if (!data?.dailyViews.length) {
      return (
        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 flex items-center justify-center h-60 lg:h-72 xl:h-80 2xl:h-96">
          <div className="text-center">
            <svg className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Chưa có dữ liệu lượt xem</p>
          </div>
        </div>
      );
    }

    const chartData = data.dailyViews;

    // Dashboard responsive chart dimensions - optimized for 2-column grid
    const containerWidth = windowWidth > 1280 ? (windowWidth - 400) / 2 - 20 : // XL screens: half width minus gap
                           windowWidth > 1024 ? (windowWidth - 350) / 2 - 20 : // LG screens: half width minus gap
                           windowWidth > 768 ? windowWidth - 100 :  // MD screens: full width
                           windowWidth - 60; // SM screens: full width

    const width = Math.max(400, Math.min(containerWidth, 800)); // Cap at 800px for dashboard
    const baseHeight = 260;
    const height = baseHeight;
    const padding = 45;
    const chartWidth = width - (padding * 2);
    const chartHeight = height - (padding * 2);

    const maxValue = Math.max(...chartData.map(d => d.views)) || 1;

    // Calculate points for the line
    const points = chartData.map((d, i) => {
      const x = padding + (i * (chartWidth / (chartData.length - 1)));
      const y = padding + chartHeight - ((d.views / maxValue) * chartHeight);
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
      <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 w-full">
        <svg
          width="100%"
          height="260"
          viewBox={`0 0 ${width} ${height}`}
          className="overflow-visible h-60 lg:h-72 xl:h-80 2xl:h-96 w-full"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Gradient definition */}
          <defs>
            <linearGradient id="viewsGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.05" />
            </linearGradient>
          </defs>

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
            fill="url(#viewsGradient)"
          />

          {/* Main line */}
          <path
            d={pathData}
            fill="none"
            stroke="#3B82F6"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data points with tooltips */}
          {points.map((point, i) => (
            <g key={i}>
              {/* Point circle */}
              <circle
                cx={point.x}
                cy={point.y}
                r={hoveredPoint === i ? "6" : "4"}
                fill="#3B82F6"
                stroke="white"
                strokeWidth="2"
                className="cursor-pointer transition-all duration-200 drop-shadow-sm"
                onMouseEnter={() => setHoveredPoint(i)}
                onMouseLeave={() => setHoveredPoint(null)}
              />

              {/* Value label on hover */}
              {hoveredPoint === i && (
                <g>
                  {/* Tooltip background */}
                  <rect
                    x={point.x - 30}
                    y={point.y - 40}
                    width="60"
                    height="30"
                    fill="rgba(0, 0, 0, 0.9)"
                    rx="6"
                  />
                  {/* Tooltip text - count */}
                  <text
                    x={point.x}
                    y={point.y - 28}
                    textAnchor="middle"
                    fontSize="12"
                    fill="white"
                    fontWeight="bold"
                  >
                    {point.data.views}
                  </text>
                  {/* Tooltip text - date */}
                  <text
                    x={point.x}
                    y={point.y - 16}
                    textAnchor="middle"
                    fontSize="9"
                    fill="rgba(255, 255, 255, 0.8)"
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
                  fontSize={timeRange === '1m' || timeRange === '3m' || timeRange === '6m' ? "11" : "10"}
                  fill="currentColor"
                  className="text-gray-600 dark:text-gray-400"
                  pointerEvents="none"
                >
                  {point.data.dateLabel}
                </text>
              )}
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
                fontSize="12"
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
  }, [data, timeRange, windowWidth, hoveredPoint, visibleLabelIndices]);



  // Remove global loading state - use individual loading states for each section

  // Simple loading skeleton
  if (isChartLoading) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 ${className}`}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-2 animate-pulse"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-64 animate-pulse"></div>
          </div>
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse"></div>
        </div>
        <div className="h-60 lg:h-72 xl:h-80 2xl:h-96 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-4"></div>
        <div className="grid grid-cols-2 gap-2 sm:gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          {[1, 2].map(i => (
            <div key={i} className="text-center p-2 sm:p-3">
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-12 mx-auto mb-2 animate-pulse"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16 mx-auto animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (chartError) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 ${className}`}>
        <div className="text-center">
          <div className="text-red-500 dark:text-red-400 mb-2">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Lỗi tải dữ liệu</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{chartError}</p>
          <button
            onClick={() => fetchAnalytics(timeRange)}
            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg"
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
      <div className="bg-gradient-to-r from-green-50/50 via-emerald-50/30 to-teal-50/50 dark:from-green-950/20 dark:via-emerald-950/10 dark:to-teal-950/20 rounded-t-lg p-4 border border-green-100 dark:border-green-800/30 border-b-0 w-full">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Icon */}
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center shadow-sm">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>

            {/* Title and Description */}
            <div className="flex-1">
              <h3
                id="article-views-chart-title"
                className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1"
              >
                Xu hướng lượt xem
                {(timeRange === '3m' || timeRange === '6m') && (
                  <span className="text-sm text-gray-500 ml-2 font-normal">
                    (theo tuần)
                  </span>
                )}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {timeRange === '3m' || timeRange === '6m'
                  ? 'Thống kê lượt xem bài viết theo tuần'
                  : 'Thống kê lượt xem bài viết theo ngày'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
          {/* Time Range Filter */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              disabled={isChartLoading}
              className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg disabled:opacity-50"
              title="Chọn khoảng thời gian"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="hidden sm:inline">{getTimeRangeLabel(timeRange)}</span>
              <svg className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            <AnimatePresence>
              {isDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 mt-2 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50"
                >
                  {TIME_RANGE_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        handleTimeRangeChange(option.value);
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700/30 first:rounded-t-lg last:rounded-b-lg ${
                        timeRange === option.value
                          ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20'
                          : 'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button
            onClick={() => fetchAnalytics(timeRange)}
            disabled={isChartLoading}
            className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg disabled:opacity-50"
            title="Làm mới dữ liệu"
          >
            <svg className={`w-4 h-4 ${isChartLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span className="hidden sm:inline">{isChartLoading ? 'Đang tải...' : 'Làm mới'}</span>
          </button>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="bg-white dark:bg-gray-800 rounded-b-lg border border-green-100 dark:border-green-800/30 border-t-0 p-4 w-full">
        {/* Chart */}
        <div
          className="mb-4 w-full"
          role="img"
          aria-labelledby="article-views-chart-title"
          aria-describedby="article-views-chart-description"
        >
        <div id="article-views-chart-description" className="sr-only">
          Biểu đồ đường thể hiện lượt xem bài viết trong {getTimeRangeLabel(timeRange)} gần nhất.
          Tổng cộng có {data?.dailyViews.reduce((sum, day) => sum + day.views, 0) || 0} lượt xem được ghi nhận.
        </div>
        <LineChart />
      </div>

      {/* Summary Stats */}
      <div
        className="grid grid-cols-2 gap-2 sm:gap-4 mt-4 pt-3 border-t border-gray-200 dark:border-gray-700"
        role="region"
        aria-label="Tóm tắt thống kê lượt xem"
      >
        <div
          className="text-center p-2 sm:p-3 rounded-lg bg-green-50 dark:bg-green-900/20"
          role="group"
          aria-label={`Tổng số lượt xem: ${data?.dailyViews.reduce((sum, day) => sum + day.views, 0) || 0}`}
        >
          <div
            className="text-lg sm:text-2xl font-bold text-green-600 dark:text-green-400"
            aria-label={`${data?.dailyViews.reduce((sum, day) => sum + day.views, 0) || 0} lượt xem tổng cộng`}
          >
            {data?.dailyViews.reduce((sum, day) => sum + day.views, 0).toLocaleString() || 0}
          </div>
          <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Tổng xem</div>
        </div>
        <div
          className="text-center p-2 sm:p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20"
          role="group"
          aria-label={`Trung bình mỗi ngày: ${data ? Math.round((data.dailyViews.reduce((sum, day) => sum + day.views, 0)) / data.dailyViews.length) : 0}`}
        >
          <div
            className="text-lg sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400"
            aria-label={`${data ? Math.round((data.dailyViews.reduce((sum, day) => sum + day.views, 0)) / data.dailyViews.length) : 0} lượt xem trung bình mỗi ngày`}
          >
            {data ? Math.round((data.dailyViews.reduce((sum, day) => sum + day.views, 0)) / data.dailyViews.length) : 0}
          </div>
          <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
            {timeRange === '3m' || timeRange === '6m' ? 'TB/tuần' : 'TB/ngày'}
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
