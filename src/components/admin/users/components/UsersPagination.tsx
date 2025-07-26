/**
 * USERS PAGINATION COMPONENT
 * Component hiển thị pagination controls - khớp chính xác với design trong UsersList
 */

import React from 'react';

// Type cho pagination data
interface PaginationData {
  users: any[];
  total: number;
  totalPages: number;
  hasPrev: boolean;
  hasNext: boolean;
}

interface UsersPaginationProps {
  usersData: PaginationData | null;
  currentPage: number;
  displayCurrentPage: number;
  limit: number;
  isMobile: boolean;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
}

export const UsersPagination: React.FC<UsersPaginationProps> = ({
  usersData,
  currentPage,
  displayCurrentPage,
  limit,
  isMobile,
  onPageChange,
  onLimitChange
}) => {
  // Chỉ hiển thị khi có data và users
  if (!usersData || usersData.users.length === 0) {
    return null;
  }

  return (
    <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
      <div className="flex items-center justify-between">
        {/* Left: Results Info */}
        <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
          <span>
            Hiển thị {Math.min(displayCurrentPage * limit, usersData.total)}/{usersData.total} người dùng
          </span>

          {/* Items Per Page Selector - Compact */}
          <div className="flex items-center space-x-2">
            <select
              value={limit}
              onChange={(e) => onLimitChange(Number(e.target.value))}
              className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span className="text-xs text-gray-500 dark:text-gray-400">/ trang</span>
          </div>
        </div>

        {/* Right: Pagination Controls - Only show if more than 1 page and data exists */}
        {usersData.totalPages > 1 && usersData.total > 0 && (
          <nav className="flex items-center space-x-1">
            {/* First Page - Hidden on mobile */}
            <button
              onClick={() => onPageChange(1)}
              disabled={displayCurrentPage === 1}
              className="hidden sm:flex items-center justify-center w-10 h-10 text-sm font-medium text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Trang đầu"
            >
              ⇤
            </button>

            {/* Previous Page */}
            <button
              onClick={() => onPageChange(displayCurrentPage - 1)}
              disabled={!usersData.hasPrev}
              className="flex items-center justify-center w-10 h-10 text-sm font-medium text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Trang trước"
            >
              ←
            </button>
            
            {/* Page Numbers - Responsive count */}
            <div className="flex items-center space-x-1">
              {Array.from({
                length: Math.min(
                  isMobile ? 3 : 5, // 3 on mobile, 5 on desktop
                  usersData.totalPages
                )
              }, (_, i) => {
                const maxVisible = isMobile ? 3 : 5;
                const page = i + Math.max(1, displayCurrentPage - Math.floor(maxVisible / 2));
                if (page > usersData.totalPages) return null;

                return (
                  <button
                    key={page}
                    onClick={() => onPageChange(page)}
                    className={`flex items-center justify-center w-10 h-10 text-sm font-medium rounded-lg ${
                      page === displayCurrentPage
                        ? 'bg-primary-600 dark:bg-primary-500 text-white shadow-sm'
                        : 'text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                    aria-label={`Trang ${page}`}
                    aria-current={page === displayCurrentPage ? 'page' : undefined}
                  >
                    {page}
                  </button>
                );
              })}
            </div>
            
            {/* Next Page */}
            <button
              onClick={() => onPageChange(displayCurrentPage + 1)}
              disabled={!usersData.hasNext}
              className="flex items-center justify-center w-10 h-10 text-sm font-medium text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Trang sau"
            >
              →
            </button>

            {/* Last Page - Hidden on mobile */}
            <button
              onClick={() => onPageChange(usersData.totalPages)}
              disabled={displayCurrentPage === usersData.totalPages}
              className="hidden sm:flex items-center justify-center w-10 h-10 text-sm font-medium text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Trang cuối"
            >
              ⇥
            </button>

            {/* Mobile-only: Jump to page input */}
            {usersData.totalPages > 5 && (
              <div className="flex sm:hidden items-center ml-2 space-x-1">
                <span className="text-xs text-gray-500 dark:text-gray-400">Đến:</span>
                <input
                  type="number"
                  min="1"
                  max={usersData.totalPages}
                  value={currentPage}
                  onChange={(e) => {
                    const page = parseInt(e.target.value);
                    if (page >= 1 && page <= usersData.totalPages) {
                      onPageChange(page);
                    }
                  }}
                  className="w-12 h-8 text-xs text-center border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-primary-500 dark:focus:ring-primary-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                />
              </div>
            )}
          </nav>
        )}
      </div>
    </div>
  );
};
