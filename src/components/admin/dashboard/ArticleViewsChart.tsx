import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArticlesService } from '../../../../backend';
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

type TimeRange = 7 | 14 | 30 | 60 | 90;
type TopArticlesTimeRange = 1 | 7 | 14 | 30;

const TIME_RANGE_OPTIONS = [
  { value: 7, label: '7 ngày' },
  { value: 14, label: '14 ngày' },
  { value: 30, label: '30 ngày' },
  { value: 60, label: '60 ngày' },
  { value: 90, label: '90 ngày' }
] as const;

const TOP_ARTICLES_TIME_RANGE_OPTIONS = [
  { value: 1, label: '1 ngày' },
  { value: 7, label: '7 ngày' },
  { value: 14, label: '14 ngày' },
  { value: 30, label: '30 ngày' }
] as const;

// Smart aggregation configuration
function getAggregationConfig(days: TimeRange) {
  switch (days) {
    case 7:
    case 14:
      return { groupSize: 1, maxPoints: days }; // Daily
    case 30:
      return { groupSize: 2, maxPoints: 15 }; // 2-day groups
    case 60:
      return { groupSize: 3, maxPoints: 20 }; // 3-day groups
    case 90:
      return { groupSize: 5, maxPoints: 18 }; // 5-day groups
    default:
      return { groupSize: 1, maxPoints: days };
  }
}

// Aggregate views data intelligently
function aggregateViewsData(
  rawData: any[],
  totalDays: number,
  config: { groupSize: number; maxPoints: number }
) {
  // First, create complete daily data (fill missing days)
  const completeData = [];
  for (let i = totalDays - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    const existingData = rawData.find(d => d.date === dateStr);
    completeData.push({
      date: dateStr,
      views: existingData ? existingData.views : 0,
      dateObj: new Date(date)
    });
  }

  // If no grouping needed, return daily data
  if (config.groupSize === 1) {
    return completeData.map(item => ({
      date: item.date,
      views: item.views,
      dateLabel: item.dateObj.toLocaleDateString('vi-VN', {
        weekday: 'short',
        day: '2-digit',
        month: '2-digit'
      })
    }));
  }

  // Group data by groupSize
  const groupedData = [];
  for (let i = 0; i < completeData.length; i += config.groupSize) {
    const group = completeData.slice(i, i + config.groupSize);
    const totalViews = group.reduce((sum, item) => sum + item.views, 0);
    const startDate = group[0].dateObj;
    const endDate = group[group.length - 1].dateObj;

    // Create label based on group size
    let dateLabel;
    if (config.groupSize <= 3) {
      // For 2-3 day groups: "01/12 - 02/12"
      dateLabel = `${startDate.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })} - ${endDate.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}`;
    } else {
      // For 5+ day groups: "W1 Dec", "W2 Dec"
      const weekNum = Math.floor(i / config.groupSize) + 1;
      const monthName = startDate.toLocaleDateString('vi-VN', { month: 'short' });
      dateLabel = `T${weekNum} ${monthName}`;
    }

    groupedData.push({
      date: group[0].date, // Use first date as reference
      views: totalViews,
      dateLabel,
      groupSize: group.length,
      period: `${startDate.toLocaleDateString('vi-VN')} - ${endDate.toLocaleDateString('vi-VN')}`
    });
  }

  return groupedData;
}

