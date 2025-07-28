/**
 * ARTICLES DATA HOOK
 * Hook quản lý data fetching, caching và SSR hydration cho Articles module
 * Pattern based on useUsersData.ts
 */

import { useCallback, useRef, useEffect } from 'react';
import { ArticlesService } from '../../../../../backend';
import type { ArticlesFilters, ArticlesListResponse } from '../../../../../backend';

// ===== DEBUG UTILITY =====
const debug = {
  prefetch: (msg: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`⚡ ARTICLES PREFETCH: ${msg}`, data || '');
    }
  },
  cache: (msg: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`🗄️ ARTICLES CACHE: ${msg}`, data || '');
    }
  },
  ssr: (msg: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`⚡ SSR ARTICLES: ${msg}`, data || '');
    }
  }
};

interface UseArticlesDataProps {
  filters: ArticlesFilters;
  limit: number;
  currentPage: number;
  dispatch: (action: any) => void;
  setLoading?: (payload: any) => void; // Optional for backward compatibility
}

export const useArticlesData = ({
  filters,
  limit,
  currentPage,
  dispatch
}: UseArticlesDataProps) => {
  // Track if initial load has been done to prevent infinite loops
  const initialLoadDone = useRef(false);

  // ===== CACHE MANAGEMENT =====
  const cache = useRef<Map<string, {
    data: ArticlesListResponse;
    timestamp: number;
    ttl: number;
  }>>(new Map());
  const prefetchQueue = useRef<Set<number>>(new Set());
  const aggressivePrefetchDone = useRef<Set<string>>(new Set());
  const activeRequests = useRef<Map<string, Promise<void>>>(new Map());

  // ===== CACHE UTILITIES =====
  const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  const isCacheValid = useCallback((entry: { timestamp: number; ttl: number }) => {
    return Date.now() - entry.timestamp < entry.ttl;
  }, []);

  const getCachedData = useCallback((cacheKey: string) => {
    const entry = cache.current.get(cacheKey);
    if (!entry) return null;

    return {
      data: entry.data,
      isValid: isCacheValid(entry),
      isStale: !isCacheValid(entry)
    };
  }, [isCacheValid]);

  const setCacheData = useCallback((cacheKey: string, data: ArticlesListResponse, ttl: number = CACHE_TTL) => {
    cache.current.set(cacheKey, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }, [CACHE_TTL]);

  const clearCache = useCallback(() => {
    const cacheSize = cache.current.size;
    console.log('🗑️ CLEAR CACHE START - Current cache size:', cacheSize);
    console.log('🗑️ Cache keys before clear:', Array.from(cache.current.keys()));

    cache.current.clear();
    prefetchQueue.current.clear();
    aggressivePrefetchDone.current.clear();
    activeRequests.current.clear();

    console.log('✅ CLEAR CACHE COMPLETE - Cache size after clear:', cache.current.size);
    debug.cache('Client cache cleared manually');
  }, []);



  // Generate cache key
  const getCacheKey = (page: number, currentFilters: ArticlesFilters, pageLimit: number = limit) => {
    return `${page}-${pageLimit}-${JSON.stringify(currentFilters)}`;
  };

  // Prefetch data for instant pagination
  const prefetchPage = useCallback(async (page: number, currentFilters: ArticlesFilters, pageLimit: number = limit) => {
    const cacheKey = getCacheKey(page, currentFilters, pageLimit);

    // Check cache using unified system
    const cachedData = getCachedData(cacheKey);
    if (cachedData) {
      debug.prefetch(`Skip page ${page} - already cached`);
      return;
    }

    if (prefetchQueue.current.has(page)) {
      debug.prefetch(`Skip page ${page} - already in queue`);
      return;
    }

    prefetchQueue.current.add(page);

    try {
      const { data, error: fetchError } = await ArticlesService.getArticles(page, pageLimit, currentFilters);
      if (!fetchError && data) {
        // Store in unified cache
        setCacheData(cacheKey, data);
        debug.prefetch(`Success page ${page}`, `${data.articles.length} articles cached`);
      }
    } catch (err) {
      debug.prefetch(`Error page ${page}`, err);
    } finally {
      prefetchQueue.current.delete(page);
    }
  }, [limit, getCacheKey, getCachedData, setCacheData]);

  // Smart prefetch - Immediate for next page, background for others
  const smartAggressivePrefetch = useCallback(async (totalPages: number, currentFilters: ArticlesFilters, pageLimit: number = limit, currentPageNum: number = 1) => {
    const filterKey = JSON.stringify(currentFilters);
    if (aggressivePrefetchDone.current.has(filterKey)) {
      debug.prefetch(`Skip aggressive prefetch - already done for filter set`);
      return;
    }

    debug.prefetch(`Smart prefetch ${totalPages} pages from page ${currentPageNum}`);
    aggressivePrefetchDone.current.add(filterKey);

    // Immediate prefetch for next page (no delay) - AWAIT to ensure completion
    const nextPage = currentPageNum + 1;
    if (nextPage <= totalPages) {
      const nextCacheKey = getCacheKey(nextPage, currentFilters, pageLimit);
      const nextCachedData = getCachedData(nextCacheKey);
      if (!nextCachedData) {
        debug.prefetch(`Immediate prefetch page ${nextPage} (next page)`);
        await prefetchPage(nextPage, currentFilters, pageLimit); // AWAIT for immediate completion
        debug.prefetch(`Immediate prefetch complete page ${nextPage}`);
      } else {
        debug.cache(`Cache hit page ${nextPage}`);
      }
    }

    // Background prefetch for remaining pages
    for (let page = 1; page <= totalPages; page++) {
      if (page === currentPageNum || page === nextPage) continue; // Skip current and next

      const cacheKey = getCacheKey(page, currentFilters, pageLimit);
      const cachedData = getCachedData(cacheKey);
      if (!cachedData) {
        debug.prefetch(`Background prefetch page ${page} (delay: ${page * 100}ms)`);
        setTimeout(() => prefetchPage(page, currentFilters, pageLimit), page * 100); // Slower for background
      } else {
        debug.cache(`Cache hit page ${page}`);
      }
    }
  }, [prefetchPage, limit, getCacheKey]);

  // Fetch articles data with stale-while-revalidate
  const fetchArticles = useCallback(async (page: number = currentPage, pageLimit: number = limit) => {
    const cacheKey = getCacheKey(page, filters, pageLimit);

    debug.cache(`Fetching articles for page ${page}`, { cacheKey });

    // Check if there's already an active request for this cache key
    if (activeRequests.current.has(cacheKey)) {
      debug.cache(`Request already in progress for ${cacheKey}, waiting...`);
      await activeRequests.current.get(cacheKey);
      return;
    }

    // Check cache first using unified system
    const cachedData = getCachedData(cacheKey);
    console.log('🔍 FETCH ARTICLES - Cache check:', {
      cacheKey,
      hasCachedData: !!cachedData,
      isValid: cachedData?.isValid,
      cacheSize: cache.current.size
    });

    if (cachedData) {
      // Instant display from cache
      console.log('📦 Using cached data for page', page);
      debug.cache(`Using cached data for page ${page}`);
      dispatch({ type: 'SET_ARTICLES_DATA', payload: cachedData.data });
      dispatch({ type: 'SET_ERROR', payload: '' });
      dispatch({ type: 'SET_LOADING', payload: { articles: false } });

      // Check if data is fresh
      if (cachedData.isValid) {
        console.log('✅ Cache is valid, no need to revalidate');
        smartAggressivePrefetch(cachedData.data.totalPages, filters, pageLimit, page);
        return; // Fresh data, no need to revalidate
      }
      console.log('⚠️ Cache is stale, fetching fresh data in background');
      // Continue to fetch fresh data in background (no loading shown)
    } else {
      // No cached data, show loading
      console.log('🔄 No cache for page', page, '- showing loading');
      debug.cache(`No cache for page ${page}, showing loading`);
      dispatch({ type: 'SET_LOADING', payload: { articles: true } });
    }

    // Create and track the request promise
    const requestPromise = (async () => {
      // Fetch fresh data (either initial load or background revalidation)
      dispatch({ type: 'SET_ERROR', payload: '' });

      try {
        debug.cache(`API call for page ${page}`);
        const { data, error: fetchError } = await ArticlesService.getArticles(page, pageLimit, filters);

        if (fetchError || !data) {
          debug.cache(`API error for page ${page}`, fetchError);
          if (!cachedData) {
            dispatch({ type: 'SET_ERROR', payload: 'Không thể tải danh sách bài viết' });
          }
          return;
        }

        debug.cache(`API success for page ${page}`, { articlesCount: data.articles.length });

        // Handle boundary condition: if current page is empty but there are other pages
        if (data.articles.length === 0 && data.totalPages > 0 && page > data.totalPages) {
          const lastValidPage = Math.max(1, data.totalPages);
          debug.cache(`Page ${page} out of bounds, redirecting to page ${lastValidPage}`);
          dispatch({ type: 'SET_UI', payload: { currentPage: lastValidPage } });
          fetchArticles(lastValidPage, pageLimit);
          return;
        }

        // Update unified cache
        setCacheData(cacheKey, data);

        // Always update UI with fresh data (overwrite stale cache)
        dispatch({ type: 'SET_ARTICLES_DATA', payload: data });

        // Smart aggressive prefetch
        smartAggressivePrefetch(data.totalPages, filters, pageLimit, page);

      } catch (err) {
        debug.cache(`Exception for page ${page}`, err);
        if (!cachedData) {
          dispatch({ type: 'SET_ERROR', payload: 'Có lỗi xảy ra khi tải dữ liệu' });
        }
      } finally {
        // Always turn off loading after fetch completes
        dispatch({ type: 'SET_LOADING', payload: { articles: false } });
      }
    })();

    // Track the request
    activeRequests.current.set(cacheKey, requestPromise);

    // Execute and cleanup
    try {
      await requestPromise;
    } finally {
      activeRequests.current.delete(cacheKey);
    }
  }, [currentPage, filters, dispatch, limit, smartAggressivePrefetch, getCacheKey, getCachedData, setCacheData]);

  // Fetch stats with caching
  const fetchStats = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: { stats: true } });
    try {
      const { data: statsData, error: statsError } = await ArticlesService.getStats();
      if (!statsError && statsData) {
        dispatch({ type: 'SET_STATS', payload: statsData });
      }
    } catch (err) {
      console.warn('Could not fetch articles stats:', err);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: { stats: false } });
    }
  }, [dispatch]);



  // SSR Hydration - Load initial data and stats from window object
  const hydrateFromSSR = useCallback(() => {
    let articlesUsed = false;
    let statsUsed = false;

    // Check if we should force fresh data (skip SSR)
    if (typeof window !== 'undefined') {
      const forceFresh = localStorage.getItem('articles_force_fresh');
      if (forceFresh) {
        debug.ssr('Force fresh data - skipping SSR hydration');
        localStorage.removeItem('articles_force_fresh');
        // Clear SSR data to prevent any usage
        delete (window as any).__ARTICLES_INITIAL_DATA__;
        delete (window as any).__ARTICLES_INITIAL_STATS__;
        return { articlesUsed: false, statsUsed: false };
      }
    }

    // Hydrate articles data
    if (typeof window !== 'undefined' && (window as any).__ARTICLES_INITIAL_DATA__) {
      const initialData = (window as any).__ARTICLES_INITIAL_DATA__;

      debug.ssr('Hydration using pre-loaded data', {
        page: initialData?.page,
        articlesCount: initialData?.articles?.length,
        totalPages: initialData?.totalPages
      });

      // IMPORTANT: Sync page and filters FIRST to prevent UI conflicts
      if (initialData.page && initialData.page !== currentPage) {
        debug.ssr(`Syncing page from SSR: ${currentPage} -> ${initialData.page}`);
        dispatch({ type: 'SET_UI', payload: { currentPage: initialData.page } });
      }

      // Sync filters if provided in SSR data
      if (initialData.filters) {
        debug.ssr('Syncing filters from SSR:', initialData.filters);
        dispatch({ type: 'SET_FILTERS', payload: initialData.filters });
      }

      // THEN set data after state is synced
      debug.ssr('Setting articles data after state sync');
      dispatch({ type: 'SET_ARTICLES_DATA', payload: initialData });
      dispatch({ type: 'SET_LOADING', payload: { articles: false } });
      dispatch({ type: 'SET_ERROR', payload: '' });

      // Cache the initial data with unified cache - use filters from SSR data if available
      const ssrFilters = initialData.filters || filters;
      const cacheKey = getCacheKey(initialData.page || 1, ssrFilters, limit);
      setCacheData(cacheKey, initialData);
      debug.ssr(`Cached SSR data with key: ${cacheKey}`);

      // Start aggressive prefetch for remaining pages (background)
      setTimeout(() => {
        smartAggressivePrefetch(initialData.totalPages, ssrFilters, limit, initialData.page || 1);
      }, 100); // Small delay to ensure UI is stable first

      // Clear the global data to prevent reuse
      delete (window as any).__ARTICLES_INITIAL_DATA__;
      articlesUsed = true;
    }

    // Hydrate stats data
    if (typeof window !== 'undefined' && (window as any).__ARTICLES_INITIAL_STATS__) {
      const initialStats = (window as any).__ARTICLES_INITIAL_STATS__;
      debug.ssr('Stats hydration using pre-loaded stats', initialStats);
      dispatch({ type: 'SET_STATS', payload: initialStats });
      dispatch({ type: 'SET_LOADING', payload: { stats: false } });
      delete (window as any).__ARTICLES_INITIAL_STATS__;
      statsUsed = true;
    }

    return { articlesUsed, statsUsed };
  }, [dispatch, filters, limit, smartAggressivePrefetch, currentPage, getCacheKey, setCacheData]);

  // ===== CLEANUP =====
  // Cleanup cache and refs on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      cache.current.clear();
      prefetchQueue.current.clear();
      aggressivePrefetchDone.current.clear();
      activeRequests.current.clear();
      debug.cache('Cache and active requests cleared on unmount');
    };
  }, []);

  return {
    // Cache utilities
    getCacheKey,
    cache,
    getCachedData,
    setCacheData,
    clearCache,
    isCacheValid,
    CACHE_TTL,

    // Data fetching
    fetchArticles,
    fetchStats,
    hydrateFromSSR,

    // Prefetching
    prefetchPage,
    smartAggressivePrefetch,

    // State tracking
    initialLoadDone
  };
};
