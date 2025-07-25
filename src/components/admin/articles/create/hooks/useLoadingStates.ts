/**
 * LOADING STATES FOR ARTICLE CREATE PAGE
 * Quản lý loading states cho Progressive Loading trong trang tạo bài viết
 */

import { useState, useEffect } from 'react';

// Loading state interface
export interface CreateLoadingState {
  isLoading: boolean;
  isDataLoaded: boolean;
  isEditorReady: boolean;
  // Separate loading states for different sections
  isLoadingCategories: boolean;
  isLoadingAuthors: boolean;
  isLoadingTags: boolean;
  isValidatingSlug: boolean;
}

// Loading actions interface
export interface CreateLoadingActions {
  setLoading: (loading: boolean) => void;
  setDataLoaded: () => void;
  setEditorReady: () => void;
  setCategoriesLoaded: () => void;
  setAuthorsLoaded: () => void;
  setTagsLoaded: () => void;
  setSlugValidating: (validating: boolean) => void;
}

// Initial loading state for create mode
export const createInitialLoadingState = (): CreateLoadingState => ({
  isLoading: false, // UI tĩnh hiển thị ngay
  isDataLoaded: false, // Cần load categories, authors, tags
  isEditorReady: false,
  isValidatingSlug: false,
  // Create mode: cần load dropdown data
  isLoadingCategories: true, // Cần load categories cho dropdown
  isLoadingAuthors: true, // Cần load authors cho dropdown  
  isLoadingTags: true // Cần load available tags cho autocomplete
});

// Create loading actions
export const createLoadingActions = (
  setLoadingState: React.Dispatch<React.SetStateAction<CreateLoadingState>>
): CreateLoadingActions => ({
  setLoading: (loading: boolean) =>
    setLoadingState(prev => ({ ...prev, isLoading: loading })),
    
  setDataLoaded: () =>
    setLoadingState(prev => ({ ...prev, isDataLoaded: true })),
    
  setEditorReady: () =>
    setLoadingState(prev => ({ ...prev, isEditorReady: true })),
    
  setCategoriesLoaded: () =>
    setLoadingState(prev => ({ ...prev, isLoadingCategories: false })),
    
  setAuthorsLoaded: () =>
    setLoadingState(prev => ({ ...prev, isLoadingAuthors: false })),
    
  setTagsLoaded: () =>
    setLoadingState(prev => ({ ...prev, isLoadingTags: false })),
    
  setSlugValidating: (validating: boolean) =>
    setLoadingState(prev => ({ ...prev, isValidatingSlug: validating }))
});

// Loading state helpers
export const useCreateLoadingHelpers = (loadingState: CreateLoadingState) => {
  return {
    // Create mode không cần skeleton cho article data (vì không load article)
    shouldShowArticleSkeleton: false,
    shouldShowCategoriesSkeleton: loadingState.isLoadingCategories,
    shouldShowAuthorsSkeleton: loadingState.isLoadingAuthors,
    shouldShowTagsSkeleton: loadingState.isLoadingTags,
    shouldShowEditorSkeleton: !loadingState.isEditorReady,
    isAnyLoading: loadingState.isLoading || 
                  loadingState.isLoadingCategories || 
                  loadingState.isLoadingAuthors || 
                  loadingState.isLoadingTags,
    isFormDisabled: loadingState.isLoading,
    isDataReady: !loadingState.isLoadingCategories && 
                 !loadingState.isLoadingAuthors && 
                 !loadingState.isLoadingTags
  };
};

// Hook để quản lý Progressive Loading cho create page
export const useCreateProgressiveLoading = () => {
  const [loadingState, setLoadingState] = useState<CreateLoadingState>(createInitialLoadingState);
  const loadingActions = createLoadingActions(setLoadingState);
  const loadingHelpers = useCreateLoadingHelpers(loadingState);

  // Editor ready immediately for create mode
  useEffect(() => {
    // Editor ready after a short delay
    setTimeout(() => {
      loadingActions.setEditorReady();
      console.log('✅ Editor ready');
    }, 200);
  }, []);

  return {
    loadingState,
    loadingActions,
    loadingHelpers
  };
};
