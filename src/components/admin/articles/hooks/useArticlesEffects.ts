/**
 * ARTICLES EFFECTS HOOK
 * Hook quản lý side effects, URL sync và browser history cho Articles module
 * Pattern based on useUsersEffects.ts
 */

import { useEffect, useCallback, useRef } from 'react';
import type { ArticlesFilters } from '../../../../../backend';

// ===== DEBUG UTILITY =====
const debug = {
  url: (msg: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔄 ARTICLES URL: ${msg}`, data || '');
    }
  }
};

interface UseArticlesEffectsProps {
  dispatch: (action: any) => void;
  filters: ArticlesFilters;
  currentPage: number;
}

export const useArticlesEffects = ({
  dispatch,
  filters,
  currentPage
}: UseArticlesEffectsProps) => {
  // Track if initial load is done to prevent auto URL sync on mount
  const initialLoadDone = useRef(false);

  // Update URL without triggering navigation
  const updateURL = useCallback((page: number, currentFilters: ArticlesFilters) => {
    if (typeof window === 'undefined') return;

    const url = new URL(window.location.href);

    // Update page
    if (page > 1) {
      url.searchParams.set('page', page.toString());
    } else {
      url.searchParams.delete('page');
    }

    // Update filters
    Object.entries(currentFilters).forEach(([key, value]) => {
      if (value && value !== 'all' && value !== '') {
        // Special handling for sort - don't add if it's the default
        if (key === 'sort' && value === 'created_desc') {
          url.searchParams.delete(key);
        } else {
          url.searchParams.set(key, value.toString());
        }
      } else {
        url.searchParams.delete(key);
      }
    });

    // Update URL without page reload
    window.history.replaceState({}, '', url.toString());
  }, []);

  // Initialize from URL params on mount - ONLY if no SSR data
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if SSR data exists AND will be used (not skipped by force fresh flag)
    const hasSSRData = (window as any).__ARTICLES_INITIAL_DATA__;
    const forceFresh = localStorage.getItem('articles_force_fresh');
    const willUseSSR = hasSSRData && !forceFresh;

    if (willUseSSR) {
      debug.url('SSR data will be used - skipping URL initialization to prevent conflicts');
      initialLoadDone.current = true;
      return;
    }

    debug.url('No SSR data or force fresh - initializing from URL', { hasSSRData, forceFresh });

    const url = new URL(window.location.href);
    const urlPage = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
    const urlStatus = url.searchParams.get('status') || 'all';
    const urlSearch = url.searchParams.get('search') || '';
    const urlCategory = url.searchParams.get('category') || '';
    const urlAuthor = url.searchParams.get('author') || '';
    const urlFeatured = url.searchParams.get('featured') || 'all';
    const urlSort = url.searchParams.get('sort') || 'created_desc';

    const urlFilters: ArticlesFilters = {
      status: urlStatus as 'all' | 'draft' | 'published',
      search: urlSearch,
      category: urlCategory,
      author: urlAuthor,
      featured: urlFeatured as 'all' | 'true' | 'false',
      sort: urlSort as 'created_desc' | 'created_asc' | 'updated_desc' | 'updated_asc' | 'title_asc' | 'title_desc'
    };

    // Only update if different from current state
    const filtersChanged = JSON.stringify(urlFilters) !== JSON.stringify(filters);
    const pageChanged = urlPage !== currentPage;

    if (filtersChanged || pageChanged) {
      debug.url('Initializing from URL params (no SSR data)', {
        page: urlPage,
        filters: urlFilters
      });

      dispatch({
        type: 'SET_UI',
        payload: {
          currentPage: urlPage,
          filters: urlFilters
        }
      });
    }

    // Mark initial load as done
    initialLoadDone.current = true;
  }, []); // Only run on mount

  // Handle browser back/forward
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handlePopState = () => {
      const url = new URL(window.location.href);
      const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
      const status = url.searchParams.get('status') || 'all';
      const search = url.searchParams.get('search') || '';
      const category = url.searchParams.get('category') || '';
      const author = url.searchParams.get('author') || '';
      const featured = url.searchParams.get('featured') || 'all';
      const sort = url.searchParams.get('sort') || 'created_desc';

      const newFilters: ArticlesFilters = {
        status: status as 'all' | 'draft' | 'published',
        search,
        category,
        author,
        featured: featured as 'all' | 'true' | 'false',
        sort: sort as 'created_desc' | 'created_asc' | 'updated_desc' | 'updated_asc' | 'title_asc' | 'title_desc'
      };

      debug.url('Browser navigation - syncing state from URL', {
        page,
        filters: newFilters
      });

      dispatch({
        type: 'SET_UI',
        payload: {
          currentPage: page,
          filters: newFilters
        }
      });
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [dispatch]);

  // Sync URL when state changes (only after initial load)
  useEffect(() => {
    if (initialLoadDone.current) {
      updateURL(currentPage, filters);
    }
  }, [currentPage, filters, updateURL]);

  return {
    updateURL
  };
};
