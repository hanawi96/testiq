import React, { useReducer, useEffect, useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArticlesService } from '../../../../backend';
import type { Article, ArticleStats, ArticlesFilters, ArticlesListResponse } from '../../../../backend';
import QuickTagsEditor from './quick-actions/QuickTagsEditor';
import QuickAuthorEditor from './quick-actions/QuickAuthorEditor';
import QuickMultipleCategoryEditor from './quick-actions/QuickMultipleCategoryEditor';
import LinkAnalysisModal from './modals/LinkAnalysisModal';
import QuickStatusEditor from './quick-actions/QuickStatusEditor';
import QuickTitleEditor from './quick-actions/QuickTitleEditor';
import CategoryDisplay from './components/CategoryDisplay';
import SearchInput from '../common/SearchInput';
import LoadingSpinner from '../common/LoadingSpinner';
import SearchHighlight from '../common/SearchHighlight';
import SearchStats from '../common/SearchStats';
// Removed skeleton imports - no more loading animations
import { SmartPreloader } from '../../../utils/admin/preloaders/preload-manager';

// ===== OPTIMIZED STATE MANAGEMENT =====

interface EditorPosition {
  articleId: string;
  position: { top: number; left: number };
}

interface LoadingStates {
  stats: boolean;
  articles: boolean;
  updating: boolean;
  authorIds: Set<string>;
  categoryIds: Set<string>;
  tagIds: Set<string>;
  titleIds: Set<string>;
}

interface UIStates {
  currentPage: number;
  filters: ArticlesFilters;
  selectedArticles: string[];
  showBulkActions: boolean;
}

interface ModalStates {
  quickTagsEditor: EditorPosition | null;
  quickAuthorEditor: EditorPosition | null;
  quickCategoryEditor: EditorPosition | null;
  quickStatusEditor: EditorPosition | null;
  quickTitleEditor: EditorPosition | null;
  linkAnalysisModal: { articleId: string; articleTitle: string } | null;
}

interface AdminArticlesState {
  // Data
  articlesData: ArticlesListResponse | null;
  stats: ArticleStats | null;
  error: string;

  // Loading states
  loading: LoadingStates;

  // UI states
  ui: UIStates;

  // Modal states
  modals: ModalStates;
}

type AdminArticlesAction =
  | { type: 'SET_ARTICLES_DATA'; payload: ArticlesListResponse | null }
  | { type: 'SET_STATS'; payload: ArticleStats | null }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'SET_LOADING'; payload: Partial<LoadingStates> }
  | { type: 'SET_UI'; payload: Partial<UIStates> }
  | { type: 'SET_MODAL'; payload: Partial<ModalStates> }
  | { type: 'RESET_MODALS' }
  | { type: 'TOGGLE_ARTICLE_SELECTION'; payload: string }
  | { type: 'CLEAR_SELECTION' };

const initialState: AdminArticlesState = {
  articlesData: null,
  stats: null,
  error: '',
  loading: {
    stats: true,
    articles: true,
    updating: false,
    authorIds: new Set(),
    categoryIds: new Set(),
    tagIds: new Set(),
    titleIds: new Set()
  },
  ui: {
    currentPage: 1,
    filters: {
      status: 'all',
      search: '',
      sort_by: 'created_at',
      sort_order: 'desc'
    },
    selectedArticles: [],
    showBulkActions: false
  },
  modals: {
    quickTagsEditor: null,
    quickAuthorEditor: null,
    quickCategoryEditor: null,
    quickStatusEditor: null,
    quickTitleEditor: null,
    linkAnalysisModal: null
  }
};

function adminArticlesReducer(state: AdminArticlesState, action: AdminArticlesAction): AdminArticlesState {
  switch (action.type) {
    case 'SET_ARTICLES_DATA':
      return { ...state, articlesData: action.payload };

    case 'SET_STATS':
      return { ...state, stats: action.payload };

    case 'SET_ERROR':
      return { ...state, error: action.payload };

    case 'SET_LOADING':
      return {
        ...state,
        loading: { ...state.loading, ...action.payload }
      };

    case 'SET_UI':
      return {
        ...state,
        ui: { ...state.ui, ...action.payload }
      };

    case 'SET_MODAL':
      return {
        ...state,
        modals: { ...state.modals, ...action.payload }
      };

    case 'RESET_MODALS':
      return {
        ...state,
        modals: initialState.modals
      };

    case 'TOGGLE_ARTICLE_SELECTION':
      const articleId = action.payload;
      const isSelected = state.ui.selectedArticles.includes(articleId);
      const newSelection = isSelected
        ? state.ui.selectedArticles.filter(id => id !== articleId)
        : [...state.ui.selectedArticles, articleId];

      return {
        ...state,
        ui: {
          ...state.ui,
          selectedArticles: newSelection,
          showBulkActions: newSelection.length > 0
        }
      };

    case 'CLEAR_SELECTION':
      return {
        ...state,
        ui: {
          ...state.ui,
          selectedArticles: [],
          showBulkActions: false
        }
      };

    default:
      return state;
  }
}


