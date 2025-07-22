/**
 * LOADING STATES COMPONENT
 * Tách component loading states để dễ quản lý
 */

import React from 'react';

// Loading state type
export interface LoadingState {
  isLoading: boolean;
  isDataLoaded: boolean;
  isValidatingSlug: boolean;
  isEditorReady: boolean;
  isLoadingArticleData: boolean;
  isLoadingCategories: boolean;
  isLoadingAuthors: boolean;
  isLoadingTags: boolean;
}

// Props for loading components
interface LoadingComponentProps {
  loadingState: LoadingState;
  isEditMode: boolean;
}

// Slug validation spinner
export const SlugValidationSpinner: React.FC<{ isValidating: boolean }> = ({ isValidating }) => {
  if (!isValidating) return null;

  return (
    <div className="w-4 h-4 animate-spin text-blue-600">
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" className="opacity-25"/>
        <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" className="opacity-75"/>
      </svg>
    </div>
  );
};

// Loading state helpers
export const useLoadingHelpers = (loadingState: LoadingState, isEditMode: boolean) => {
  return {
    shouldShowArticleSkeleton: isEditMode && loadingState.isLoadingArticleData,
    shouldShowCategoriesSkeleton: loadingState.isLoadingCategories,
    shouldShowAuthorsSkeleton: loadingState.isLoadingAuthors,
    shouldShowTagsSkeleton: loadingState.isLoadingTags,
    shouldShowSEOSkeleton: isEditMode && loadingState.isLoadingArticleData,
    isAnyLoading: loadingState.isLoading || loadingState.isLoadingArticleData || 
                  loadingState.isLoadingCategories || loadingState.isLoadingAuthors || 
                  loadingState.isLoadingTags,
    isFormDisabled: loadingState.isLoading
  };
};

// Loading state actions
export const createLoadingActions = (
  setLoadingState: React.Dispatch<React.SetStateAction<LoadingState>>
) => ({
  setValidatingSlug: (isValidating: boolean) => {
    setLoadingState(prev => ({ ...prev, isValidatingSlug: isValidating }));
  },
  
  setArticleDataLoaded: () => {
    setLoadingState(prev => ({
      ...prev,
      isDataLoaded: true,
      isLoadingArticleData: false
    }));
  },
  
  setTagsLoaded: () => {
    setLoadingState(prev => ({
      ...prev,
      isLoadingTags: false
    }));
  },

  setCategoriesLoaded: () => {
    setLoadingState(prev => ({
      ...prev,
      isLoadingCategories: false
    }));
  },

  setAuthorsLoaded: () => {
    setLoadingState(prev => ({
      ...prev,
      isLoadingAuthors: false
    }));
  },

  setCreateModeDataLoaded: () => {
    setLoadingState(prev => ({
      ...prev,
      isDataLoaded: true,
      isLoadingCategories: false,
      isLoadingAuthors: false,
      isLoadingTags: false
    }));
  },
  
  setLoadingError: () => {
    setLoadingState(prev => ({ 
      ...prev, 
      isLoading: false, 
      isDataLoaded: false 
    }));
  }
});

// Initial loading state factory
export const createInitialLoadingState = (isEditMode: boolean): LoadingState => ({
  isLoading: false, // UI tĩnh hiển thị ngay
  isDataLoaded: !isEditMode, // false for edit mode, true for create mode
  isValidatingSlug: false,
  isEditorReady: false,
  // Separate loading states for different sections
  isLoadingArticleData: isEditMode,
  isLoadingCategories: isEditMode, // Edit mode: categories need to load
  isLoadingAuthors: isEditMode, // Edit mode: authors need to load
  isLoadingTags: isEditMode // Edit mode: tags need to load, Create mode: no tags to load
});
