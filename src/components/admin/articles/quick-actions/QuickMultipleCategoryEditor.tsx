import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getInstantCategoriesData, preloadCategoriesData } from '../../../../utils/admin/preloaders/categories-preloader';

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
  onUpdate: (articleId: string, categoryIds: string[], categoryNames: string[]) => Promise<void>;
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
  const popupRef = useRef<HTMLDivElement>(null);

  // Load categories on mount with instant data
  useEffect(() => {
    // Set instant data immediately to avoid loading delay
    const instantCategories = getInstantCategoriesData();
    setCategories(instantCategories);
    setIsLoading(false);

    // Always load fresh data in background to ensure completeness
    preloadCategoriesData().then(loadedCategories => {
      setCategories(loadedCategories);
      console.log(`📂 QuickMultipleCategoryEditor: Loaded ${loadedCategories.length} categories`);
    }).catch(() => {
      // Keep instant data on error
      console.warn('📂 QuickMultipleCategoryEditor: Failed to load categories, using instant fallback');
    });
  }, []);

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      // Don't close if clicking inside the popup
      if (popupRef.current && popupRef.current.contains(target)) {
        return;
      }

      // Don't close if clicking on edit category buttons (to avoid toggle conflict)
      const editButton = (target as Element).closest('[data-quick-edit-button="category"]');
      if (editButton) {
        return;
      }

      // Close popup for other outside clicks
      onClose();
    };

    // Add event listener immediately - no delay needed
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);



  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategoryIds(prev => {
      if (prev.includes(categoryId)) {
        return prev.filter(id => id !== categoryId);
      } else {
        return [...prev, categoryId];
      }
    });
  };

  // Handle select all/none toggle
  const handleSelectAllToggle = () => {
    const activeCategories = categories.filter(cat => cat.status === 'active');
    const allActiveIds = activeCategories.map(cat => cat.id);

    // If all active categories are selected, deselect all
    // Otherwise, select all active categories
    const allSelected = allActiveIds.every(id => selectedCategoryIds.includes(id));

    if (allSelected) {
      setSelectedCategoryIds([]);
    } else {
      setSelectedCategoryIds(allActiveIds);
    }
  };

  // Check if all active categories are selected
  const activeCategories = categories.filter(cat => cat.status === 'active');
  const allActiveIds = activeCategories.map(cat => cat.id);
  const isAllSelected = allActiveIds.length > 0 && allActiveIds.every(id => selectedCategoryIds.includes(id));
  const isPartialSelected = selectedCategoryIds.length > 0 && !isAllSelected;

  const handleSave = async () => {
    // Get selected category names for optimistic UI update
    const selectedCategoryNames = selectedCategoryIds.map(id => {
      const category = categories.find(cat => cat.id === id);
      return category?.name || '';
    }).filter(name => name);

    // Call parent handler (which will close popup and handle API call)
    await onUpdate(articleId, selectedCategoryIds, selectedCategoryNames);
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
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
              <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Đang tải...</span>
            </div>
          ) : (
            <>
              {/* Select All Header */}
              {categories.length > 0 && (
                <div className="mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
                  <label className="flex items-center space-x-3 p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={isAllSelected}
                        ref={(input) => {
                          if (input) input.indeterminate = isPartialSelected;
                        }}
                        onChange={handleSelectAllToggle}
                        className="rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500 dark:bg-gray-700"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {isAllSelected ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {activeCategories.length} danh mục khả dụng
                      </div>
                    </div>
                    <div className="text-xs text-primary-600 dark:text-primary-400 font-medium">
                      {selectedCategoryIds.length}/{activeCategories.length}
                    </div>
                  </label>
                </div>
              )}

              <div className="space-y-2 max-h-48 overflow-y-auto">
                {categories.length === 0 ? (
                  <div className="text-center py-4 text-sm text-gray-500 dark:text-gray-400">
                    Không có danh mục nào
                  </div>
                ) : (
                  categories.map((category) => (
                    <label
                      key={category.id}
                      className={`flex items-center space-x-3 p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer ${
                        category.status === 'inactive' ? 'opacity-50' : ''
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedCategoryIds.includes(category.id)}
                        onChange={() => handleCategoryToggle(category.id)}
                        disabled={category.status === 'inactive'}
                        className="rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500 dark:bg-gray-700 disabled:opacity-50"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                          {category.name}
                          {category.status === 'inactive' && (
                            <span className="ml-2 text-xs text-red-500 dark:text-red-400">(Không hoạt động)</span>
                          )}
                        </div>
                        {category.description && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {category.description}
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-gray-400 dark:text-gray-500">
                        {category.article_count || 0} bài
                      </div>
                    </label>
                  ))
                )}
              </div>
            </>
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
              className="px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors duration-200"
            >
              Hủy
            </button>
            <button
              onClick={handleSave}
              disabled={!hasChanges}
              className="px-3 py-1.5 text-xs font-medium text-white bg-primary-600 hover:bg-primary-700 rounded transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Lưu
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default QuickMultipleCategoryEditor;
