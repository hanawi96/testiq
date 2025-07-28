/**
 * REDUCER FOR ARTICLES ADMIN
 * State management logic for the unified articles admin hook
 */

import type { ArticlesFilters } from '../../../../../../backend';
import type { AdminArticlesState, AdminArticlesAction, LoadingStates, ModalStates } from './types';

// ===== INITIAL STATE =====
const getInitialFilters = (): ArticlesFilters => {
  if (typeof window === 'undefined') return { status: 'all', sort: 'created_desc' };

  const url = new URL(window.location.href);
  return {
    status: (url.searchParams.get('status') || 'all') as 'all' | 'draft' | 'published' | 'archived' | 'scheduled',
    search: url.searchParams.get('search') || '',
    category: url.searchParams.get('category') || '',
    author: url.searchParams.get('author') || '',
    featured: (url.searchParams.get('featured') || 'all') as 'all' | 'true' | 'false',
    sort: (url.searchParams.get('sort') || 'created_desc') as 'created_desc' | 'created_asc' | 'updated_desc' | 'updated_asc' | 'title_asc' | 'title_desc' | 'views_desc' | 'views_asc'
  };
};

const getInitialPage = (): number => {
  if (typeof window === 'undefined') return 1;

  const url = new URL(window.location.href);
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
  return page;
};

export const initialState: AdminArticlesState = {
  articlesData: null,
  stats: null,
  error: '',
  loading: {
    stats: true,
    articles: true,
    updating: false,
    fieldUpdates: new Map() // Unified field loading system
  },
  currentPage: getInitialPage(),
  limit: 5,
  filters: getInitialFilters(),
  selectedArticles: [],
  showBulkActions: false,
  modals: {
    quickTagsEditor: null,
    quickAuthorEditor: null,
    quickCategoryEditor: null,
    quickStatusEditor: null,
    quickTitleEditor: null,
    linkAnalysisModal: null
  }
};

// ===== REDUCER =====
export function adminArticlesReducer(state: AdminArticlesState, action: AdminArticlesAction): AdminArticlesState {
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
      return { ...state, ...action.payload };

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
      const isSelected = state.selectedArticles.includes(articleId);
      const newSelection = isSelected
        ? state.selectedArticles.filter(id => id !== articleId)
        : [...state.selectedArticles, articleId];
      
      return {
        ...state,
        selectedArticles: newSelection,
        showBulkActions: newSelection.length > 0
      };

    case 'CLEAR_SELECTION':
      return {
        ...state,
        selectedArticles: [],
        showBulkActions: false
      };

    default:
      return state;
  }
}
