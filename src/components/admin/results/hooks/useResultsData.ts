import { useCallback, useRef } from 'react';
import { loadResultsService } from '../../../../../backend';
import type { ResultsFilters, ResultsListResponse } from '../../../../../backend';

interface UseResultsDataProps {
  filters: ResultsFilters;
  limit: number;
  currentPage: number;
  setResultsData: (data: ResultsListResponse | null) => void;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string) => void;
}

export const useResultsData = ({
  filters,
  limit,
  currentPage,
  setResultsData,
  setIsLoading,
  setError
}: UseResultsDataProps) => {
  // Enhanced cache with TTL
  const cacheWithTTL = useRef<Map<string, {
    data: ResultsListResponse;
    timestamp: number;
    ttl: number;
  }>>(new Map());
  const prefetchQueue = useRef<Set<number>>(new Set());

  const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  // Generate cache key
  const getCacheKey = (page: number, currentFilters: ResultsFilters, pageLimit: number = limit) => {
    return `results-${page}-${pageLimit}-${JSON.stringify(currentFilters)}`;
  };

  // Check if cache is valid
  const isCacheValid = (cacheEntry: { timestamp: number; ttl: number }) => {
    return Date.now() - cacheEntry.timestamp < cacheEntry.ttl;
  };

  // Prefetch data for instant pagination
  const prefetchPage = useCallback(async (page: number, currentFilters: ResultsFilters, pageLimit: number = limit) => {
    const cacheKey = getCacheKey(page, currentFilters, pageLimit);

    // Check cache first
    const cached = cacheWithTTL.current.get(cacheKey);
    if (cached && isCacheValid(cached)) {
      console.log(`⏭️ PREFETCH SKIP: Page ${page} already cached`);
      return;
    }

    if (prefetchQueue.current.has(page)) {
      console.log(`⏳ PREFETCH SKIP: Page ${page} already in queue`);
      return;
    }

    prefetchQueue.current.add(page);
    console.log(`🚀 PREFETCH START: Page ${page}`);

    try {
      const ResultsService = await loadResultsService();
      const { data, error } = await ResultsService.getResults(page, pageLimit, currentFilters);
      
      if (error || !data) {
        console.log(`❌ PREFETCH FAILED: Page ${page}`, error);
        return;
      }

      // Cache the result
      cacheWithTTL.current.set(cacheKey, {
        data,
        timestamp: Date.now(),
        ttl: CACHE_TTL
      });

      console.log(`✅ PREFETCH SUCCESS: Page ${page} cached`);
    } catch (err) {
      console.log(`❌ PREFETCH ERROR: Page ${page}`, err);
    } finally {
      prefetchQueue.current.delete(page);
    }
  }, [limit]);

  // Smart aggressive prefetch
  const smartAggressivePrefetch = useCallback(async (
    totalPages: number, 
    currentFilters: ResultsFilters, 
    pageLimit: number, 
    currentPage: number
  ) => {
    // Prefetch next 2-3 pages
    const pagesToPrefetch = [];
    
    // Next pages
    for (let i = 1; i <= 3; i++) {
      const nextPage = currentPage + i;
      if (nextPage <= totalPages) {
        pagesToPrefetch.push(nextPage);
      }
    }
    
    // Previous pages
    for (let i = 1; i <= 2; i++) {
      const prevPage = currentPage - i;
      if (prevPage >= 1) {
        pagesToPrefetch.push(prevPage);
      }
    }

    console.log(`🎯 SMART PREFETCH: Pages [${pagesToPrefetch.join(', ')}] from current ${currentPage}`);

    // Prefetch in background (no await)
    pagesToPrefetch.forEach(page => {
      prefetchPage(page, currentFilters, pageLimit);
    });
  }, [prefetchPage]);

  // Main fetch function with cache
  const fetchResults = useCallback(async (page: number, pageLimit: number = limit) => {
    const cacheKey = getCacheKey(page, filters, pageLimit);
    
    // Check cache first
    const cached = cacheWithTTL.current.get(cacheKey);
    if (cached && isCacheValid(cached)) {
      console.log(`⚡ CACHE HIT: Page ${page} served from cache`);
      setResultsData(cached.data);
      setError('');
      setIsLoading(false);
      
      // Smart prefetch in background
      smartAggressivePrefetch(cached.data.totalPages, filters, pageLimit, page);
      return;
    }

    // No valid cache, fetch from API
    console.log(`🌐 API FETCH: Page ${page}`);
    // Only show loading for table data, not blocking entire UI
    setIsLoading(true);

    try {
      const ResultsService = await loadResultsService();
      const { data, error } = await ResultsService.getResults(page, pageLimit, filters);

      if (error || !data) {
        setError('Không thể tải danh sách kết quả test');
        setResultsData(null);
        return;
      }

      // Handle boundary condition
      if (data.results.length === 0 && data.totalPages > 0 && page > data.totalPages) {
        const lastValidPage = Math.max(1, data.totalPages);
        fetchResults(lastValidPage, pageLimit);
        return;
      }

      // Update cache
      cacheWithTTL.current.set(cacheKey, {
        data,
        timestamp: Date.now(),
        ttl: CACHE_TTL
      });

      setResultsData(data);
      setError('');

      // Smart prefetch in background
      smartAggressivePrefetch(data.totalPages, filters, pageLimit, page);

    } catch (err) {
      setError('Có lỗi xảy ra khi tải dữ liệu');
      setResultsData(null);
    } finally {
      setIsLoading(false);
    }
  }, [filters, limit, setResultsData, setIsLoading, setError, smartAggressivePrefetch]);

  return {
    fetchResults,
    prefetchPage,
    getCacheKey,
    cacheWithTTL,
    CACHE_TTL
  };
};
