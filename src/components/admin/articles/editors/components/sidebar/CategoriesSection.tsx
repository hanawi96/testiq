/**
 * CATEGORIES SECTION COMPONENT
 * Sidebar component cho category selection
 */

import React from 'react';
import type { FormData } from '../../hooks/useFormHandlers';
import type { LoadingState } from '../../utils/articleEditorHelpers';
import CategorySelector from '../../../create/components/CategorySelector';
import { CategoriesSkeleton } from '../SkeletonComponents';

interface CategoriesSectionProps {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  loadingState: LoadingState;
  shouldShowSkeleton?: boolean;
}

export const CategoriesSection: React.FC<CategoriesSectionProps> = ({
  formData,
  setFormData,
  loadingState,
  shouldShowSkeleton = false
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header với màu nền nhẹ nhàng */}
      <div className="bg-gradient-to-r from-blue-50/80 via-indigo-50/60 to-purple-50/80 dark:from-blue-950/30 dark:via-indigo-950/20 dark:to-purple-950/30 px-6 py-4 border-b border-blue-100/50 dark:border-blue-900/30">
        <div className="flex items-center gap-3">
          {/* Icon với gradient đẹp */}
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/25">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Danh mục</h3>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">Phân loại nội dung bài viết</p>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="p-6">
        {shouldShowSkeleton ? (
          <CategoriesSkeleton />
        ) : (
          <CategorySelector
            value={formData.categories}
            onChange={(categories) => setFormData(prev => ({ ...prev, categories }))}
            disabled={loadingState.isLoading}
          />
        )}
      </div>
    </div>
  );
};
