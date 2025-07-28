/**
 * RESULTS STATE HOOK
 * Hook quản lý state cơ bản cho Results module với URL synchronization
 */

import { useState, useMemo } from 'react';
import type { TestResult, ResultsListResponse, ResultsFilters } from '../../../../../backend';
import { useToast } from '../../common/Toast';

export const useResultsState = () => {
  // State management - Start with defaults, sync with URL in useEffect
  const [resultsData, setResultsData] = useState<ResultsListResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<ResultsFilters>({
    user_type: 'all',
    search: '',
    test_type: 'iq'
  });

  // Computed current page from URL with validation
  const displayCurrentPage = useMemo(() => {
    if (typeof window === 'undefined') return currentPage;
    const params = new URLSearchParams(window.location.search);
    const urlPage = Math.max(1, parseInt(params.get('page') || '1'));

    // Validate against totalPages if available
    if (resultsData?.totalPages && urlPage > resultsData.totalPages) {
      console.warn('🚨 INVALID PAGE: URL page', urlPage, 'exceeds totalPages', resultsData.totalPages);
      // Redirect to last valid page
      if (typeof window !== 'undefined') {
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.set('page', resultsData.totalPages.toString());
        window.history.replaceState({}, '', newUrl.toString());
      }
      return resultsData.totalPages;
    }

    return urlPage;
  }, [currentPage, resultsData?.totalPages, typeof window !== 'undefined' ? window.location.search : '']);

  // URL sync state
  const [isInitialized, setIsInitialized] = useState(false);

  // Toast notifications
  const { toasts, removeToast, showSuccess, showError } = useToast();

  // Limit state
  const [limit, setLimit] = useState(10);

  // Selection state
  const [selectedResults, setSelectedResults] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);

  // Stats state
  const [stats, setStats] = useState<any>(null);
  const [estimatedStats, setEstimatedStats] = useState<any>(null);
  const [scoreDistribution, setScoreDistribution] = useState<Array<{ range: string; count: number }> | null>(null);

  // Mobile detection
  const [isMobile, setIsMobile] = useState(false);

  // URL update function
  const updateURL = (page: number, currentFilters: ResultsFilters) => {
    if (typeof window === 'undefined') return;

    const url = new URL(window.location.href);
    
    // Update page
    if (page === 1) {
      url.searchParams.delete('page');
    } else {
      url.searchParams.set('page', page.toString());
    }

    // Update filters
    Object.entries(currentFilters).forEach(([key, value]) => {
      if (value && value !== 'all' && value !== '') {
        url.searchParams.set(key, value.toString());
      } else {
        url.searchParams.delete(key);
      }
    });

    // Update URL without page reload
    window.history.pushState({}, '', url.toString());
    console.log('🔄 URL UPDATED:', url.toString());
  };

  return {
    // Data state
    resultsData,
    setResultsData,
    isLoading,
    setIsLoading,
    error,
    setError,
    
    // Pagination state
    currentPage,
    setCurrentPage,
    displayCurrentPage,
    limit,
    setLimit,
    
    // Filter state
    filters,
    setFilters,
    
    // Selection state
    selectedResults,
    setSelectedResults,
    isDeleting,
    setIsDeleting,
    
    // Stats state
    stats,
    setStats,
    estimatedStats,
    setEstimatedStats,
    scoreDistribution,
    setScoreDistribution,
    
    // UI state
    isMobile,
    setIsMobile,
    isInitialized,
    setIsInitialized,
    
    // Toast functions
    toasts,
    removeToast,
    showSuccess,
    showError,
    
    // URL functions
    updateURL
  };
};
