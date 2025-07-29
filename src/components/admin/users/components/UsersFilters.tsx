import React from 'react';
import type { UsersFilters as UsersFiltersType } from '../../../../../backend';

interface Props {
  filters: UsersFiltersType;
  searchInput: string;
  onFilterChange: (newFilters: Partial<UsersFiltersType>) => void;
  onSearchInputChange: (search: string) => void;
}

export default function UsersFilters({
  filters,
  searchInput,
  onFilterChange,
  onSearchInputChange
}: Props) {

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tìm kiếm</label>
          <div className="relative">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => onSearchInputChange(e.target.value)}
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
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Trạng thái người dùng</label>
          <select
            value={filters.user_status || 'all'}
            onChange={(e) => onFilterChange({ user_status: e.target.value === 'all' ? undefined : e.target.value as any })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            <option value="all">Tất cả</option>
            <option value="registered_verified">Đã đăng ký & xác thực</option>
            <option value="registered_unverified">Đã đăng ký & chưa xác thực</option>
            <option value="anonymous">Ẩn danh</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Vai trò</label>
          <select
            value={filters.role || 'all'}
            onChange={(e) => onFilterChange({ role: e.target.value === 'all' ? undefined : e.target.value as any })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            <option value="all">Tất cả</option>
            <option value="admin">Admin</option>
            <option value="editor">Editor</option>
            <option value="author">Author</option>
            <option value="reviewer">Reviewer</option>
            <option value="user">User</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Giới tính</label>
          <select
            value={filters.gender || 'all'}
            onChange={(e) => onFilterChange({ gender: e.target.value === 'all' ? undefined : e.target.value as any })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            <option value="all">Tất cả</option>
            <option value="male">Nam</option>
            <option value="female">Nữ</option>
            <option value="other">Khác</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Sắp xếp</label>
          <select
            value={filters.sort || 'created_desc'}
            onChange={(e) => onFilterChange({ sort: e.target.value as any })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            <option value="created_desc">Tham gia gần nhất</option>
            <option value="created_asc">Tham gia sớm nhất</option>
            <option value="age_asc">Tuổi thấp đến cao</option>
            <option value="age_desc">Tuổi cao đến thấp</option>
          </select>
        </div>
      </div>
    </div>
  );
}
