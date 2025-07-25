import React from 'react';

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
    <>
      {showBulkActions && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
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

              {/* Close button */}
              <button
                onClick={onClearSelection}
                className="flex items-center justify-center w-8 h-8 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors ml-2"
                title="Đóng thanh công cụ"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
