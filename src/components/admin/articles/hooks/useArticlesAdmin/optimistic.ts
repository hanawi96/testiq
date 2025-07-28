/**
 * UNIFIED OPTIMISTIC QUICK EDIT FOR ARTICLES ADMIN
 * Simplified, reusable optimistic updates - no duplicate code
 * Single pattern for all field updates with consistent behavior
 */

import { useCallback, startTransition } from 'react';
import { ArticlesService } from '../../../../../../backend';
import type { UseToastResult } from '../../../common/Toast';
import type { AdminArticlesState, LoadingStates, ModalStates } from './types';
import { getInstantCategoriesData } from '../../../../../utils/admin/preloaders/categories-preloader';

interface QuickEditConfig {
  state: AdminArticlesState;
  dispatch: (action: any) => void;
  setLoading: (payload: Partial<LoadingStates>) => void;
  setModal: (payload: Partial<ModalStates>) => void;
  toast: UseToastResult;
  fetchArticles: (page: number, limit?: number) => Promise<void>;
  getCacheKey: (page: number, filters: any, limit: number) => string;  // ← Thêm getCacheKey
  cache: React.MutableRefObject<Map<string, any>>;  // ← Thêm cache ref
}

// ===== UNIFIED OPTIMISTIC UPDATE PATTERN =====
interface OptimisticUpdateConfig<T> {
  articleId: string;
  newValue: T;
  fieldName: string; // Simplified to string instead of keyof LoadingStates
  modalName: keyof ModalStates;
  updateFn: (articleId: string, value: T) => Promise<{ error: any }>;
  fieldUpdater: (article: any, value: T) => any;
  errorMessage: string;
}

function createOptimisticUpdate<T>(config: QuickEditConfig) {
  const { state, dispatch, setLoading, setModal, toast, fetchArticles, getCacheKey, cache } = config;
  const { showError } = toast;

  return async <T>(updateConfig: OptimisticUpdateConfig<T>) => {
    const {
      articleId,
      newValue,
      fieldName,
      modalName,
      updateFn,
      fieldUpdater,
      errorMessage
    } = updateConfig;

    if (!state.articlesData) return;

    const originalArticle = state.articlesData.articles.find(a => a.id === articleId);
    if (!originalArticle) return;

    // Close modal and start loading
    setModal({ [modalName]: null } as Partial<ModalStates>);

    // Update unified loading state
    const currentFieldLoading = state.loading.fieldUpdates.get(fieldName) || new Set<string>();
    const newFieldUpdates = new Map(state.loading.fieldUpdates);
    newFieldUpdates.set(fieldName, new Set([...currentFieldLoading, articleId]));
    setLoading({ fieldUpdates: newFieldUpdates });

    // 1. OPTIMISTIC UPDATE - Update UI immediately
    const updatedArticles = state.articlesData.articles.map(article =>
      article.id === articleId ? fieldUpdater(article, newValue) : article
    );

    // 🔧 FIX: Wrap trong startTransition để tránh hydration error
    startTransition(() => {
      dispatch({
        type: 'SET_ARTICLES_DATA',
        payload: { ...state.articlesData, articles: updatedArticles }
      });
    });

    try {
      // 2. API CALL - Update database in background
      const { error } = await updateFn(articleId, newValue);

      if (error) {
        // 3. ROLLBACK - Revert to original state on error
        const rolledBackArticles = state.articlesData.articles.map(article =>
          article.id === articleId ? originalArticle : article
        );

        // 🔧 FIX: Wrap rollback trong startTransition
        startTransition(() => {
          dispatch({
            type: 'SET_ARTICLES_DATA',
            payload: { ...state.articlesData, articles: rolledBackArticles }
          });
        });
        showError(errorMessage);
      } else {
        // ✅ COPY USERS EXACTLY: Smart cache invalidation - only clear current page cache
        console.log('✅ OPTIMISTIC UPDATE: Quick edit success, clearing cache exactly like Users...');

        const currentCacheKey = getCacheKey(state.currentPage, state.filters, state.limit);
        console.log('🗑️ OPTIMISTIC UPDATE: Clearing cache key:', currentCacheKey);

        // Clear cache trực tiếp như Users
        cache.current.delete(currentCacheKey);
        console.log('🗑️ OPTIMISTIC UPDATE: Cache cleared for current page');

        // Refresh current page data như Users
        console.log('🔄 OPTIMISTIC UPDATE: Refreshing current page data...');
        try {
          await fetchArticles(state.currentPage);
          console.log('✅ OPTIMISTIC UPDATE: Data refreshed successfully');
        } catch (error) {
          console.error('❌ OPTIMISTIC UPDATE: Failed to refresh data:', error);
        }

        console.log('✅ OPTIMISTIC UPDATE: Process completed like Users module');
      }
    } catch (err) {
      // 3. ROLLBACK - Revert to original state on exception
      const rolledBackArticles = state.articlesData.articles.map(article =>
        article.id === articleId ? originalArticle : article
      );

      // 🔧 FIX: Wrap rollback trong startTransition
      startTransition(() => {
        dispatch({
          type: 'SET_ARTICLES_DATA',
          payload: { ...state.articlesData, articles: rolledBackArticles }
        });
      });
      showError(errorMessage);
    } finally {
      // Clear loading state
      const currentFieldLoading = state.loading.fieldUpdates.get(fieldName) || new Set<string>();
      const newFieldUpdates = new Map(state.loading.fieldUpdates);
      newFieldUpdates.set(fieldName, new Set([...currentFieldLoading].filter(id => id !== articleId)));
      setLoading({ fieldUpdates: newFieldUpdates });
    }
  };
}

