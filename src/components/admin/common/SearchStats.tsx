import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SearchStatsProps {
  searchTerm: string;
  totalResults: number;
  currentPage: number;
  totalPages: number;
  isLoading?: boolean;
  className?: string;
}

/**
 * Component hiển thị thống kê kết quả tìm kiếm
 * Tuân theo design principles: minimalist, informative, fast
 */
export default function SearchStats({
  searchTerm,
  totalResults,
  currentPage,
  totalPages,
  isLoading = false,
  className = ""
}: SearchStatsProps) {
  if (!searchTerm && !isLoading) {
    return null;
  }

  return (
    <AnimatePresence>
      {(searchTerm || isLoading) && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.15 }}
          className={`flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 ${className}`}
        >
          <div className="flex items-center space-x-2">
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-gray-300 border-t-primary-500 rounded-full animate-spin"></div>
                <span>Đang tìm kiếm...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>
                  Tìm thấy <strong className="text-gray-900 dark:text-gray-100">{totalResults}</strong> kết quả 
                  {searchTerm && (
                    <> cho "<strong className="text-primary-600 dark:text-primary-400">{searchTerm}</strong>"</>
                  )}
                </span>
              </>
            )}
          </div>

          {!isLoading && totalPages > 1 && (
            <div className="text-xs">
              Trang {currentPage} / {totalPages}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
