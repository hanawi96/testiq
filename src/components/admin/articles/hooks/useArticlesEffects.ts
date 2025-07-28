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

  // Initialize URL sync tracking
  useEffect(() => {
    // Mark as initialized after first render to enable URL sync
    initialLoadDone.current = true;
  }, []);

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
        status: status as 'all' | 'draft' | 'published' | 'archived' | 'scheduled',
        search,
        category,
        author,
        featured: featured as 'all' | 'true' | 'false',
        sort: sort as 'created_desc' | 'created_asc' | 'updated_desc' | 'updated_asc' | 'title_asc' | 'title_desc' | 'views_desc' | 'views_asc'
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
