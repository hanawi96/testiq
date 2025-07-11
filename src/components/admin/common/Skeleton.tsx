/**
 * Simple Skeleton Loading Components
 * Đơn giản, nhẹ, không phức tạp
 */

import React from 'react';

// Base skeleton
const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded ${className}`} />
);

// Stats card skeleton
export const SkeletonStats: React.FC = () => (
  <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
    {[1, 2, 3, 4].map(i => (
      <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-8 w-16" />
          </div>
          <Skeleton className="h-10 w-10 rounded-lg" />
        </div>
      </div>
    ))}
  </div>
);

// Table skeleton
export const SkeletonTable: React.FC<{ rows?: number }> = ({ rows = 10 }) => (
  <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
    {/* Header */}
    <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
      <Skeleton className="h-6 w-48" />
    </div>

    {/* Table rows */}
    <div className="divide-y divide-gray-200 dark:divide-gray-700">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="px-6 py-4">
          <div className="flex items-start space-x-4">
            <Skeleton className="h-4 w-4 mt-1" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
            <div className="hidden lg:block">
              <Skeleton className="h-4 w-24" />
            </div>
            <div className="hidden sm:block">
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
            <Skeleton className="h-6 w-16 rounded-full" />
            <div className="flex space-x-2">
              <Skeleton className="h-8 w-8" />
              <Skeleton className="h-8 w-8" />
              <Skeleton className="h-8 w-8" />
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default Skeleton;
