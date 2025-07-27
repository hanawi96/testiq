/**
 * ARTICLES DATA HOOK
 * Hook quản lý data fetching, caching và SSR hydration cho Articles module
 * Pattern based on useUsersData.ts
 */

import { useCallback, useRef } from 'react';
import { ArticlesService } from '../../../../../backend';
import type { ArticlesFilters, ArticlesListResponse } from '../../../../../backend';

interface UseArticlesDataProps {
  filters: ArticlesFilters;
  limit: number;
  currentPage: number;
  dispatch: (action: any) => void;
  setLoading: (payload: any) => void;
}

export const useArticlesData = ({
  filters,
  limit,
  currentPage,
  dispatch,
  setLoading
}: UseArticlesDataProps) => {
  // Track if initial load has been done to prevent infinite loops
  const initialLoadDone = useRef(false);

  // Enhanced cache with TTL for stale-while-revalidate
  const cache = useRef<Map<string, ArticlesListResponse>>(new Map());
  const cacheWithTTL = useRef<Map<string, {
    data: ArticlesListResponse;
    timestamp: number;
    ttl: number;
  }>>(new Map());
  const prefetchQueue = useRef<Set<number>>(new Set());
  const aggressivePrefetchDone = useRef<Set<string>>(new Set()); // Track completed aggressive prefetches

  const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  // Generate cache key
  const getCacheKey = (page: number, currentFilters: ArticlesFilters, pageLimit: number = limit) => {
    return `${page}-${pageLimit}-${JSON.stringify(currentFilters)}`;
  };

  // Prefetch data for instant pagination
  const prefetchPage = useCallback(async (page: number, currentFilters: ArticlesFilters, pageLimit: number = limit) => {
    const cacheKey = getCacheKey(page, currentFilters, pageLimit);

    // Check both caches
    if (cacheWithTTL.current.has(cacheKey) || cache.current.has(cacheKey)) {
      console.log(`⏭️ PREFETCH SKIP: Page ${page} already cached`);
      return;
    }

    if (prefetchQueue.current.has(page)) {
      console.log(`⏳ PREFETCH SKIP: Page ${page} already in queue`);
      return;
    }


    prefetchQueue.current.add(page);

    try {
      const { data, error: fetchError } = await ArticlesService.getArticles(page, pageLimit, currentFilters);
      if (!fetchError && data) {
        // Store in both caches
        cache.current.set(cacheKey, data);
        cacheWithTTL.current.set(cacheKey, {
          data,
          timestamp: Date.now(),
          ttl: CACHE_TTL
        });
        console.log(`✅ PREFETCH SUCCESS: Page ${page} (${data.articles.length} articles cached)`);
      }
    } catch (err) {
      console.warn(`Prefetch error for page ${page}:`, err);
    } finally {
      prefetchQueue.current.delete(page);
    }
  }, [limit, CACHE_TTL, getCacheKey]);

  // Smart prefetch - Immediate for next page, background for others
  const smartAggressivePrefetch = useCallback(async (totalPages: number, currentFilters: ArticlesFilters, pageLimit: number = limit, currentPageNum: number = 1) => {
    const filterKey = JSON.stringify(currentFilters);
    if (aggressivePrefetchDone.current.has(filterKey)) {
      console.log(`⏭️ PREFETCH: Already done for filter set, skipping`);
      return;
    }

    console.log(`🚀 ARTICLES SMART PREFETCH: ${totalPages} pages from page ${currentPageNum}`);
    aggressivePrefetchDone.current.add(filterKey);

    // Immediate prefetch for next page (no delay) - AWAIT to ensure completion
    const nextPage = currentPageNum + 1;
    if (nextPage <= totalPages) {
      const nextCacheKey = getCacheKey(nextPage, currentFilters, pageLimit);
      if (!cacheWithTTL.current.has(nextCacheKey)) {
        console.log(`⚡ IMMEDIATE PREFETCH: Page ${nextPage} (next page) - AWAITING...`);
        await prefetchPage(nextPage, currentFilters, pageLimit); // AWAIT for immediate completion
        console.log(`✅ IMMEDIATE PREFETCH COMPLETE: Page ${nextPage}`);
      } else {
        console.log(`✅ CACHE HIT: Page ${nextPage} already cached`);
      }
    }

    // Background prefetch for remaining pages
    for (let page = 1; page <= totalPages; page++) {
      if (page === currentPageNum || page === nextPage) continue; // Skip current and next

      const cacheKey = getCacheKey(page, currentFilters, pageLimit);
      if (!cacheWithTTL.current.has(cacheKey)) {
        console.log(`🔄 BACKGROUND PREFETCH: Page ${page} (delay: ${page * 100}ms)`);
        setTimeout(() => prefetchPage(page, currentFilters, pageLimit), page * 100); // Slower for background
      } else {
        console.log(`✅ CACHE HIT: Page ${page} already cached`);
      }
    }
  }, [prefetchPage, limit, getCacheKey]);

  // Fetch articles data with stale-while-revalidate
  const fetchArticles = useCallback(async (page: number = currentPage, pageLimit: number = limit) => {
    const cacheKey = getCacheKey(page, filters, pageLimit);

    // Check cache first, show loading only if no cache
    const cached = cacheWithTTL.current.get(cacheKey);

    if (cached) {
      // Instant display from cache
      dispatch({ type: 'SET_ARTICLES_DATA', payload: cached.data });
      dispatch({ type: 'SET_ERROR', payload: '' });
      dispatch({ type: 'SET_LOADING', payload: { articles: false } });

      // Check if data is fresh
      const isStale = Date.now() - cached.timestamp > cached.ttl;
      if (!isStale) {
        smartAggressivePrefetch(cached.data.totalPages, filters, pageLimit, page);
        return; // Fresh data, no need to revalidate
      }
      // Continue to fetch fresh data in background (no loading shown)
    } else {
      // No cached data, show loading
      dispatch({ type: 'SET_LOADING', payload: { articles: true } });
    }

    // Fetch fresh data (either initial load or background revalidation)
    dispatch({ type: 'SET_ERROR', payload: '' });

    try {
      const { data, error: fetchError } = await ArticlesService.getArticles(page, pageLimit, filters);

      if (fetchError || !data) {
        if (!cached) {
          dispatch({ type: 'SET_ERROR', payload: 'Không thể tải danh sách bài viết' });
        }
        return;
      }

      // Handle boundary condition: if current page is empty but there are other pages
      if (data.articles.length === 0 && data.totalPages > 0 && page > data.totalPages) {
        const lastValidPage = Math.max(1, data.totalPages);
        dispatch({ type: 'SET_UI', payload: { currentPage: lastValidPage } });
        fetchArticles(lastValidPage, pageLimit);
        return;
      }

      // Update cache with TTL
      cacheWithTTL.current.set(cacheKey, {
        data,
        timestamp: Date.now(),
        ttl: CACHE_TTL
      });

      // Also update old cache for backward compatibility
      cache.current.set(cacheKey, data);

      // Update UI only if no stale data was served
      if (!cached) {
        dispatch({ type: 'SET_ARTICLES_DATA', payload: data });
      }

      // Smart aggressive prefetch
      smartAggressivePrefetch(data.totalPages, filters, pageLimit, page); // No await needed for background

    } catch (err) {
      if (!cached) {
        dispatch({ type: 'SET_ERROR', payload: 'Có lỗi xảy ra khi tải dữ liệu' });
      }
    } finally {
      // Always turn off loading after fetch completes
      dispatch({ type: 'SET_LOADING', payload: { articles: false } });
    }
  }, [currentPage, filters, dispatch, limit, smartAggressivePrefetch]);

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

    // Hydrate articles data
    if (typeof window !== 'undefined' && (window as any).__ARTICLES_INITIAL_DATA__) {
      const initialData = (window as any).__ARTICLES_INITIAL_DATA__;

      console.log('⚡ SSR ARTICLES HYDRATION: Using pre-loaded data', {
        page: initialData?.page,
        articlesCount: initialData?.articles?.length,
        totalPages: initialData?.totalPages
      });

      // Set data immediately (0ms)
      dispatch({ type: 'SET_ARTICLES_DATA', payload: initialData });
      dispatch({ type: 'SET_LOADING', payload: { articles: false } });
      dispatch({ type: 'SET_ERROR', payload: '' });

      // Cache the initial data with TTL
      const cacheKey = `${initialData.page}-${limit}-${JSON.stringify(filters)}`;
      cache.current.set(cacheKey, initialData);
      cacheWithTTL.current.set(cacheKey, {
        data: initialData,
        timestamp: Date.now(),
        ttl: CACHE_TTL
      });

      // Start aggressive prefetch for remaining pages
      smartAggressivePrefetch(initialData.totalPages, filters, limit, initialData.page || 1); // No await needed for background

      // Clear the global data to prevent reuse
      delete (window as any).__ARTICLES_INITIAL_DATA__;
      articlesUsed = true;
    }

    // Hydrate stats data
    if (typeof window !== 'undefined' && (window as any).__ARTICLES_INITIAL_STATS__) {
      const initialStats = (window as any).__ARTICLES_INITIAL_STATS__;
      console.log('⚡ SSR STATS HYDRATION: Using pre-loaded stats', initialStats);
      dispatch({ type: 'SET_STATS', payload: initialStats });
      dispatch({ type: 'SET_LOADING', payload: { stats: false } });
      delete (window as any).__ARTICLES_INITIAL_STATS__;
      statsUsed = true;
    }

    return { articlesUsed, statsUsed };
  }, [dispatch, filters, limit, smartAggressivePrefetch]);

  return {
    // Cache utilities
    getCacheKey,
    cache,
    cacheWithTTL,
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
