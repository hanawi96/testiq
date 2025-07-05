import React from 'react';
import { motion } from 'framer-motion';
import { formatTime } from './utils';

interface QuickStatsProps {
  completionRate: number;
  timeTaken: number;
  correctAnswers: number;
  totalQuestions: number;
  percentile: number;
}

const QuickStats: React.FC<QuickStatsProps> = ({
  completionRate,
  timeTaken,
  correctAnswers,
  totalQuestions,
  percentile
}) => {
  const stats = [
    { label: 'Chính xác', value: `${Math.round(completionRate * 100)}%`, color: 'green', icon: '🎯' },
    { label: 'Thời gian', value: formatTime(timeTaken), color: 'blue', icon: '⏱️' },
    { label: 'Đúng/Tổng', value: `${correctAnswers}/${totalQuestions}`, color: 'purple', icon: '📊' },
    { label: 'Percentile', value: `${percentile}%`, color: 'yellow', icon: '🏆' }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-2">
      {stats.map((stat, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className={`bg-${stat.color}-50 dark:bg-${stat.color}-900/30 rounded-xl p-4 text-center`}
        >
          <div className="text-2xl mb-1">{stat.icon}</div>
          <div className={`text-lg font-bold text-${stat.color}-600 dark:text-${stat.color}-400`}>{stat.value}</div>
          <div className="text-xs text-gray-600 dark:text-gray-400">{stat.label}</div>
        </motion.div>
      ))}
    </div>
  );
};

export default QuickStats; 