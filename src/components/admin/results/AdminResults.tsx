import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ResultsService } from '../../../../backend';
import { getCountryFlag, getCountryFlagSvgByCode } from '../../../utils/country-flags';
import type { TestResult, ResultsStats, ResultsFilters, ResultsListResponse } from '../../../../backend';
import ResultsTestChart from './ResultsTestChart';
import DateRangeFilter from './DateRangeFilter';
import { useResultsData } from './hooks/useResultsData';

export default function AdminResults() {
  const [resultsData, setResultsData] = useState<ResultsListResponse | null>(null);
  const [stats, setStats] = useState<ResultsStats | null>(null);
  const [scoreDistribution, setScoreDistribution] = useState<Array<{ range: string; count: number }> | null>(null);
  const [isLoading, setIsLoading] = useState(false); // Start with false for instant display
  const [error, setError] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<ResultsFilters>({
    user_type: 'all',
    search: '',
    test_type: 'iq'
  });
  const [isExporting, setIsExporting] = useState(false);

  // Bulk selection state
  const [selectedResults, setSelectedResults] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);

  const [limit, setLimit] = useState(10);
  const [isMobile, setIsMobile] = useState(false);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Bulk selection helpers
  const toggleSelectAll = () => {
    if (selectedResults.size === resultsData?.results.length) {
      setSelectedResults(new Set());
    } else {
      setSelectedResults(new Set(resultsData?.results.map(r => r.id) || []));
    }
  };

  const toggleSelectResult = (id: string) => {
    const newSelected = new Set(selectedResults);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedResults(newSelected);
  };

  const deleteSelectedResults = async () => {
    if (selectedResults.size === 0) return;

    // Confirm deletion
    if (!confirm(`Bạn có chắc chắn muốn xóa ${selectedResults.size} kết quả test đã chọn?`)) {
      return;
    }

    setIsDeleting(true);
    try {
      const { data, error } = await ResultsService.deleteResults(Array.from(selectedResults));
      if (error) {
        console.error('Error deleting results:', error);
        alert('Có lỗi xảy ra khi xóa kết quả test');
        return;
      }

      console.log(`Successfully deleted ${data} results`);
      setSelectedResults(new Set());
      await fetchResults(currentPage);
    } catch (err) {
      console.error('Exception deleting results:', err);
      alert('Có lỗi xảy ra khi xóa kết quả test');
    } finally {
      setIsDeleting(false);
    }
  };

  // Advanced data fetching with caching and prefetching
  const {
    fetchResults: fetchResultsAdvanced,
    prefetchPage,
    cacheWithTTL
  } = useResultsData({
    filters,
    limit,
    currentPage,
    setResultsData,
    setIsLoading,
    setError
  });

  // Optimized wrapper - no unnecessary operations
  const fetchResults = useCallback(async (page: number = currentPage, pageLimit: number = limit) => {
    console.log(`🔍 Advanced fetch results page ${page} with limit ${pageLimit}`);

    // Clear selection when loading new page (non-blocking)
    setSelectedResults(new Set());

    // Use advanced fetch with caching (this handles loading states internally)
    await fetchResultsAdvanced(page, pageLimit);
  }, [currentPage, limit, fetchResultsAdvanced]);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const { data: statsData, error: statsError } = await ResultsService.getStats();
      if (!statsError && statsData) {
        setStats(statsData);
      }
    } catch (err) {
      console.warn('Could not fetch results stats:', err);
    }
  }, []);

  // Fetch score distribution
  const fetchScoreDistribution = useCallback(async () => {
    try {
      const { data: distData, error: distError } = await ResultsService.getScoreDistribution();
      if (!distError && distData) {
        setScoreDistribution(distData);
      }
    } catch (err) {
      console.warn('Could not fetch score distribution:', err);
    }
  }, []);

  // Instant hydration + non-blocking loading
  useEffect(() => {
    // Check for pre-loaded data (SSR-style)
    if (typeof window !== 'undefined' && (window as any).__RESULTS_INITIAL_DATA__) {
      const initialData = (window as any).__RESULTS_INITIAL_DATA__;
      console.log('⚡ SSR RESULTS HYDRATION: Using pre-loaded data', initialData);
      setResultsData(initialData);
      delete (window as any).__RESULTS_INITIAL_DATA__;
    } else {
      // Priority 1: Load results immediately
      fetchResults(1);
    }

    // Priority 2: Load stats in background (non-blocking)
    fetchStats();

    // Priority 3: Load score distribution in background (non-blocking)
    fetchScoreDistribution();
  }, [filters]);

  // Handle page change - INSTANT with cache check
  const handlePageChange = (page: number) => {
    console.log(`🔄 PAGE CHANGE: ${currentPage} → ${page}`);

    // Validate page bounds
    if (resultsData && page > resultsData.totalPages) return;
    if (page < 1) return;

    setCurrentPage(page);
    fetchResults(page);
  };

  // Handle page hover - Prefetch for instant navigation
  const handlePageHover = (page: number) => {
    if (page !== currentPage && page >= 1 && (!resultsData || page <= resultsData.totalPages)) {
      console.log(`👆 PAGE HOVER: Prefetching page ${page}`);
      prefetchPage(page, filters, limit);
    }
  };

  // Handle limit change - Reset to page 1
  const handleLimitChange = (newLimit: number) => {
    console.log(`🔄 LIMIT CHANGE: ${limit} → ${newLimit}`);
    setLimit(newLimit);
    setCurrentPage(1);
    fetchResults(1, newLimit);
  };

  // Handle filter change with date validation
  const handleFilterChange = (newFilters: Partial<ResultsFilters>) => {
    // Smart date validation
    if (newFilters.date_from || newFilters.date_to) {
      const updatedFilters = { ...filters, ...newFilters };

      // If both dates exist, ensure from <= to
      if (updatedFilters.date_from && updatedFilters.date_to) {
        if (updatedFilters.date_from > updatedFilters.date_to) {
          // Auto-fix: swap dates
          newFilters = {
            ...newFilters,
            date_from: updatedFilters.date_to,
            date_to: updatedFilters.date_from
          };
        }
      }
    }

    setFilters(prev => ({ ...prev, ...newFilters }));
    setCurrentPage(1);
  };

  // Handle export
  const handleExport = async () => {
    setIsExporting(true);
    try {
      const { data: exportData, error: exportError } = await ResultsService.exportResults(filters);
      
      if (exportError || !exportData) {
        alert('Không thể export dữ liệu');
        return;
      }

      // Convert to CSV
      const headers = ['ID', 'Tên', 'Email', 'Điểm', 'Thời gian', 'Tuổi', 'Quốc gia', 'Loại user', 'Ngày test'];
      const csvContent = [
        headers.join(','),
        ...exportData.map(result => [
          result.id,
          result.name || '',
          result.email || '',
          result.score,
          result.duration_seconds ? `${Math.round(result.duration_seconds / 60)}m` : '',
          result.age || '',
          result.country || '',
          result.user_type === 'anonymous' ? 'Ẩn danh' : 'Đã đăng ký',
          new Date(result.tested_at).toLocaleDateString('vi-VN')
        ].join(','))
      ].join('\n');

      // Download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `test-results-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      
    } catch (err) {
      alert('Có lỗi xảy ra khi export dữ liệu');
    } finally {
      setIsExporting(false);
    }
  };

  // Format duration
  const formatDuration = (seconds: number | null) => {
    if (!seconds) return 'N/A';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };



  // Skeleton components
  const SkeletonStatsCard = () => (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-24"></div>
          <div className="h-8 bg-gray-200 dark:bg-gray-600 rounded w-16"></div>
        </div>
        <div className="text-3xl bg-gray-200 dark:bg-gray-600 rounded w-12 h-12"></div>
      </div>
    </div>
  );

  const SkeletonTableRow = () => (
    <tr className="animate-pulse hover:bg-gray-50 dark:hover:bg-gray-700">
      {/* Checkbox */}
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="w-4 h-4 bg-gray-200 dark:bg-gray-600 rounded"></div>
      </td>
      {/* Người dùng (avatar + name/email + country) - ~30% */}
      <td className="px-6 py-4 whitespace-nowrap" style={{ width: '30%' }}>
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10 mr-3">
            <div className="h-10 w-10 bg-gray-200 dark:bg-gray-600 rounded-full"></div>
          </div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-32"></div>
            <div className="flex items-center space-x-2">
              <div className="w-5 h-4 bg-gray-200 dark:bg-gray-600 rounded"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-20"></div>
            </div>
          </div>
        </div>
      </td>

      {/* Điểm IQ (score + classification) - ~20% */}
      <td className="px-6 py-4 whitespace-nowrap" style={{ width: '20%' }}>
        <div className="space-y-2">
          <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded w-12"></div>
          <div className="h-5 bg-gray-200 dark:bg-gray-600 rounded-full w-20"></div>
        </div>
      </td>

      {/* Độ chính xác - ~15% */}
      <td className="px-6 py-4 whitespace-nowrap" style={{ width: '15%' }}>
        <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-12"></div>
      </td>

      {/* Thời gian - ~15% */}
      <td className="px-6 py-4 whitespace-nowrap" style={{ width: '15%' }}>
        <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-16"></div>
      </td>

      {/* Tuổi - ~10% */}
      <td className="px-6 py-4 whitespace-nowrap" style={{ width: '10%' }}>
        <div className="space-y-1">
          <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-12"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-8"></div>
        </div>
      </td>

      {/* Quốc gia - ~15% */}
      <td className="px-6 py-4 whitespace-nowrap" style={{ width: '15%' }}>
        <div className="flex items-center space-x-2">
          <div className="w-5 h-4 bg-gray-200 dark:bg-gray-600 rounded"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-16"></div>
        </div>
      </td>

      {/* Ngày test - ~10% */}
      <td className="px-6 py-4 whitespace-nowrap" style={{ width: '10%' }}>
        <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-20"></div>
      </td>

      {/* Loại - ~8% */}
      <td className="px-6 py-4 whitespace-nowrap" style={{ width: '8%' }}>
        <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded-full w-12"></div>
      </td>
    </tr>
  );

  return (
    <div className="space-y-6">
      {/* Error */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Stats Cards - Progressive Loading */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {stats ? (
          [
            { 
              title: 'Tổng số test', 
              value: stats.totalTests.toLocaleString(), 
              icon: '📊',
              color: 'from-blue-500 to-blue-600'
            },
            { 
              title: 'Điểm trung bình', 
              value: stats.averageScore.toString(), 
              icon: '🎯',
              color: 'from-green-500 to-green-600'
            },
            { 
              title: 'Người tham gia', 
              value: stats.totalParticipants.toLocaleString(), 
              icon: '👥',
              color: 'from-purple-500 to-purple-600'
            },
            { 
              title: 'Test hôm nay', 
              value: stats.testsToday.toString(), 
              icon: '📅',
              color: 'from-orange-500 to-orange-600'
            }
          ].map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{stat.value}</p>
                </div>
                <div className="text-3xl">{stat.icon}</div>
              </div>
            </motion.div>
          ))
        ) : (
          // Skeleton stats cards
          <>
            <SkeletonStatsCard />
            <SkeletonStatsCard />
            <SkeletonStatsCard />
            <SkeletonStatsCard />
          </>
        )}
      </div>

      {/* Results Test Chart */}
      <ResultsTestChart className="mb-6" defaultTimeRange="1m" />

      {/* Compact Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-3 lg:space-y-0">
          {/* Left Side - Title & Active Filters Summary */}
          <div className="flex items-center space-x-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Bộ lọc</h3>

            {/* Active Filters Count */}
            {(() => {
              const activeFilters = [
                filters.search,
                filters.user_type && filters.user_type !== 'all',
                filters.date_from || filters.date_to,
                filters.score_min,
                filters.score_max
              ].filter(Boolean).length;

              return activeFilters > 0 ? (
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-xs font-medium">
                    {activeFilters} bộ lọc đang áp dụng
                  </span>
                  <button
                    onClick={() => {
                      setFilters({ test_type: 'iq' }); // Keep test_type
                      setCurrentPage(1);
                    }}
                    className="text-xs text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                  >
                    Xóa tất cả
                  </button>
                </div>
              ) : (
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Hiển thị tất cả kết quả
                </span>
              );
            })()}
          </div>

          {/* Right Side - Filter Controls */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Search - Priority 1 */}
            <div className="relative flex-1 min-w-[200px] max-w-[300px]">
              <input
                type="text"
                value={filters.search || ''}
                onChange={(e) => handleFilterChange({ search: e.target.value })}
                placeholder="Tìm kiếm tên, email, quốc gia..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* Date Range Filter - Priority 2 */}
            <DateRangeFilter
              filters={filters}
              onFilterChange={handleFilterChange}
            />

            {/* User Type - Priority 3 */}
            <select
              value={filters.user_type || 'all'}
              onChange={(e) => handleFilterChange({ user_type: e.target.value as any })}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Tất cả user</option>
              <option value="registered">Đã đăng ký</option>
              <option value="anonymous">Ẩn danh</option>
            </select>

            {/* Score Range - Priority 4 */}
            <div className="flex items-center space-x-2">
              <input
                type="number"
                value={filters.score_min || ''}
                onChange={(e) => handleFilterChange({ score_min: e.target.value ? parseInt(e.target.value) : undefined })}
                placeholder="Min"
                min="0"
                max="200"
                className="w-20 px-2 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
              <span className="text-gray-400 text-sm">-</span>
              <input
                type="number"
                value={filters.score_max || ''}
                onChange={(e) => handleFilterChange({ score_max: e.target.value ? parseInt(e.target.value) : undefined })}
                placeholder="Max"
                min="0"
                max="200"
                className="w-20 px-2 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Results Table - Always show container */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Table Header - Thiết kế mới giống ảnh */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Icon với background màu indigo */}
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="drop-shadow-sm"
                >
                  <path d="M9 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2h-4"/>
                  <rect x="9" y="7" width="6" height="6"/>
                  <path d="M12 1v6"/>
                  <circle cx="12" cy="12" r="2"/>
                </svg>
              </div>

              {/* Tiêu đề và mô tả */}
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  Kết quả test
                </h3>
                <div className="flex items-center space-x-2">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Phân tích {resultsData ? resultsData.total.toLocaleString() : '0'} kết quả test IQ
                  </p>
                  {(filters.date_from || filters.date_to) && (
                    <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-xs font-medium">
                      {filters.date_from && filters.date_to
                        ? filters.date_from === filters.date_to
                          ? new Date(filters.date_from).toLocaleDateString('vi-VN')
                          : `${new Date(filters.date_from).toLocaleDateString('vi-VN')} - ${new Date(filters.date_to).toLocaleDateString('vi-VN')}`
                        : filters.date_from
                        ? `Từ ${new Date(filters.date_from).toLocaleDateString('vi-VN')}`
                        : `Đến ${new Date(filters.date_to!).toLocaleDateString('vi-VN')}`
                      }
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center space-x-2">
              {/* Bulk delete button - only show when items selected */}
              {selectedResults.size > 0 && (
                <button
                  onClick={deleteSelectedResults}
                  disabled={isDeleting}
                  className="flex items-center justify-center w-10 h-10 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg font-medium shadow-lg hover:shadow-xl"
                  title={`Xóa ${selectedResults.size} kết quả đã chọn`}
                >
                  {isDeleting ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  )}
                </button>
              )}

              {/* Export button */}
              <button
                onClick={handleExport}
                disabled={isExporting}
                className="flex items-center justify-center w-10 h-10 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg font-medium shadow-lg hover:shadow-xl"
                title="Export dữ liệu"
              >
                {isExporting ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                      checked={selectedResults.size > 0 && selectedResults.size === resultsData?.results.length}
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Người dùng
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Điểm số
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Thời gian
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Tuổi
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Quốc gia
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Ngày test
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Loại
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {/* Real results */}
                {resultsData?.results.map((result) => (
                  <tr key={result.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    {/* Checkbox */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                        checked={selectedResults.has(result.id)}
                        onChange={() => toggleSelectResult(result.id)}
                      />
                    </td>
                    {/* User Info */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 mr-3">
                          <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                            result.user_type === 'anonymous' ? 'bg-orange-100 dark:bg-orange-900/30' : 'bg-primary-100 dark:bg-primary-900/30'
                          }`}>
                            <span className={`text-sm font-semibold ${
                              result.user_type === 'anonymous' ? 'text-orange-700 dark:text-orange-400' : 'text-primary-700 dark:text-primary-400'
                            }`}>
                              {(result.name || 'U').charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {result.name || 'Unknown User'}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {result.email || 'No email'}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Score */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {result.score}
                      </span>
                    </td>

                    {/* Duration */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-gray-100">
                        {formatDuration(result.duration_seconds)}
                      </div>
                      {result.accuracy && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Độ chính xác: {result.accuracy}%
                        </div>
                      )}
                    </td>

                    {/* Age */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-gray-100">
                        {result.age ? `${result.age} tuổi` : '-'}
                      </div>
                      {result.gender && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {result.gender === 'male' ? 'Nam' : result.gender === 'female' ? 'Nữ' : 'Khác'}
                        </div>
                      )}
                    </td>

                    {/* Country */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {result.country ? (
                        <div className="flex items-center space-x-2">
                          {/* Flag */}
                          <div className="flex-shrink-0">
                            {result.country_code ? (
                              <img
                                src={getCountryFlagSvgByCode(result.country_code)}
                                alt={`${result.country} flag`}
                                className="w-5 h-4 object-cover rounded-sm"
                                onError={(e) => {
                                  // Fallback to emoji if SVG fails
                                  const target = e.target as HTMLImageElement;
                                  const flag = result.country ? getCountryFlag(result.country) : '';
                                  if (flag) {
                                    target.style.display = 'none';
                                    const span = document.createElement('span');
                                    span.textContent = flag;
                                    span.className = 'text-lg';
                                    target.parentNode?.appendChild(span);
                                  }
                                }}
                              />
                            ) : (
                              <span className="text-lg">{result.country ? getCountryFlag(result.country) : ''}</span>
                            )}
                          </div>
                          {/* Country name */}
                          <div className="text-sm text-gray-900 dark:text-gray-100 truncate">
                            {result.country}
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500 dark:text-gray-400">-</span>
                      )}
                    </td>

                    {/* Date */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-gray-100">
                        {new Date(result.tested_at).toLocaleDateString('vi-VN')}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(result.tested_at).toLocaleTimeString('vi-VN', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </td>

                    {/* Type */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        result.user_type === 'anonymous'
                          ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-400 border border-orange-200 dark:border-orange-800'
                          : 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 border border-green-200 dark:border-green-800'
                      }`}>
                        {result.user_type === 'anonymous' ? 'Ẩn danh' : 'Đã đăng ký'}
                      </span>
                    </td>
                  </tr>
                ))}

                {/* Skeleton rows while loading */}
                {isLoading && (
                  <>
                    <SkeletonTableRow />
                    <SkeletonTableRow />
                    <SkeletonTableRow />
                    <SkeletonTableRow />
                    <SkeletonTableRow />
                    <SkeletonTableRow />
                    <SkeletonTableRow />
                    <SkeletonTableRow />
                    <SkeletonTableRow />
                    <SkeletonTableRow />
                    <SkeletonTableRow />
                    <SkeletonTableRow />
                    <SkeletonTableRow />
                    <SkeletonTableRow />
                    <SkeletonTableRow />
                    <SkeletonTableRow />
                    <SkeletonTableRow />
                    <SkeletonTableRow />
                    <SkeletonTableRow />
                    <SkeletonTableRow />
                  </>
                )}
              </tbody>
            </table>

            {/* Empty State */}
            {!isLoading && resultsData?.results.length === 0 && (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2-2V7a2 2 0 012-2h2a2 2 0 002 2v2a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 00-2 2h-2a2 2 0 00-2 2v6a2 2 0 01-2 2H9z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">Không có kết quả test nào</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Thử điều chỉnh bộ lọc để xem kết quả khác</p>
              </div>
            )}
          </div>

          {/* Pagination - Enhanced like UsersList */}
          {resultsData && (
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-3 sm:space-y-0">
                {/* Left: Info + Items Per Page */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                  {/* Results Info */}
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    Hiển thị {((currentPage - 1) * limit) + 1} - {Math.min(currentPage * limit, resultsData.total)}/{resultsData.total.toLocaleString()} kết quả
                  </div>

                  {/* Items Per Page Selector - Compact */}
                  <div className="flex items-center space-x-2">
                    <select
                      value={limit}
                      onChange={(e) => handleLimitChange(Number(e.target.value))}
                      className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                    <span className="text-xs text-gray-500 dark:text-gray-400">/ trang</span>
                  </div>
                </div>

                {/* Right: Pagination Controls - Only show if more than 1 page */}
                {resultsData.totalPages > 1 && (
                  <nav className="flex items-center space-x-1">
                    {/* First Page - Hidden on mobile */}
                    <button
                      onClick={() => handlePageChange(1)}
                      disabled={currentPage === 1}
                      className="hidden sm:flex items-center justify-center w-10 h-10 text-sm font-medium text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
                      aria-label="Trang đầu"
                    >
                      ⇤
                    </button>

                    {/* Previous Page */}
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={!resultsData.hasPrev}
                      className="flex items-center justify-center w-10 h-10 text-sm font-medium text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
                      aria-label="Trang trước"
                    >
                      ←
                    </button>

                    {/* Page Numbers - Responsive count */}
                    <div className="flex items-center space-x-1">
                      {Array.from({
                        length: Math.min(
                          isMobile ? 3 : 5, // 3 on mobile, 5 on desktop
                          resultsData.totalPages
                        )
                      }, (_, i) => {
                        const maxVisible = isMobile ? 3 : 5;
                        const page = i + Math.max(1, currentPage - Math.floor(maxVisible / 2));
                        if (page > resultsData.totalPages) return null;

                        return (
                          <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            onMouseEnter={() => handlePageHover(page)}
                            className={`flex items-center justify-center w-10 h-10 text-sm font-medium rounded-lg transition-colors ${
                              page === currentPage
                                ? 'bg-primary-600 dark:bg-primary-500 text-white shadow-sm'
                                : 'text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                            }`}
                            aria-label={`Trang ${page}`}
                            aria-current={page === currentPage ? 'page' : undefined}
                          >
                            {page}
                          </button>
                        );
                      })}
                    </div>

                    {/* Next Page */}
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={!resultsData.hasNext}
                      className="flex items-center justify-center w-10 h-10 text-sm font-medium text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
                      aria-label="Trang sau"
                    >
                      →
                    </button>

                    {/* Last Page - Hidden on mobile */}
                    <button
                      onClick={() => handlePageChange(resultsData.totalPages)}
                      disabled={currentPage === resultsData.totalPages}
                      className="hidden sm:flex items-center justify-center w-10 h-10 text-sm font-medium text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
                      aria-label="Trang cuối"
                    >
                      ⇥
                    </button>

                    {/* Mobile-only: Jump to page input */}
                    {resultsData.totalPages > 5 && (
                      <div className="flex sm:hidden items-center ml-2 space-x-1">
                        <span className="text-xs text-gray-500 dark:text-gray-400">Đến:</span>
                        <input
                          type="number"
                          min="1"
                          max={resultsData.totalPages}
                          value={currentPage}
                          onChange={(e) => {
                            const page = parseInt(e.target.value);
                            if (page >= 1 && page <= resultsData.totalPages) {
                              handlePageChange(page);
                            }
                          }}
                          className="w-12 h-8 text-xs text-center border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-primary-500 dark:focus:ring-primary-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                        />
                      </div>
                    )}
                  </nav>
                )}
              </div>
            </div>
          )}
        </div>

      {/* Score Distribution & Top Countries - Combined Row */}
      {(scoreDistribution || (stats?.topCountries && stats.topCountries.length > 0)) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Score Distribution Chart */}
          {scoreDistribution && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
              {/* Header with table header gradient */}
              <div className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 px-6 py-3 rounded-t-xl">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Phân bố điểm số</h3>
                </div>
              </div>
              {/* Content */}
              <div className="p-6">
              <div className="space-y-3">
                {scoreDistribution.map((item, index) => (
                  <div key={item.range} className="flex items-center">
                    <div className="w-16 text-sm text-gray-600 dark:text-gray-400 flex-shrink-0">{item.range}</div>
                    <div className="flex-1 mx-3">
                      <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-3 relative overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(item.count / Math.max(...scoreDistribution.map(s => s.count))) * 100}%` }}
                          transition={{ delay: index * 0.1, duration: 0.8 }}
                          className="bg-gradient-to-r from-blue-500 to-purple-500 h-full rounded-full"
                        />
                      </div>
                    </div>
                    <div className="w-12 text-sm text-gray-900 dark:text-gray-100 text-right flex-shrink-0">
                      {item.count.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
              </div>
            </div>
          )}

          {/* Top Countries */}
          {stats?.topCountries && stats.topCountries.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
              {/* Header with table header gradient */}
              <div className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 px-6 py-3 rounded-t-xl">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center mr-3">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Top quốc gia</h3>
                </div>
              </div>
              {/* Content */}
              <div className="p-6">
              <div className="space-y-3">
                {stats.topCountries.slice(0, 8).map((country, index) => (
                  <div key={country.country} className="flex items-center justify-between p-2.5 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center space-x-2 min-w-0 flex-1">
                      <span className="text-sm font-semibold text-gray-500 dark:text-gray-400 flex-shrink-0">#{index + 1}</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100 truncate">{country.country}</span>
                    </div>
                    <div className="flex items-center space-x-3 flex-shrink-0">
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        {country.count}
                      </span>
                      <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {country.avgScore}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
