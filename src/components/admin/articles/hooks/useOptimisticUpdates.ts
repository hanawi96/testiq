import { ArticlesService } from '../../../../../backend';
import type { ArticlesListResponse } from '../../../../../backend';
import type { LoadingStates, ModalStates } from './useAdminArticlesState';

interface OptimisticUpdateConfig {
  articlesData: ArticlesListResponse | null;
  loading: LoadingStates;
  setLoading: (payload: Partial<LoadingStates>) => void;
  setModal: (payload: Partial<ModalStates>) => void;
  dispatch: (action: any) => void;
  fetchStats: () => Promise<void>;
}

// Generic optimistic update pattern
async function performOptimisticUpdate<T>(
  config: OptimisticUpdateConfig,
  articleId: string,
  updateData: T,
  options: {
    loadingKey: keyof LoadingStates;
    updateArticle: (article: any, data: T) => any;
    apiCall: (articleId: string, data: T) => Promise<{ error?: any; data?: any }>;
    closeModal?: keyof ModalStates;
    refreshStats?: boolean;
    errorMessage?: string;
  }
) {
  const { articlesData, loading, setLoading, setModal, dispatch, fetchStats } = config;
  
  if (!articlesData) return;

  const originalArticle = articlesData.articles.find(a => a.id === articleId);
  if (!originalArticle) return;

  // Close modal immediately for fast UX
  if (options.closeModal) {
    setModal({ [options.closeModal]: null });
  }

  // Start loading state
  const currentLoadingSet = loading[options.loadingKey] as Set<string>;
  setLoading({ [options.loadingKey]: new Set(currentLoadingSet).add(articleId) });

  // Optimistic UI update
  const updatedArticles = articlesData.articles.map(article =>
    article.id === articleId ? options.updateArticle(article, updateData) : article
  );
  dispatch({ 
    type: 'SET_ARTICLES_DATA', 
    payload: { ...articlesData, articles: updatedArticles } 
  });

  try {
    // Call API in background
    const { error } = await options.apiCall(articleId, updateData);

    if (error) {
      // Rollback on error
      const rolledBackArticles = articlesData.articles.map(article =>
        article.id === articleId ? originalArticle : article
      );
      dispatch({ 
        type: 'SET_ARTICLES_DATA', 
        payload: { ...articlesData, articles: rolledBackArticles } 
      });

      if (options.errorMessage) {
        dispatch({ type: 'SET_ERROR', payload: options.errorMessage });
      }
      console.error('Optimistic update failed:', error);
    } else if (options.refreshStats) {
      // Refresh stats on success
      await fetchStats();
    }
  } catch (err) {
    // Rollback on exception
    const rolledBackArticles = articlesData.articles.map(article =>
      article.id === articleId ? originalArticle : article
    );
    dispatch({ 
      type: 'SET_ARTICLES_DATA', 
      payload: { ...articlesData, articles: rolledBackArticles } 
    });
    
    if (options.errorMessage) {
      dispatch({ type: 'SET_ERROR', payload: options.errorMessage });
    }
    console.error('Error in optimistic update:', err);
  } finally {
    // Remove loading state
    const newLoadingSet = new Set(currentLoadingSet);
    newLoadingSet.delete(articleId);
    setLoading({ [options.loadingKey]: newLoadingSet });
  }
}

