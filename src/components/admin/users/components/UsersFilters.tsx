import React, { useState, useEffect, useCallback } from 'react';
import type { UsersFilters as UsersFiltersType } from '../../../../../backend';

interface Props {
  onFiltersChange?: (filters: UsersFiltersType) => void;
  initialFilters?: UsersFiltersType;
}

export default function UsersFilters({ onFiltersChange, initialFilters }: Props) {
  const [filters, setFilters] = useState<UsersFiltersType>(initialFilters || {
    role: 'all',
    search: '',
    verified: undefined,
    user_type: undefined
  });
  const [searchInput, setSearchInput] = useState(initialFilters?.search || '');

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchInput !== filters.search) {
        handleFilterChange({ search: searchInput });
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchInput]);

  // Handle filter changes
  const handleFilterChange = useCallback((newFilters: Partial<UsersFiltersType>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    onFiltersChange?.(updatedFilters);
  }, [filters, onFiltersChange]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tìm kiếm</label>
          <div className="relative">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Tên, email, địa điểm..."
              className="w-full pr-10 pl-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg outline-none focus:outline-none focus:ring-0 focus:border-gray-300 dark:focus:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
              style={{ textIndent: '6px' }}
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Loại người dùng</label>
          <select
            value={filters.user_type || 'all'}
            onChange={(e) => handleFilterChange({ user_type: e.target.value === 'all' ? undefined : e.target.value as any })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            <option value="all">Tất cả</option>
            <option value="registered">Đã đăng ký</option>
            <option value="anonymous">Ẩn danh</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Vai trò</label>
          <select
            value={filters.role || 'all'}
            onChange={(e) => handleFilterChange({ role: e.target.value as any })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            <option value="all">Tất cả</option>
            <option value="admin">Admin</option>
            <option value="mod">Moderator</option>
            <option value="user">User</option>
            <option value="anonymous">Người chơi chưa đăng ký</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Trạng thái</label>
          <select
            value={filters.verified === undefined ? 'all' : filters.verified.toString()}
            onChange={(e) => {
              const value = e.target.value;
              handleFilterChange({
                verified: value === 'all' ? undefined : value === 'true'
              });
            }}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            <option value="all">Tất cả</option>
            <option value="true">Đã xác thực</option>
            <option value="false">Chưa xác thực</option>
          </select>
        </div>
      </div>
    </div>
  );
}
