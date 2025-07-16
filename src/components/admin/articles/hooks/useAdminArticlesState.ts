import { useReducer } from 'react';
import type { ArticleStats, ArticlesFilters, ArticlesListResponse } from '../../../../../backend';

// ===== OPTIMIZED STATE MANAGEMENT =====

export interface EditorPosition {
  articleId: string;
  position: { top: number; left: number };
}

export interface LoadingStates {
  stats: boolean;
  articles: boolean;
  updating: boolean;
  authorIds: Set<string>;
  categoryIds: Set<string>;
  tagIds: Set<string>;
  titleIds: Set<string>;
  statusIds: Set<string>;
}

export interface UIStates {
  currentPage: number;
  limit: number;
  filters: ArticlesFilters;
  selectedArticles: string[];
  showBulkActions: boolean;
}

export interface ModalStates {
  quickTagsEditor: EditorPosition | null;
  quickAuthorEditor: EditorPosition | null;
  quickCategoryEditor: EditorPosition | null;
  quickStatusEditor: EditorPosition | null;
  quickTitleEditor: EditorPosition | null;
  linkAnalysisModal: { articleId: string; articleTitle: string } | null;
}

export interface AdminArticlesState {
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

export type AdminArticlesAction =
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
    titleIds: new Set(),
    statusIds: new Set()
  },
  ui: {
    currentPage: 1,
    limit: 10,
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

export function useAdminArticlesState() {
  const [state, dispatch] = useReducer(adminArticlesReducer, initialState);

  // Helper functions for cleaner code
  const closeAllEditors = () => dispatch({ type: 'RESET_MODALS' });
  const setModal = (payload: Partial<ModalStates>) => dispatch({ type: 'SET_MODAL', payload });
  const setLoading = (payload: Partial<LoadingStates>) => dispatch({ type: 'SET_LOADING', payload });

  return {
    state,
    dispatch,
    // Helper functions
    closeAllEditors,
    setModal,
    setLoading,
    // Destructured state for easier access
    articlesData: state.articlesData,
    stats: state.stats,
    error: state.error,
    loading: state.loading,
    ui: state.ui,
    modals: state.modals,
    // Destructured UI state
    currentPage: state.ui.currentPage,
    limit: state.ui.limit,
    filters: state.ui.filters,
    selectedArticles: state.ui.selectedArticles,
    showBulkActions: state.ui.showBulkActions,
    // Destructured modal state
    quickTagsEditor: state.modals.quickTagsEditor,
    quickAuthorEditor: state.modals.quickAuthorEditor,
    quickCategoryEditor: state.modals.quickCategoryEditor,
    quickStatusEditor: state.modals.quickStatusEditor,
    quickTitleEditor: state.modals.quickTitleEditor,
    linkAnalysisModal: state.modals.linkAnalysisModal
  };
}
