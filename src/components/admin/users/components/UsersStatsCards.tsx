import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { UsersService } from '../../../../../backend';
import type { UsersStats } from '../../../../../backend';

// Skeleton component for loading state
const SkeletonStatsCard = () => (
  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 animate-pulse">
    <div className="flex items-center justify-between">
      <div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 mb-2"></div>
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
      </div>
      <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
    </div>
  </div>
);

export default function UsersStatsCards() {
  const [stats, setStats] = useState<UsersStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch stats on component mount
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true);
        
        // Check for SSR initial data
        const initialStats = (window as any).__USERS_INITIAL_STATS__;
        if (initialStats) {
          console.log('✅ Using SSR initial stats data');
          setStats(initialStats);
          setIsLoading(false);
          return;
        }

        // Fallback to client-side fetch
        console.log('🔄 Fetching stats from client...');
        const response = await UsersService.getStats();
        setStats(response);
      } catch (error) {
        console.error('❌ Error fetching stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statsConfig = [
    {
      title: 'Tổng người dùng',
      value: stats?.total?.toString() || '0',
      icon: '👥',
      bgColor: 'bg-blue-50 dark:bg-blue-900/30',
      textColor: 'text-blue-600 dark:text-blue-400'
    },
    {
      title: 'Đã đăng ký',
      value: stats?.registered?.toString() || '0',
      icon: '✅',
      bgColor: 'bg-green-50 dark:bg-green-900/30',
      textColor: 'text-green-600 dark:text-green-400'
    },
    {
      title: 'Chưa đăng ký',
      value: stats?.anonymous?.toString() || '0',
      icon: '👤',
      bgColor: 'bg-orange-50 dark:bg-orange-900/30',
      textColor: 'text-orange-600 dark:text-orange-400'
    },
    {
      title: 'Đã xác thực',
      value: stats?.verified?.toString() || '0',
      icon: '🔐',
      bgColor: 'bg-purple-50 dark:bg-purple-900/30',
      textColor: 'text-purple-600 dark:text-purple-400'
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
      {!isLoading && stats ? (
        statsConfig.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow"
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
          </motion.div>
        ))
      ) : (
        // Skeleton stats cards
        <>
          <SkeletonStatsCard />
          <SkeletonStatsCard />
          <SkeletonStatsCard />
          <SkeletonStatsCard />
        </>
      )}
    </div>
  );
}
