import { useState, useEffect, useCallback } from 'react';
import { loadResultsService } from '../../../../backend';
import { getCountryFlag, getCountryFlagSvgByCode } from '../../../utils/country-flags';
import type { ResultsStats } from '../../../../backend';
import ResultsTestChart from './ResultsTestChart';
import DateRangeFilter from './DateRangeFilter';
import { useResultsData } from './hooks/useResultsData';
import { useResultsState } from './hooks/useResultsState';
import { useResultsActions } from './hooks/useResultsActions';
import { useResultsUrlSync } from './hooks/useResultsUrlSync';
import { ToastContainer } from '../common/Toast';

export default function AdminResults() {
  // Initialize state management with URL sync
  const {
    resultsData,
    setResultsData,
    isLoading,
    setIsLoading,
    error,
    setError,
    currentPage,
    setCurrentPage,
    displayCurrentPage,
    limit,
    setLimit,
    filters,
    setFilters,
    selectedResults,
    setSelectedResults,
    isDeleting,
    setIsDeleting,
    stats,
    setStats,
    estimatedStats,
    setEstimatedStats,
    scoreDistribution,
    setScoreDistribution,
    isMobile,
    setIsMobile,
    isInitialized,
    setIsInitialized,
    toasts,
    removeToast,
    showSuccess,
    showError,
    updateURL
  } = useResultsState();

  const [isExporting, setIsExporting] = useState(false);

  // Delete confirmation modal state
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    resultId: string;
    userName: string;
  }>({
    isOpen: false,
    resultId: '',
    userName: ''
  });

  // Bulk delete confirmation modal state
  const [bulkDeleteModal, setBulkDeleteModal] = useState<{
    isOpen: boolean;
    count: number;
  }>({
    isOpen: false,
    count: 0
  });

  // Delete handlers - handleDeleteClick only (others moved after fetchResults)
  const handleDeleteClick = useCallback((resultId: string, userName: string) => {
    setDeleteModal({
      isOpen: true,
      resultId,
      userName
    });
  }, []);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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
  }, [currentPage, limit, fetchResultsAdvanced, setSelectedResults]);

  // Delete handlers - moved here after fetchResults is defined
  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteModal.resultId || !resultsData) return;

    try {
      setIsDeleting(true);
      const ResultsService = await loadResultsService();
      const { error } = await ResultsService.deleteResult(deleteModal.resultId);

      if (error) {
        showError('Không thể xóa kết quả test');
        return;
      }

      showSuccess('Đã xóa kết quả test thành công');

      // 🗑️ CACHE INVALIDATION: Clear cache to prevent stale data
      cacheWithTTL.current.clear();

      // 🚀 UPDATE UI: Remove from UI after successful API call
      const updatedData = {
        ...resultsData,
        results: resultsData.results.filter(result => result.id !== deleteModal.resultId),
        total: resultsData.total - 1
      };
      setResultsData(updatedData);

      // Close modal
      setDeleteModal({ isOpen: false, resultId: '', userName: '' });

    } catch (err) {
      showError('Có lỗi xảy ra khi xóa kết quả test');
    } finally {
      setIsDeleting(false);
    }
  }, [deleteModal.resultId, resultsData, setResultsData, setIsDeleting, showError, showSuccess, cacheWithTTL]);

  const handleDeleteCancel = useCallback(() => {
    setDeleteModal({ isOpen: false, resultId: '', userName: '' });
  }, []);

  // Bulk delete handlers
  const handleBulkDeleteClick = useCallback(() => {
    if (selectedResults.size === 0) return;
    setBulkDeleteModal({
      isOpen: true,
      count: selectedResults.size
    });
  }, [selectedResults.size]);

  const handleBulkDeleteConfirm = useCallback(async () => {
    if (selectedResults.size === 0 || !resultsData) return;

    try {
      setIsDeleting(true);
      const { loadResultsService } = await import('../../../../backend');
      const ResultsService = await loadResultsService();
      const { data, error } = await ResultsService.deleteResults(Array.from(selectedResults));

      if (error) {
        showError('Có lỗi xảy ra khi xóa kết quả test');
        return;
      }

      showSuccess(`Đã xóa ${data} kết quả test thành công!`);

      // 🗑️ CACHE INVALIDATION: Clear cache to prevent stale data
      cacheWithTTL.current.clear();

      // 🚀 UPDATE UI: Remove deleted results from UI after successful API call
      const deletedIds = Array.from(selectedResults);
      const updatedData = {
        ...resultsData,
        results: resultsData.results.filter(result => !deletedIds.includes(result.id)),
        total: resultsData.total - data
      };
      setResultsData(updatedData);

      // Clear selection and close modal
      setSelectedResults(new Set());
      setBulkDeleteModal({ isOpen: false, count: 0 });

    } catch (err) {
      showError('Có lỗi xảy ra khi xóa kết quả test');
    } finally {
      setIsDeleting(false);
    }
  }, [selectedResults, resultsData, setResultsData, setIsDeleting, setSelectedResults, cacheWithTTL, showSuccess, showError]);

  const handleBulkDeleteCancel = useCallback(() => {
    setBulkDeleteModal({ isOpen: false, count: 0 });
  }, []);

  // Initialize actions hook
  const {
    handlePageChange,
    handleLimitChange,
    handleFilterChange,
    handleResultSelect,
    handleSelectAll
  } = useResultsActions({
    resultsData,
    setResultsData,
    currentPage,
    setCurrentPage,
    displayCurrentPage,
    filters,
    setFilters,
    limit,
    setLimit,
    selectedResults,
    setSelectedResults,
    setIsDeleting,
    setError,
    showSuccess,
    showError,
    updateURL,
    fetchResults,
    cacheWithTTL,
    setIsLoading
  });

  // URL synchronization
  useResultsUrlSync({
    displayCurrentPage,
    setCurrentPage,
    filters,
    setFilters,
    isInitialized,
    setIsInitialized,
    fetchResults,
    limit,
    setResultsData,
    setStats,
    setScoreDistribution
  });







  // Generate estimated stats from results data for instant display
  useEffect(() => {
    if (resultsData && resultsData.results.length > 0) {
      const results = resultsData.results;
      const avgScore = Math.round(results.reduce((sum, r) => sum + r.score, 0) / results.length);
      const today = new Date().toISOString().split('T')[0];
      const testsToday = results.filter(r => r.tested_at.startsWith(today)).length;

      // Generate estimated stats for instant display
      const estimated: ResultsStats = {
        totalTests: resultsData.total, // Exact from pagination
        averageScore: avgScore, // Estimated from current page
        totalParticipants: Math.round(resultsData.total * 0.8), // Estimated
        testsToday: testsToday, // Estimated from current page
        highestScore: Math.max(...results.map(r => r.score)),
        geniusCount: results.filter(r => r.score >= 140).length,
        averageDuration: Math.round(results.reduce((sum, r) => sum + (r.duration_seconds || 0), 0) / results.length),
        topCountries: []
      };

      console.log('⚡ INSTANT STATS: Generated from results data', estimated);
      setEstimatedStats(estimated);
    }
  }, [resultsData]);

  // Handle page hover - Prefetch for instant navigation
  const handlePageHover = (page: number) => {
    if (page !== currentPage && page >= 1 && (!resultsData || page <= resultsData.totalPages)) {
      console.log(`👆 PAGE HOVER: Prefetching page ${page}`);
      prefetchPage(page, filters, limit);
    }
  };

  // Handle export
  const handleExport = async () => {
    setIsExporting(true);
    try {
      const ResultsService = await loadResultsService();
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

      {/* Actions */}
      <td className="px-6 py-4 whitespace-nowrap text-center">
        <div className="w-5 h-5 bg-gray-200 dark:bg-gray-600 rounded mx-auto"></div>
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

      {/* Stats Cards - Instant Display */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {(stats || estimatedStats) ? (() => {
          const currentStats = stats || estimatedStats!;
          const isEstimated = !stats && estimatedStats;

          return [
            {
              title: 'Tổng số test',
              value: currentStats.totalTests.toLocaleString(),
              icon: '📊',
              color: 'from-blue-500 to-blue-600'
            },
            {
              title: 'Điểm trung bình',
              value: currentStats.averageScore.toString(),
              icon: '🎯',
              color: 'from-green-500 to-green-600'
            },
            {
              title: 'Người tham gia',
              value: currentStats.totalParticipants.toLocaleString(),
              icon: '👥',
              color: 'from-purple-500 to-purple-600'
            },
            {
              title: 'Test hôm nay',
              value: currentStats.testsToday.toString(),
              icon: '📅',
              color: 'from-orange-500 to-orange-600'
            }
          ].map((stat) => (
            <div
              key={stat.title}
              className={`bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow ${
                isEstimated ? 'opacity-90' : 'opacity-100'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                    {stat.title}
                    {isEstimated && <span className="ml-1 text-xs text-blue-500">~</span>}
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{stat.value}</p>
                </div>
                <div className="text-3xl">{stat.icon}</div>
              </div>
            </div>
          ));
        })() : (
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
                  onClick={handleBulkDeleteClick}
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
              {/* Table body with fixed min-height to prevent layout shift */}
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                      checked={selectedResults.size > 0 && selectedResults.size === resultsData?.results.length}
                      onChange={handleSelectAll}
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
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Hành động
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700" style={{ minHeight: '600px' }}>
                {/* Real results */}
                {resultsData?.results.map((result) => (
                  <tr key={result.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    {/* Checkbox */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                        checked={selectedResults.has(result.id)}
                        onChange={() => handleResultSelect(result.id)}
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

                    {/* Actions */}
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <button
                        onClick={() => handleDeleteClick(result.id, result.name || 'Unknown User')}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                        title="Xóa kết quả test"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}

                {/* Skeleton rows - Only show when loading */}
                {isLoading &&
                  Array.from({ length: limit }, (_, i) => (
                    <SkeletonTableRow key={`skeleton-${i}`} />
                  ))
                }
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
                        <div
                          style={{ width: `${(item.count / Math.max(...scoreDistribution.map(s => s.count))) * 100}%` }}
                          className="bg-gradient-to-r from-blue-500 to-purple-500 h-full rounded-full transition-all duration-300"
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

      {/* Bulk Delete Confirmation Modal */}
      {bulkDeleteModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  Xác nhận xóa hàng loạt
                </h3>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Bạn có chắc chắn muốn xóa <strong>{bulkDeleteModal.count}</strong> kết quả test đã chọn?
              </p>
              <p className="text-sm text-red-600 dark:text-red-400 mt-2">
                Hành động này không thể hoàn tác.
              </p>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={handleBulkDeleteCancel}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                onClick={handleBulkDeleteConfirm}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 flex items-center"
              >
                {isDeleting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Đang xóa...
                  </>
                ) : (
                  `Xác nhận xóa ${bulkDeleteModal.count} kết quả`
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  Xác nhận xóa
                </h3>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Bạn có chắc chắn muốn xóa kết quả test của <strong>{deleteModal.userName}</strong>?
              </p>
              <p className="text-sm text-red-600 dark:text-red-400 mt-2">
                Hành động này không thể hoàn tác.
              </p>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={handleDeleteCancel}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 flex items-center"
              >
                {isDeleting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Đang xóa...
                  </>
                ) : (
                  'Xác nhận xóa'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Container */}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
}
