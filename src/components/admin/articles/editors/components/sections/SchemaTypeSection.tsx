import React, { startTransition } from 'react';
import { SEOSkeleton } from '../SkeletonComponents';

interface SchemaTypeSectionProps {
  formData: any;
  shouldShowSEOSkeleton: boolean;
  loadingState: any;
  setFormData: (updater: (prev: any) => any) => void;
  setHasUnsavedChanges: (hasChanges: boolean) => void;
}

const SCHEMA_TYPES = [
  { type: 'Article', name: 'Bài viết', icon: '📄', recommended: true },
  { type: 'HowTo', name: 'Hướng dẫn', icon: '📋' },
  { type: 'Review', name: 'Đánh giá', icon: '⭐' },
  { type: 'NewsArticle', name: 'Tin tức', icon: '📰' },
  { type: 'BlogPosting', name: 'Blog Post', icon: '✍️' },
  { type: 'TechArticle', name: 'Kỹ thuật', icon: '⚙️' },
  { type: 'Recipe', name: 'Công thức', icon: '👨‍🍳' },
  { type: 'FAQPage', name: 'FAQ', icon: '❓' }
];

const getSchemaIcon = (schemaType: string) => {
  const schema = SCHEMA_TYPES.find(s => s.type === schemaType);
  return schema?.icon || '📄';
};

const getSchemaDescription = (schemaType: string) => {
  switch (schemaType) {
    case 'HowTo': return 'Rich snippets với từng bước';
    case 'Review': return 'Hiển thị rating stars';
    case 'Recipe': return 'Thời gian nấu + nutrition';
    case 'NewsArticle': return 'Xuất hiện Google News';
    case 'FAQPage': return 'Dropdown Q&A trên Google';
    default: return 'Tối ưu hiển thị cơ bản';
  }
};

export const SchemaTypeSection: React.FC<SchemaTypeSectionProps> = ({
  formData,
  shouldShowSEOSkeleton,
  loadingState,
  setFormData,
  setHasUnsavedChanges
}) => {
  const handleSchemaTypeChange = (schemaType: string) => {
    startTransition(() => {
      setFormData(prev => ({ ...prev, schema_type: schemaType }));
      setHasUnsavedChanges(true);
    });
  };

  if (shouldShowSEOSkeleton) {
    return <SEOSkeleton />;
  }

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
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Schema Type</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">Tối ưu hiển thị trên Google Search</p>
            </div>
          </div>

          {/* Current Selection Display */}
          <div className="flex items-center gap-2 bg-white/60 dark:bg-gray-800/60 px-3 py-1.5 rounded-lg">
            <span className="text-lg">
              {getSchemaIcon(formData.schema_type)}
            </span>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {formData.schema_type || 'Article'}
            </span>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="p-6">
        {/* Schema Type Selector - All 8 Types Displayed */}
        <div className="space-y-3">
          {/* All Schema Types - 8 options in responsive grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {SCHEMA_TYPES.map((schema) => {
              const isSelected = formData.schema_type === schema.type;
              return (
                <button
                  key={schema.type}
                  onClick={() => handleSchemaTypeChange(schema.type)}
                  disabled={loadingState.isLoading}
                  className={`
                    relative p-3 rounded-lg border transition-all duration-200 text-center group
                    ${isSelected
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300'
                      : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-emerald-300 dark:hover:border-emerald-600'
                    }
                    ${loadingState.isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-sm'}
                  `}
                >
                  {schema.recommended && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full"></div>
                  )}

                  <div className="text-lg mb-1">{schema.icon}</div>
                  <div className="text-xs font-medium text-gray-900 dark:text-gray-100">{schema.name}</div>

                  {isSelected && (
                    <div className="absolute -top-1 -left-1">
                      <div className="w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center">
                        <svg className="w-2 h-2 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Compact Schema Info */}
        <div className="mt-4 flex items-center justify-between p-3 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <div className="text-sm font-medium text-emerald-800 dark:text-emerald-200">
                Schema: {formData.schema_type || 'Article'}
              </div>
              <div className="text-xs text-emerald-600 dark:text-emerald-400">
                {getSchemaDescription(formData.schema_type)}
              </div>
            </div>
          </div>

          {/* Quick Benefits */}
          <div className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            <span>+CTR</span>
          </div>
        </div>
      </div>
    </div>
  );
};
