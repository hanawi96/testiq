/**
 * SKELETON COMPONENTS
 * Các skeleton loading components cho Users module
 */

import React from 'react';

// Skeleton cho table row - khớp chính xác với cấu trúc table thật
export const SkeletonTableRow: React.FC = () => (
  <tr className="animate-pulse">
    {/* Người dùng */}
    <td className="px-6 py-4">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-gray-200 dark:bg-gray-600 rounded-full"></div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-32"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-24"></div>
        </div>
      </div>
    </td>

    {/* Vai trò */}
    <td className="px-6 py-4">
      <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded-full w-20"></div>
    </td>

    {/* Trạng thái */}
    <td className="px-6 py-4">
      <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded-full w-24"></div>
    </td>

    {/* Quốc gia (hidden lg:table-cell) */}
    <td className="hidden lg:table-cell px-6 py-4">
      <div className="flex items-center space-x-2">
        <div className="w-5 h-4 bg-gray-200 dark:bg-gray-600 rounded"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-16"></div>
      </div>
    </td>

    {/* Giới tính (hidden md:table-cell) */}
    <td className="hidden md:table-cell px-6 py-4">
      <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-12"></div>
    </td>

    {/* Tuổi (hidden sm:table-cell) */}
    <td className="hidden sm:table-cell px-6 py-4">
      <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-16"></div>
    </td>

    {/* Số lần test IQ */}
    <td className="px-6 py-4">
      <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-8"></div>
    </td>

    {/* Ngày tham gia */}
    <td className="px-6 py-4">
      <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-20"></div>
    </td>

    {/* Đăng nhập cuối */}
    <td className="px-6 py-4">
      <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-20"></div>
    </td>

    {/* Hành động */}
    <td className="px-6 py-4">
      <div className="flex space-x-2">
        <div className="w-8 h-8 bg-gray-200 dark:bg-gray-600 rounded"></div>
        <div className="w-8 h-8 bg-gray-200 dark:bg-gray-600 rounded"></div>
      </div>
    </td>
  </tr>
);

// Skeleton cho stats cards - khớp với layout stats thật
export const SkeletonStatsCards: React.FC = () => (
  <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
    {[...Array(4)].map((_, index) => (
      <div key={index} className="flex items-center space-x-3 animate-pulse">
        <div className="w-5 h-5 bg-gray-200 dark:bg-gray-600 rounded"></div>
        <div className="min-w-0 flex-1">
          <div className="h-8 bg-gray-200 dark:bg-gray-600 rounded w-12 mb-1"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-20"></div>
        </div>
      </div>
    ))}
  </div>
);