interface AdminArticlesProps {
  initialData?: {
    articles: ArticlesListResponse | null;
    stats: ArticleStats | null;
  };
}

export default function AdminArticles({ initialData }: AdminArticlesProps) {
  // HYBRID APPROACH: Use initial data if available, but don't block UI
  const smartInitialState = initialData ? {
    ...initialState,
    articlesData: initialData.articles,
    stats: initialData.stats,
    loading: {
      ...initialState.loading,
      articles: false, // Don't show loading if we have data
      stats: false     // Don't show loading if we have data
    }
  } : initialState;

  const [state, dispatch] = useReducer(adminArticlesReducer, smartInitialState);

  // INSTANT UI: Track mount state for immediate UI display
  const [isMounted, setIsMounted] = useState(false);

  // Mount immediately for instant UI
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Destructure for easier access
  const { articlesData, stats, error, loading, ui, modals } = state;
  const { currentPage, filters, selectedArticles, showBulkActions } = ui;
  const {
    quickTagsEditor,
    quickAuthorEditor,
    quickCategoryEditor,
    quickStatusEditor,
    quickTitleEditor,
    linkAnalysisModal
  } = modals;

  const limit = 10;

  // Helper functions for cleaner code
  const closeAllEditors = () => dispatch({ type: 'RESET_MODALS' });
  const setModal = (payload: Partial<ModalStates>) => dispatch({ type: 'SET_MODAL', payload });
  const setLoading = (payload: Partial<LoadingStates>) => dispatch({ type: 'SET_LOADING', payload });

  // Generate category color based on category name
  const getCategoryColor = (categoryName: string) => {
    const colors = [
      'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-700',
      'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-700',
      'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-700',
      'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 border-orange-200 dark:border-orange-700',
      'bg-pink-100 dark:bg-pink-900/30 text-pink-800 dark:text-pink-300 border-pink-200 dark:border-pink-700',
      'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300 border-indigo-200 dark:border-indigo-700',
      'bg-teal-100 dark:bg-teal-900/30 text-teal-800 dark:text-teal-300 border-teal-200 dark:border-teal-700',
      'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-200 dark:border-red-700'
    ];

    // Simple hash function to get consistent color for same category name
    let hash = 0;
    for (let i = 0; i < categoryName.length; i++) {
      hash = categoryName.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  // SMART FETCH: Background refresh with stale-while-revalidate
  const fetchArticles = useCallback(async (page: number = currentPage, silent = false) => {
    if (!silent) {
      dispatch({ type: 'SET_ERROR', payload: '' });
      dispatch({ type: 'SET_LOADING', payload: { articles: true } });
    }

    try {
      const { data, error: fetchError } = await ArticlesService.getArticles(page, limit, filters);

      if (fetchError || !data) {
        if (!silent) dispatch({ type: 'SET_ERROR', payload: 'Không thể tải danh sách bài viết' });
        return;
      }

      dispatch({ type: 'SET_ARTICLES_DATA', payload: data });
      if (!silent) dispatch({ type: 'SET_LOADING', payload: { articles: false } });

    } catch (err) {
      if (!silent) {
        dispatch({ type: 'SET_ERROR', payload: 'Có lỗi xảy ra khi tải dữ liệu' });
        dispatch({ type: 'SET_LOADING', payload: { articles: false } });
        console.error('Frontend: Error fetching articles:', err);
      }
    }
  }, [currentPage, filters]);

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
  }, []);



  // HYBRID LOAD: Only fetch if no initial data or filters changed
  useEffect(() => {
    if (!isMounted) return;

    const needsRefresh = !articlesData ||
      (initialData && (
        filters.status !== 'all' ||
        filters.search !== '' ||
        filters.sort_by !== 'created_at' ||
        filters.sort_order !== 'desc'
      ));

    if (needsRefresh) {
      const loadData = async () => {
        await Promise.all([
          fetchArticles(1),
          fetchStats()
        ]);
      };
      loadData();
    } else if (initialData && articlesData) {
      // Background refresh for stale data (silent)
      setTimeout(() => {
        fetchArticles(1, true);
        fetchStats();
      }, 2000);
    }

    SmartPreloader.triggerSmartPreload('navigation');
  }, [isMounted, filters]);

  // Handle page change
  const handlePageChange = (page: number) => {
    dispatch({ type: 'SET_UI', payload: { currentPage: page } });
    fetchArticles(page);
  };

  // Handle filter change
  const handleFilterChange = (newFilters: Partial<ArticlesFilters>) => {
    dispatch({
      type: 'SET_UI',
      payload: {
        filters: { ...filters, ...newFilters },
        currentPage: 1
      }
    });
  };

  // Handle article selection
  const handleSelectArticle = (articleId: string) => {
    dispatch({ type: 'TOGGLE_ARTICLE_SELECTION', payload: articleId });
  };

  // Handle select all
  const handleSelectAll = () => {
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
  };

  // Handle bulk status update
  const handleBulkStatusUpdate = async (status: 'published' | 'draft' | 'archived') => {
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
  };

  // Handle delete article
  const handleDeleteArticle = async (articleId: string) => {
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
  };

  // Handle quick tags edit with toggle behavior
  const handleQuickTagsEdit = (event: React.MouseEvent, articleId: string) => {
    event.stopPropagation();

    // Trigger smart preload when opening popup
    SmartPreloader.triggerSmartPreload('click');

    // Close other editors
    setModal({
      quickAuthorEditor: null,
      quickCategoryEditor: null,
      quickStatusEditor: null,
      quickTitleEditor: null
    });

    // Toggle: if same article editor is open, close it
    if (quickTagsEditor?.articleId === articleId) {
      setModal({ quickTagsEditor: null });
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
    const spaceBelow = window.innerHeight - rect.bottom - 4;
    const spaceAbove = rect.top - 4;

    if (spaceBelow < popupHeight) {
      if (spaceAbove >= popupHeight) {
        // Show above button if there's enough space
        top = rect.top - popupHeight - 4;
      } else {
        // If neither space is enough, position to fit in viewport with margin
        if (spaceAbove > spaceBelow) {
          // More space above, position at top with margin
          top = 16;
        } else {
          // More space below, position to fit in remaining space
          top = Math.max(16, window.innerHeight - popupHeight - 16);
        }
      }
    }

    setModal({
      quickTagsEditor: {
        articleId,
        position: { top, left }
      }
    });
  };

  // Handle quick author edit with toggle behavior
  const handleQuickAuthorEdit = (event: React.MouseEvent, articleId: string) => {
    event.stopPropagation();

    // Trigger smart preload when opening popup
    SmartPreloader.triggerSmartPreload('click');

    // Close other editors
    setModal({
      quickTagsEditor: null,
      quickCategoryEditor: null,
      quickStatusEditor: null,
      quickTitleEditor: null
    });

    // Toggle: if same article editor is open, close it
    if (quickAuthorEditor?.articleId === articleId) {
      setModal({ quickAuthorEditor: null });
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
    const spaceBelow = window.innerHeight - rect.bottom - 4;
    const spaceAbove = rect.top - 4;

    if (spaceBelow < popupHeight) {
      if (spaceAbove >= popupHeight) {
        // Show above button if there's enough space
        top = rect.top - popupHeight - 4;
      } else {
        // If neither space is enough, position to fit in viewport with margin
        if (spaceAbove > spaceBelow) {
          // More space above, position at top with margin
          top = 16;
        } else {
          // More space below, position to fit in remaining space
          top = Math.max(16, window.innerHeight - popupHeight - 16);
        }
      }
    }

    setModal({
      quickAuthorEditor: {
        articleId,
        position: { top, left }
      }
    });
  };

  // Handle quick category edit with toggle behavior
  const handleQuickCategoryEdit = (event: React.MouseEvent, articleId: string) => {
    event.stopPropagation();

    // Trigger smart preload when opening popup
    SmartPreloader.triggerSmartPreload('click');

    // Close other editors first
    setModal({
      quickTagsEditor: null,
      quickAuthorEditor: null,
      quickStatusEditor: null,
      quickTitleEditor: null
    });

    // Toggle: if same article editor is open, close it
    if (quickCategoryEditor?.articleId === articleId) {
      setModal({ quickCategoryEditor: null });
      return;
    }

    // Calculate position immediately
    const rect = event.currentTarget.getBoundingClientRect();
    const popupWidth = 288; // QuickCategoryEditor width (w-72 = 288px)
    const popupHeight = 480; // Estimated popup height with increased max-height for category list

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
    const spaceBelow = window.innerHeight - rect.bottom - 4;
    const spaceAbove = rect.top - 4;

    if (spaceBelow < popupHeight) {
      if (spaceAbove >= popupHeight) {
        // Show above button if there's enough space
        top = rect.top - popupHeight - 4;
      } else {
        // If neither space is enough, position to fit in viewport with margin
        if (spaceAbove > spaceBelow) {
          // More space above, position at top with margin
          top = 16;
        } else {
          // More space below, position to fit in remaining space
          top = Math.max(16, window.innerHeight - popupHeight - 16);
        }
      }
    }

    setModal({
      quickCategoryEditor: {
        articleId,
        position: { top, left }
      }
    });
  };

  // Handle quick status edit with toggle behavior
  const handleQuickStatusEdit = (event: React.MouseEvent, articleId: string) => {
    event.stopPropagation();

    // Close other editors
    setModal({
      quickTagsEditor: null,
      quickAuthorEditor: null,
      quickCategoryEditor: null,
      quickTitleEditor: null
    });

    // Toggle: if same article editor is open, close it
    if (quickStatusEditor?.articleId === articleId) {
      setModal({ quickStatusEditor: null });
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const popupWidth = 240; // QuickStatusEditor width (w-60 = 240px)
    const popupHeight = 200; // Estimated popup height

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
    const spaceBelow = window.innerHeight - rect.bottom - 4;
    const spaceAbove = rect.top - 4;

    if (spaceBelow < popupHeight) {
      if (spaceAbove >= popupHeight) {
        // Show above button if there's enough space
        top = rect.top - popupHeight - 4;
      } else {
        // If neither space is enough, position to fit in viewport with margin
        if (spaceAbove > spaceBelow) {
          // More space above, position at top with margin
          top = 16;
        } else {
          // More space below, position to fit in remaining space
          top = Math.max(16, window.innerHeight - popupHeight - 16);
        }
      }
    }

    setModal({
      quickStatusEditor: {
        articleId,
        position: { top, left }
      }
    });
  };

  // Handle quick title edit with toggle behavior
  const handleQuickTitleEdit = (event: React.MouseEvent, articleId: string) => {
    event.stopPropagation();

    // Close other editors
    setModal({
      quickTagsEditor: null,
      quickAuthorEditor: null,
      quickCategoryEditor: null,
      quickStatusEditor: null
    });

    // Toggle: if same article editor is open, close it
    if (quickTitleEditor?.articleId === articleId) {
      setModal({ quickTitleEditor: null });
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const popupWidth = 400; // QuickTitleEditor width
    const popupHeight = 200; // Estimated popup height

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
    const spaceBelow = window.innerHeight - rect.bottom - 4;
    const spaceAbove = rect.top - 4;

    if (spaceBelow < popupHeight) {
      if (spaceAbove >= popupHeight) {
        // Show above button if there's enough space
        top = rect.top - popupHeight - 4;
      } else {
        // If neither space is enough, position to fit in viewport with margin
        if (spaceAbove > spaceBelow) {
          // More space above, position at top with margin
          top = 16;
        } else {
          // More space below, position to fit in remaining space
          top = Math.max(16, window.innerHeight - popupHeight - 16);
        }
      }
    }

    setModal({
      quickTitleEditor: {
        articleId,
        position: { top, left }
      }
    });
  };

  // Handle tags update with instant UI feedback
  const handleTagsUpdate = async (articleId: string, newTags: string[]) => {
    if (!articlesData) return;

    const originalArticle = articlesData.articles.find(a => a.id === articleId);
    if (!originalArticle) return;

    // Store original data for rollback
    const originalTagNames = originalArticle.tag_names || [];
    const originalTags = originalArticle.tags || [];

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
    if (!articlesData) return;

    // Close popup immediately for fast UX
    setModal({ quickAuthorEditor: null });

    // Store original article for rollback
    const originalArticle = articlesData.articles.find(article => article.id === articleId);
    if (!originalArticle) return;

    // Start loading state
    setLoading({ authorIds: new Set(loading.authorIds).add(articleId) });

    // Optimistic UI update
    const updatedArticles = articlesData.articles.map(article =>
      article.id === articleId ? {
        ...article,
        author: newAuthor,
        author_id: authorId,
        user_profiles: userProfile
      } : article
    );
    dispatch({ type: 'SET_ARTICLES_DATA', payload: { ...articlesData, articles: updatedArticles } });

    try {
      // Call API in background
      const { error: updateError } = await ArticlesService.updateAuthorById(articleId, authorId);

      if (updateError) {
        // Rollback on error
        const rolledBackArticles = articlesData.articles.map(article =>
          article.id === articleId ? originalArticle : article
        );
        dispatch({ type: 'SET_ARTICLES_DATA', payload: { ...articlesData, articles: rolledBackArticles } });

        // Show error (you can add toast notification here)
        console.error('Failed to update author:', updateError);
      }
    } catch (err) {
      // Rollback on exception
      const rolledBackArticles = articlesData.articles.map(article =>
        article.id === articleId ? originalArticle : article
      );
      dispatch({ type: 'SET_ARTICLES_DATA', payload: { ...articlesData, articles: rolledBackArticles } });
      console.error('Error updating author:', err);
    } finally {
      // Remove loading state
      const newAuthorIds = new Set(loading.authorIds);
      newAuthorIds.delete(articleId);
      setLoading({ authorIds: newAuthorIds });
    }
  };

  // Handle status update with optimistic UI
  const handleStatusUpdateOptimistic = async (articleId: string, newStatus: 'published' | 'draft' | 'archived') => {
    if (!articlesData) return;

    // Store original article for rollback
    const originalArticle = articlesData.articles.find(article => article.id === articleId);
    if (!originalArticle) return;

    // Optimistic UI update
    const updatedArticles = articlesData.articles.map(article =>
      article.id === articleId ? { ...article, status: newStatus } : article
    );
    dispatch({ type: 'SET_ARTICLES_DATA', payload: { ...articlesData, articles: updatedArticles } });

    // Close the status editor
    setModal({ quickStatusEditor: null });

    try {
      // Send API request
      const { error } = await ArticlesService.updateStatus(articleId, newStatus);

      if (error) {
        // Revert optimistic update on error
        const revertedArticles = articlesData.articles.map(article =>
          article.id === articleId ? originalArticle : article
        );
        dispatch({ type: 'SET_ARTICLES_DATA', payload: { ...articlesData, articles: revertedArticles } });
        dispatch({ type: 'SET_ERROR', payload: 'Không thể cập nhật trạng thái bài viết' });
      } else {
        // Refresh stats on success
        await fetchStats();
      }
    } catch (err) {
      // Revert optimistic update on exception
      const revertedArticles = articlesData.articles.map(article =>
        article.id === articleId ? originalArticle : article
      );
      dispatch({ type: 'SET_ARTICLES_DATA', payload: { ...articlesData, articles: revertedArticles } });
      dispatch({ type: 'SET_ERROR', payload: 'Có lỗi xảy ra khi cập nhật trạng thái' });
    }
  };

  // Handle category update with optimistic UI and loading state
  const handleCategoryUpdate = async (articleId: string, categoryIds: string[], categoryNames: string[]) => {
    if (!articlesData) return;

    // Close popup immediately for fast UX
    setModal({ quickCategoryEditor: null });

    // Store original article for rollback
    const originalArticle = articlesData.articles.find(article => article.id === articleId);
    if (!originalArticle) return;

    // Start loading state
    setLoading({ categoryIds: new Set(loading.categoryIds).add(articleId) });

    // Optimistic UI update - update all category-related fields
    const updatedArticles = articlesData.articles.map(article =>
      article.id === articleId ? {
        ...article,
        category_names: categoryNames,  // Computed field for UI display
        category_ids: categoryIds,      // Array for QuickMultipleCategoryEditor
        category_id: categoryIds.length > 0 ? categoryIds[0] : null  // Primary category for database
      } : article
    );
    dispatch({ type: 'SET_ARTICLES_DATA', payload: { ...articlesData, articles: updatedArticles } });

    try {
      // Call API in background
      const { error: updateError } = await ArticlesService.updateCategories(articleId, categoryIds);

      if (updateError) {
        // Rollback on error
        const rolledBackArticles = articlesData.articles.map(article =>
          article.id === articleId ? originalArticle : article
        );
        dispatch({ type: 'SET_ARTICLES_DATA', payload: { ...articlesData, articles: rolledBackArticles } });

        // Show error (you can add toast notification here)
        console.error('Failed to update categories:', updateError);
      }
    } catch (err) {
      // Rollback on exception
      const rolledBackArticles = articlesData.articles.map(article =>
        article.id === articleId ? originalArticle : article
      );
      dispatch({ type: 'SET_ARTICLES_DATA', payload: { ...articlesData, articles: rolledBackArticles } });
      console.error('Error updating categories:', err);
    } finally {
      // Remove loading state
      const newCategoryIds = new Set(loading.categoryIds);
      newCategoryIds.delete(articleId);
      setLoading({ categoryIds: newCategoryIds });
    }
  };

  // Handle title update with optimistic UI and loading state
  const handleTitleUpdate = async (articleId: string, newTitle: string) => {
    if (!articlesData) return;

    // Close popup immediately for fast UX
    setModal({ quickTitleEditor: null });

    // Store original article for rollback
    const originalArticle = articlesData.articles.find(article => article.id === articleId);
    if (!originalArticle) return;

    // Start loading state
    setLoading({ titleIds: new Set(loading.titleIds).add(articleId) });

    // Optimistic UI update
    const updatedArticles = articlesData.articles.map(article =>
      article.id === articleId ? { ...article, title: newTitle } : article
    );
    dispatch({ type: 'SET_ARTICLES_DATA', payload: { ...articlesData, articles: updatedArticles } });

    try {
      // Send API request
      const { error } = await ArticlesService.updateTitle(articleId, newTitle);

      if (error) {
        // Rollback on error
        const rolledBackArticles = articlesData.articles.map(article =>
          article.id === articleId ? originalArticle : article
        );
        dispatch({ type: 'SET_ARTICLES_DATA', payload: { ...articlesData, articles: rolledBackArticles } });
        dispatch({ type: 'SET_ERROR', payload: 'Không thể cập nhật tiêu đề bài viết' });
      }
    } catch (err) {
      // Rollback on exception
      const rolledBackArticles = articlesData.articles.map(article =>
        article.id === articleId ? originalArticle : article
      );
      dispatch({ type: 'SET_ARTICLES_DATA', payload: { ...articlesData, articles: rolledBackArticles } });
      console.error('Error updating title:', err);
    } finally {
      // Remove loading state
      const newTitleIds = new Set(loading.titleIds);
      newTitleIds.delete(articleId);
      setLoading({ titleIds: newTitleIds });
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

  // Loading state removed - show content immediately

  return (
    <div className="space-y-6">
      {/* STATIC HEADER - Hiển thị ngay lập tức */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Quản lý bài viết</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Quản lý nội dung và bài viết trên website</p>
        </div>
        <div className="flex items-center space-x-3">
          <a
            href="/admin/articles/create"
            onClick={() => SmartPreloader.triggerSmartPreload('click')}
            onMouseEnter={() => SmartPreloader.triggerSmartPreload('hover')}
            className="inline-flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors duration-200"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Thêm bài viết
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

      {/* Stats Cards - NO SKELETON: Show immediately or nothing */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
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
            <div
              key={stat.title}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow duration-200"
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
            </div>
          ))}
        </div>
      )}



      {/* STATIC FILTERS - Hiển thị ngay lập tức */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tìm kiếm</label>
            <SearchInput
              value={filters.search || ''}
              onChange={(value) => handleFilterChange({ search: value })}
              placeholder="Tiêu đề, tác giả, danh mục, tags..."
              onClear={() => handleFilterChange({ search: '' })}
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

      {/* Search Stats */}
      <SearchStats
        searchTerm={filters.search || ''}
        totalResults={articlesData?.total || 0}
        currentPage={currentPage}
        totalPages={articlesData?.totalPages || 1}
        className="mb-4"
      />

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
                  onClick={() => dispatch({ type: 'CLEAR_SELECTION' })}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
                >
                  Bỏ chọn
                </button>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleBulkStatusUpdate('published')}
                  disabled={loading.updating}
                  className="px-3 py-1 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white text-sm rounded-md transition-colors"
                >
                  Xuất bản
                </button>
                <button
                  onClick={() => handleBulkStatusUpdate('draft')}
                  disabled={loading.updating}
                  className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 disabled:bg-yellow-400 text-white text-sm rounded-md transition-colors"
                >
                  Chuyển nháp
                </button>
                <button
                  onClick={() => handleBulkStatusUpdate('archived')}
                  disabled={loading.updating}
                  className="px-3 py-1 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white text-sm rounded-md transition-colors"
                >
                  Lưu trữ
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Articles Table - NO SKELETON: Show immediately or nothing */}
      {articlesData ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Danh sách bài viết ({articlesData.total.toLocaleString()})
              </h3>
              <div>
                <a
                  href="/admin/articles/create"
                  onClick={() => SmartPreloader.triggerSmartPreload('click')}
                  onMouseEnter={() => SmartPreloader.triggerSmartPreload('hover')}
                  className="flex items-center justify-center w-10 h-10 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
                  title="Tạo bài viết mới"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </a>
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
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={selectedArticles.length === articlesData.articles.length && articlesData.articles.length > 0}
                          onChange={handleSelectAll}
                          className="rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500"
                        />
                        <span>Bài viết</span>
                      </div>
                    </th>
                    <th className="hidden sm:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Danh mục
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
                    <th className="hidden lg:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Links
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
                            <div className="flex items-start space-x-2">
                              <div className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-2 flex-1">
                                <SearchHighlight
                                  text={article.title}
                                  searchTerm={filters.search || ''}
                                />
                              </div>
                              <button
                                onClick={(e) => handleQuickTitleEdit(e, article.id)}
                                disabled={loading.titleIds.has(article.id)}
                                className="p-1 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-200 flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Chỉnh sửa tiêu đề"
                                data-quick-edit-button="title"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                              </button>
                            </div>
                            {/* Category info for mobile */}
                            <div className="sm:hidden mt-2 flex items-center">
                              {loading.categoryIds.has(article.id) ? (
                                <div className="flex items-center space-x-2">
                                  <LoadingSpinner size="sm" color="blue" />
                                  <div className="text-xs text-gray-500 dark:text-gray-400">
                                    Đang cập nhật danh mục...
                                  </div>
                                </div>
                              ) : (
                                <CategoryDisplay
                                  categories={article.category_names || []}
                                  maxVisible={2}
                                  getCategoryColor={getCategoryColor}
                                  className=""
                                  showIcon={true}
                                  iconPrefix="📁"
                                />
                              )}
                              <button
                                onClick={(e) => handleQuickCategoryEdit(e, article.id)}
                                onMouseEnter={() => SmartPreloader.triggerSmartPreload('hover')}
                                disabled={loading.categoryIds.has(article.id)}
                                className="ml-2 p-1 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-200 flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Chỉnh sửa danh mục"
                                data-quick-edit-button="category"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                              </button>
                            </div>
                            <div className="flex items-center space-x-2 mt-2">
                              {loading.tagIds.has(article.id) ? (
                                <div className="flex items-center space-x-2">
                                  <LoadingSpinner size="sm" color="blue" />
                                  <div className="text-xs text-gray-500 dark:text-gray-400">
                                    Đang cập nhật tags...
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-center space-x-2">
                                  {(() => {
                                    const tagNames = article.tag_names || [];
                                    return tagNames.slice(0, 3).map((tagName, index) => (
                                      <span
                                        key={`${article.id}-tag-${index}-${tagName}`}
                                        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300"
                                      >
                                        {tagName}
                                      </span>
                                    ));
                                  })()}
                                  {(() => {
                                    const tagNames = article.tag_names || [];
                                    return tagNames.length > 3 && (
                                      <span className="text-xs text-gray-500 dark:text-gray-400">
                                        +{tagNames.length - 3} khác
                                      </span>
                                    );
                                  })()}
                                </div>
                              )}
                              <button
                                onClick={(e) => handleQuickTagsEdit(e, article.id)}
                                onMouseEnter={() => SmartPreloader.triggerSmartPreload('hover')}
                                disabled={loading.tagIds.has(article.id)}
                                className="p-1 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Chỉnh sửa tags"
                                data-quick-edit-button="tags"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                </svg>
                              </button>
                            </div>

                            {/* Stats for mobile */}
                            <div className="sm:hidden mt-2 flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                              <div className="flex items-center space-x-1">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                <span>{formatNumber(article.view_count || 0)}</span>
                              </div>

                              <div className="flex items-center space-x-1">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                </svg>
                                <span>{formatNumber(article.like_count || 0)}</span>
                              </div>

                              {article.word_count && article.word_count > 0 && (
                                <div className="flex items-center space-x-1">
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                  <span>{formatNumber(article.word_count)}</span>
                                </div>
                              )}

                              {/* Links for mobile - compact display */}
                              <div className="lg:hidden flex items-center space-x-2">
                                {/* Internal Links */}
                                <div className="flex items-center space-x-1">
                                  <svg className="w-3 h-3 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                  </svg>
                                  <span className="text-green-600 dark:text-green-400 text-xs">
                                    {article.internal_links && Array.isArray(article.internal_links) ? article.internal_links.length : 0}
                                  </span>
                                </div>

                                {/* External Links */}
                                <div className="flex items-center space-x-1">
                                  <svg className="w-3 h-3 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                  </svg>
                                  <span className="text-blue-600 dark:text-blue-400 text-xs">
                                    {article.external_links && Array.isArray(article.external_links) ? article.external_links.length : 0}
                                  </span>
                                </div>

                                {/* Analyze button for mobile */}
                                <button
                                  onClick={() => setModal({
                                    linkAnalysisModal: {
                                      articleId: article.id,
                                      articleTitle: article.title
                                    }
                                  })}
                                  className="p-1 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-200"
                                  title="Phân tích links"
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Categories */}
                      <td className="hidden sm:table-cell px-6 py-4">
                        <div className="flex items-center">
                          {loading.categoryIds.has(article.id) ? (
                            <div className="flex items-center space-x-2">
                              <LoadingSpinner size="sm" color="blue" />
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                Đang cập nhật...
                              </div>
                            </div>
                          ) : (
                            <CategoryDisplay
                              categories={article.category_names || []}
                              maxVisible={2}
                              getCategoryColor={getCategoryColor}
                              className=""
                            />
                          )}
                          <button
                            onClick={(e) => handleQuickCategoryEdit(e, article.id)}
                            onMouseEnter={() => SmartPreloader.triggerSmartPreload('hover')}
                            disabled={loading.categoryIds.has(article.id)}
                            className="ml-2 p-1 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-200 flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Chỉnh sửa danh mục"
                            data-quick-edit-button="category"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                        </div>
                      </td>

                      {/* Author */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <div className="flex items-center space-x-2">
                            {loading.authorIds.has(article.id) ? (
                              <div className="flex items-center space-x-2">
                                <LoadingSpinner size="sm" color="blue" />
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                  Đang cập nhật...
                                </div>
                              </div>
                            ) : (
                              <div className="text-sm text-gray-900 dark:text-gray-100">
                                {article.user_profiles?.full_name || article.author || 'Unknown Author'}
                              </div>
                            )}
                          </div>
                          <button
                            onClick={(e) => handleQuickAuthorEdit(e, article.id)}
                            onMouseEnter={() => SmartPreloader.triggerSmartPreload('hover')}
                            disabled={loading.authorIds.has(article.id)}
                            className="p-1 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
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
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusBadge(article.status)}`}>
                            {getStatusLabel(article.status)}
                          </span>
                          <button
                            onClick={(e) => handleQuickStatusEdit(e, article.id)}
                            className="p-1 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-200"
                            title="Chỉnh sửa trạng thái"
                            data-quick-edit-button="status"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                        </div>
                      </td>

                      {/* Stats */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-1">
                          {/* Views */}
                          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            <span>{formatNumber(article.view_count || 0)}</span>
                          </div>

                          {/* Likes */}
                          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                            <span>{formatNumber(article.like_count || 0)}</span>
                          </div>

                          {/* Word Count */}
                          {article.word_count && article.word_count > 0 && (
                            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              <span>{formatNumber(article.word_count)} từ</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Links */}
                      <td className="hidden lg:table-cell px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            {/* Internal Links */}
                            {article.internal_links && Array.isArray(article.internal_links) && article.internal_links.length > 0 ? (
                              <div className="flex items-center space-x-1">
                                <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                </svg>
                                <span className="text-sm font-medium text-green-600 dark:text-green-400">
                                  {article.internal_links.length}
                                </span>
                              </div>
                            ) : (
                              <div className="flex items-center space-x-1">
                                <svg className="w-4 h-4 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                </svg>
                                <span className="text-sm text-gray-400 dark:text-gray-500">0</span>
                              </div>
                            )}

                            {/* External Links */}
                            {article.external_links && Array.isArray(article.external_links) && article.external_links.length > 0 ? (
                              <div className="flex items-center space-x-1">
                                <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                                <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                                  {article.external_links.length}
                                </span>
                              </div>
                            ) : (
                              <div className="flex items-center space-x-1">
                                <svg className="w-4 h-4 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                                <span className="text-sm text-gray-400 dark:text-gray-500">0</span>
                              </div>
                            )}
                          </div>

                          {/* Analyze button */}
                          <button
                            onClick={() => setModal({
                              linkAnalysisModal: {
                                articleId: article.id,
                                articleTitle: article.title
                              }
                            })}
                            className="p-1 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-200"
                            title="Phân tích links"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                          </button>
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
                          {/* Edit */}
                          <a
                            href={`/admin/articles/edit?id=${article.id}`}
                            onMouseEnter={() => SmartPreloader.triggerSmartPreload('hover')}
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
                            disabled={loading.updating}
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
      ) : (
        // EMPTY STATE: Show when no data (no loading check needed)
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Chưa có bài viết nào</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">Bắt đầu tạo bài viết đầu tiên của bạn</p>
          <a
            href="/admin/articles/create"
            className="inline-flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors duration-200"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Tạo bài viết mới
          </a>
        </div>
      )}

      {/* Quick Editors */}
      <AnimatePresence>
        {quickTagsEditor && (
          <QuickTagsEditor
            articleId={quickTagsEditor.articleId}
            currentTags={(() => {
              const article = articlesData?.articles.find(a => a.id === quickTagsEditor.articleId);
              return article?.tag_names || [];
            })()}
            onUpdate={handleTagsUpdate}
            onClose={() => setModal({ quickTagsEditor: null })}
            position={quickTagsEditor.position}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {quickAuthorEditor && (
          <QuickAuthorEditor
            articleId={quickAuthorEditor.articleId}
            currentAuthor={articlesData?.articles.find(a => a.id === quickAuthorEditor.articleId)?.user_profiles?.full_name || articlesData?.articles.find(a => a.id === quickAuthorEditor.articleId)?.author || ''}
            currentAuthorId={articlesData?.articles.find(a => a.id === quickAuthorEditor.articleId)?.author_id}
            onUpdate={handleAuthorUpdate}
            onClose={() => setModal({ quickAuthorEditor: null })}
            position={quickAuthorEditor.position}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {quickCategoryEditor && (
          <QuickMultipleCategoryEditor
            articleId={quickCategoryEditor.articleId}
            currentCategoryIds={(() => {
              const article = articlesData?.articles.find(a => a.id === quickCategoryEditor.articleId);
              // Use category_ids if available, otherwise fallback to category_id as single item array
              if (article?.category_ids && article.category_ids.length > 0) {
                return article.category_ids;
              }
              return article?.category_id ? [article.category_id] : [];
            })()}
            currentCategoryNames={(() => {
              const article = articlesData?.articles.find(a => a.id === quickCategoryEditor.articleId);
              return article?.category_names || [];
            })()}
            onUpdate={handleCategoryUpdate}
            onClose={() => setModal({ quickCategoryEditor: null })}
            position={quickCategoryEditor.position}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {quickTitleEditor && (
          <QuickTitleEditor
            articleId={quickTitleEditor.articleId}
            currentTitle={(() => {
              const article = articlesData?.articles.find(a => a.id === quickTitleEditor.articleId);
              return article?.title || '';
            })()}
            onUpdate={handleTitleUpdate}
            onClose={() => setModal({ quickTitleEditor: null })}
            position={quickTitleEditor.position}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {quickStatusEditor && (
          <QuickStatusEditor
            articleId={quickStatusEditor.articleId}
            currentStatus={articlesData?.articles.find(a => a.id === quickStatusEditor.articleId)?.status || 'draft'}
            onUpdate={handleStatusUpdateOptimistic}
            onClose={() => setModal({ quickStatusEditor: null })}
            position={quickStatusEditor.position}
          />
        )}
      </AnimatePresence>

      {/* Link Analysis Modal */}
      {linkAnalysisModal && (
        <LinkAnalysisModal
          articleId={linkAnalysisModal.articleId}
          articleTitle={linkAnalysisModal.articleTitle}
          isOpen={true}
          onClose={() => setModal({ linkAnalysisModal: null })}
        />
      )}
    </div>
  );
}
