import React from 'react';
import { ExcerptSkeleton } from '../SkeletonComponents';

interface ExcerptSectionProps {
  formData: any;
  shouldShowArticleSkeleton: boolean;
  setFormData: (updater: (prev: any) => any) => void;
}

export const ExcerptSection: React.FC<ExcerptSectionProps> = ({
  formData,
  shouldShowArticleSkeleton,
  setFormData
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header với màu nền nhẹ nhàng */}
      <div className="bg-gradient-to-r from-blue-50/80 via-indigo-50/60 to-purple-50/80 dark:from-blue-950/30 dark:via-indigo-950/20 dark:to-purple-950/30 px-6 py-4 border-b border-blue-100/50 dark:border-blue-900/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Icon với gradient đẹp */}
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/25">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Tóm tắt bài viết</h2>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">Mô tả ngắn gọn hiển thị trong danh sách</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-600 dark:text-gray-400 bg-white/60 dark:bg-gray-800/60 px-2 py-1 rounded-md">
              {formData.excerpt.length}/200
            </span>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="p-6">
        {/* PROGRESSIVE LOADING: Show skeleton for excerpt when loading article data */}
        {shouldShowArticleSkeleton ? (
          <ExcerptSkeleton />
        ) : (
          <div className="space-y-3">
            <textarea
              value={formData.excerpt}
              onChange={(e) => setFormData(prev => ({ ...prev, excerpt: e.target.value }))}
              placeholder="Viết tóm tắt ngắn gọn và hấp dẫn để thu hút độc giả..."
              rows={4}
              maxLength={200}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 resize-none"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Tóm tắt tốt sẽ hiển thị trong kết quả tìm kiếm và mạng xã hội
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
