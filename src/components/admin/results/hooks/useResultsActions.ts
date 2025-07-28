/**
 * RESULTS ACTIONS HOOK
 * Hook xử lý các actions cho Results module với URL synchronization
 */

import { useCallback } from 'react';
import type { ResultsFilters, ResultsListResponse } from '../../../../../backend';

interface UseResultsActionsProps {
  resultsData: ResultsListResponse | null;
  setResultsData: (data: ResultsListResponse | null) => void;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  displayCurrentPage: number;
  filters: ResultsFilters;
  setFilters: (filters: ResultsFilters | ((prev: ResultsFilters) => ResultsFilters)) => void;
  limit: number;
  setLimit: (limit: number) => void;
  selectedResults: Set<string>;
  setSelectedResults: (results: Set<string>) => void;
  setIsDeleting: (deleting: boolean) => void;
  setError: (error: string) => void;
  showSuccess: (message: string) => void;
  showError: (title: string, message?: string) => void;
  updateURL: (page: number, filters: ResultsFilters) => void;
  fetchResults: (page?: number, pageLimit?: number) => Promise<void>;
  cacheWithTTL: React.MutableRefObject<Map<string, any>>;
  setIsLoading: (loading: boolean) => void;
}

export const useResultsActions = ({
  resultsData,
  setResultsData,
  currentPage,
  setCurrentPage,
  displayCurrentPage,
  filters,
  setFilters,
  limit,
  setLimit,
  selectedResults,
  setSelectedResults,
  setIsDeleting,
  setError,
  showSuccess,
  showError,
  updateURL,
  fetchResults,
  cacheWithTTL,
  setIsLoading
}: UseResultsActionsProps) => {

  // Handle page change with URL sync
  const handlePageChange = useCallback((newPage: number) => {
    // Validate page bounds
    if (resultsData && newPage > resultsData.totalPages) return;
    if (newPage < 1) return;

    console.log(`🔄 PAGE CHANGE: → ${newPage}`);

    // Update URL and let displayCurrentPage handle the rest
    updateURL(newPage, filters);

    // Simple cache check for instant display
    const cacheKey = `results-${newPage}-${limit}-${JSON.stringify(filters)}`;
    const cached = cacheWithTTL.current.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      setResultsData(cached.data);
      setError('');
    } else {
      setIsLoading(true);
      fetchResults(newPage);
    }
  }, [resultsData, filters, limit, updateURL, cacheWithTTL, setResultsData, setError, setIsLoading, fetchResults]);

  // Handle limit change - Reset to page 1
  const handleLimitChange = useCallback((newLimit: number) => {
    console.log(`🔄 LIMIT CHANGE: ${limit} → ${newLimit}`);
    setLimit(newLimit);
    setCurrentPage(1);
    // Clear cache since page size changed
    cacheWithTTL.current.clear();
    fetchResults(1, newLimit);
  }, [limit, setLimit, setCurrentPage, cacheWithTTL, fetchResults]);

  // Handle filter change with URL sync
  const handleFilterChange = useCallback((newFilters: Partial<ResultsFilters>) => {
    const updatedFilters = { ...filters, ...newFilters };
    console.log('🔄 FILTER CHANGE:', updatedFilters);

    // Update URL with new filters and reset to page 1
    updateURL(1, updatedFilters);

    setFilters(updatedFilters);
    setCurrentPage(1);
  }, [filters, updateURL, setFilters, setCurrentPage]);

  // Handle result selection
  const handleResultSelect = useCallback((resultId: string) => {
    setSelectedResults(prev => {
      const newSet = new Set(prev);
      if (newSet.has(resultId)) {
        newSet.delete(resultId);
      } else {
        newSet.add(resultId);
      }
      return newSet;
    });
  }, [setSelectedResults]);

  // Handle select all
  const handleSelectAll = useCallback(() => {
    if (!resultsData?.results) return;
    
    const allCurrentIds = new Set(resultsData.results.map(r => r.id));
    const hasAllSelected = resultsData.results.every(r => selectedResults.has(r.id));
    
    if (hasAllSelected) {
      // Deselect all current page items
      setSelectedResults(prev => {
        const newSet = new Set(prev);
        allCurrentIds.forEach(id => newSet.delete(id));
        return newSet;
      });
    } else {
      // Select all current page items
      setSelectedResults(prev => {
        const newSet = new Set(prev);
        allCurrentIds.forEach(id => newSet.add(id));
        return newSet;
      });
    }
  }, [resultsData, selectedResults, setSelectedResults]);

  // Handle clear selection
  const handleClearSelection = useCallback(() => {
    setSelectedResults(new Set());
  }, [setSelectedResults]);

  // Handle delete selected results
  const handleDeleteSelected = useCallback(async () => {
    if (selectedResults.size === 0) return;

    // Confirm deletion
    if (!confirm(`Bạn có chắc chắn muốn xóa ${selectedResults.size} kết quả test đã chọn?`)) {
      return;
    }

    setIsDeleting(true);
    try {
      const { loadResultsService } = await import('../../../../../backend');
      const ResultsService = await loadResultsService();
      const { data, error } = await ResultsService.deleteResults(Array.from(selectedResults));
      
      if (error) {
        console.error('Error deleting results:', error);
        showError('Có lỗi xảy ra khi xóa kết quả test');
        return;
      }

      console.log(`Successfully deleted ${data} results`);
      setSelectedResults(new Set());
      
      // Refresh current page data (use displayCurrentPage to stay on current URL page)
      await fetchResults(displayCurrentPage);
      showSuccess(`Đã xóa ${data} kết quả test thành công!`);
      
    } catch (err) {
      console.error('Exception deleting results:', err);
      showError('Có lỗi xảy ra khi xóa kết quả test');
    } finally {
      setIsDeleting(false);
    }
  }, [selectedResults, setIsDeleting, setSelectedResults, displayCurrentPage, fetchResults, showSuccess, showError]);

  return {
    handlePageChange,
    handleLimitChange,
    handleFilterChange,
    handleResultSelect,
    handleSelectAll,
    handleClearSelection,
    handleDeleteSelected
  };
};
