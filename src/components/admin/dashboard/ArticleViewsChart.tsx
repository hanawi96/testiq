import React, { useState, useEffect, useCallback } from 'react';
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

export default function ArticleViewsChart({ className = '' }: ArticleViewsChartProps) {
  const [data, setData] = useState<ViewsAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch analytics data
  const fetchAnalytics = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Get real analytics data from ViewTrackingService
      const { data: analyticsData, error: analyticsError } = await ViewTrackingService.getArticleViewsAnalytics();

      if (analyticsError || !analyticsData) {
        throw new Error('Không thể tải dữ liệu thống kê');
      }

      // Ensure we have 7 days of data (fill missing days with 0)
      const last7Days = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];

        const existingData = analyticsData.dailyViews.find(d => d.date === dateStr);

        last7Days.push({
          date: dateStr,
          views: existingData ? existingData.views : 0,
          dateLabel: date.toLocaleDateString('vi-VN', {
            weekday: 'short',
            day: '2-digit',
            month: '2-digit'
          })
        });
      }

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
        dailyViews: last7Days,
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
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Line Chart Component (reusing pattern from existing charts)
  const LineChart = useCallback(() => {
    if (!data?.dailyViews.length) return null;

    const chartData = data.dailyViews;
    const width = 800;
    const height = 240;
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
                <rect
                  x={point.x - 30}
                  y={point.y - 40}
                  width="60"
                  height="24"
                  fill="rgba(0,0,0,0.9)"
                  rx="6"
                  stroke="rgba(255,255,255,0.2)"
                  strokeWidth="1"
                />
                <text
                  x={point.x}
                  y={point.y - 24}
                  textAnchor="middle"
                  fontSize="11"
                  fill="white"
                  fontWeight="500"
                >
                  {point.data.views.toLocaleString()}
                </text>
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

              {/* Date labels */}
              <text
                x={point.x}
                y={height - 10}
                textAnchor="middle"
                fontSize="10"
                fill="currentColor"
                className="text-gray-600 dark:text-gray-400"
                pointerEvents="none"
              >
                {point.data.dateLabel}
              </text>
            </g>
          ))}
        </svg>
      </div>
    );
  }, [data]);

  // Bar Chart for Top Articles
  const TopArticlesChart = useCallback(() => {
    if (!data?.topArticles.length) return null;

    const articles = data.topArticles;
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
  }, [data]);

  if (isLoading) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="h-40 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 ${className}`}>
        <div className="text-center py-8">
          <svg className="w-12 h-12 mx-auto text-red-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-red-600 dark:text-red-400 mb-2">Không thể tải dữ liệu</p>
          <p className="text-gray-500 dark:text-gray-400 text-sm">{error}</p>
          <button
            onClick={fetchAnalytics}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          📈 Lượt xem bài viết
        </h2>
        <button
          onClick={fetchAnalytics}
          disabled={isLoading}
          className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors disabled:opacity-50"
          title="Làm mới"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      {/* Main Line Chart */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Xu hướng 7 ngày gần nhất
          </h3>
          {data && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Tổng: {data.dailyViews.reduce((sum, day) => sum + day.views, 0).toLocaleString()} views
            </span>
          )}
        </div>
        <LineChart />
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Articles */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Top 5 bài viết (7 ngày)
          </h3>
          <TopArticlesChart />
        </div>

        {/* Quick Stats */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Thống kê nhanh
          </h3>
          
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <span className="text-blue-600 dark:text-blue-400 text-sm">📊</span>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Tổng lượt xem</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {data?.summary.totalViews.toLocaleString()}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <span className="text-green-600 dark:text-green-400 text-sm">📈</span>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Tăng trưởng</p>
                <p className={`text-lg font-semibold ${
                  (data?.summary.growthRate || 0) >= 0 
                    ? 'text-green-600 dark:text-green-400' 
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  {data?.summary.growthRate > 0 ? '+' : ''}{data?.summary.growthRate}%
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                <span className="text-purple-600 dark:text-purple-400 text-sm">🔥</span>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Trung bình/bài</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {data?.summary.averageViews.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  ({data?.summary.articlesCount} bài viết)
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
