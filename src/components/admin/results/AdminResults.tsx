import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ResultsService } from '../../../../backend';
import type { TestResult, ResultsStats, ResultsFilters, ResultsListResponse } from '../../../../backend';

export default function AdminResults() {
  const [resultsData, setResultsData] = useState<ResultsListResponse | null>(null);
  const [stats, setStats] = useState<ResultsStats | null>(null);
  const [scoreDistribution, setScoreDistribution] = useState<Array<{ range: string; count: number }> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<ResultsFilters>({
    user_type: 'all',
    search: '',
    test_type: 'iq'
  });
  const [isExporting, setIsExporting] = useState(false);

  const limit = 20;

  // Fetch results data
  const fetchResults = useCallback(async (page: number = currentPage) => {
    console.log(`🔍 Fetch results page ${page}`);
    setError('');
    
    try {
      const { data, error: fetchError } = await ResultsService.getResults(page, limit, filters);
      
      if (fetchError || !data) {
        setError('Không thể tải danh sách kết quả test');
        return;
      }
      
      console.log(`✅ Loaded results page ${page}`);
      setResultsData(data);
      
    } catch (err) {
      setError('Có lỗi xảy ra khi tải dữ liệu');
    }
  }, [currentPage, filters]);

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

  // Initial load
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([
        fetchResults(1),
        fetchStats(),
        fetchScoreDistribution()
      ]);
      setIsLoading(false);
    };
    
    loadData();
  }, [filters]);

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchResults(page);
  };

  // Handle filter change
  const handleFilterChange = (newFilters: Partial<ResultsFilters>) => {
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

  // Get badge color based on score
  const getBadgeColor = (score: number) => {
    if (score >= 140) return 'bg-purple-100 text-purple-800 border-purple-200';
    if (score >= 130) return 'bg-blue-100 text-blue-800 border-blue-200';
    if (score >= 115) return 'bg-green-100 text-green-800 border-green-200';
    if (score >= 100) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  // Get badge label based on score
  const getBadgeLabel = (score: number) => {
    if (score >= 140) return 'Thiên tài';
    if (score >= 130) return 'Rất cao';
    if (score >= 115) return 'Cao';
    if (score >= 100) return 'Trung bình cao';
    if (score >= 85) return 'Trung bình';
    return 'Dưới trung bình';
  };

  if (isLoading && !resultsData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
          <span className="text-gray-600 dark:text-gray-400 font-medium">Đang tải...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Quản lý kết quả test</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Phân tích và quản lý kết quả test IQ của người dùng</p>
        </div>
        <button
          onClick={handleExport}
          disabled={isExporting}
          className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg font-medium transition-colors"
        >
          {isExporting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Đang export...</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Export CSV</span>
            </>
          )}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
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
              className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-200"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{stat.value}</p>
                </div>
                <div className="text-3xl">{stat.icon}</div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Bộ lọc</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tìm kiếm</label>
            <input
              type="text"
              value={filters.search || ''}
              onChange={(e) => handleFilterChange({ search: e.target.value })}
              placeholder="Tên, email, quốc gia..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* User Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Loại user</label>
            <select
              value={filters.user_type || 'all'}
              onChange={(e) => handleFilterChange({ user_type: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">Tất cả</option>
              <option value="registered">Đã đăng ký</option>
              <option value="anonymous">Ẩn danh</option>
            </select>
          </div>

          {/* Score Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Điểm tối thiểu</label>
            <input
              type="number"
              value={filters.score_min || ''}
              onChange={(e) => handleFilterChange({ score_min: e.target.value ? parseInt(e.target.value) : undefined })}
              placeholder="70"
              min="0"
              max="200"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Điểm tối đa</label>
            <input
              type="number"
              value={filters.score_max || ''}
              onChange={(e) => handleFilterChange({ score_max: e.target.value ? parseInt(e.target.value) : undefined })}
              placeholder="200"
              min="0"
              max="200"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Results Table */}
      {resultsData && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Kết quả test ({resultsData.total.toLocaleString()})
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
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
                    Thông tin
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
                {resultsData.results.map((result) => (
                  <tr key={result.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
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
                      <div className="flex items-center space-x-2">
                        <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                          {result.score}
                        </span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getBadgeColor(result.score)}`}>
                          {getBadgeLabel(result.score)}
                        </span>
                      </div>
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

                    {/* Info */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-gray-100">
                        {result.age && `${result.age} tuổi`}
                        {result.age && result.country && ' • '}
                        {result.country}
                      </div>
                      {result.gender && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {result.gender === 'male' ? 'Nam' : result.gender === 'female' ? 'Nữ' : 'Khác'}
                        </div>
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
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {resultsData.totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  Hiển thị {((currentPage - 1) * limit) + 1} - {Math.min(currentPage * limit, resultsData.total)}
                  trong tổng số {resultsData.total.toLocaleString()} kết quả
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={!resultsData.hasPrev}
                    className="px-3 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Trước
                  </button>

                  <span className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Trang {currentPage} / {resultsData.totalPages}
                  </span>

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={!resultsData.hasNext}
                    className="px-3 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Sau
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Score Distribution Chart */}
      {scoreDistribution && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Phân bố điểm số</h3>
          <div className="space-y-3">
            {scoreDistribution.map((item, index) => (
              <div key={item.range} className="flex items-center">
                <div className="w-20 text-sm text-gray-600 dark:text-gray-400">{item.range}</div>
                <div className="flex-1 mx-4">
                  <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-4 relative overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(item.count / Math.max(...scoreDistribution.map(s => s.count))) * 100}%` }}
                      transition={{ delay: index * 0.1, duration: 0.8 }}
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-full rounded-full"
                    />
                  </div>
                </div>
                <div className="w-16 text-sm text-gray-900 dark:text-gray-100 text-right">
                  {item.count.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Countries */}
      {stats?.topCountries && stats.topCountries.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Top quốc gia</h3>
          <div className="space-y-3">
            {stats.topCountries.map((country, index) => (
              <div key={country.country} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center space-x-3">
                  <span className="text-lg font-semibold text-gray-500 dark:text-gray-400">#{index + 1}</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">{country.country}</span>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {country.count} test{country.count > 1 ? 's' : ''}
                  </span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    {country.avgScore} điểm TB
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
