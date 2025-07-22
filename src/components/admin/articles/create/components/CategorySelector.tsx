import React, { useState, useEffect } from 'react';
import { CategoriesService, type Category } from '../../../../../../backend/admin/categories-service';

interface CategorySelectorProps {
  value: string[];
  categories?: Category[]; // Optional - nếu không có thì tự load
  onChange: (categories: string[]) => void;
  disabled?: boolean;
}

export default function CategorySelector({
  value,
  categories: propCategories,
  onChange,
  disabled = false
}: CategorySelectorProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'recent'>('all');
  const [categories, setCategories] = useState<Category[]>([]);

  // Use prop categories or fetch from database
  useEffect(() => {
    if (propCategories) {
      // Use categories from props (preloaded)
      setCategories(propCategories);
      return;
    }

    // Fallback: fetch categories if not provided
    const loadCategories = async () => {
      try {
        console.log('CategorySelector: Loading categories from database...');

        const { data: categoriesData, error } = await CategoriesService.getAllCategories();

        if (error) {
          console.error('CategorySelector: Error loading categories:', error);
          setCategories([]);
          return;
        }

        if (categoriesData && categoriesData.length > 0) {
          console.log(`CategorySelector: Loaded ${categoriesData.length} categories from database`);
          setCategories(categoriesData);
        } else {
          console.warn('CategorySelector: No categories found in database');
          setCategories([]);
        }
      } catch (err) {
        console.error('CategorySelector: Failed to load categories:', err);
        setCategories([]);
      }
    };

    loadCategories();
  }, [propCategories]);

  // Get categories based on active tab
  const getDisplayCategories = () => {
    if (activeTab === 'recent') {
      // Sort by created_at descending (newest first)
      return [...categories].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
    // Tab "all" - sort by article_count descending (most articles first)
    return [...categories].sort((a, b) => b.article_count - a.article_count);
  };

  // Handle category toggle
  const handleCategoryToggle = (categoryId: string) => {
    if (disabled) return;
    
    const newValue = value.includes(categoryId)
      ? value.filter(id => id !== categoryId)
      : [...value, categoryId];
    
    onChange(newValue);
  };

  const displayCategories = getDisplayCategories();

  return (
    <div>
      {/* Tab Navigation */}
      <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1 mb-3">
        <button
          type="button"
          onClick={() => setActiveTab('all')}
          className={`flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'all'
              ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm'
              : 'text-gray-600 dark:text-gray-400'
          }`}
        >
          Tất cả
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('recent')}
          className={`flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'recent'
              ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm'
              : 'text-gray-600 dark:text-gray-400'
          }`}
        >
          Mới thêm
        </button>
      </div>

      {/* Categories List */}
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {displayCategories.length === 0 ? (
          <div className="text-center py-4 text-sm text-gray-500 dark:text-gray-400">
            Không có danh mục nào
          </div>
        ) : (
          displayCategories.map((category) => {
            const isSelected = value.includes(category.id);
            return (
              <label
                key={category.id}
                className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                  isSelected
                    ? 'bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleCategoryToggle(category.id)}
                    disabled={disabled}
                    className="rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {category.name}
                  </span>
                </div>
                
                {/* Article count badge */}
                <span className="text-xs px-2 py-0.5 bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-400 rounded-full">
                  {category.article_count}
                </span>
              </label>
            );
          })
        )}
      </div>

      {/* Selected count */}
      {value.length > 0 && (
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          Đã chọn {value.length} danh mục
        </div>
      )}
    </div>
  );
}
