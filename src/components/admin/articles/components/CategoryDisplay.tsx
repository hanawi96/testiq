import React, { useState, memo, useMemo } from 'react';

interface CategoryDisplayProps {
  categories: readonly string[] | string[];
  maxVisible?: number;
  getCategoryColor: (categoryName: string) => string;
  className?: string;
  showIcon?: boolean;
  iconPrefix?: string;
}

const CategoryDisplay: React.FC<CategoryDisplayProps> = ({
  categories,
  maxVisible = 3,
  getCategoryColor,
  className = '',
  showIcon = false,
  iconPrefix = '📁'
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Memoize categories để tránh re-render không cần thiết
  const memoizedCategories = useMemo(() => categories, [categories?.join(',')]);

  // Debug log để xem categories data (chỉ khi thực sự thay đổi)
  console.log('🏷️ CategoryDisplay render:', { categories: memoizedCategories, length: memoizedCategories?.length });

  // Nếu không có danh mục hoặc ít hơn maxVisible, hiển thị bình thường
  if (!memoizedCategories || memoizedCategories.length === 0) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600">
        {showIcon && `${iconPrefix} `}Chưa phân loại
      </span>
    );
  }

  if (memoizedCategories.length <= maxVisible) {
    return (
      <div className={`flex flex-wrap gap-1 ${className}`}>
        {memoizedCategories.map((categoryName, index) => (
          <span
            key={index}
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getCategoryColor(categoryName)}`}
          >
            {showIcon && `${iconPrefix} `}{categoryName}
          </span>
        ))}
      </div>
    );
  }

  // Có nhiều hơn maxVisible danh mục
  const visibleCategories = isExpanded ? memoizedCategories : memoizedCategories.slice(0, maxVisible);
  const hiddenCount = memoizedCategories.length - maxVisible;

  return (
    <div className={`flex flex-wrap gap-1 ${className}`}>
      {visibleCategories.map((categoryName, index) => (
        <span
          key={index}
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getCategoryColor(categoryName)} ${
            index >= maxVisible && !isExpanded ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
          }`}
          style={{
            transitionDelay: index >= maxVisible ? `${(index - maxVisible) * 50}ms` : '0ms'
          }}
        >
          {showIcon && `${iconPrefix} `}{categoryName}
        </span>
      ))}
      
      {!isExpanded && hiddenCount > 0 && (
        <button
          onClick={() => setIsExpanded(true)}
          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/50 hover:scale-105"
          title={`Hiển thị ${hiddenCount} danh mục khác`}
        >
          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          {hiddenCount} khác
        </button>
      )}
      
      {isExpanded && hiddenCount > 0 && (
        <button
          onClick={() => setIsExpanded(false)}
          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 hover:scale-105"
          title="Thu gọn danh mục"
        >
          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
          Thu gọn
        </button>
      )}
    </div>
  );
};

export default memo(CategoryDisplay);
