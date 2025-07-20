/**
 * SKELETON COMPONENTS
 * Tách các skeleton loading components để dễ quản lý
 */

import React from 'react';

// Base skeleton component
export const FieldSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`animate-pulse bg-gray-200 dark:bg-gray-700 ${className}`}></div>
);

// Title section skeleton
export const TitleSkeleton: React.FC = () => (
  <div className="space-y-3">
    <FieldSkeleton className="h-4 w-24" />
    <FieldSkeleton className="h-12 w-full rounded-lg" />
  </div>
);

// Editor skeleton - matches TipTap editor layout
export const EditorSkeleton: React.FC = () => (
  <div className="border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900" style={{ height: '1000px' }}>
    {/* Toolbar Skeleton - khớp với TipTap toolbar */}
    <div className="border-b border-gray-300 dark:border-gray-600 p-3">
      <div className="flex items-center gap-2 flex-wrap">
        {Array.from({ length: 15 }, (_, i) => (
          <FieldSkeleton key={i} className="w-8 h-8 rounded" />
        ))}
      </div>
    </div>

    {/* Content Area Skeleton */}
    <div className="p-6 space-y-4">
      {Array.from({ length: 20 }, (_, i) => (
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

// Excerpt skeleton
export const ExcerptSkeleton: React.FC = () => (
  <div className="space-y-3">
    <FieldSkeleton className="h-4 w-32" />
    <FieldSkeleton className="h-24 w-full rounded-lg" />
    <FieldSkeleton className="h-3 w-48" />
  </div>
);

// SEO section skeleton
export const SEOSkeleton: React.FC = () => (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
    {/* Left side skeleton */}
    <div className="space-y-6">
      <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <FieldSkeleton className="h-6 w-24" />
          <FieldSkeleton className="h-8 w-16 rounded-full" />
        </div>
        <FieldSkeleton className="h-4 w-full mb-2" />
        <FieldSkeleton className="h-4 w-3/4" />
      </div>

      <div className="space-y-4">
        <FieldSkeleton className="h-4 w-32" />
        <FieldSkeleton className="h-3 w-full" />
        <FieldSkeleton className="h-3 w-5/6" />
        <FieldSkeleton className="h-3 w-4/5" />
      </div>
    </div>

    {/* Right side skeleton */}
    <div className="space-y-6">
      <div className="space-y-3">
        <FieldSkeleton className="h-4 w-24" />
        <FieldSkeleton className="h-10 w-full rounded-lg" />
      </div>

      <div className="space-y-3">
        <FieldSkeleton className="h-4 w-32" />
        <FieldSkeleton className="h-20 w-full rounded-lg" />
      </div>

      <div className="space-y-3">
        <FieldSkeleton className="h-4 w-28" />
        <FieldSkeleton className="h-10 w-full rounded-lg" />
      </div>
    </div>
  </div>
);

// Sidebar skeleton
export const SidebarSkeleton: React.FC = () => (
  <div className="space-y-6">
    {/* Categories skeleton */}
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      <FieldSkeleton className="h-5 w-20 mb-3" />
      <div className="space-y-2">
        <FieldSkeleton className="h-8 w-full rounded" />
        <FieldSkeleton className="h-8 w-3/4 rounded" />
      </div>
    </div>

    {/* Tags skeleton */}
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      <FieldSkeleton className="h-5 w-16 mb-3" />
      <div className="flex flex-wrap gap-2">
        <FieldSkeleton className="h-6 w-16 rounded-full" />
        <FieldSkeleton className="h-6 w-20 rounded-full" />
        <FieldSkeleton className="h-6 w-14 rounded-full" />
      </div>
    </div>

    {/* Featured Image skeleton */}
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      <FieldSkeleton className="h-5 w-24 mb-3" />
      <FieldSkeleton className="h-32 w-full rounded-lg" />
    </div>

    {/* Author skeleton */}
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      <FieldSkeleton className="h-5 w-18 mb-3" />
      <FieldSkeleton className="h-10 w-full rounded" />
    </div>
  </div>
);

// Categories dropdown skeleton
export const CategoriesSkeleton: React.FC = () => (
  <div className="space-y-3">
    <FieldSkeleton className="h-10 w-full rounded-lg" />
    <div className="flex flex-wrap gap-2">
      <FieldSkeleton className="h-6 w-20 rounded-full" />
      <FieldSkeleton className="h-6 w-16 rounded-full" />
    </div>
  </div>
);

// Tags dropdown skeleton
export const TagsSkeleton: React.FC = () => (
  <div className="space-y-3">
    <FieldSkeleton className="h-10 w-full rounded-lg" />
    <div className="flex flex-wrap gap-2">
      <FieldSkeleton className="h-6 w-14 rounded-full" />
      <FieldSkeleton className="h-6 w-18 rounded-full" />
      <FieldSkeleton className="h-6 w-16 rounded-full" />
      <FieldSkeleton className="h-6 w-20 rounded-full" />
    </div>
  </div>
);

// Authors dropdown skeleton
export const AuthorsSkeleton: React.FC = () => (
  <div className="space-y-3">
    <FieldSkeleton className="h-10 w-full rounded-lg" />
  </div>
);
