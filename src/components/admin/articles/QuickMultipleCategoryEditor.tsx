import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CategoriesService } from '../../../../backend/admin/categories-service';

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  status: 'active' | 'inactive';
  article_count: number;
  display_order: number;
  created_at: string;
  updated_at: string;
}

interface QuickMultipleCategoryEditorProps {
  articleId: string;
  currentCategoryIds: string[];
  currentCategoryNames: string[];
  onUpdate: (articleId: string, categoryIds: string[]) => Promise<void>;
  onClose: () => void;
  position: { top: number; left: number };
}

const QuickMultipleCategoryEditor: React.FC<QuickMultipleCategoryEditorProps> = ({
  articleId,
  currentCategoryIds,
  currentCategoryNames,
  onUpdate,
  onClose,
  position
}) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>(currentCategoryIds);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  // Load categories on mount
  useEffect(() => {
    loadCategories();
  }, []);

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const loadCategories = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data: categoriesData, error: categoriesError } = await CategoriesService.getAllCategories();

      if (categoriesError) {
        console.error('Error loading categories:', categoriesError);
        setError('Không thể tải danh sách danh mục');
        return;
      }

      if (categoriesData) {
        // getAllCategories already returns only active categories
        setCategories(categoriesData);
      }
    } catch (err) {
      console.error('Exception loading categories:', err);
      setError('Có lỗi xảy ra khi tải danh mục');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategoryIds(prev => {
      if (prev.includes(categoryId)) {
        return prev.filter(id => id !== categoryId);
      } else {
        return [...prev, categoryId];
      }
    });
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError(null);
      
      await onUpdate(articleId, selectedCategoryIds);
      onClose();
    } catch (err) {
      console.error('Error saving categories:', err);
      setError('Không thể lưu danh mục');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setSelectedCategoryIds(currentCategoryIds);
    onClose();
  };

  // Check if changes were made
  const hasChanges = JSON.stringify(selectedCategoryIds.sort()) !== JSON.stringify(currentCategoryIds.sort());

  return (
    <AnimatePresence>
      <motion.div
        ref={popupRef}
        initial={{ opacity: 0, scale: 0.95, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -10 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="fixed z-50 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 w-80"
        style={{
          top: position.top,
          left: position.left,
          maxHeight: '400px'
        }}
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Chọn danh mục
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {error && (
            <div className="mb-3 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
              <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Đang tải...</span>
            </div>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {categories.length === 0 ? (
                <div className="text-center py-4 text-sm text-gray-500 dark:text-gray-400">
                  Không có danh mục nào
                </div>
              ) : (
                categories.map((category) => (
                  <label
                    key={category.id}
                    className="flex items-center space-x-3 p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedCategoryIds.includes(category.id)}
                      onChange={() => handleCategoryToggle(category.id)}
                      className="rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500 dark:bg-gray-700"
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
                  </label>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {selectedCategoryIds.length} danh mục được chọn
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleCancel}
              disabled={isSaving}
              className="px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors duration-200 disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || !hasChanges}
              className="px-3 py-1.5 text-xs font-medium text-white bg-primary-600 hover:bg-primary-700 rounded transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
            >
              {isSaving && (
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
              )}
              <span>{isSaving ? 'Đang lưu...' : 'Lưu'}</span>
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default QuickMultipleCategoryEditor;
