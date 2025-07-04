import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArticlesService } from '../../../../backend';
import type { Article, ArticleStats, ArticlesFilters, ArticlesListResponse } from '../../../../backend';
import QuickTagsEditor from './QuickTagsEditor';
import QuickAuthorEditor from './QuickAuthorEditor';

export default function AdminArticles() {
  const [articlesData, setArticlesData] = useState<ArticlesListResponse | null>(null);
  const [stats, setStats] = useState<ArticleStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<ArticlesFilters>({
    status: 'all',
    search: '',
    sort_by: 'created_at',
    sort_order: 'desc'
  });
  const [selectedArticles, setSelectedArticles] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Quick editors state
  const [quickTagsEditor, setQuickTagsEditor] = useState<{
    articleId: string;
    position: { top: number; left: number };
  } | null>(null);
  const [quickAuthorEditor, setQuickAuthorEditor] = useState<{
    articleId: string;
    position: { top: number; left: number };
  } | null>(null);

  const limit = 10;

  // Fetch articles data
  const fetchArticles = useCallback(async (page: number = currentPage) => {
    console.log(`🔍 Fetch articles page ${page}`);
    setError('');
    
    try {
      const { data, error: fetchError } = await ArticlesService.getArticles(page, limit, filters);
      
      if (fetchError || !data) {
        setError('Không thể tải danh sách bài viết');
        return;
      }
      
      console.log(`✅ Loaded articles page ${page}`);
      setArticlesData(data);
      
    } catch (err) {
      setError('Có lỗi xảy ra khi tải dữ liệu');
    }
  }, [currentPage, filters]);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const { data: statsData, error: statsError } = await ArticlesService.getStats();
      if (!statsError && statsData) {
        setStats(statsData);
      }
    } catch (err) {
      console.warn('Could not fetch articles stats:', err);
    }
  }, []);

  // Initial load
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([
        fetchArticles(1),
        fetchStats()
      ]);
      setIsLoading(false);
    };
    
    loadData();
  }, [filters]);

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchArticles(page);
  };

  // Handle filter change
  const handleFilterChange = (newFilters: Partial<ArticlesFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setCurrentPage(1);
  };

  // Handle article selection
  const handleSelectArticle = (articleId: string) => {
    setSelectedArticles(prev => {
      const newSelection = prev.includes(articleId)
        ? prev.filter(id => id !== articleId)
        : [...prev, articleId];
      setShowBulkActions(newSelection.length > 0);
      return newSelection;
    });
  };

  // Handle select all
  const handleSelectAll = () => {
    if (selectedArticles.length === articlesData?.articles.length) {
      setSelectedArticles([]);
      setShowBulkActions(false);
    } else {
      const allIds = articlesData?.articles.map(a => a.id) || [];
      setSelectedArticles(allIds);
      setShowBulkActions(true);
    }
  };

  // Handle status update
  const handleStatusUpdate = async (articleId: string, status: 'published' | 'draft' | 'archived') => {
    setIsUpdating(true);
    try {
      const { error } = await ArticlesService.updateStatus(articleId, status);
      if (!error) {
        await fetchArticles(currentPage);
        await fetchStats();
      } else {
        setError('Không thể cập nhật trạng thái bài viết');
      }
    } catch (err) {
      setError('Có lỗi xảy ra khi cập nhật');
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle bulk status update
  const handleBulkStatusUpdate = async (status: 'published' | 'draft' | 'archived') => {
    if (selectedArticles.length === 0) return;
    
    setIsUpdating(true);
    try {
      const { data: updatedCount, error } = await ArticlesService.bulkUpdateStatus(selectedArticles, status);
      if (!error) {
        await fetchArticles(currentPage);
        await fetchStats();
        setSelectedArticles([]);
        setShowBulkActions(false);
        alert(`Đã cập nhật ${updatedCount} bài viết`);
      } else {
        setError('Không thể cập nhật trạng thái bài viết');
      }
    } catch (err) {
      setError('Có lỗi xảy ra khi cập nhật');
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle delete article
  const handleDeleteArticle = async (articleId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa bài viết này?')) return;

    setIsUpdating(true);
    try {
      const { error } = await ArticlesService.deleteArticle(articleId);
      if (!error) {
        await fetchArticles(currentPage);
        await fetchStats();
      } else {
        setError('Không thể xóa bài viết');
      }
    } catch (err) {
      setError('Có lỗi xảy ra khi xóa');
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle quick tags edit with toggle behavior
  const handleQuickTagsEdit = (event: React.MouseEvent, articleId: string) => {
    event.stopPropagation();

    // Close author editor if open
    setQuickAuthorEditor(null);

    // Toggle: if same article editor is open, close it
    if (quickTagsEditor?.articleId === articleId) {
      setQuickTagsEditor(null);
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const popupWidth = 320; // QuickTagsEditor width (w-80 = 320px)
    const popupHeight = 400; // Estimated popup height

    // Calculate position relative to viewport (for fixed positioning)
    let left = rect.left;
    let top = rect.bottom + 4;

    // Adjust horizontal position if popup would overflow viewport
    if (left + popupWidth > window.innerWidth) {
      left = window.innerWidth - popupWidth - 16;
    }
    if (left < 16) {
      left = 16;
    }

    // Adjust vertical position if popup would overflow viewport
    if (top + popupHeight > window.innerHeight) {
      top = rect.top - popupHeight - 4; // Show above button
    }

    setQuickTagsEditor({
      articleId,
      position: { top, left }
    });
  };

  // Handle quick author edit with toggle behavior
  const handleQuickAuthorEdit = (event: React.MouseEvent, articleId: string) => {
    event.stopPropagation();

    // Close tags editor if open
    setQuickTagsEditor(null);

    // Toggle: if same article editor is open, close it
    if (quickAuthorEditor?.articleId === articleId) {
      setQuickAuthorEditor(null);
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const popupWidth = 288; // QuickAuthorEditor width (w-72 = 288px)
    const popupHeight = 300; // Estimated popup height

    // Calculate position relative to viewport (for fixed positioning)
    let left = rect.left;
    let top = rect.bottom + 4;

    // Adjust horizontal position if popup would overflow viewport
    if (left + popupWidth > window.innerWidth) {
      left = window.innerWidth - popupWidth - 16;
    }
    if (left < 16) {
      left = 16;
    }

    // Adjust vertical position if popup would overflow viewport
    if (top + popupHeight > window.innerHeight) {
      top = rect.top - popupHeight - 4; // Show above button
    }

    setQuickAuthorEditor({
      articleId,
      position: { top, left }
    });
  };

  // Handle tags update
  const handleTagsUpdate = (articleId: string, newTags: string[]) => {
    if (articlesData) {
      const updatedArticles = articlesData.articles.map(article =>
        article.id === articleId ? { ...article, tags: newTags } : article
      );
      setArticlesData({ ...articlesData, articles: updatedArticles });
    }
  };

  // Handle author update
  const handleAuthorUpdate = (articleId: string, newAuthor: string) => {
    if (articlesData) {
      const updatedArticles = articlesData.articles.map(article =>
        article.id === articleId ? { ...article, author: newAuthor } : article
      );
      setArticlesData({ ...articlesData, articles: updatedArticles });
    }
  };

  // Get status badge color
  const getStatusBadge = (status: string) => {
    const styles = {
      published: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800',
      draft: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800',
      archived: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600'
    };
    return styles[status as keyof typeof styles] || styles.draft;
  };

  // Get status label
  const getStatusLabel = (status: string) => {
    const labels = {
      published: 'Đã xuất bản',
      draft: 'Nháp',
      archived: 'Lưu trữ'
    };
    return labels[status as keyof typeof labels] || status;
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Format number
  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  };

  if (isLoading && !articlesData) {
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Quản lý bài viết</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Quản lý nội dung và bài viết trên website</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <a
            href="/admin/articles/create"
            className="flex items-center space-x-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Tạo bài viết</span>
          </a>
        </div>
      </div>

      {/* Error */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4"
        >
          <div className="flex">
            <svg className="h-5 w-5 text-red-400 dark:text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="ml-3">
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              title: 'Tổng bài viết',
              value: stats.total.toLocaleString(),
              icon: '📄',
              color: 'from-blue-500 to-blue-600',
              bgColor: 'bg-blue-50 dark:bg-blue-900/30',
              textColor: 'text-blue-600 dark:text-blue-400'
            },
            {
              title: 'Đã xuất bản',
              value: stats.published.toString(),
              icon: '✅',
              color: 'from-green-500 to-green-600',
              bgColor: 'bg-green-50 dark:bg-green-900/30',
              textColor: 'text-green-600 dark:text-green-400'
            },
            {
              title: 'Bài nháp',
              value: stats.draft.toString(),
              icon: '📝',
              color: 'from-yellow-500 to-yellow-600',
              bgColor: 'bg-yellow-50 dark:bg-yellow-900/30',
              textColor: 'text-yellow-600 dark:text-yellow-400'
            },
            {
              title: 'Lượt xem',
              value: formatNumber(stats.totalViews),
              icon: '👁️',
              color: 'from-purple-500 to-purple-600',
              bgColor: 'bg-purple-50 dark:bg-purple-900/30',
              textColor: 'text-purple-600 dark:text-purple-400'
            }
          ].map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg rounded-lg"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{stat.value}</p>
                </div>
                <div className={`w-12 h-12 ${stat.bgColor} rounded-lg flex items-center justify-center ${stat.textColor}`}>
                  <span className="text-2xl">{stat.icon}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tìm kiếm</label>
            <input
              type="text"
              value={filters.search || ''}
              onChange={(e) => handleFilterChange({ search: e.target.value })}
              placeholder="Tiêu đề, tác giả, tags..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Trạng thái</label>
            <select
              value={filters.status || 'all'}
              onChange={(e) => handleFilterChange({ status: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">Tất cả</option>
              <option value="published">Đã xuất bản</option>
              <option value="draft">Nháp</option>
              <option value="archived">Lưu trữ</option>
            </select>
          </div>

          {/* Sort By */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Sắp xếp theo</label>
            <select
              value={filters.sort_by || 'created_at'}
              onChange={(e) => handleFilterChange({ sort_by: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="created_at">Ngày tạo</option>
              <option value="updated_at">Ngày cập nhật</option>
              <option value="views">Lượt xem</option>
              <option value="title">Tiêu đề</option>
            </select>
          </div>

          {/* Sort Order */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Thứ tự</label>
            <select
              value={filters.sort_order || 'desc'}
              onChange={(e) => handleFilterChange({ sort_order: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="desc">Giảm dần</option>
              <option value="asc">Tăng dần</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      <AnimatePresence>
        {showBulkActions && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Đã chọn {selectedArticles.length} bài viết
                </span>
                <button
                  onClick={() => {
                    setSelectedArticles([]);
                    setShowBulkActions(false);
                  }}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
                >
                  Bỏ chọn
                </button>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleBulkStatusUpdate('published')}
                  disabled={isUpdating}
                  className="px-3 py-1 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white text-sm rounded-md transition-colors"
                >
                  Xuất bản
                </button>
                <button
                  onClick={() => handleBulkStatusUpdate('draft')}
                  disabled={isUpdating}
                  className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 disabled:bg-yellow-400 text-white text-sm rounded-md transition-colors"
                >
                  Chuyển nháp
                </button>
                <button
                  onClick={() => handleBulkStatusUpdate('archived')}
                  disabled={isUpdating}
                  className="px-3 py-1 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white text-sm rounded-md transition-colors"
                >
                  Lưu trữ
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Articles Table */}
      {articlesData && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Danh sách bài viết ({articlesData.total.toLocaleString()})
              </h3>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={selectedArticles.length === articlesData.articles.length && articlesData.articles.length > 0}
                  onChange={handleSelectAll}
                  className="rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">Chọn tất cả</span>
              </div>
            </div>
          </div>

          {articlesData.articles.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">Không có bài viết nào</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Thử điều chỉnh bộ lọc để xem kết quả khác</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Bài viết
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Tác giả
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Trạng thái
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Thống kê
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Ngày
                    </th>
                    <th className="relative px-6 py-3">
                      <span className="sr-only">Hành động</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {articlesData.articles.map((article) => (
                    <tr
                      key={article.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      {/* Article Info */}
                      <td className="px-6 py-4">
                        <div className="flex items-start space-x-4">
                          <input
                            type="checkbox"
                            checked={selectedArticles.includes(article.id)}
                            onChange={() => handleSelectArticle(article.id)}
                            className="mt-1 rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-2">
                              {article.title}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                              {article.excerpt}
                            </div>
                            <div className="flex items-center space-x-2 mt-2">
                              <div className="flex items-center space-x-2">
                                {article.tags.slice(0, 3).map((tag, index) => (
                                  <span
                                    key={index}
                                    className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300"
                                  >
                                    {tag}
                                  </span>
                                ))}
                                {article.tags.length > 3 && (
                                  <span className="text-xs text-gray-500 dark:text-gray-400">
                                    +{article.tags.length - 3} khác
                                  </span>
                                )}
                              </div>
                              <button
                                onClick={(e) => handleQuickTagsEdit(e, article.id)}
                                className="p-1 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-200"
                                title="Chỉnh sửa tags"
                                data-quick-edit-button="tags"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Author */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <div>
                            <div className="text-sm text-gray-900 dark:text-gray-100">{article.author}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {article.reading_time} phút đọc
                            </div>
                          </div>
                          <button
                            onClick={(e) => handleQuickAuthorEdit(e, article.id)}
                            className="p-1 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-200"
                            title="Chỉnh sửa tác giả"
                            data-quick-edit-button="author"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusBadge(article.status)}`}>
                          {getStatusLabel(article.status)}
                        </span>
                      </td>

                      {/* Stats */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                          <div className="flex items-center space-x-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            <span>{formatNumber(article.views)}</span>
                          </div>
                        </div>
                      </td>

                      {/* Date */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-gray-100">
                          {formatDate(article.created_at)}
                        </div>
                        {article.updated_at !== article.created_at && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Sửa: {formatDate(article.updated_at)}
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          {/* Status Toggle */}
                          {article.status === 'draft' && (
                            <button
                              onClick={() => handleStatusUpdate(article.id, 'published')}
                              disabled={isUpdating}
                              className="text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-200 disabled:opacity-50"
                              title="Xuất bản"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </button>
                          )}

                          {article.status === 'published' && (
                            <button
                              onClick={() => handleStatusUpdate(article.id, 'draft')}
                              disabled={isUpdating}
                              className="text-yellow-600 dark:text-yellow-400 hover:text-yellow-900 dark:hover:text-yellow-200 disabled:opacity-50"
                              title="Chuyển về nháp"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                              </svg>
                            </button>
                          )}

                          {/* Edit */}
                          <a
                            href={`/admin/articles/edit/${article.id}`}
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-200"
                            title="Sửa"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </a>

                          {/* Delete */}
                          <button
                            onClick={() => handleDeleteArticle(article.id)}
                            disabled={isUpdating}
                            className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-200 disabled:opacity-50"
                            title="Xóa"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {articlesData.totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  Hiển thị {((currentPage - 1) * limit) + 1} - {Math.min(currentPage * limit, articlesData.total)}
                  trong tổng số {articlesData.total.toLocaleString()} bài viết
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={!articlesData.hasPrev}
                    className="px-3 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Trước
                  </button>

                  <span className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Trang {currentPage} / {articlesData.totalPages}
                  </span>

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={!articlesData.hasNext}
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

      {/* Quick Editors */}
      <AnimatePresence>
        {quickTagsEditor && (
          <QuickTagsEditor
            articleId={quickTagsEditor.articleId}
            currentTags={articlesData?.articles.find(a => a.id === quickTagsEditor.articleId)?.tags || []}
            onUpdate={handleTagsUpdate}
            onClose={() => setQuickTagsEditor(null)}
            position={quickTagsEditor.position}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {quickAuthorEditor && (
          <QuickAuthorEditor
            articleId={quickAuthorEditor.articleId}
            currentAuthor={articlesData?.articles.find(a => a.id === quickAuthorEditor.articleId)?.author || ''}
            onUpdate={handleAuthorUpdate}
            onClose={() => setQuickAuthorEditor(null)}
            position={quickAuthorEditor.position}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
