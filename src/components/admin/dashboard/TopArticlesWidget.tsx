import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ViewTrackingService } from '../../../../backend/utils/view-tracking-service';

interface TopArticle {
  title: string;
  views: number;
  slug: string;
}

type TopArticlesTimeRange = 1 | 7 | 14 | 30;

const TOP_ARTICLES_TIME_RANGE_OPTIONS = [
  { value: 1, label: '1 ngày' },
  { value: 7, label: '7 ngày' },
  { value: 14, label: '14 ngày' },
  { value: 30, label: '30 ngày' }
] as const;

interface TopArticlesWidgetProps {
  className?: string;
}

export default function TopArticlesWidget({ className = '' }: TopArticlesWidgetProps) {
  const [topArticlesData, setTopArticlesData] = useState<TopArticle[] | null>(null);
  const [isTopArticlesLoading, setIsTopArticlesLoading] = useState(true);
  const [topArticlesError, setTopArticlesError] = useState<string | null>(null);
  const [topArticlesTimeRange, setTopArticlesTimeRange] = useState<TopArticlesTimeRange>(7);
  const [isTopArticlesDropdownOpen, setIsTopArticlesDropdownOpen] = useState(false);
  
  const topArticlesDropdownRef = useRef<HTMLDivElement>(null);

  // Helper function for dropdown
  const getTopArticlesTimeRangeLabel = (range: TopArticlesTimeRange) => {
    const option = TOP_ARTICLES_TIME_RANGE_OPTIONS.find(opt => opt.value === range);
    return option?.label || '7 ngày';
  };

  // Handle time range change
  const handleTopArticlesTimeRangeChange = (newRange: TopArticlesTimeRange) => {
    setTopArticlesTimeRange(newRange);
  };

  // Fetch top articles data
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
        title: article.title.length > 50 ? article.title.substring(0, 50) + '...' : article.title,
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

  useEffect(() => {
    fetchTopArticles(topArticlesTimeRange);
  }, [topArticlesTimeRange, fetchTopArticles]);

  // Handle click outside for dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (topArticlesDropdownRef.current && !topArticlesDropdownRef.current.contains(event.target as Node)) {
        setIsTopArticlesDropdownOpen(false);
      }
    }

    if (isTopArticlesDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isTopArticlesDropdownOpen]);

  // Bar Chart for Top Articles
  const TopArticlesChart = useCallback(() => {
    if (!topArticlesData?.length) return null;

    const articles = topArticlesData;
    const maxViews = Math.max(...articles.map(a => a.views)) || 1;

    return (
      <div className="space-y-4">
        {articles.map((article, index) => {
          const percentage = (article.views / maxViews) * 100;
          
          return (
            <div key={index} className="flex items-center space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                {index + 1}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate pr-2">
                    {article.title}
                  </span>
                  <span className="text-sm text-gray-600 dark:text-gray-400 font-semibold">
                    {article.views.toLocaleString()}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-amber-500 to-orange-500 h-2 rounded-full transition-all duration-500"
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

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 ${className}`}>
      {/* Header Section */}
      <div className="bg-gradient-to-r from-amber-50/50 via-orange-50/30 to-yellow-50/50 dark:from-amber-950/20 dark:via-orange-950/10 dark:to-yellow-950/20 rounded-t-xl p-6 border-b border-amber-100 dark:border-amber-800/30">
        <div className="flex items-center justify-between">
          {/* Left side - Icon and Title */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
                Top 5 bài viết
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                Bài viết được xem nhiều nhất
              </p>
            </div>
          </div>

          {/* Right side - Time Range Filter */}
          <div className="relative" ref={topArticlesDropdownRef}>
            <button
              onClick={() => setIsTopArticlesDropdownOpen(!isTopArticlesDropdownOpen)}
              disabled={isTopArticlesLoading}
              className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg disabled:opacity-50 transition-colors"
              title="Chọn khoảng thời gian"
            >
              <span>{getTopArticlesTimeRangeLabel(topArticlesTimeRange)}</span>
              <svg className={`w-4 h-4 transition-transform ${isTopArticlesDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                  className="absolute right-0 mt-2 w-36 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50"
                >
                  {TOP_ARTICLES_TIME_RANGE_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        handleTopArticlesTimeRangeChange(option.value);
                        setIsTopArticlesDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700/30 first:rounded-t-lg last:rounded-b-lg transition-colors ${
                        topArticlesTimeRange === option.value
                          ? 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20'
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
      </div>

      {/* Content Section */}
      <div className="p-6">
        {isTopArticlesLoading ? (
          <div className="space-y-4">
            {[1,2,3,4,5].map(i => (
              <div key={i} className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 animate-pulse"></div>
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        ) : topArticlesError ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-red-600 dark:text-red-400 text-sm mb-3">{topArticlesError}</p>
            <button
              onClick={() => fetchTopArticles(topArticlesTimeRange)}
              className="px-4 py-2 bg-amber-600 text-white text-sm rounded-lg hover:bg-amber-700 transition-colors"
            >
              Thử lại
            </button>
          </div>
        ) : !topArticlesData?.length ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Chưa có dữ liệu bài viết</p>
          </div>
        ) : (
          <TopArticlesChart />
        )}
      </div>
    </div>
  );
}
