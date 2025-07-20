import React from 'react';
import { TitleSkeleton, FieldSkeleton } from '../SkeletonComponents';
import { SlugValidationSpinner } from '../LoadingStates';
import { generateSlug } from '../../../../../../utils/slug-generator';

interface TitleSectionProps {
  formData: any;
  shouldShowArticleSkeleton: boolean;
  showSlugEdit: boolean;
  setShowSlugEdit: (show: boolean) => void;
  slugError: string;
  loadingState: any;
  handleTitleChange: (title: string) => void;
  handleSlugChange: (slug: string) => void;
  validateSlug: (slug: string) => void;
  setFormData: (updater: (prev: any) => any) => void;
}

export const TitleSection: React.FC<TitleSectionProps> = ({
  formData,
  shouldShowArticleSkeleton,
  showSlugEdit,
  setShowSlugEdit,
  slugError,
  loadingState,
  handleTitleChange,
  handleSlugChange,
  validateSlug,
  setFormData
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header với màu nền nhẹ nhàng */}
      <div className="bg-gradient-to-r from-blue-50/80 via-indigo-50/60 to-purple-50/80 dark:from-blue-950/30 dark:via-indigo-950/20 dark:to-purple-950/30 px-6 py-4 border-b border-blue-100/50 dark:border-blue-900/30">
        <div className="flex items-center gap-3">
          {/* Icon với gradient đẹp */}
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/25">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 16h4M6 3v18l4-4h8a2 2 0 002-2V5a2 2 0 00-2-2H6z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Tiêu đề bài viết</h3>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">Tạo tiêu đề hấp dẫn và thu hút</p>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="p-6">
        <div className="space-y-4">
          {/* Title - Dynamic Content */}
          <div>
            {shouldShowArticleSkeleton ? (
              <TitleSkeleton />
            ) : (
              <>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Nhập tiêu đề
                  </label>
                  {formData.title && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formData.title.length}/100
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="Nhập tiêu đề hấp dẫn cho bài viết..."
                  className="w-full px-4 py-3 text-xl font-medium text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg"
                  maxLength={100}
                />
              </>
            )}
          </div>

          {/* URL Slug - Always visible inline edit */}
          <div className="mt-2">
            {shouldShowArticleSkeleton ? (
              /* Slug Skeleton */
              <div className="flex items-center gap-2">
                <FieldSkeleton className="h-4 w-8" />
                <FieldSkeleton className="h-4 w-24" />
                <FieldSkeleton className="h-4 w-32" />
              </div>
            ) : (
              <div className="group flex items-center gap-2">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">URL:</span>
                <span className="text-sm text-gray-500 dark:text-gray-400 font-mono">yoursite.com/</span>

                {showSlugEdit ? (
                /* Inline Edit Mode */
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => handleSlugChange(e.target.value)}
                    onBlur={() => setShowSlugEdit(false)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        setShowSlugEdit(false);
                      }
                      if (e.key === 'Escape') {
                        setShowSlugEdit(false);
                      }
                    }}
                    placeholder="nhap-slug-tai-day"
                    autoFocus
                    className={`px-2 py-1 text-sm font-mono bg-white dark:bg-gray-800 border rounded ${
                      slugError ? 'border-red-500 dark:border-red-400 text-red-600 dark:text-red-400' : 'border-blue-500 dark:border-blue-400 text-blue-600 dark:text-blue-400'
                    } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                    style={{ minWidth: `${Math.max((formData.slug || 'nhap-slug-tai-day').length * 8, 120)}px` }}
                  />
                  <SlugValidationSpinner isValidating={loadingState.isValidatingSlug} />
                  <button
                    onMouseDown={(e) => {
                      e.preventDefault(); // Ngăn input bị blur
                      if (!formData.title.trim()) {
                        alert('Vui lòng nhập tiêu đề trước');
                        return;
                      }
                      const newSlug = generateSlug(formData.title);
                      setFormData(prev => ({ ...prev, slug: newSlug }));
                      if (newSlug) {
                        validateSlug(newSlug);
                      }
                    }}
                    className="p-1 text-blue-600 hover:text-blue-700 dark:hover:text-blue-400"
                    title="Tạo lại từ tiêu đề"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                </div>
              ) : (
                /* Display Mode */
                <div className="flex items-center gap-1">
                  <span
                    className={`text-sm font-mono cursor-pointer hover:underline ${
                      formData.slug
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-gray-400 dark:text-gray-500 italic'
                    }`}
                    onClick={() => setShowSlugEdit(true)}
                    title="Click để chỉnh sửa"
                  >
                    {formData.slug || 'chưa-có-slug'}
                  </span>
                  <button
                    onClick={() => setShowSlugEdit(true)}
                    className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Chỉnh sửa slug"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                </div>
              )}

                {slugError && (
                  <span className="text-xs text-red-600 dark:text-red-400 ml-2">
                    • {slugError}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
