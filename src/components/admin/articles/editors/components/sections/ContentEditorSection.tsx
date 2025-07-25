import React, { Suspense } from 'react';
import { EditorSkeleton } from '../SkeletonComponents';

interface ContentEditorSectionProps {
  formData: any;
  shouldShowArticleSkeleton: boolean;
  setFormData: (updater: (prev: any) => any) => void;
  TiptapEditor: React.ComponentType<any>;
}

export const ContentEditorSection: React.FC<ContentEditorSectionProps> = ({
  formData,
  shouldShowArticleSkeleton,
  setFormData,
  TiptapEditor
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Nội dung bài viết</h2>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">Soạn thảo nội dung chính của bài viết</p>
            </div>
          </div>
          {/* Dynamic Stats - Only show when data loaded */}
          {!shouldShowArticleSkeleton && formData.content && (
            <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-1 bg-white/60 dark:bg-gray-800/60 px-2 py-1 rounded-md">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>{formData.content.split(' ').filter((word: string) => word.length > 0).length} từ</span>
              </div>
              <div className="flex items-center gap-1 bg-white/60 dark:bg-gray-800/60 px-2 py-1 rounded-md">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>~{Math.ceil(formData.content.split(' ').filter((word: string) => word.length > 0).length / 200)} phút đọc</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content Editor Area */}
      <div className="p-6">
        <div className="article-content-editor">
          {/* OPTIMIZED: Simplified loading - remove redundant Suspense */}
          {shouldShowArticleSkeleton ? (
            <EditorSkeleton height="600px" compact={true} />
          ) : (
            <TiptapEditor
              value={formData.content}
              onChange={(content: string) => setFormData(prev => ({ ...prev, content }))}
              placeholder="Bắt đầu viết nội dung tuyệt vời của bạn..."
              height="auto"
              flexHeight={true}
              className="focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
            />
          )}
        </div>
      </div>
    </div>
  );
};
