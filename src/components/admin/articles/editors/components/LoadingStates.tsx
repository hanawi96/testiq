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
    <svg className="w-4 h-4 animate-spin text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
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
  isLoadingCategories: !isEditMode, // Create mode: categories load instantly
  isLoadingAuthors: !isEditMode, // Create mode: authors load instantly
  isLoadingTags: isEditMode // Edit mode: tags need to load, Create mode: no tags to load
});
