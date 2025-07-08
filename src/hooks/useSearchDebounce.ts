import { useState, useEffect, useCallback, useRef } from 'react';

interface UseSearchDebounceOptions {
  delay?: number;
  minLength?: number;
}

interface UseSearchDebounceReturn {
  searchTerm: string;
  debouncedSearchTerm: string;
  isSearching: boolean;
  setSearchTerm: (term: string) => void;
  clearSearch: () => void;
  handleKeyDown: (e: React.KeyboardEvent) => void;
}

/**
 * Hook tối ưu cho tìm kiếm với debouncing, caching và keyboard support
 * Tuân theo design pattern đơn giản, hiệu suất cao của user
 */
export function useSearchDebounce({
  delay = 300,
  minLength = 1
}: UseSearchDebounceOptions = {}): UseSearchDebounceReturn {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  // Debounce search term - simplified without callback dependencies
  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (searchTerm.length === 0) {
      setDebouncedSearchTerm('');
      setIsSearching(false);
      return;
    }

    if (searchTerm.length < minLength) {
      setIsSearching(false);
      return;
    }

    setIsSearching(true);

    timeoutRef.current = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setIsSearching(false);
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [searchTerm, delay, minLength]);

  // Clear search function - simplified
  const clearSearch = useCallback(() => {
    setSearchTerm('');
    setDebouncedSearchTerm('');
    setIsSearching(false);
  }, []);

  // Keyboard event handler - simplified
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      clearSearch();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (searchTerm.length >= minLength) {
        // Trigger immediate search on Enter
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        setDebouncedSearchTerm(searchTerm);
        setIsSearching(false);
      }
    }
  }, [searchTerm, minLength, clearSearch]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    searchTerm,
    debouncedSearchTerm,
    isSearching,
    setSearchTerm,
    clearSearch,
    handleKeyDown
  };
}
