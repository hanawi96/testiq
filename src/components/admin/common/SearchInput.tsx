import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchDebounce } from '../../../hooks/useSearchDebounce';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
  onSearch?: (searchTerm: string) => void;
  onClear?: () => void;
  isLoading?: boolean;
}

/**
 * Component tìm kiếm tối ưu với debouncing, loading states, clear button
 * Tuân theo design principles: minimalist, fast, clean
 */
export default function SearchInput({
  value,
  onChange,
  placeholder = "Tìm kiếm...",
  className = "",
  autoFocus = false,
  onSearch,
  onClear,
  isLoading = false
}: SearchInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  
  const {
    searchTerm,
    debouncedSearchTerm,
    isSearching,
    setSearchTerm,
    clearSearch,
    handleKeyDown
  } = useSearchDebounce({
    delay: 300,
    minLength: 1
  });

  // Sync external value with internal state - simplified
  useEffect(() => {
    if (value !== searchTerm) {
      setSearchTerm(value);
    }
  }, [value]);

  // Handle debounced search term changes
  useEffect(() => {
    if (debouncedSearchTerm !== value) {
      onChange(debouncedSearchTerm);
      onSearch?.(debouncedSearchTerm);
    }
  }, [debouncedSearchTerm]);

  // Handle clear action
  const handleClear = () => {
    clearSearch();
    onChange('');
    onClear?.();
  };

  // Auto focus if requested
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  const showLoading = isLoading || isSearching;
  const showClearButton = searchTerm.length > 0;

  return (
    <div className={`relative ${className}`}>
      {/* Search Icon */}
      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
        <AnimatePresence mode="wait">
          {showLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.15 }}
              className="w-4 h-4"
            >
              <svg className="animate-spin w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </motion.div>
          ) : (
            <motion.div
              key="search"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.15 }}
            >
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Input Field */}
      <input
        ref={inputRef}
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
      />

      {/* Clear Button */}
      <AnimatePresence>
        {showClearButton && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.15 }}
            onClick={handleClear}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-full transition-colors duration-150"
            title="Xóa tìm kiếm (Esc)"
          >
            <svg className="w-3 h-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Search Hint */}
      {searchTerm.length > 0 && (
        <div className="absolute top-full left-0 mt-1 text-xs text-gray-500 dark:text-gray-400">
          {isSearching ? 'Đang tìm kiếm...' : `Tìm thấy kết quả cho "${debouncedSearchTerm}"`}
        </div>
      )}
    </div>
  );
}