export function useOptimisticUpdates(config: OptimisticUpdateConfig) {
  // Handle tags update with instant UI feedback
  const handleTagsUpdate = async (articleId: string, newTags: string[]) => {
    const { articlesData, loading, setLoading, dispatch } = config;
    
    if (!articlesData) return;

    const originalArticle = articlesData.articles.find(a => a.id === articleId);
    if (!originalArticle) return;

    // Store original data for rollback
    const originalTagNames = (originalArticle as any).tag_names || [];
    const originalTags = (originalArticle as any).tags || [];

    // Start loading state
    setLoading({ tagIds: new Set(loading.tagIds).add(articleId) });

    // INSTANT UI UPDATE: Apply optimistic update immediately
    const optimisticData = {
      ...articlesData,
      lastUpdated: Date.now(),
      articles: articlesData.articles.map(article =>
        article.id === articleId
          ? {
              ...article,
              tag_names: [...newTags],
              tags: newTags.map(name => ({
                id: `temp-${Date.now()}-${Math.random()}`,
                name,
                slug: ''
              }))
            }
          : article
      )
    };

    dispatch({ type: 'SET_ARTICLES_DATA', payload: optimisticData });

    try {
      // Background API call
      const { data: updatedData, error: updateError } = await ArticlesService.updateTags(articleId, newTags);

      if (updateError) {
        // ROLLBACK: Revert to original data
        const rollbackData = {
          ...optimisticData,
          lastUpdated: Date.now(),
          articles: optimisticData.articles.map(article =>
            article.id === articleId
              ? {
                  ...article,
                  tag_names: [...originalTagNames],
                  tags: [...originalTags]
                }
              : article
          )
        };
        dispatch({ type: 'SET_ARTICLES_DATA', payload: rollbackData });
      } else if (updatedData) {
        // SUCCESS: Update with server data
        const serverData = {
          ...optimisticData,
          lastUpdated: Date.now(),
          articles: optimisticData.articles.map(article =>
            article.id === articleId
              ? {
                  ...article,
                  tags: [...updatedData.tags],
                  tag_names: [...updatedData.tag_names]
                }
              : article
          )
        };

        dispatch({ type: 'SET_ARTICLES_DATA', payload: serverData });
      }
    } catch (err) {
      // ROLLBACK: Revert to original data
      const rollbackData = {
        ...optimisticData,
        lastUpdated: Date.now(),
        articles: optimisticData.articles.map(article =>
          article.id === articleId
            ? {
                ...article,
                tag_names: [...originalTagNames],
                tags: [...originalTags]
              }
            : article
        )
      };
      dispatch({ type: 'SET_ARTICLES_DATA', payload: rollbackData });
    } finally {
      // Clear loading state
      const newTagIds = new Set(loading.tagIds);
      newTagIds.delete(articleId);
      setLoading({ tagIds: newTagIds });
    }
  };

  // Handle author update with optimistic UI and loading state
  const handleAuthorUpdate = async (articleId: string, newAuthor: string, authorId: string, userProfile: any) => {
    await performOptimisticUpdate(
      config,
      articleId,
      { newAuthor, authorId, userProfile },
      {
        loadingKey: 'authorIds',
        closeModal: 'quickAuthorEditor',
        updateArticle: (article, data) => ({
          ...article,
          author: data.newAuthor,
          author_id: data.authorId,
          user_profiles: data.userProfile
        }),
        apiCall: async (id, data) => ArticlesService.updateAuthorById(id, data.authorId)
      }
    );
  };

  // Handle status update with optimistic UI
  const handleStatusUpdateOptimistic = async (articleId: string, newStatus: 'published' | 'draft' | 'archived') => {
    await performOptimisticUpdate(
      config,
      articleId,
      newStatus,
      {
        loadingKey: 'statusIds',
        closeModal: 'quickStatusEditor',
        refreshStats: true,
        updateArticle: (article, status) => ({ ...article, status }),
        apiCall: async (id, status) => ArticlesService.updateStatus(id, status),
        errorMessage: 'Không thể cập nhật trạng thái bài viết'
      }
    );
  };

  // Handle category update with optimistic UI and loading state
  const handleCategoryUpdate = async (articleId: string, categoryIds: string[], categoryNames: string[]) => {
    await performOptimisticUpdate(
      config,
      articleId,
      { categoryIds, categoryNames },
      {
        loadingKey: 'categoryIds',
        closeModal: 'quickCategoryEditor',
        updateArticle: (article, data) => ({
          ...article,
          category_names: data.categoryNames,
          category_ids: data.categoryIds,
          category_id: data.categoryIds.length > 0 ? data.categoryIds[0] : null
        }),
        apiCall: async (id, data) => ArticlesService.updateCategories(id, data.categoryIds)
      }
    );
  };

  // Handle title update with optimistic UI and loading state
  const handleTitleUpdate = async (articleId: string, newTitle: string) => {
    await performOptimisticUpdate(
      config,
      articleId,
      newTitle,
      {
        loadingKey: 'titleIds',
        closeModal: 'quickTitleEditor',
        updateArticle: (article, title) => ({ ...article, title }),
        apiCall: async (id, title) => ArticlesService.updateTitle(id, title),
        errorMessage: 'Không thể cập nhật tiêu đề bài viết'
      }
    );
  };

  return {
    handleTagsUpdate,
    handleAuthorUpdate,
    handleStatusUpdateOptimistic,
    handleCategoryUpdate,
    handleTitleUpdate
  };
}
