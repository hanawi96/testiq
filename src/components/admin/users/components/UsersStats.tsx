/**
 * USERS STATS COMPONENT
 * Component hiển thị thống kê người dùng - khớp chính xác với design trong UsersList
 */

import React from 'react';
import { motion } from 'framer-motion';
import { SkeletonStatsCards } from './SkeletonComponents';

// Type cho stats data
interface StatsData {
  total: number;
  registered: number;
  anonymous: number;
  verified: number;
}

interface UsersStatsProps {
  stats: StatsData | null;
}

export const UsersStats: React.FC<UsersStatsProps> = ({ stats }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      {stats ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              title: 'Tổng người dùng',
              value: stats.total.toString(),
              icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              ),
              color: 'text-blue-600 dark:text-blue-400'
            },
            {
              title: 'Đã đăng ký',
              value: stats.registered.toString(),
              icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ),
              color: 'text-green-600 dark:text-green-400'
            },
            {
              title: 'Chưa đăng ký',
              value: stats.anonymous.toString(),
              icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              ),
              color: 'text-orange-600 dark:text-orange-400'
            },
            {
              title: 'Đã xác thực',
              value: stats.verified.toString(),
              icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              ),
              color: 'text-purple-600 dark:text-purple-400'
            }
          ].map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center space-x-3"
            >
              <div className={`${stat.color} flex-shrink-0`}>
                {stat.icon}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 truncate">
                  {stat.title}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        // Compact skeleton loading
        <SkeletonStatsCards />
      )}
    </div>
  );
};
