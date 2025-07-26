/**
 * USERS DATA HOOK
 * Hook quản lý data fetching, caching và prefetching cho Users module
 */

import { useCallback, useEffect, useRef } from 'react';
import { UsersService } from '../../../../../backend';
import type { UsersFilters, UsersListResponse } from '../../../../../backend';

interface UseUsersDataProps {
  filters: UsersFilters;
  limit: number;
  currentPage: number;
  displayCurrentPage: number;
  isInitialized: boolean;
  setUsersData: (data: UsersListResponse | null) => void;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string) => void;
  setStats: (stats: any) => void;
  setCurrentPage: (page: number) => void;
  updateURL: (page: number, filters: UsersFilters) => void;
  usersDataRef: React.MutableRefObject<UsersListResponse | null>;
  cache: React.MutableRefObject<Map<string, UsersListResponse>>;
  cacheWithTTL: React.MutableRefObject<Map<string, {
    data: UsersListResponse;
    timestamp: number;
    ttl: number;
  }>>;
  prefetchQueue: React.MutableRefObject<Set<number>>;
  aggressivePrefetchDone: React.MutableRefObject<Set<string>>;
  CACHE_TTL: number;
}

export const useUsersData = ({
  filters,
  limit,
  currentPage,
  displayCurrentPage,
  isInitialized,
  setUsersData,
  setIsLoading,
  setError,
  setStats,
  setCurrentPage,
  updateURL,
  usersDataRef,
  cache,
  cacheWithTTL,
  prefetchQueue,
  aggressivePrefetchDone,
  CACHE_TTL
}: UseUsersDataProps) => {
  // Track if initial load has been done to prevent infinite loops
  const initialLoadDone = useRef(false);

  // Generate cache key
  const getCacheKey = (page: number, currentFilters: UsersFilters, pageLimit: number = limit) => {
    return `${page}-${pageLimit}-${JSON.stringify(currentFilters)}`;
  };

  // Prefetch data for instant pagination
  const prefetchPage = useCallback(async (page: number, currentFilters: UsersFilters, pageLimit: number = limit) => {
    const cacheKey = getCacheKey(page, currentFilters, pageLimit);

    // Check both caches
    if (cacheWithTTL.current.has(cacheKey) || cache.current.has(cacheKey)) {
      return;
    }

    if (prefetchQueue.current.has(page)) {
      return;
    }

    prefetchQueue.current.add(page);

    try {
      const { data, error: fetchError } = await UsersService.getUsers(page, pageLimit, currentFilters);
      if (!fetchError && data) {
        // Store in both caches
        cache.current.set(cacheKey, data);
        cacheWithTTL.current.set(cacheKey, {
          data,
          timestamp: Date.now(),
          ttl: CACHE_TTL
        });
        console.log(`✅ Prefetch SUCCESS page ${page}`);
      }
    } catch (err) {
      console.log(`❌ Prefetch ERROR page ${page}`);
    } finally {
      prefetchQueue.current.delete(page);
    }
  }, [limit, CACHE_TTL, cache, cacheWithTTL, prefetchQueue]);

  // Smart aggressive prefetch - ONCE ONLY per filter set
  const smartAggressivePrefetch = useCallback(async (totalPages: number, currentFilters: UsersFilters, pageLimit: number = limit) => {
    const filterKey = `${JSON.stringify(currentFilters)}-${pageLimit}`;

    if (aggressivePrefetchDone.current.has(filterKey)) {
      return; // Already done for this filter set
    }

    console.log(`🚀 SMART AGGRESSIVE PREFETCH: ${totalPages} pages (ONCE ONLY)`);
    aggressivePrefetchDone.current.add(filterKey);

    // Prefetch all pages with smart timing
    for (let page = 1; page <= totalPages; page++) {
      const cacheKey = getCacheKey(page, currentFilters, pageLimit);

      // Check both caches before prefetching
      if (!cacheWithTTL.current.has(cacheKey) && !cache.current.has(cacheKey)) {
        setTimeout(() => prefetchPage(page, currentFilters, pageLimit), page * 50); // Faster 50ms
      }
    }
  }, [prefetchPage, limit, aggressivePrefetchDone, cacheWithTTL, cache]);

  // Fetch users data with stale-while-revalidate
  const fetchUsers = useCallback(async (page: number = currentPage, pageLimit: number = limit) => {
    const cacheKey = getCacheKey(page, filters, pageLimit);

    console.log(`🔍 Fetch page ${page}`);

    // 🚀 STEP 3: Stale-while-revalidate strategy
    const cached = cacheWithTTL.current.get(cacheKey);

    // Serve stale data immediately if available
    if (cached) {
      console.log(`⚡ INSTANT page ${page} (${cached.data.users.length} users)`);
      setUsersData(cached.data);
      setError('');

      // Check if data is stale
      const isStale = Date.now() - cached.timestamp > cached.ttl;
      if (!isStale) {
        console.log(`✅ Data is fresh, no revalidation needed`);
        // Smart aggressive prefetch - ONCE ONLY
        smartAggressivePrefetch(cached.data.totalPages, filters, pageLimit);
        return; // Fresh data, no need to revalidate
      }

      // Data is stale, revalidate in background
      console.log(`🔄 Data is stale, revalidating page ${page} in background...`);
    } else {
      // No cached data, show loading
      console.log(`🔄 Loading page ${page}...`);
      // Use ref to check current usersData without adding it to dependencies
      if (page === 1 && !usersDataRef.current) setIsLoading(true);
    }

    setError('');

    try {
      const { data, error: fetchError } = await UsersService.getUsers(page, pageLimit, filters);

      if (fetchError || !data) {
        // Only show error if no stale data was served
        if (!cached) {
          setError('Không thể tải danh sách users');
        }
        return;
      }

      console.log(`✅ Loaded fresh page ${page}`);

      // Handle boundary condition: if current page is empty but there are other pages
      if (data.users.length === 0 && data.totalPages > 0 && page > data.totalPages) {
        console.log('🔧 BOUNDARY: Current page is empty, redirecting to last valid page');
        const lastValidPage = Math.max(1, data.totalPages);
        setCurrentPage(lastValidPage);
        updateURL(lastValidPage, filters);
        fetchUsers(lastValidPage, pageLimit);
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
        setUsersData(data);
        console.log('🔍 UsersList: First user data:', data.users[0]); // Debug username
      }

      // Smart aggressive prefetch - ONCE ONLY
      smartAggressivePrefetch(data.totalPages, filters, pageLimit);

    } catch (err) {
      // Only show error if no stale data was served
      if (!cached) {
        setError('Có lỗi xảy ra khi tải dữ liệu');
      }
    } finally {
      // Use ref to check current usersData without adding it to dependencies
      if (page === 1 && !usersDataRef.current) setIsLoading(false);
    }
  }, [currentPage, limit, filters, getCacheKey, cacheWithTTL, setUsersData, setError, smartAggressivePrefetch, usersDataRef, setIsLoading, setCurrentPage, updateURL, cache, CACHE_TTL]);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const { data: statsData, error: statsError } = await UsersService.getUserStats();
      if (!statsError && statsData) {
        setStats(statsData);
      }
    } catch (err) {
      console.warn('Could not fetch user stats:', err);
    }
  }, [setStats]);

  // Clear cache when filters change and trigger refetch
  const prevFiltersRef = useRef<UsersFilters>(filters);
  useEffect(() => {
    const filtersChanged = JSON.stringify(prevFiltersRef.current) !== JSON.stringify(filters);
    if (filtersChanged && isInitialized) {
      console.log('🧹 FILTERS CHANGED: Clearing cache and refetching data');
      cache.current.clear();
      cacheWithTTL.current.clear();
      prefetchQueue.current.clear();
      aggressivePrefetchDone.current.clear();
      prevFiltersRef.current = filters;

      // Trigger data refetch when filters change
      fetchUsers(displayCurrentPage);
    }
  }, [filters, isInitialized, displayCurrentPage, fetchUsers, cache, cacheWithTTL, prefetchQueue, aggressivePrefetchDone]);

  // Initial load with SSR hydration - Simplified
  useEffect(() => {
    // Wait for URL initialization
    if (!isInitialized) return;

    // Prevent infinite loops - only run once for initial load
    if (initialLoadDone.current) return;
    initialLoadDone.current = true;

    // 🚀 Hydrate from SSR data if available
    if (typeof window !== 'undefined' && (window as any).__USERS_INITIAL_DATA__) {
      const initialData = (window as any).__USERS_INITIAL_DATA__;
      const initialStats = (window as any).__USERS_INITIAL_STATS__;

      console.log('⚡ SSR HYDRATION: Using pre-loaded data', {
        page: initialData?.page,
        usersCount: initialData?.users?.length,
        totalPages: initialData?.totalPages
      });

      // Set data immediately (0ms)
      setUsersData(initialData);
      if (initialStats) setStats(initialStats);
      setIsLoading(false);
      setError('');

      // Cache the initial data with TTL
      const cacheKey = `${initialData.page}-${limit}-${JSON.stringify(filters)}`;
      cache.current.set(cacheKey, initialData);
      cacheWithTTL.current.set(cacheKey, {
        data: initialData,
        timestamp: Date.now(),
        ttl: CACHE_TTL
      });

      // Start aggressive prefetch for remaining pages
      smartAggressivePrefetch(initialData.totalPages, filters, limit);

      // Clear the global data to prevent reuse
      delete (window as any).__USERS_INITIAL_DATA__;
      delete (window as any).__USERS_INITIAL_STATS__;

      return; // Skip API call
    }

    // Fallback to API if no SSR data - ONLY ONCE for initial load
    console.log('🔄 CLIENT-SIDE: Loading initial data via API for page', displayCurrentPage);
    fetchUsers(displayCurrentPage);
    fetchStats();
  }, [isInitialized, displayCurrentPage, limit]);

  return {
    getCacheKey,
    prefetchPage,
    smartAggressivePrefetch,
    fetchUsers,
    fetchStats
  };
};
