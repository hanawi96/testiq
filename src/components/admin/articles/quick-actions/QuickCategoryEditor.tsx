import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArticlesService, CategoriesService } from '../../../../../backend';
import type { Category } from '../../../../../backend';

interface QuickCategoryEditorProps {
  articleId: string;
  currentCategoryId: string | null;
  currentCategoryName: string | null;
  onUpdate: (articleId: string, categoryIds: string[], categoryNames: string[]) => void;
  onClose: () => void;
  position: { top: number; left: number };
}

export default function QuickCategoryEditor({ 
  articleId, 
  currentCategoryId,
  currentCategoryName,
  onUpdate, 
  onClose, 
  position 
}: QuickCategoryEditorProps) {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(currentCategoryId);
  const [availableCategories, setAvailableCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [error, setError] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load available categories
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const { data: categories, error: categoriesError } = await CategoriesService.getAllCategories();
        
        if (categoriesError) {
          console.error('Error loading categories:', categoriesError);
          setError('Không thể tải danh sách danh mục');
          return;
        }

        setAvailableCategories(categories || []);
      } catch (err) {
        console.error('Error loading categories:', err);
        setError('Có lỗi xảy ra khi tải danh mục');
      } finally {
        setIsLoadingCategories(false);
      }
    };

    loadCategories();
  }, []);

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const handleCategorySelect = (categoryId: string | null) => {
    setSelectedCategoryId(categoryId);
  };

  const handleSave = async () => {
    setIsLoading(true);
    setError('');

    try {
      const { error: updateError } = await ArticlesService.updateCategory(articleId, selectedCategoryId);
      
      if (updateError) {
        setError('Không thể cập nhật danh mục');
        return;
      }

      // Find category name for UI update
      const selectedCategory = availableCategories.find(cat => cat.id === selectedCategoryId);
      const categoryName = selectedCategory?.name || null;

      // Convert to arrays format expected by handleCategoryUpdate
      const categoryIds = selectedCategoryId ? [selectedCategoryId] : [];
      const categoryNames = categoryName ? [categoryName] : [];

      onUpdate(articleId, categoryIds, categoryNames);
      onClose();
    } catch (err) {
      setError('Có lỗi xảy ra khi cập nhật');
    } finally {
      setIsLoading(false);
    }
  };

  const selectedCategory = availableCategories.find(cat => cat.id === selectedCategoryId);

  return (
    <motion.div
      ref={dropdownRef}
      initial={{ opacity: 0, y: -10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="fixed z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl w-72 max-w-[calc(100vw-32px)] max-h-[90vh] overflow-hidden"
      style={{
        top: position.top,
        left: position.left,
      }}
    >
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
            Chọn danh mục
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mb-3 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        {isLoadingCategories ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
            {/* No category option */}
            <label className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors">
              <input
                type="radio"
                name="category"
                checked={selectedCategoryId === null}
                onChange={() => handleCategorySelect(null)}
                className="text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600"
                disabled={isLoading}
              />
              <span className="text-sm text-gray-600 dark:text-gray-400 italic">
                Không có danh mục
              </span>
            </label>

            {/* Available categories */}
            {availableCategories.map((category) => (
              <label
                key={category.id}
                className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
              >
                <input
                  type="radio"
                  name="category"
                  checked={selectedCategoryId === category.id}
                  onChange={() => handleCategorySelect(category.id)}
                  className="text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600"
                  disabled={isLoading}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {category.name}
                  </div>
                  {category.description && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {category.description}
                    </div>
                  )}
                </div>
                <div className="text-xs text-gray-400 dark:text-gray-500">
                  {category.article_count} bài
                </div>
              </label>
            ))}

            {availableCategories.length === 0 && (
              <div className="text-center py-4 text-sm text-gray-500 dark:text-gray-400">
                Không có danh mục nào
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            disabled={isLoading}
          >
            Hủy
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading || isLoadingCategories}
            className="px-4 py-1.5 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white text-sm font-medium rounded-lg transition-colors flex items-center space-x-2"
          >
            {isLoading && (
              <div className="animate-spin rounded-full h-3 w-3 border border-white border-t-transparent"></div>
            )}
            <span>{isLoading ? 'Đang lưu...' : 'Lưu'}</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
}