export default function ArticleViewsChart({ className = '' }: ArticleViewsChartProps) {
  const [data, setData] = useState<ViewsAnalytics | null>(null);
  const [topArticlesData, setTopArticlesData] = useState<TopArticle[] | null>(null);
  const [isChartLoading, setIsChartLoading] = useState(true);
  const [isTopArticlesLoading, setIsTopArticlesLoading] = useState(true);
  const [chartError, setChartError] = useState<string | null>(null);
  const [topArticlesError, setTopArticlesError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>(7);
  const [topArticlesTimeRange, setTopArticlesTimeRange] = useState<TopArticlesTimeRange>(1);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isTopArticlesDropdownOpen, setIsTopArticlesDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const topArticlesDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (topArticlesDropdownRef.current && !topArticlesDropdownRef.current.contains(event.target as Node)) {
        setIsTopArticlesDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Helper functions for dropdowns
  const getTimeRangeLabel = (range: TimeRange) => {
    const option = TIME_RANGE_OPTIONS.find(opt => opt.value === range);
    return option?.label || '7 ngày';
  };

  const getTopArticlesTimeRangeLabel = (range: TopArticlesTimeRange) => {
    const option = TOP_ARTICLES_TIME_RANGE_OPTIONS.find(opt => opt.value === range);
    return option?.label || '1 ngày';
  };

  // Fetch top articles data separately
  const fetchTopArticles = useCallback(async (days: TopArticlesTimeRange) => {
    try {
      setIsTopArticlesLoading(true);
      setTopArticlesError(null);

      // Get top articles data from ViewTrackingService
      const { data: analyticsData, error: analyticsError } = await ViewTrackingService.getArticleViewsAnalytics(days);

      if (analyticsError || !analyticsData) {
        throw new Error('Không thể tải dữ liệu top bài viết');
      }

      // Process top articles
      const topArticles: TopArticle[] = analyticsData.topArticles.map(article => ({
        title: article.title.length > 30 ? article.title.substring(0, 30) + '...' : article.title,
        views: article.views,
        slug: article.slug
      }));

      setTopArticlesData(topArticles);

    } catch (err) {
      console.error('Error fetching top articles:', err);
      setTopArticlesError(err instanceof Error ? err.message : 'Có lỗi xảy ra');
    } finally {
      setIsTopArticlesLoading(false);
    }
  }, []);

  // Fetch analytics data
  const fetchAnalytics = useCallback(async (days: TimeRange) => {
    try {
      setIsChartLoading(true);
      setChartError(null);

      // Get real analytics data from ViewTrackingService
      const { data: analyticsData, error: analyticsError } = await ViewTrackingService.getArticleViewsAnalytics(days);

      if (analyticsError || !analyticsData) {
        throw new Error('Không thể tải dữ liệu thống kê');
      }

      // Smart aggregation based on time range
      const aggregationConfig = getAggregationConfig(days);
      const dailyViewsData = aggregateViewsData(analyticsData.dailyViews, days, aggregationConfig);

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

  useEffect(() => {
    fetchTopArticles(topArticlesTimeRange);
  }, [topArticlesTimeRange, fetchTopArticles]);

  const handleTimeRangeChange = (newTimeRange: TimeRange) => {
    setTimeRange(newTimeRange);
  };

  const handleTopArticlesTimeRangeChange = (newTimeRange: TopArticlesTimeRange) => {
    setTopArticlesTimeRange(newTimeRange);
  };

  // Simplified chart dimensions - use fixed viewBox like DailyTestChart
  const chartDimensions = useMemo(() => {
    if (!data?.dailyViews.length) return { width: 800, height: 240 };

    const chartData = data.dailyViews;
    const dataPoints = chartData.length;

    // Use fixed width for viewBox - SVG will scale automatically
    // Adjust width based on data density for better label spacing
    const calculateViewBoxWidth = () => {
      if (timeRange >= 90) {
        return 1200; // Wider viewBox for 90+ days to spread out labels
      }
      if (timeRange >= 60) {
        return 1000; // Medium-wide for 60+ days
      }
      if (timeRange >= 30) {
        return 900; // Slightly wider for 30+ days
      }
      if (timeRange >= 14) {
        return 800; // Standard width for 14+ days
      }
      return 700; // Compact for 7 days
    };

    const width = calculateViewBoxWidth();
    return { width, height: 240 };
  }, [data?.dailyViews.length, timeRange]);

  // Line Chart Component (reusing pattern from existing charts)
  const LineChart = useCallback(() => {
    if (!data?.dailyViews.length) return null;

    const chartData = data.dailyViews;
    const { width, height } = chartDimensions;
    const padding = 50;
    const chartWidth = width - (padding * 2);
    const chartHeight = height - (padding * 2);

    const maxValue = Math.max(...chartData.map(d => d.views)) || 1;
    const minValue = Math.min(...chartData.map(d => d.views)) || 0;
    const valueRange = maxValue - minValue || 1;

    // Calculate Y-axis labels (4 levels)
    const yAxisLabels = [];
    for (let i = 0; i <= 4; i++) {
      const value = minValue + (valueRange * (4 - i) / 4);
      yAxisLabels.push(Math.round(value));
    }

    // Calculate points for the line
    const points = chartData.map((d, i) => {
      const x = padding + (i * (chartWidth / (chartData.length - 1)));
      const y = padding + chartHeight - (((d.views - minValue) / valueRange) * chartHeight);
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
      <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
        <svg
          width="100%"
          height="240"
          viewBox={`0 0 ${width} ${height}`}
          className="overflow-visible"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Gradient definition */}
          <defs>
            <linearGradient id="viewsGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.05" />
            </linearGradient>
          </defs>

          {/* Grid lines and Y-axis labels */}
          {yAxisLabels.map((value, i) => {
            const y = padding + (chartHeight / 4) * i;
            return (
              <g key={`grid-${i}`}>
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
                  x={padding - 10}
                  y={y + 4}
                  textAnchor="end"
                  fontSize="11"
                  fill="currentColor"
                  className="text-gray-600 dark:text-gray-400"
                >
                  {value.toLocaleString()}
                </text>
              </g>
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
              {/* Invisible hover area (larger than visible circle) */}
              <circle
                cx={point.x}
                cy={point.y}
                r="12"
                fill="transparent"
                className="cursor-pointer"
                onMouseEnter={(e) => {
                  // Show tooltip
                  const tooltip = e.currentTarget.nextElementSibling;
                  if (tooltip) tooltip.style.opacity = '1';
                  // Enlarge visible circle
                  const visibleCircle = e.currentTarget.parentElement?.querySelector('.data-point');
                  if (visibleCircle) visibleCircle.setAttribute('r', '6');
                }}
                onMouseLeave={(e) => {
                  // Hide tooltip
                  const tooltip = e.currentTarget.nextElementSibling;
                  if (tooltip) tooltip.style.opacity = '0';
                  // Reset visible circle
                  const visibleCircle = e.currentTarget.parentElement?.querySelector('.data-point');
                  if (visibleCircle) visibleCircle.setAttribute('r', '4');
                }}
              />

              {/* Tooltip (initially hidden) */}
              <g style={{ opacity: 0, transition: 'opacity 200ms', pointerEvents: 'none' }}>
                {/* Dynamic tooltip size based on content */}
                {(() => {
                  const hasGroupInfo = point.data.groupSize && point.data.groupSize > 1;
                  const tooltipWidth = hasGroupInfo ? 120 : 60;
                  const tooltipHeight = hasGroupInfo ? 40 : 24;

                  return (
                    <>
                      <rect
                        x={point.x - tooltipWidth/2}
                        y={point.y - tooltipHeight - 8}
                        width={tooltipWidth}
                        height={tooltipHeight}
                        fill="rgba(0,0,0,0.9)"
                        rx="6"
                        stroke="rgba(255,255,255,0.2)"
                        strokeWidth="1"
                      />
                      <text
                        x={point.x}
                        y={point.y - (hasGroupInfo ? 28 : 24)}
                        textAnchor="middle"
                        fontSize="11"
                        fill="white"
                        fontWeight="500"
                      >
                        {point.data.views.toLocaleString()} views
                      </text>
                      {hasGroupInfo && (
                        <text
                          x={point.x}
                          y={point.y - 14}
                          textAnchor="middle"
                          fontSize="9"
                          fill="rgba(255,255,255,0.7)"
                        >
                          ({point.data.groupSize} ngày)
                        </text>
                      )}
                    </>
                  );
                })()}
              </g>

              {/* Visible data point */}
              <circle
                cx={point.x}
                cy={point.y}
                r="4"
                fill="#3B82F6"
                stroke="white"
                strokeWidth="2"
                className="data-point"
                style={{ transition: 'r 200ms' }}
                pointerEvents="none"
              />

              {/* Date labels - Smart sampling based on chart width and data density */}
              {(() => {
                const totalPoints = points.length;

                // Simplified label sampling based on time range and data points
                const calculateOptimalSampling = () => {
                  // Since we're using fixed viewBox with auto-scaling SVG,
                  // we can use simpler logic based on time range and data density

                  if (timeRange >= 90) {
                    // For 90 days: show every 10-12th point to avoid crowding
                    return Math.max(10, Math.ceil(totalPoints / 8));
                  }
                  if (timeRange >= 60) {
                    // For 60 days: show every 6-8th point
                    return Math.max(6, Math.ceil(totalPoints / 10));
                  }
                  if (timeRange >= 30) {
                    // For 30 days: show every 3-4th point
                    return Math.max(3, Math.ceil(totalPoints / 12));
                  }
                  if (timeRange >= 14) {
                    // For 14 days: show every 2nd point
                    return Math.max(2, Math.ceil(totalPoints / 14));
                  }

                  // For 7 days: show all or every other
                  return totalPoints > 10 ? 2 : 1;
                };

                const showEveryNth = calculateOptimalSampling();

                // Smart label selection: always show first, last, and evenly distributed points
                const shouldShowLabel = (() => {
                  // Always show first and last
                  if (i === 0 || i === totalPoints - 1) return true;

                  // For regular sampling, ensure we don't show labels too close to first/last
                  if (i % showEveryNth === 0) {
                    // Don't show if too close to first label (within 2 positions)
                    if (i <= 2) return false;
                    // Don't show if too close to last label (within 2 positions)
                    if (i >= totalPoints - 3) return false;
                    return true;
                  }

                  return false;
                })();

                return shouldShowLabel ? (
                  <text
                    x={point.x}
                    y={height - 10}
                    textAnchor={
                      // Adjust text anchor to prevent clipping at edges
                      i === 0 ? "start" :
                      i === totalPoints - 1 ? "end" :
                      "middle"
                    }
                    fontSize={timeRange >= 14 ? "11" : "10"}
                    fill="currentColor"
                    className="text-gray-600 dark:text-gray-400"
                    pointerEvents="none"
                  >
                    {point.data.dateLabel}
                  </text>
                ) : null;
              })()}
            </g>
          ))}
        </svg>
      </div>
    );
  }, [data, chartDimensions, timeRange]);

  // Bar Chart for Top Articles
  const TopArticlesChart = useCallback(() => {
    if (!topArticlesData?.length) return null;

    const articles = topArticlesData;
    const maxViews = Math.max(...articles.map(a => a.views)) || 1;

    return (
      <div className="space-y-3">
        {articles.map((article, index) => {
          const percentage = (article.views / maxViews) * 100;
          
          return (
            <div key={index} className="flex items-center space-x-3">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {article.title}
                  </span>
                  <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">
                    {article.views.toLocaleString()}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }, [topArticlesData]);

  // Remove global loading state - use individual loading states for each section

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 ${className}`}>
      {/* Header removed - no longer needed */}

      {/* Main Content Grid - Dynamic Layout Based on Time Range */}
      <div className={`grid grid-cols-1 gap-6 ${
        timeRange >= 14
          ? 'xl:grid-cols-4' // For 14+ days: wider chart takes more space
          : 'lg:grid-cols-3'  // For 7 days: normal layout
      }`}>
        {/* Chart Box - Dynamic width based on time range */}
        <div className={`bg-gray-50 dark:bg-gray-900/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700 ${
          timeRange >= 14
            ? 'xl:col-span-3' // Takes 3/4 width for longer periods
            : 'lg:col-span-2'  // Takes 2/3 width for 7 days
        }`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                📈 Xu hướng lượt xem
                {timeRange > 14 && (
                  <span className="text-sm text-gray-500 ml-2 font-normal">
                    ({getAggregationConfig(timeRange).groupSize} ngày/điểm)
                  </span>
                )}
              </h3>
              {data && (
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Tổng: {data.dailyViews.reduce((sum, day) => sum + day.views, 0).toLocaleString()} views
                </span>
              )}
            </div>

            {/* Chart Time Range Filter & Refresh */}
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

              {/* Refresh Button */}
              <button
                onClick={() => fetchAnalytics(timeRange)}
                disabled={isChartLoading}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors disabled:opacity-50"
                title="Làm mới"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
          </div>

          {isChartLoading ? (
            <div className="h-60 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          ) : chartError ? (
            <div className="text-center py-8">
              <svg className="w-12 h-12 mx-auto text-red-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-600 dark:text-red-400 mb-2">Không thể tải biểu đồ</p>
              <p className="text-gray-500 dark:text-gray-400 text-sm">{chartError}</p>
              <button
                onClick={() => fetchAnalytics(timeRange)}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Thử lại
              </button>
            </div>
          ) : (
            <LineChart />
          )}
        </div>

        {/* Top Articles Box - Takes 1/3 width */}
        <div className="lg:col-span-1 bg-gray-50 dark:bg-gray-900/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              🏆 Top 5 bài viết
            </h3>

            {/* Top Articles Time Range Filter */}
            <div className="relative" ref={topArticlesDropdownRef}>
              <button
                onClick={() => setIsTopArticlesDropdownOpen(!isTopArticlesDropdownOpen)}
                disabled={isTopArticlesLoading}
                className="flex items-center space-x-1 px-2 py-1 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md disabled:opacity-50"
                title="Chọn khoảng thời gian"
              >
                <span>{getTopArticlesTimeRangeLabel(topArticlesTimeRange)}</span>
                <svg className={`w-3 h-3 transition-transform ${isTopArticlesDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              <AnimatePresence>
                {isTopArticlesDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 mt-2 w-32 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50"
                  >
                    {TOP_ARTICLES_TIME_RANGE_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          handleTopArticlesTimeRangeChange(option.value);
                          setIsTopArticlesDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-50 dark:hover:bg-gray-700/30 first:rounded-t-lg last:rounded-b-lg ${
                          topArticlesTimeRange === option.value
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
          </div>

          {isTopArticlesLoading ? (
            <div className="space-y-3">
              {[1,2,3,4,5].map(i => (
                <div key={i} className="space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 animate-pulse"></div>
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                </div>
              ))}
            </div>
          ) : topArticlesError ? (
            <div className="text-center py-8">
              <p className="text-red-600 dark:text-red-400 text-sm">{topArticlesError}</p>
              <button
                onClick={() => fetchTopArticles(topArticlesTimeRange)}
                className="mt-2 px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
              >
                Thử lại
              </button>
            </div>
          ) : (
            <TopArticlesChart />
          )}
        </div>
      </div>
    </div>
  );
}
