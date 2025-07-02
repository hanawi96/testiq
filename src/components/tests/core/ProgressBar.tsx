import React, { useEffect, useRef } from 'react';
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
  const prevPercentage = useRef(percentage);
  const barRef = useRef<HTMLDivElement>(null);
  
  // Tạo key động để buộc Framer Motion render lại hoàn toàn
  const resetKey = current === 0 && prevPercentage.current > 10 ? Date.now() : 'progress';

  // Lưu lại giá trị percentage trước đó để theo dõi reset
  useEffect(() => {
    prevPercentage.current = percentage;
  }, [percentage]);
  
  return (
    <div className={`w-full ${className}`}>
      {/* Progress info */}
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-gray-700">
          Đã trả lời: {current} / {total}
        </span>
        <span className="text-sm font-medium text-primary-600">
          {Math.round(percentage)}%
        </span>
      </div>
      
      {/* Progress bar */}
      <div className="relative">
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <motion.div
            key={resetKey} /* Key đặc biệt để buộc render lại hoàn toàn khi reset */
            ref={barRef}
            className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full relative overflow-hidden"
            initial={{ width: 0 }} /* Luôn bắt đầu từ 0 khi là component mới */
            animate={{ width: `${percentage}%` }}
            transition={{ 
              type: "tween", /* Sử dụng tween thay vì spring để mượt hơn */
              duration: current === 0 ? 0 : 0.3 /* Tắt animation khi reset */
            }}
          >
            {/* Shimmer effect - chỉ hiện khi có tiến trình */}
            {percentage > 0 && (
              <motion.div
                key={`shimmer-${resetKey}`}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                animate={{ x: ['-100%', '100%'] }}
                transition={{ 
                  duration: 1.5, 
                  repeat: Infinity, 
                  ease: "linear" 
                }}
              />
            )}
          </motion.div>
        </div>
        
        {/* Step indicators */}
        {showSteps && (
          <div className="flex justify-between absolute -top-1 w-full">
            {Array.from({ length: total }, (_, index) => (
              <motion.div
                key={`step-${index}-${resetKey}`}
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
    </div>
  );
}