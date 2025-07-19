import React from 'react';
import { useCategories } from '../hooks/useCategories';

interface CategoryDropdownProps {
  value: string;
  onChange: (categorySlug: string) => void;
  placeholder?: string;
  className?: string;
}

export default function CategoryDropdown({
  value,
  onChange,
  placeholder = "Chọn danh mục...",
  className = ""
}: CategoryDropdownProps) {
  const { categories, loading, error } = useCategories();

  if (error) {
    return (
      <div className="text-sm text-red-600 dark:text-red-400">
        {error}
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        disabled={loading}
        className="w-full px-3 py-2 pr-8 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed appearance-none text-sm"
      >
        <option value="">
          {loading ? "Đang tải..." : placeholder}
        </option>

        {categories.map((category) => (
          <option key={category.id} value={category.slug}>
            📁 {category.name}
          </option>
        ))}
      </select>

      {/* Custom dropdown arrow */}
      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
        {loading ? (
          <div className="w-4 h-4 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
        ) : (
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </div>


    </div>
  );
}
