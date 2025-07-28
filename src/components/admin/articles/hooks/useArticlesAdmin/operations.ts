/**
 * OPERATIONS FOR ARTICLES ADMIN
 * Business logic operations for the unified articles admin hook
 */

import { useCallback } from 'react';
// Lazy load heavy services
const loadArticlesService = () => import('../../../../../../backend').then(m => m.ArticlesService);
import type { ArticlesFilters } from '../../../../../../backend';
import type { UseToastResult } from '../../../common/Toast';
import type { AdminArticlesState, LoadingStates } from './types';

// ===== DEBUG UTILITY =====
const debug = {
  admin: (msg: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`🎛️ ARTICLES ADMIN: ${msg}`, data || '');
    }
  }
};

interface OperationsConfig {
  state: AdminArticlesState;
  dispatch: (action: any) => void;
  setLoading: (payload: Partial<LoadingStates>) => void;
  toast: UseToastResult;
  fetchArticles: (page: number, limit?: number) => Promise<void>;
  fetchStats: () => Promise<void>;
  updateURL: (page: number, filters: ArticlesFilters) => void;
  getCacheKey: (page: number, filters: ArticlesFilters, limit: number) => string;
  getCachedData: (cacheKey: string) => any;
  prefetchPage: (page: number, filters: ArticlesFilters, limit: number) => Promise<void>;
}

