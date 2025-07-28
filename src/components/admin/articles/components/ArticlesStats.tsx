import React from 'react';
import type { ArticleStats } from '../../../../../backend';
import { SkeletonStats } from '../../common/Skeleton';
import { formatNumber } from '../utils/articleHelpers';

interface ArticlesStatsProps {
  stats: ArticleStats | null;
  loading: boolean;
}

export default function ArticlesStats({ stats, loading }: ArticlesStatsProps) {
  if (loading) {
    return <SkeletonStats />;
  }

  if (!stats) {
    return null;
  }

  const statsData = [
    {
      title: 'Tổng bài viết',
      value: stats.total.toLocaleString(),
      icon: '📄',
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900/30',
      textColor: 'text-blue-600 dark:text-blue-400'
    },
    {
      title: 'Đã xuất bản',
      value: stats.published.toString(),
      icon: '✅',
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50 dark:bg-green-900/30',
      textColor: 'text-green-600 dark:text-green-400'
    },
    {
      title: 'Bài nháp',
      value: stats.draft.toString(),
      icon: '📝',
      color: 'from-yellow-500 to-yellow-600',
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/30',
      textColor: 'text-yellow-600 dark:text-yellow-400'
    },
    {
      title: 'Lượt xem',
      value: formatNumber(stats.totalViews),
      icon: '👁️',
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-900/30',
      textColor: 'text-purple-600 dark:text-purple-400'
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
      {statsData.map((stat, index) => (
        <div
          key={stat.title}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-300"
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{stat.title}</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{stat.value}</p>
            </div>
            <div className={`w-12 h-12 ${stat.bgColor} rounded-lg flex items-center justify-center ${stat.textColor}`}>
              <span className="text-2xl">{stat.icon}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
