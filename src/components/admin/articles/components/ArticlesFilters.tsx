import React from 'react';
import type { ArticlesFilters } from '../../../../../backend';
import SearchInput from '../../common/SearchInput';
import SearchStats from '../../common/SearchStats';
import CategoryDropdown from './CategoryDropdown';
import AuthorDropdown from './AuthorDropdown';

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
      {/* Filters - Single Row Layout */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex flex-wrap items-center gap-4">
          {/* Search */}
          <div className="flex-1 min-w-[300px]">
            <SearchInput
              value={filters.search || ''}
              onChange={(value) => onFilterChange({ search: value })}
              placeholder="Tìm kiếm tiêu đề, tác giả, danh mục, tags..."
              onClear={() => onFilterChange({ search: '' })}
            />
          </div>

          {/* Status Filter */}
          <div className="min-w-[140px]">
            <select
              value={filters.status || 'all'}
              onChange={(e) => onFilterChange({ status: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="published">Đã xuất bản</option>
              <option value="draft">Nháp</option>
              <option value="archived">Lưu trữ</option>
              <option value="scheduled">Hẹn giờ</option>
            </select>
          </div>

          {/* Category Filter */}
          <div className="min-w-[180px]">
            <CategoryDropdown
              value={filters.category || ''}
              onChange={(categorySlug) => onFilterChange({ category: categorySlug })}
              placeholder="Chọn danh mục..."
            />
          </div>

          {/* Author Filter */}
          <div className="min-w-[180px]">
            <AuthorDropdown
              value={filters.author || ''}
              onChange={(authorId) => onFilterChange({ author: authorId })}
              placeholder="Chọn tác giả..."
            />
          </div>

          {/* Sort & View Count Filter */}
          <div className="min-w-[160px]">
            <select
              value={filters.sort || 'created_desc'}
              onChange={(e) => {
                const value = e.target.value;
                onFilterChange({ sort: value as any });
              }}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
            >
              <option value="created_desc">🕒 Mới nhất</option>
              <option value="created_asc">🕒 Cũ nhất</option>
              <option value="updated_desc">📝 Cập nhật mới</option>
              <option value="updated_asc">📝 Cập nhật cũ</option>
              <option value="views_desc">📈 Xem nhiều</option>
              <option value="views_asc">📉 Xem ít</option>
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
