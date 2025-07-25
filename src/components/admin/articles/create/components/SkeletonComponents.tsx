/**
 * SKELETON COMPONENTS FOR ARTICLE CREATE PAGE
 * Skeleton loading components cho trang tạo bài viết mới
 */

import React from 'react';

// Base skeleton component with smooth animation
export const FieldSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 bg-[length:200%_100%] animate-[shimmer_1.5s_ease-in-out_infinite] ${className}`}></div>
);

// Title field skeleton
export const TitleFieldSkeleton: React.FC = () => (
  <div className="group">
    <div className="flex items-center gap-2 mb-3">
      <FieldSkeleton className="w-2 h-2 rounded-full" />
      <FieldSkeleton className="h-4 w-32" />
      <FieldSkeleton className="w-2 h-4" />
    </div>
    <div className="relative">
      <FieldSkeleton className="h-14 w-full rounded-xl" />
    </div>
  </div>
);

// Slug field skeleton
export const SlugFieldSkeleton: React.FC = () => (
  <div className="group">
    <div className="flex items-center gap-2 mb-3">
      <FieldSkeleton className="w-2 h-2 rounded-full" />
      <FieldSkeleton className="h-4 w-20" />
      <FieldSkeleton className="w-2 h-4" />
    </div>
    <div className="relative">
      <FieldSkeleton className="h-14 w-full rounded-xl" />
    </div>
    <div className="mt-2 flex items-center gap-1">
      <FieldSkeleton className="w-3 h-3 rounded" />
      <FieldSkeleton className="h-3 w-48" />
    </div>
  </div>
);

// Excerpt field skeleton
export const ExcerptFieldSkeleton: React.FC = () => (
  <div className="group">
    <div className="flex items-center gap-2 mb-3">
      <FieldSkeleton className="w-2 h-2 rounded-full" />
      <FieldSkeleton className="h-4 w-24" />
    </div>
    <div className="relative">
      <FieldSkeleton className="h-24 w-full rounded-xl" />
    </div>
    <div className="mt-2 flex items-center gap-1">
      <FieldSkeleton className="w-3 h-3 rounded" />
      <FieldSkeleton className="h-3 w-56" />
    </div>
  </div>
);

// Category selector skeleton
export const CategorySelectorSkeleton: React.FC = () => (
  <div className="space-y-3">
    <div className="flex items-center gap-2">
      <FieldSkeleton className="w-2 h-2 rounded-full" />
      <FieldSkeleton className="h-4 w-20" />
    </div>
    <FieldSkeleton className="h-12 w-full rounded-xl" />
    <div className="flex flex-wrap gap-2">
      <FieldSkeleton className="h-6 w-20 rounded-full" />
      <FieldSkeleton className="h-6 w-16 rounded-full" />
      <FieldSkeleton className="h-6 w-24 rounded-full" />
    </div>
  </div>
);

// Status selector skeleton
export const StatusSelectorSkeleton: React.FC = () => (
  <div>
    <FieldSkeleton className="h-4 w-20 mb-2" />
    <FieldSkeleton className="h-10 w-full rounded-md" />
  </div>
);

// Author selector skeleton
export const AuthorSelectorSkeleton: React.FC = () => (
  <div>
    <FieldSkeleton className="h-4 w-16 mb-2" />
    <div className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800">
      <div className="flex items-center gap-3">
        {/* Avatar skeleton */}
        <FieldSkeleton className="w-8 h-8 rounded-full" />
        
        {/* Author info skeleton */}
        <div className="flex-1 min-w-0 space-y-1">
          <FieldSkeleton className="h-4 w-24" />
          <FieldSkeleton className="h-3 w-20" />
        </div>
        
        {/* Dropdown arrow skeleton */}
        <FieldSkeleton className="w-4 h-4 rounded" />
      </div>
    </div>
  </div>
);

// Tags input skeleton
export const TagsInputSkeleton: React.FC = () => (
  <div>
    <FieldSkeleton className="h-4 w-12 mb-2" />
    <div className="space-y-3">
      <FieldSkeleton className="h-10 w-full rounded-xl" />
      <div className="flex flex-wrap gap-2">
        <FieldSkeleton className="h-6 w-16 rounded-full" />
        <FieldSkeleton className="h-6 w-20 rounded-full" />
        <FieldSkeleton className="h-6 w-14 rounded-full" />
      </div>
    </div>
  </div>
);

// Featured checkbox skeleton
export const FeaturedCheckboxSkeleton: React.FC = () => (
  <div className="flex items-center">
    <FieldSkeleton className="h-4 w-4 rounded" />
    <FieldSkeleton className="h-4 w-32 ml-2" />
  </div>
);

// Content editor skeleton - matches TipTap editor layout
export const ContentEditorSkeleton: React.FC = () => (
  <div className="border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900" style={{ height: '600px' }}>
    {/* Toolbar Skeleton */}
    <div className="border-b border-gray-300 dark:border-gray-600 p-3">
      <div className="flex items-center gap-2 flex-wrap">
        {Array.from({ length: 12 }, (_, i) => (
          <FieldSkeleton key={i} className="w-8 h-8 rounded" />
        ))}
      </div>
    </div>

    {/* Content Area Skeleton */}
    <div className="p-6 space-y-4">
      {Array.from({ length: 15 }, (_, i) => (
        <FieldSkeleton 
          key={i} 
          className={`h-4 ${
            i % 4 === 0 ? 'w-3/4' : 
            i % 4 === 1 ? 'w-full' : 
            i % 4 === 2 ? 'w-5/6' : 'w-2/3'
          }`} 
        />
      ))}
    </div>
  </div>
);

// Complete settings sidebar skeleton
export const SettingsSidebarSkeleton: React.FC = () => (
  <div className="space-y-6">
    {/* Settings Card Skeleton */}
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700/50 overflow-hidden">
      {/* Header Skeleton */}
      <div className="p-6 bg-gradient-to-r from-primary-50/50 to-purple-50/50 dark:from-primary-900/10 dark:to-purple-900/10 border-b border-gray-100 dark:border-gray-700/50">
        <div className="flex items-center gap-3">
          <FieldSkeleton className="w-8 h-8 rounded-xl" />
          <FieldSkeleton className="h-5 w-40" />
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="p-6 space-y-6">
        <TitleFieldSkeleton />
        <SlugFieldSkeleton />
        <ExcerptFieldSkeleton />
        <CategorySelectorSkeleton />
        <StatusSelectorSkeleton />
        <AuthorSelectorSkeleton />
        <TagsInputSkeleton />
        <FeaturedCheckboxSkeleton />
      </div>
    </div>
  </div>
);
