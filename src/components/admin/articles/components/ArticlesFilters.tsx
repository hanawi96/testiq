import React from 'react';
import type { ArticlesFilters } from '../../../../../backend';
import SearchInput from '../../common/SearchInput';
import SearchStats from '../../common/SearchStats';

interface ArticlesFiltersProps {
  filters: ArticlesFilters;
  onFilterChange: (newFilters: Partial<ArticlesFilters>) => void;
  searchStats?: {
    searchTerm: string;
    totalResults: number;
    currentPage: number;
    totalPages: number;
  };
}

export default function ArticlesFilters({ 
  filters, 
  onFilterChange,
  searchStats 
}: ArticlesFiltersProps) {
  return (
    <>
      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tìm kiếm</label>
            <SearchInput
              value={filters.search || ''}
              onChange={(value) => onFilterChange({ search: value })}
              placeholder="Tiêu đề, tác giả, danh mục, tags..."
              onClear={() => onFilterChange({ search: '' })}
            />
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Trạng thái</label>
            <select
              value={filters.status || 'all'}
              onChange={(e) => onFilterChange({ status: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">Tất cả</option>
              <option value="published">Đã xuất bản</option>
              <option value="draft">Nháp</option>
              <option value="archived">Lưu trữ</option>
            </select>
          </div>

          {/* Sort By */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Sắp xếp theo</label>
            <select
              value={filters.sort_by || 'created_at'}
              onChange={(e) => onFilterChange({ sort_by: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="created_at">Ngày tạo</option>
              <option value="updated_at">Ngày cập nhật</option>
              <option value="views">Lượt xem</option>
            </select>
          </div>

          {/* Sort Order */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Thứ tự</label>
            <select
              value={filters.sort_order || 'desc'}
              onChange={(e) => onFilterChange({ sort_order: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="desc">Giảm dần</option>
              <option value="asc">Tăng dần</option>
            </select>
          </div>
        </div>
      </div>

      {/* Search Stats */}
      {searchStats && (
        <SearchStats
          searchTerm={searchStats.searchTerm}
          totalResults={searchStats.totalResults}
          currentPage={searchStats.currentPage}
          totalPages={searchStats.totalPages}
          className="mb-4"
        />
      )}
    </>
  );
}
