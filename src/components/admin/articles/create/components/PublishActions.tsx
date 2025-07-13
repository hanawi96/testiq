import React from 'react';
import type { PublishActionsProps } from '../types/articleForm';

export default function PublishActions({
  formData,
  isSubmitting,
  isDirty,
  isAutoSaving,
  lastSaved,
  onSaveDraft,
  onPublish,
  onSchedule,
  onPreview
}: PublishActionsProps) {
  return (
    <div className="flex items-center space-x-3">
      {/* Preview Button */}
      <button
        onClick={onPreview}
        disabled={isSubmitting}
        className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Xem trước
      </button>

      {/* Save Draft Button */}
      <button
        onClick={onSaveDraft}
        disabled={isSubmitting || !isDirty}
        className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? 'Đang lưu...' : 'Lưu nháp'}
      </button>

      {/* Publish Button */}
      <button
        onClick={onPublish}
        disabled={isSubmitting}
        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? 'Đang xuất bản...' : 'Xuất bản'}
      </button>
    </div>
  );
}
