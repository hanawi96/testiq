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
  // 🤖 Auto Generate Excerpt từ content
  const generateExcerpt = () => {
    if (!formData.content) {
      alert('⚠️ Vui lòng viết nội dung trước khi tạo tóm tắt');
      return;
    }

    // Strip HTML tags và lấy text thuần
    const textContent = formData.content
      .replace(/<[^>]*>/g, ' ')           // Remove HTML tags
      .replace(/\s+/g, ' ')              // Normalize whitespace
      .trim();

    if (!textContent) {
      alert('⚠️ Nội dung không có text để tạo tóm tắt');
      return;
    }

    // Tạo excerpt thông minh: lấy 2-3 câu đầu hoặc 160 ký tự
    let excerpt = '';
    const sentences = textContent.split(/[.!?]+/).filter(s => s.trim().length > 10);

    if (sentences.length >= 2) {
      // Lấy 2 câu đầu
      excerpt = sentences.slice(0, 2).join('. ').trim() + '.';
    } else {
      // Fallback: lấy 160 ký tự đầu
      excerpt = textContent.substring(0, 160).trim();
    }

    // Giới hạn 200 ký tự
    if (excerpt.length > 200) {
      excerpt = excerpt.substring(0, 197) + '...';
    }

    setFormData(prev => ({ ...prev, excerpt }));
  };
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
            {/* Auto Generate Button */}
            <button
              onClick={generateExcerpt}
              disabled={!formData.content}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Tự động tạo tóm tắt từ nội dung bài viết"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Tự động tạo
            </button>

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
