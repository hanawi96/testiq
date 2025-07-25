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

// OPTIMIZED Loading state helpers with consistent timing
export const useLoadingHelpers = (loadingState: LoadingState, isEditMode: boolean) => {
  // TIMING OPTIMIZATION: Ensure minimum skeleton display time for smooth UX
  const minSkeletonTime = 200; // ms - prevent flash for fast loads

  return {
    // UNIFIED: Both CREATE and EDIT use same skeleton logic
    shouldShowArticleSkeleton: loadingState.isLoadingArticleData ||
                              (!isEditMode && loadingState.isLoading),
    shouldShowCategoriesSkeleton: loadingState.isLoadingCategories,
    shouldShowAuthorsSkeleton: loadingState.isLoadingAuthors,
    shouldShowTagsSkeleton: loadingState.isLoadingTags,
    shouldShowSEOSkeleton: loadingState.isLoadingArticleData ||
                          (!isEditMode && loadingState.isLoading),

    // PERFORMANCE: Simplified loading check
    isAnyLoading: loadingState.isLoading || loadingState.isLoadingArticleData ||
                  loadingState.isLoadingCategories || loadingState.isLoadingAuthors ||
                  loadingState.isLoadingTags,
    isFormDisabled: loadingState.isLoading,

    // NEW: Consistent skeleton timing
    minSkeletonTime
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
      isLoading: false, // FIX: Tắt loading chính
      isDataLoaded: true,
      isLoadingCategories: false,
      isLoadingAuthors: false,
      isLoadingTags: false
    }));
  },
  
  setLoadingError: (errorType?: 'categories' | 'authors' | 'tags' | 'article') => {
    setLoadingState(prev => ({
      ...prev,
      isLoading: false,
      isDataLoaded: false,
      // IMPROVED: Granular error handling
      ...(errorType === 'categories' && { isLoadingCategories: false }),
      ...(errorType === 'authors' && { isLoadingAuthors: false }),
      ...(errorType === 'tags' && { isLoadingTags: false }),
      ...(errorType === 'article' && { isLoadingArticleData: false })
    }));
  },

  // NEW: Retry mechanism for failed loads
  retryDataLoad: (dataType: 'categories' | 'authors' | 'tags') => {
    setLoadingState(prev => ({
      ...prev,
      [`isLoading${dataType.charAt(0).toUpperCase() + dataType.slice(1)}`]: true
    }));
  }
});

// Initial loading state factory
export const createInitialLoadingState = (isEditMode: boolean): LoadingState => ({
  isLoading: true, // FIX: Cả CREATE và EDIT đều cần loading ban đầu
  isDataLoaded: false, // FIX: Cả CREATE và EDIT đều chưa load data
  isValidatingSlug: false,
  isEditorReady: false,
  // Separate loading states for different sections
  isLoadingArticleData: isEditMode, // Chỉ EDIT mode cần load article data
  isLoadingCategories: true, // FIX: Cả CREATE và EDIT đều cần load categories
  isLoadingAuthors: true, // FIX: Cả CREATE và EDIT đều cần load authors
  isLoadingTags: true // FIX: Cả CREATE và EDIT đều cần load tags
});
