import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ArticlesBulkActionsProps {
  selectedArticles: string[];
  showBulkActions: boolean;
  loading: boolean;
  onBulkStatusUpdate: (status: 'published' | 'draft' | 'archived') => void;
  onBulkDelete: () => void;
  onClearSelection: () => void;
}

export default function ArticlesBulkActions({
  selectedArticles,
  showBulkActions,
  loading,
  onBulkStatusUpdate,
  onBulkDelete,
  onClearSelection
}: ArticlesBulkActionsProps) {
  return (
    <AnimatePresence>
      {showBulkActions && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Đã chọn {selectedArticles.length} bài viết
              </span>
              <button
                onClick={onClearSelection}
                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
              >
                Bỏ chọn
              </button>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onBulkStatusUpdate('published')}
                disabled={loading}
                className="px-3 py-1 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white text-sm rounded-md transition-colors"
              >
                Xuất bản
              </button>
              <button
                onClick={() => onBulkStatusUpdate('draft')}
                disabled={loading}
                className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 disabled:bg-yellow-400 text-white text-sm rounded-md transition-colors"
              >
                Chuyển nháp
              </button>
              <button
                onClick={() => onBulkStatusUpdate('archived')}
                disabled={loading}
                className="px-3 py-1 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white text-sm rounded-md transition-colors"
              >
                Lưu trữ
              </button>
              <button
                onClick={onBulkDelete}
                disabled={loading}
                className="px-3 py-1 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white text-sm rounded-md transition-colors"
              >
                Xóa
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