export function useArticlesOperations(config: OperationsConfig) {
  const {
    state,
    dispatch,
    setLoading,
    toast,
    fetchArticles,
    fetchStats,
    updateURL,
    getCacheKey,
    getCachedData,
    prefetchPage
  } = config;

  const { showSuccess, showError } = toast;

  // ===== PAGE OPERATIONS =====
  const handlePageChange = useCallback((page: number) => {
    // Validate page before changing
    if (state.articlesData && page > state.articlesData.totalPages) {
      debug.admin(`Invalid page ${page} > ${state.articlesData.totalPages}`);
      return;
    }
    if (page < 1) {
      debug.admin(`Invalid page ${page} < 1`);
      return;
    }

    // Prevent unnecessary re-fetch if already on the same page
    if (page === state.currentPage) {
      debug.admin(`Already on page ${page}, skipping`);
      return;
    }

    debug.admin(`Changing to page ${page}`);

    // Update current page and URL immediately
    dispatch({ type: 'SET_UI', payload: { currentPage: page } });
    updateURL(page, state.filters);

    // Check cache before calling fetchArticles
    const cacheKey = getCacheKey(page, state.filters, state.limit);
    const cachedData = getCachedData(cacheKey);

    if (cachedData && cachedData.isValid) {
      // Instant display from cache
      debug.admin(`Using cached data for page ${page}`);
      dispatch({ type: 'SET_ARTICLES_DATA', payload: cachedData.data });
      dispatch({ type: 'SET_ERROR', payload: '' });
      dispatch({ type: 'SET_LOADING', payload: { articles: false } });
    } else {
      // No cache or stale cache, fetch from API
      debug.admin(`Fetching fresh data for page ${page}`);
      fetchArticles(page);
    }
  }, [dispatch, fetchArticles, state.articlesData, updateURL, state.filters, state.currentPage, getCacheKey, getCachedData, state.limit]);

  const handlePageHover = useCallback((page: number) => {
    const cacheKey = getCacheKey(page, state.filters, state.limit);
    const cachedData = getCachedData(cacheKey);
    if (!cachedData) {
      prefetchPage(page, state.filters, state.limit);
    }
  }, [getCacheKey, getCachedData, prefetchPage, state.filters, state.limit]);

  const handleFilterChange = useCallback(async (newFilters: Partial<ArticlesFilters>) => {
    const updatedFilters = { ...state.filters, ...newFilters };

    debug.admin('Filter change', { from: state.filters, to: updatedFilters });

    // Clear cache for old filter set to prevent stale data
    const oldCacheKey = getCacheKey(state.currentPage, state.filters, state.limit);
    debug.admin(`Clearing old cache key: ${oldCacheKey}`);

    dispatch({ type: 'SET_UI', payload: {
      filters: updatedFilters,
      currentPage: 1,
      selectedArticles: [],
      showBulkActions: false
    } });

    updateURL(1, updatedFilters);
    await fetchArticles(1);
  }, [state.filters, state.currentPage, state.limit, dispatch, updateURL, fetchArticles, getCacheKey]);

  const handleLimitChange = useCallback(async (newLimit: number) => {
    dispatch({ type: 'SET_UI', payload: { 
      limit: newLimit, 
      currentPage: 1,
      selectedArticles: [],
      showBulkActions: false
    } });
    
    updateURL(1, state.filters);
    await fetchArticles(1, newLimit);
  }, [dispatch, updateURL, state.filters, fetchArticles]);

  // ===== SELECTION OPERATIONS =====
  const handleSelectArticle = useCallback((articleId: string) => {
    dispatch({ type: 'TOGGLE_ARTICLE_SELECTION', payload: articleId });
  }, [dispatch]);

  const handleSelectAll = useCallback(() => {
    if (!state.articlesData?.articles) return;
    
    const allIds = state.articlesData.articles.map(article => article.id);
    const allSelected = allIds.every(id => state.selectedArticles.includes(id));
    
    if (allSelected) {
      dispatch({ type: 'CLEAR_SELECTION' });
    } else {
      dispatch({ type: 'SET_UI', payload: { 
        selectedArticles: allIds,
        showBulkActions: true
      } });
    }
  }, [state.articlesData, state.selectedArticles, dispatch]);

  // ===== BULK OPERATIONS =====
  const handleBulkStatusUpdate = useCallback(async (status: 'draft' | 'published') => {
    if (state.selectedArticles.length === 0) return;

    setLoading({ updating: true });
    
    try {
      const ArticlesService = await loadArticlesService();
      const { error } = await ArticlesService.bulkUpdateStatus(state.selectedArticles, status);
      
      if (error) {
        showError('Không thể cập nhật trạng thái hàng loạt');
      } else {
        showSuccess(`Đã cập nhật trạng thái ${state.selectedArticles.length} bài viết`);
        dispatch({ type: 'CLEAR_SELECTION' });
        await Promise.all([fetchArticles(state.currentPage), fetchStats()]);
      }
    } catch (err) {
      showError('Có lỗi xảy ra khi cập nhật hàng loạt');
    } finally {
      setLoading({ updating: false });
    }
  }, [state.selectedArticles, setLoading, showSuccess, showError, dispatch, fetchArticles, state.currentPage, fetchStats]);

  const handleBulkDelete = useCallback(async () => {
    if (state.selectedArticles.length === 0) return;

    setLoading({ updating: true });
    
    try {
      const ArticlesService = await loadArticlesService();
      const { error } = await ArticlesService.bulkDeleteArticles(state.selectedArticles);
      
      if (error) {
        showError('Không thể xóa bài viết hàng loạt');
      } else {
        showSuccess(`Đã xóa ${state.selectedArticles.length} bài viết`);
        dispatch({ type: 'CLEAR_SELECTION' });
        await Promise.all([fetchArticles(state.currentPage), fetchStats()]);
      }
    } catch (err) {
      showError('Có lỗi xảy ra khi xóa hàng loạt');
    } finally {
      setLoading({ updating: false });
    }
  }, [state.selectedArticles, setLoading, showSuccess, showError, dispatch, fetchArticles, state.currentPage, fetchStats]);

  const handleDeleteArticle = useCallback(async (articleId: string) => {
    // Find article title for confirmation
    const article = state.articlesData?.articles.find(a => a.id === articleId);
    const articleTitle = article?.title || 'bài viết này';

    // Confirmation dialog
    if (!confirm(`Bạn có chắc chắn muốn xóa "${articleTitle}"?\n\nHành động này không thể hoàn tác.`)) {
      return;
    }

    setLoading({ updating: true });

    try {
      const ArticlesService = await loadArticlesService();
      const { error } = await ArticlesService.deleteArticle(articleId);

      if (error) {
        showError('Không thể xóa bài viết');
      } else {
        showSuccess('Đã xóa bài viết thành công');
        await Promise.all([fetchArticles(state.currentPage), fetchStats()]);
      }
    } catch (err) {
      showError('Có lỗi xảy ra khi xóa bài viết');
    } finally {
      setLoading({ updating: false });
    }
  }, [setLoading, showSuccess, showError, fetchArticles, state.currentPage, fetchStats, state.articlesData]);

  return {
    handlePageChange,
    handlePageHover,
    handleFilterChange,
    handleLimitChange,
    handleSelectArticle,
    handleSelectAll,
    handleBulkStatusUpdate,
    handleBulkDelete,
    handleDeleteArticle
  };
}
