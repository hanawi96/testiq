/**
 * TYPES FOR ARTICLES ADMIN
 * Shared types for the unified articles admin hook
 */

import type { ArticlesFilters, ArticlesListResponse, ArticleStats } from '../../../../../../backend';

export interface EditorPosition {
  articleId: string;
  position: { top: number; left: number };
}

export interface LoadingStates {
  stats: boolean;
  articles: boolean;
  updating: boolean;
  // Unified field loading - simpler than separate Sets
  fieldUpdates: Map<string, Set<string>>; // fieldName -> Set of articleIds
}

// Helper functions for field loading
export const createFieldLoadingHelpers = () => {
  const getFieldLoading = (loadingStates: LoadingStates, fieldName: string): Set<string> => {
    return loadingStates.fieldUpdates.get(fieldName) || new Set();
  };

  const setFieldLoading = (loadingStates: LoadingStates, fieldName: string, articleIds: Set<string>): LoadingStates => {
    const newFieldUpdates = new Map(loadingStates.fieldUpdates);
    newFieldUpdates.set(fieldName, articleIds);
    return { ...loadingStates, fieldUpdates: newFieldUpdates };
  };

  return { getFieldLoading, setFieldLoading };
};

// Legacy compatibility - map old field names to new system
export const FIELD_NAMES = {
  authorIds: 'author',
  categoryIds: 'category',
  tagIds: 'tags',
  titleIds: 'title',
  statusIds: 'status'
} as const;

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
  loading: LoadingStates;
  
  // UI State
  currentPage: number;
  limit: number;
  filters: ArticlesFilters;
  selectedArticles: string[];
  showBulkActions: boolean;
  
  // Modal State
  modals: ModalStates;
}

export type AdminArticlesAction =
  | { type: 'SET_ARTICLES_DATA'; payload: ArticlesListResponse | null }
  | { type: 'SET_STATS'; payload: ArticleStats | null }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'SET_LOADING'; payload: Partial<LoadingStates> }
  | { type: 'SET_UI'; payload: Partial<Pick<AdminArticlesState, 'currentPage' | 'limit' | 'filters' | 'selectedArticles' | 'showBulkActions'>> }
  | { type: 'SET_MODAL'; payload: Partial<ModalStates> }
  | { type: 'RESET_MODALS' }
  | { type: 'TOGGLE_ARTICLE_SELECTION'; payload: string }
  | { type: 'CLEAR_SELECTION' };
