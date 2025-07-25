/**
 * DATA LOADING HOOK FOR ARTICLE CREATE PAGE
 * Hook để load data cho trang tạo bài viết với Progressive Loading
 */

import { useState, useEffect } from 'react';
import { ArticlesService, AuthService } from '../../../../../backend';
import type { Category, AuthorOption } from '../../../../../backend';
import { 
  getInstantCategoriesData, 
  preloadCategoriesData, 
  isCategoriesDataReady 
} from '../../../../utils/admin/preloaders/categories-preloader';
import { 
  getInstantAuthorsData, 
  preloadAuthorsData, 
  isAuthorsDataReady 
} from '../../../../utils/admin/preloaders/authors-preloader';
import { createLoadingActions, createInitialLoadingState, type CreateLoadingState } from './useLoadingStates';

interface UseCreateDataProps {
  setCurrentUserId: (id: string | null) => void;
  setLoadError: (error: string) => void;
}

export const useCreateData = ({
  setCurrentUserId,
  setLoadError
}: UseCreateDataProps) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [authors, setAuthors] = useState<AuthorOption[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [loadingState, setLoadingState] = useState<CreateLoadingState>(createInitialLoadingState);

  const loadingActions = createLoadingActions(setLoadingState);

  useEffect(() => {
    const loadAllData = async () => {
      setLoadError('');

      console.log('🔄 CREATE PAGE: Starting data load');

      // Load current user first
      try {
        const { user } = await AuthService.getCurrentUser();
        if (user?.id) {
          setCurrentUserId(user.id);
        }
      } catch (error) {
        console.error('Failed to get current user:', error);
      }

      // Start preloading immediately (non-blocking)
      preloadCategoriesData();
      preloadAuthorsData();

      try {
        // CREATE MODE: Load dropdown data with progressive loading
        console.log('📝 CREATE MODE: Loading dropdown data progressively');

        // Load categories first (usually fastest)
        const categoriesData = isCategoriesDataReady() 
          ? getInstantCategoriesData() 
          : await preloadCategoriesData();

        if (categoriesData && !categoriesData.error) {
          setCategories(categoriesData.data || []);
          console.log(`✅ Categories loaded: ${categoriesData.data?.length || 0} items`);
        }
        loadingActions.setCategoriesLoaded();

        // Load authors second
        const authorsData = isAuthorsDataReady() 
          ? getInstantAuthorsData() 
          : await preloadAuthorsData();

        if (authorsData && !authorsData.error) {
          setAuthors(authorsData.data || []);
          console.log(`✅ Authors loaded: ${authorsData.data?.length || 0} items`);
        }
        loadingActions.setAuthorsLoaded();

        // Load available tags for autocomplete (slowest)
        try {
          // Use preloaded tags if available
          const { getInstantTagsData, preloadTagsData, isTagsDataReady } = await import('../../../../utils/admin/preloaders/tags-preloader');

          const tagsData = isTagsDataReady()
            ? getInstantTagsData()
            : await preloadTagsData();

          setAvailableTags(tagsData || []);
          console.log(`✅ Available tags loaded: ${tagsData?.length || 0} items`);
        } catch (error) {
          console.error('Failed to load available tags:', error);
          // Don't fail the whole page if tags fail to load
          setAvailableTags([]);
        }
        loadingActions.setTagsLoaded();

        // Mark all data as loaded
        loadingActions.setDataLoaded();
        console.log('✅ All create page data loaded successfully');

      } catch (error) {
        console.error('Error loading create page data:', error);
        setLoadError('Không thể tải dữ liệu trang tạo bài viết');
      }
    };

    loadAllData();
  }, []);

  return {
    categories,
    authors,
    availableTags,
    loadingState,
    loadingActions
  };
};