export function useQuickEdit(config: QuickEditConfig) {
  // Create the unified optimistic update function
  const performOptimisticUpdate = createOptimisticUpdate(config);

  // ===== TAGS UPDATE - UNIFIED PATTERN =====
  const handleTagsUpdate = useCallback(async (articleId: string, newTags: string[]) => {
    await performOptimisticUpdate({
      articleId,
      newValue: newTags,
      fieldName: 'tags',
      modalName: 'quickTagsEditor',
      updateFn: ArticlesService.updateTags,
      fieldUpdater: (article, tags) => ({
        ...article,
        tag_names: tags,
        tags: tags.map(name => ({ name }))
      }),
      errorMessage: 'Không thể cập nhật tags'
    });
  }, [performOptimisticUpdate]);

  // ===== STATUS UPDATE - UNIFIED PATTERN =====
  const handleStatusUpdate = useCallback(async (articleId: string, newStatus: 'published' | 'draft' | 'archived') => {
    await performOptimisticUpdate({
      articleId,
      newValue: newStatus,
      fieldName: 'status',
      modalName: 'quickStatusEditor',
      updateFn: ArticlesService.updateStatus,
      fieldUpdater: (article, status) => ({ ...article, status }),
      errorMessage: 'Không thể cập nhật trạng thái'
    });
  }, [performOptimisticUpdate]);

  // ===== AUTHOR UPDATE - UNIFIED PATTERN =====
  const handleAuthorUpdate = useCallback(async (articleId: string, newAuthor: string, authorId: string, userProfile: any) => {
    await performOptimisticUpdate({
      articleId,
      newValue: { authorId, newAuthor, userProfile },
      fieldName: 'author',
      modalName: 'quickAuthorEditor',
      updateFn: (id, data) => ArticlesService.updateAuthorById(id, data.authorId),
      fieldUpdater: (article, data) => ({
        ...article,
        author_id: data.authorId,
        user_profiles: data.userProfile ? {
          id: data.authorId,
          full_name: data.newAuthor,
          avatar_url: data.userProfile.avatar_url || null,
          role: data.userProfile.role || 'author'
        } : null
      }),
      errorMessage: 'Không thể cập nhật tác giả'
    });
  }, [performOptimisticUpdate]);

  // ===== CATEGORY UPDATE - UNIFIED PATTERN =====
  const handleCategoryUpdate = useCallback(async (articleId: string, newCategoryIds: string[]) => {
    // Get category names for UI display
    const availableCategories = getInstantCategoriesData();
    const categoryNames = newCategoryIds.map(id => {
      const category = availableCategories.find(cat => cat.id === id);
      return category?.name || `Category ${id.slice(0, 8)}...`;
    });

    await performOptimisticUpdate({
      articleId,
      newValue: { categoryIds: newCategoryIds, categoryNames },
      fieldName: 'category',
      modalName: 'quickCategoryEditor',
      updateFn: (id, data) => ArticlesService.updateCategories(id, data.categoryIds),
      fieldUpdater: (article, data) => ({
        ...article,
        category_ids: data.categoryIds,
        category_names: data.categoryNames
      }),
      errorMessage: 'Không thể cập nhật danh mục'
    });
  }, [performOptimisticUpdate]);

  // ===== TITLE UPDATE - UNIFIED PATTERN =====
  const handleTitleUpdate = useCallback(async (articleId: string, newTitle: string) => {
    await performOptimisticUpdate({
      articleId,
      newValue: newTitle,
      fieldName: 'title',
      modalName: 'quickTitleEditor',
      updateFn: ArticlesService.updateTitle,
      fieldUpdater: (article, title) => ({ ...article, title }),
      errorMessage: 'Không thể cập nhật tiêu đề'
    });
  }, [performOptimisticUpdate]);

  return {
    handleTagsUpdate,
    handleStatusUpdate,
    handleAuthorUpdate,
    handleCategoryUpdate,
    handleTitleUpdate
  };
}
