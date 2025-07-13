import { useEffect, useCallback } from 'react';
import { ArticlesService } from '../../../../../backend';
import type { ArticlesFilters, ArticlesListResponse } from '../../../../../backend';
import { SmartPreloader } from '../../../../utils/admin/preloaders/preload-manager';

interface ArticlesOperationsConfig {
  // State
  currentPage: number;
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
    filters,
    selectedArticles,
    articlesData,
    dispatch,
    setLoading
  } = config;

  const limit = 10;

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

      dispatch({ type: 'SET_ARTICLES_DATA', payload: data });
      dispatch({ type: 'SET_LOADING', payload: { articles: false } });

    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: 'Có lỗi xảy ra khi tải dữ liệu' });
      dispatch({ type: 'SET_LOADING', payload: { articles: false } });
      console.error('Frontend: Error fetching articles:', err);
    }
  }, [currentPage, filters, dispatch]);

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
    dispatch({ type: 'SET_UI', payload: { currentPage: page } });
    fetchArticles(page);
  }, [dispatch, fetchArticles]);

  // Handle filter change
  const handleFilterChange = useCallback((newFilters: Partial<ArticlesFilters>) => {
    dispatch({
      type: 'SET_UI',
      payload: {
        filters: { ...filters, ...newFilters },
        currentPage: 1
      }
    });
  }, [dispatch, filters]);

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
    // Constants
    limit,

    // Data fetching
    fetchStats,
    fetchArticles,

    // Event handlers
    handlePageChange,
    handleFilterChange,
    handleSelectArticle,
    handleSelectAll,
    handleBulkStatusUpdate,
    handleDeleteArticle
  };
}
