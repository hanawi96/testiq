import { useEffect, useCallback } from 'react';
import { ArticlesService } from '../../../../../backend';
import type { ArticlesFilters, ArticlesListResponse } from '../../../../../backend';
import { SmartPreloader } from '../../../../utils/admin/preloaders/preload-manager';
import type { UseToastResult } from '../../common/Toast';
import { useArticlesData } from './useArticlesData';
import { useArticlesEffects } from './useArticlesEffects';

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
  
  // Toast
  toast: UseToastResult;
}

export function useArticlesOperations(config: ArticlesOperationsConfig) {
  const {
    currentPage,
    limit,
    filters,
    selectedArticles,
    articlesData,
    dispatch,
    setLoading,
    toast
  } = config;

  // Destructure toast methods
  const { showSuccess, showError, showInfo } = toast;

  // Initialize articles data hook with cache and SSR support
  const {
    fetchArticles,
    fetchStats,
    hydrateFromSSR,
    getCacheKey,
    cacheWithTTL,
    prefetchPage,
    initialLoadDone
  } = useArticlesData({
    filters,
    limit,
    currentPage,
    dispatch,
    setLoading
  });

  // Initialize effects hook for URL sync and browser history
  const { updateURL } = useArticlesEffects({
    dispatch,
    filters,
    currentPage
  });

  // Note: fetchStats and fetchArticles are now provided by useArticlesData hook

  // Initial load with SSR hydration support
  useEffect(() => {
    // Prevent infinite loops - only run once for initial load
    if (initialLoadDone.current) return;
    initialLoadDone.current = true;

    const loadData = async () => {
      // Try SSR hydration first
      const { articlesUsed, statsUsed } = hydrateFromSSR();

      // Fetch missing data
      const promises = [];
      if (!articlesUsed) {
        promises.push(fetchArticles(1));
      }
      if (!statsUsed) {
        promises.push(fetchStats());
      }

      if (promises.length > 0) {
        await Promise.all(promises);
      }
    };

    loadData();

    // SMART PRELOADING: Trigger intelligent preload on navigation
    SmartPreloader.triggerSmartPreload('navigation');
  }, [fetchArticles, fetchStats, hydrateFromSSR]);



  // Handle page change - SIMPLIFIED: Let fetchArticles handle all cache logic
  const handlePageChange = useCallback((page: number) => {
    // Validate page before changing
    if (articlesData && page > articlesData.totalPages) {
      console.log(`❌ PAGE CHANGE: Invalid page ${page} > ${articlesData.totalPages}`);
      return; // Don't allow navigation to invalid pages
    }
    if (page < 1) {
      console.log(`❌ PAGE CHANGE: Invalid page ${page} < 1`);
      return; // Don't allow navigation to pages less than 1
    }



    // Update current page and URL immediately
    dispatch({ type: 'SET_UI', payload: { currentPage: page } });
    updateURL(page, filters);

    // Double check cache before calling fetchArticles
    const cacheKey = getCacheKey(page, filters, limit);
    const cached = cacheWithTTL.current.get(cacheKey);

    if (cached) {
      // Instant display from cache
      dispatch({ type: 'SET_ARTICLES_DATA', payload: cached.data });
      dispatch({ type: 'SET_ERROR', payload: '' });
      dispatch({ type: 'SET_LOADING', payload: { articles: false } });
    } else {
      // No cache, fetch from API
      fetchArticles(page);
    }
  }, [dispatch, fetchArticles, articlesData, updateURL, filters, currentPage]);

  // Proactive prefetch on hover
  const handlePageHover = useCallback((page: number) => {
    const cacheKey = getCacheKey(page, filters, limit);
    if (!cacheWithTTL.current.has(cacheKey)) {
      prefetchPage(page, filters, limit);
    }
  }, [getCacheKey, cacheWithTTL, prefetchPage, filters, limit]);

  // Handle filter change with URL sync and immediate fetch
  const handleFilterChange = useCallback(async (newFilters: Partial<ArticlesFilters>) => {
    const updatedFilters = { ...filters, ...newFilters };

    dispatch({
      type: 'SET_UI',
      payload: {
        filters: updatedFilters,
        currentPage: 1 // Reset to page 1 when filters change
      }
    });

    // Update URL immediately
    updateURL(1, updatedFilters);

    // Fetch data immediately with new filters
    dispatch({ type: 'SET_LOADING', payload: { articles: true } });
    dispatch({ type: 'SET_ERROR', payload: '' });

    try {
      const { data, error: fetchError } = await ArticlesService.getArticles(1, limit, updatedFilters);

      if (fetchError || !data) {
        dispatch({ type: 'SET_ERROR', payload: 'Không thể tải danh sách bài viết' });
        return;
      }

      dispatch({ type: 'SET_ARTICLES_DATA', payload: data });
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: 'Có lỗi xảy ra khi tải dữ liệu' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: { articles: false } });
    }
  }, [dispatch, filters, updateURL, limit]);

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
        showSuccess(`Cập nhật thành công`, `Đã cập nhật ${updatedCount} bài viết thành trạng thái ${status}`);
      } else {
        dispatch({ type: 'SET_ERROR', payload: 'Không thể cập nhật trạng thái bài viết' });
        showError('Lỗi cập nhật', 'Không thể cập nhật trạng thái bài viết');
      }
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: 'Có lỗi xảy ra khi cập nhật' });
      showError('Lỗi hệ thống', 'Có lỗi xảy ra khi cập nhật');
    } finally {
      setLoading({ updating: false });
    }
  }, [selectedArticles, setLoading, fetchArticles, currentPage, fetchStats, dispatch, showSuccess, showError]);

  // Handle bulk delete
  const handleBulkDelete = useCallback(async () => {
    if (selectedArticles.length === 0) return;
    
    if (!confirm(`Bạn có chắc chắn muốn xóa ${selectedArticles.length} bài viết đã chọn? Hành động này không thể khôi phục.`)) {
      return;
    }
    
    setLoading({ updating: true });
    try {
      const { data: deletedCount, error } = await ArticlesService.bulkDeleteArticles(selectedArticles);
      if (!error) {
        await fetchArticles(currentPage);
        await fetchStats();
        dispatch({ type: 'CLEAR_SELECTION' });
        showSuccess(
          `Xóa bài viết thành công`, 
          `Đã xóa ${deletedCount} bài viết`
        );
      } else {
        dispatch({ type: 'SET_ERROR', payload: 'Không thể xóa các bài viết đã chọn' });
        showError('Lỗi xóa bài viết', 'Không thể xóa các bài viết đã chọn');
      }
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: 'Có lỗi xảy ra khi xóa bài viết' });
      showError('Lỗi hệ thống', 'Có lỗi xảy ra khi xóa bài viết');
    } finally {
      setLoading({ updating: false });
    }
  }, [selectedArticles, setLoading, fetchArticles, currentPage, fetchStats, dispatch, showSuccess, showError]);

  // Handle delete article
  const handleDeleteArticle = useCallback(async (articleId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa bài viết này?')) return;

    setLoading({ updating: true });
    try {
      const { error } = await ArticlesService.deleteArticle(articleId);
      if (!error) {
        await fetchArticles(currentPage);
        await fetchStats();
        showSuccess('Xóa bài viết thành công', 'Bài viết đã được xóa thành công');
      } else {
        dispatch({ type: 'SET_ERROR', payload: 'Không thể xóa bài viết' });
        showError('Lỗi xóa bài viết', 'Không thể xóa bài viết');
      }
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: 'Có lỗi xảy ra khi xóa' });
      showError('Lỗi hệ thống', 'Có lỗi xảy ra khi xóa bài viết');
    } finally {
      setLoading({ updating: false });
    }
  }, [setLoading, fetchArticles, currentPage, fetchStats, dispatch, showSuccess, showError]);

  return {
    // Data fetching
    fetchStats,
    fetchArticles,

    // Event handlers
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
