import React from 'react';
import { motion } from 'framer-motion';

interface ProgressBarProps {
  current: number;
  total: number;
  showSteps?: boolean;
  className?: string;
}

export default function ProgressBar({ 
  current, 
  total, 
  showSteps = false, 
  className = '' 
}: ProgressBarProps) {
  const percentage = (current / total) * 100;
  
  return (
    <div className={`w-full ${className}`}>
      {/* Progress info */}
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-gray-700">
          Câu {current} / {total}
        </span>
        <span className="text-sm font-medium text-primary-600">
          {Math.round(percentage)}%
        </span>
      </div>
      
      {/* Progress bar */}
      <div className="relative">
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full relative overflow-hidden"
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ 
              duration: 0.6, 
              ease: "easeOut",
              type: "spring",
              stiffness: 100
            }}
          >
            {/* Shimmer effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              animate={{ x: ['-100%', '100%'] }}
              transition={{ 
                duration: 1.5, 
                repeat: Infinity, 
                ease: "linear" 
              }}
            />
          </motion.div>
        </div>
        
        {/* Step indicators */}
        {showSteps && (
          <div className="flex justify-between absolute -top-1 w-full">
            {Array.from({ length: total }, (_, index) => (
              <motion.div
                key={index}
                className={`w-3 h-3 rounded-full border-2 transition-colors duration-300 ${
                  index < current
                    ? 'bg-primary-500 border-primary-500'
                    : index === current - 1
                    ? 'bg-primary-400 border-primary-400 animate-pulse'
                    : 'bg-white border-gray-300'
                }`}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.2 }}
              />
            ))}
          </div>
        )}
      </div>
      
      {/* Status message */}
      <motion.div
        className="mt-2 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        {current === total ? (
          <span className="text-green-600 font-medium text-sm">
            ✅ Hoàn thành!
          </span>
        ) : current > total * 0.8 ? (
          <span className="text-blue-600 font-medium text-sm">
            🏁 Sắp đến đích rồi!
          </span>
        ) : current > total * 0.5 ? (
          <span className="text-yellow-600 font-medium text-sm">
            💪 Đang tiến bộ tốt!
          </span>
        ) : (
          <span className="text-gray-600 text-sm">
            🚀 Cố lên nhé!
          </span>
        )}
      </motion.div>
    </div>
  );
}