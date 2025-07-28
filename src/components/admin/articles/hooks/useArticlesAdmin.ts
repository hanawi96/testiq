/**
 * UNIFIED ARTICLES ADMIN HOOK
 * Clean, modular hook that combines state management, operations, and simple quick edit functions
 */

import { useReducer, useEffect, useCallback } from 'react';
import { useArticlesData } from './useArticlesData';
import { useArticlesEffects } from './useArticlesEffects';
import { ArticlesService } from '../../../../../backend';
import type { UseToastResult } from '../../common/Toast';
import type { ArticlesFilters } from '../../../../../backend';

// Import modular components
import { adminArticlesReducer, initialState } from './useArticlesAdmin/reducer';

import { useQuickEdit } from './useArticlesAdmin/optimistic';
import type { LoadingStates, ModalStates } from './useArticlesAdmin/types';

// Re-export types for external use
export type { EditorPosition, LoadingStates, ModalStates } from './useArticlesAdmin/types';

// ===== DEBUG UTILITY =====
const debug = {
  admin: (msg: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`🎛️ ARTICLES ADMIN: ${msg}`, data || '');
    }
  }
};

// ===== MAIN HOOK =====
export function useArticlesAdmin(toast: UseToastResult) {
  const [state, dispatch] = useReducer(adminArticlesReducer, initialState);

  // Helper functions
  const setLoading = useCallback((payload: Partial<LoadingStates>) => {
    dispatch({ type: 'SET_LOADING', payload });
  }, []);

  // ===== BACKWARD COMPATIBILITY HELPERS =====
  // Create legacy loading state getters for existing components
  const legacyLoadingStates = {
    authorIds: state.loading.fieldUpdates.get('author') || new Set<string>(),
    categoryIds: state.loading.fieldUpdates.get('category') || new Set<string>(),
    tagIds: state.loading.fieldUpdates.get('tags') || new Set<string>(),
    titleIds: state.loading.fieldUpdates.get('title') || new Set<string>(),
    statusIds: state.loading.fieldUpdates.get('status') || new Set<string>()
  };

  // Merge with existing loading states for backward compatibility
  const compatibleLoading = {
    ...state.loading,
    ...legacyLoadingStates
  };

  const setModal = useCallback((payload: Partial<ModalStates>) => {
    dispatch({ type: 'SET_MODAL', payload });
  }, []);

  // Initialize data management
  const {
    fetchArticles,
    fetchStats,
    hydrateFromSSR,
    initialLoadDone,
    getCacheKey,  // ← Thêm getCacheKey
    cache        // ← Thêm cache
  } = useArticlesData({
    filters: state.filters,
    limit: state.limit,
    currentPage: state.currentPage,
    dispatch
  });



  // Initialize URL sync
  const { updateURL } = useArticlesEffects({
    dispatch,
    filters: state.filters,
    currentPage: state.currentPage
  });

  // Simple page operations
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

    // Fetch fresh data
    fetchArticles(page);
  }, [state.articlesData, state.currentPage, state.filters, dispatch, updateURL, fetchArticles]);

  const handlePageHover = useCallback((_page: number) => {
    // No prefetching in simple mode
  }, []);

  const handleFilterChange = useCallback(async (newFilters: Partial<ArticlesFilters>) => {
    const updatedFilters = { ...state.filters, ...newFilters };

    debug.admin('Filter change', { from: state.filters, to: updatedFilters });

    dispatch({ type: 'SET_UI', payload: {
      filters: updatedFilters,
      currentPage: 1,
      selectedArticles: [],
      showBulkActions: false
    } });

    updateURL(1, updatedFilters);
    await fetchArticles(1);
  }, [state.filters, dispatch, updateURL, fetchArticles]);

  const handleLimitChange = useCallback(async (newLimit: number) => {
    dispatch({ type: 'SET_UI', payload: {
      limit: newLimit,
      currentPage: 1,
      selectedArticles: [],
      showBulkActions: false
    } });

    updateURL(1, state.filters);
    await fetchArticles(1, newLimit);
  }, [state.filters, dispatch, updateURL, fetchArticles]);

  // Selection operations
  const handleSelectArticle = useCallback((articleId: string) => {
    dispatch({ type: 'TOGGLE_ARTICLE_SELECTION', payload: articleId });
  }, [dispatch]);

  const handleSelectAll = useCallback(() => {
    if (!state.articlesData?.articles) return;

    const allSelected = state.selectedArticles.length === state.articlesData.articles.length;
    if (allSelected) {
      dispatch({ type: 'CLEAR_SELECTION' });
    } else {
      const allIds = state.articlesData.articles.map(article => article.id);
      dispatch({ type: 'SET_UI', payload: {
        selectedArticles: allIds,
        showBulkActions: true
      } });
    }
  }, [dispatch, state.articlesData, state.selectedArticles]);

  // Bulk operations
  const handleBulkStatusUpdate = useCallback(async (status: 'draft' | 'published') => {
    if (state.selectedArticles.length === 0) return;

    setLoading({ updating: true });

    try {
      const { error } = await ArticlesService.bulkUpdateStatus(state.selectedArticles, status);

      if (error) {
        toast.showError('Không thể cập nhật trạng thái hàng loạt');
      } else {
        toast.showSuccess(`Đã cập nhật trạng thái ${state.selectedArticles.length} bài viết`);
        dispatch({ type: 'CLEAR_SELECTION' });
        await Promise.all([fetchArticles(state.currentPage), fetchStats()]);
      }
    } catch (err) {
      toast.showError('Có lỗi xảy ra khi cập nhật hàng loạt');
    } finally {
      setLoading({ updating: false });
    }
  }, [state.selectedArticles, setLoading, toast, dispatch, fetchArticles, state.currentPage, fetchStats]);

  const handleBulkDelete = useCallback(async () => {
    if (state.selectedArticles.length === 0) return;

    if (!confirm(`Bạn có chắc chắn muốn xóa ${state.selectedArticles.length} bài viết?\n\nHành động này không thể hoàn tác.`)) {
      return;
    }

    setLoading({ updating: true });

    try {
      const { error } = await ArticlesService.bulkDeleteArticles(state.selectedArticles);

      if (error) {
        toast.showError('Không thể xóa bài viết hàng loạt');
      } else {
        toast.showSuccess(`Đã xóa ${state.selectedArticles.length} bài viết`);
        dispatch({ type: 'CLEAR_SELECTION' });
        await Promise.all([fetchArticles(state.currentPage), fetchStats()]);
      }
    } catch (err) {
      toast.showError('Có lỗi xảy ra khi xóa hàng loạt');
    } finally {
      setLoading({ updating: false });
    }
  }, [state.selectedArticles, setLoading, toast, dispatch, fetchArticles, state.currentPage, fetchStats]);

  const handleDeleteArticle = useCallback(async (articleId: string) => {
    console.log('🗑️ DELETE ARTICLE START:', { articleId });

    if (!state.articlesData) {
      console.log('❌ No articles data available');
      return;
    }

    // Find article for confirmation and rollback
    const article = state.articlesData.articles.find(a => a.id === articleId);
    if (!article) {
      console.log('❌ Article not found:', articleId);
      return;
    }

    console.log('📝 Article to delete:', { id: article.id, title: article.title });
    console.log('📊 Current articles count:', state.articlesData.articles.length);

    // Confirmation dialog
    if (!confirm(`Bạn có chắc chắn muốn xóa "${article.title}"?\n\nHành động này không thể hoàn tác.`)) {
      console.log('❌ User cancelled deletion');
      return;
    }

    console.log('✅ User confirmed deletion');
    setLoading({ updating: true });

    // OPTIMISTIC UPDATE: Remove article from UI immediately
    console.log('🔧 OPTIMISTIC DELETE: Removing article from UI');
    const updatedArticles = state.articlesData.articles.filter(a => a.id !== articleId);
    const updatedData = {
      ...state.articlesData,
      articles: updatedArticles,
      total: state.articlesData.total - 1
    };

    console.log('📊 Updated articles count:', updatedArticles.length);
    console.log('📊 Updated total:', updatedData.total);

    dispatch({ type: 'SET_ARTICLES_DATA', payload: updatedData });
    console.log('✅ UI updated optimistically');

    try {
      console.log('🌐 Calling API to delete article...');
      const { error } = await ArticlesService.deleteArticle(articleId);

      if (error) {
        console.log('❌ API error:', error);
        // ROLLBACK: Restore article on error
        console.log('🔄 Rolling back UI changes');
        dispatch({ type: 'SET_ARTICLES_DATA', payload: state.articlesData });
        toast.showError('Không thể xóa bài viết');
      } else {
        console.log('✅ API success - article deleted');
        toast.showSuccess('Đã xóa bài viết thành công');
        // Refresh stats only (articles already updated optimistically)
        console.log('📊 Refreshing stats...');
        await fetchStats();
        console.log('✅ Stats refreshed');
      }
    } catch (err) {
      console.log('❌ API exception:', err);
      // ROLLBACK: Restore article on exception
      console.log('🔄 Rolling back UI changes');
      dispatch({ type: 'SET_ARTICLES_DATA', payload: state.articlesData });
      toast.showError('Có lỗi xảy ra khi xóa bài viết');
    } finally {
      console.log('🏁 Delete operation finished');
      setLoading({ updating: false });
    }
  }, [setLoading, toast, fetchStats, state.articlesData, dispatch]);

  // Initialize quick edit functions
  const quickEdit = useQuickEdit({
    state,
    dispatch,
    setLoading,
    setModal,
    toast,
    fetchArticles,  // ← Pass fetchArticles để có thể refetch sau khi clear cache
    getCacheKey,    // ← Pass getCacheKey để clear specific cache
    cache          // ← Pass cache để clear trực tiếp như Users
  });

  // Simplified initial load with SSR hydration
  useEffect(() => {
    if (initialLoadDone.current) return;
    initialLoadDone.current = true;

    const loadData = async () => {
      debug.admin('Starting initial data load');
      const { articlesUsed, statsUsed } = hydrateFromSSR();

      // Load missing data only
      if (!articlesUsed) {
        fetchArticles(state.currentPage);
      }
      if (!statsUsed) {
        fetchStats();
      }

      debug.admin('Initial data load completed');
    };

    loadData();
    // Remove aggressive preloading to improve initial load
  }, []);

  // ===== CLEANUP =====
  useEffect(() => {
    return () => {
      debug.admin('Cleaning up articles admin hook');
    };
  }, []);



  return {
    // State (with backward compatible loading)
    ...state,
    loading: compatibleLoading,

    // Actions
    dispatch,
    setModal,
    setLoading,

    // Data operations
    fetchStats,

    // Page operations
    handlePageChange,
    handlePageHover,
    handleFilterChange,
    handleLimitChange,

    // Selection operations
    handleSelectArticle,
    handleSelectAll,

    // Bulk operations
    handleBulkStatusUpdate,
    handleBulkDelete,
    handleDeleteArticle,

    // Quick edit functions
    ...quickEdit
  };
}
