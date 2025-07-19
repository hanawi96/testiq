import { useEffect, useCallback } from 'react';
import { ArticlesService } from '../../../../../backend';
import type { ArticlesFilters, ArticlesListResponse } from '../../../../../backend';
import { SmartPreloader } from '../../../../utils/admin/preloaders/preload-manager';

interface ArticlesOperationsConfig {
  // State
  currentPage: number;
  limit: number;
  filters: ArticlesFilters;
  selectedArticles: string[];
  articlesData: ArticlesListResponse | null;

  // Actions
  dispatch: (action: any) => void;
  setLoading: (payload: any) => void;
}

export function useArticlesOperations(config: ArticlesOperationsConfig) {
  const {
    currentPage,
    limit,
    filters,
    selectedArticles,
    articlesData,
    dispatch,
    setLoading
  } = config;

  // Fetch stats
  const fetchStats = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: { stats: true } });
    try {
      const { data: statsData, error: statsError } = await ArticlesService.getStats();
      if (!statsError && statsData) {
        dispatch({ type: 'SET_STATS', payload: statsData });
      }
    } catch (err) {
      console.warn('Could not fetch articles stats:', err);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: { stats: false } });
    }
  }, [dispatch]);

  // Fetch articles data
  const fetchArticles = useCallback(async (page: number = currentPage) => {
    dispatch({ type: 'SET_ERROR', payload: '' });
    dispatch({ type: 'SET_LOADING', payload: { articles: true } });

    try {
      const { data, error: fetchError } = await ArticlesService.getArticles(page, limit, filters);

      if (fetchError || !data) {
        dispatch({ type: 'SET_ERROR', payload: 'Không thể tải danh sách bài viết' });
        return;
      }

      // Auto-redirect to valid page if current page is out of range
      if (data.articles.length === 0 && data.total > 0 && page > 1) {
        const maxPage = Math.ceil(data.total / limit);
        const validPage = Math.min(page, maxPage);
        if (validPage !== page) {
          dispatch({ type: 'SET_UI', payload: { currentPage: validPage } });
          return fetchArticles(validPage);
        }
      }

      dispatch({ type: 'SET_ARTICLES_DATA', payload: data });
      dispatch({ type: 'SET_LOADING', payload: { articles: false } });

    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: 'Có lỗi xảy ra khi tải dữ liệu' });
      dispatch({ type: 'SET_LOADING', payload: { articles: false } });
      console.error('Frontend: Error fetching articles:', err);
    }
  }, [currentPage, filters, dispatch, limit]);

  // Initial load
  useEffect(() => {
    const loadData = async () => {
      await Promise.all([
        fetchArticles(1),
        fetchStats()
      ]);
    };

    loadData();

    // SMART PRELOADING: Trigger intelligent preload on navigation
    SmartPreloader.triggerSmartPreload('navigation');
  }, [filters, fetchArticles, fetchStats]);

  // Handle page change
  const handlePageChange = useCallback((page: number) => {
    // Validate page before changing
    if (articlesData && page > articlesData.totalPages) {
      return; // Don't allow navigation to invalid pages
    }
    if (page < 1) {
      return; // Don't allow navigation to pages less than 1
    }

    dispatch({ type: 'SET_UI', payload: { currentPage: page } });
    fetchArticles(page);
  }, [dispatch, fetchArticles, articlesData]);

  // Handle filter change
  const handleFilterChange = useCallback((newFilters: Partial<ArticlesFilters>) => {
    const updatedFilters = { ...filters, ...newFilters };

    dispatch({
      type: 'SET_UI',
      payload: {
        filters: updatedFilters,
        currentPage: 1
      }
    });

    // Update URL to maintain state
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);

      // Update or remove category parameter
      if (updatedFilters.category) {
        url.searchParams.set('category', updatedFilters.category);
      } else {
        url.searchParams.delete('category');
      }

      // Update or remove other filters
      if (updatedFilters.search) {
        url.searchParams.set('search', updatedFilters.search);
      } else {
        url.searchParams.delete('search');
      }

      if (updatedFilters.status && updatedFilters.status !== 'all') {
        url.searchParams.set('status', updatedFilters.status);
      } else {
        url.searchParams.delete('status');
      }

      if (updatedFilters.author) {
        url.searchParams.set('author', updatedFilters.author);
      } else {
        url.searchParams.delete('author');
      }

      // Update URL without page reload
      window.history.replaceState({}, '', url.toString());
    }
  }, [dispatch, filters]);

  // Handle limit change
  const handleLimitChange = useCallback((newLimit: number) => {
    dispatch({
      type: 'SET_UI',
      payload: {
        limit: newLimit,
        currentPage: 1 // Reset to page 1 when changing limit
      }
    });
  }, [dispatch]);

  // Handle article selection
  const handleSelectArticle = useCallback((articleId: string) => {
    dispatch({ type: 'TOGGLE_ARTICLE_SELECTION', payload: articleId });
  }, [dispatch]);

  // Handle select all
  const handleSelectAll = useCallback(() => {
    if (selectedArticles.length === articlesData?.articles.length) {
      dispatch({ type: 'CLEAR_SELECTION' });
    } else {
      const allIds = articlesData?.articles.map(a => a.id) || [];
      dispatch({
        type: 'SET_UI',
        payload: {
          selectedArticles: allIds,
          showBulkActions: allIds.length > 0
        }
      });
    }
  }, [selectedArticles, articlesData, dispatch]);

  // Handle bulk status update
  const handleBulkStatusUpdate = useCallback(async (status: 'published' | 'draft' | 'archived') => {
    if (selectedArticles.length === 0) return;
    
    setLoading({ updating: true });
    try {
      const { data: updatedCount, error } = await ArticlesService.bulkUpdateStatus(selectedArticles, status);
      if (!error) {
        await fetchArticles(currentPage);
        await fetchStats();
        dispatch({ type: 'CLEAR_SELECTION' });
        alert(`Đã cập nhật ${updatedCount} bài viết`);
      } else {
        dispatch({ type: 'SET_ERROR', payload: 'Không thể cập nhật trạng thái bài viết' });
      }
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: 'Có lỗi xảy ra khi cập nhật' });
    } finally {
      setLoading({ updating: false });
    }
  }, [selectedArticles, setLoading, fetchArticles, currentPage, fetchStats, dispatch]);

  // Handle delete article
  const handleDeleteArticle = useCallback(async (articleId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa bài viết này?')) return;

    setLoading({ updating: true });
    try {
      const { error } = await ArticlesService.deleteArticle(articleId);
      if (!error) {
        await fetchArticles(currentPage);
        await fetchStats();
      } else {
        dispatch({ type: 'SET_ERROR', payload: 'Không thể xóa bài viết' });
      }
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: 'Có lỗi xảy ra khi xóa' });
    } finally {
      setLoading({ updating: false });
    }
  }, [setLoading, fetchArticles, currentPage, fetchStats, dispatch]);

  return {
    // Data fetching
    fetchStats,
    fetchArticles,

    // Event handlers
    handlePageChange,
    handleFilterChange,
    handleLimitChange,
    handleSelectArticle,
    handleSelectAll,
    handleBulkStatusUpdate,
    handleDeleteArticle
  };
}
