/**
 * RESULTS URL SYNC HOOK
 * Hook đồng bộ URL parameters với state cho Results module
 */

import { useEffect, useRef } from 'react';
import type { ResultsFilters, ResultsListResponse } from '../../../../../backend';

interface UseResultsUrlSyncProps {
  displayCurrentPage: number;
  setCurrentPage: (page: number) => void;
  filters: ResultsFilters;
  setFilters: (filters: ResultsFilters) => void;
  isInitialized: boolean;
  setIsInitialized: (initialized: boolean) => void;
  fetchResults: (page?: number, pageLimit?: number) => Promise<void>;
  limit: number;
  setResultsData: (data: ResultsListResponse | null) => void;
  setStats: (stats: any) => void;
  setScoreDistribution: (distribution: any) => void;
}

export const useResultsUrlSync = ({
  displayCurrentPage,
  setCurrentPage,
  filters,
  setFilters,
  isInitialized,
  setIsInitialized,
  fetchResults,
  limit,
  setResultsData,
  setStats,
  setScoreDistribution
}: UseResultsUrlSyncProps) => {
  // Track previous filters to detect changes
  const prevFiltersRef = useRef<ResultsFilters>(filters);

  // Initialize from URL parameters on mount with SSR data support
  useEffect(() => {
    if (typeof window === 'undefined' || isInitialized) return;

    console.log('🔄 INITIALIZING from URL...');

    const params = new URLSearchParams(window.location.search);

    // Parse URL parameters
    const urlPage = Math.max(1, parseInt(params.get('page') || '1'));
    const urlFilters: ResultsFilters = {
      user_type: (params.get('user_type') as 'all' | 'registered' | 'anonymous') || 'all',
      search: params.get('search') || '',
      test_type: (params.get('test_type') as 'iq' | 'eq') || 'iq',
      score_min: params.get('score_min') ? parseInt(params.get('score_min')!) : undefined,
      score_max: params.get('score_max') ? parseInt(params.get('score_max')!) : undefined,
      date_from: params.get('date_from') || undefined,
      date_to: params.get('date_to') || undefined
    };

    console.log('🔄 URL PARAMS:', { page: urlPage, filters: urlFilters });

    // Update state from URL
    setCurrentPage(urlPage);
    setFilters(urlFilters);
    setIsInitialized(true);

    // Check for SSR data first
    let hasSSRData = false;
    if ((window as any).__RESULTS_INITIAL_DATA__) {
      const initialData = (window as any).__RESULTS_INITIAL_DATA__;
      console.log('⚡ SSR RESULTS HYDRATION: Using pre-loaded data for page', urlPage);

      // Use SSR data directly without fetching
      setResultsData(initialData);
      delete (window as any).__RESULTS_INITIAL_DATA__;
      hasSSRData = true;
    }

    // Check for SSR stats
    if ((window as any).__RESULTS_INITIAL_STATS__) {
      const initialStats = (window as any).__RESULTS_INITIAL_STATS__;
      console.log('⚡ SSR STATS HYDRATION: Using pre-loaded stats');
      setStats(initialStats);
      delete (window as any).__RESULTS_INITIAL_STATS__;
    }

    // Only fetch if no SSR data available
    if (!hasSSRData) {
      console.log('🌐 CLIENT FETCH: Loading page', urlPage);
      fetchResults(urlPage, limit);
    }

    // Always load stats and score distribution if not from SSR
    const loadAdditionalData = async () => {
      try {
        const { loadResultsService } = await import('../../../../../backend');
        const ResultsService = await loadResultsService();

        // Load stats if not from SSR
        if (!(window as any).__RESULTS_INITIAL_STATS__) {
          console.log('🌐 CLIENT FETCH: Loading stats');
          const { data: statsData, error: statsError } = await ResultsService.getStats();
          if (!statsError && statsData) {
            setStats(statsData);
          }
        }

        // Always load score distribution (not critical)
        console.log('🌐 CLIENT FETCH: Loading score distribution');
        const { data: distData, error: distError } = await ResultsService.getScoreDistribution();
        if (!distError && distData) {
          setScoreDistribution(distData);
        }
      } catch (err) {
        console.warn('Could not load additional data:', err);
      }
    };

    loadAdditionalData();
  }, [isInitialized, setCurrentPage, setFilters, setIsInitialized, fetchResults, limit]);

  // Sync currentPage with displayCurrentPage when URL changes
  useEffect(() => {
    if (!isInitialized) return;
    
    if (displayCurrentPage !== undefined && displayCurrentPage !== null) {
      console.log(`🔄 URL PAGE SYNC: ${displayCurrentPage}`);
      setCurrentPage(displayCurrentPage);
      
      // Only fetch if page actually changed
      if (displayCurrentPage !== displayCurrentPage) {
        fetchResults(displayCurrentPage, limit);
      }
    }
  }, [displayCurrentPage, isInitialized, setCurrentPage, fetchResults, limit]);

  // Handle browser back/forward navigation
  useEffect(() => {
    if (typeof window === 'undefined' || !isInitialized) return;

    const handlePopState = () => {
      console.log('🔄 BROWSER NAVIGATION detected');
      
      const params = new URLSearchParams(window.location.search);
      const urlPage = Math.max(1, parseInt(params.get('page') || '1'));
      const urlFilters: ResultsFilters = {
        user_type: (params.get('user_type') as 'all' | 'registered' | 'anonymous') || 'all',
        search: params.get('search') || '',
        test_type: (params.get('test_type') as 'iq' | 'eq') || 'iq',
        score_min: params.get('score_min') ? parseInt(params.get('score_min')!) : undefined,
        score_max: params.get('score_max') ? parseInt(params.get('score_max')!) : undefined,
        date_from: params.get('date_from') || undefined,
        date_to: params.get('date_to') || undefined
      };

      // Update state and fetch data
      setCurrentPage(urlPage);
      setFilters(urlFilters);
      fetchResults(urlPage, limit);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isInitialized, setCurrentPage, setFilters, fetchResults, limit]);

  // Watch for filter changes and refetch data
  useEffect(() => {
    if (!isInitialized) return;

    const filtersChanged = JSON.stringify(prevFiltersRef.current) !== JSON.stringify(filters);

    if (filtersChanged) {
      console.log('🔄 FILTERS CHANGED: Refetching data', {
        from: prevFiltersRef.current,
        to: filters
      });

      // Update the ref to current filters
      prevFiltersRef.current = filters;

      // Fetch data with new filters (always page 1 when filters change)
      fetchResults(1, limit);
    }
  }, [filters, isInitialized, fetchResults, limit]);
};
