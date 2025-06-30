import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';

interface TimerProps {
  initialTime: number; // in seconds
  onTimeUp: () => void;
  isActive: boolean;
  timeElapsed?: number; // optional: time already elapsed in seconds
}

export default function Timer({ initialTime, onTimeUp, isActive, timeElapsed = 0 }: TimerProps) {
  const [timeLeft, setTimeLeft] = useState(initialTime - timeElapsed);

  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          onTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, onTimeUp]);

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // ✅ SMART: Memoized calculations để trigger re-render
  const progressData = useMemo(() => {
    const percentage = (timeLeft / initialTime) * 100;
    const circumference = 2 * Math.PI * 45;
    const strokeOffset = circumference * (1 - percentage / 100);
    
    const colorClass = percentage > 50 ? 'text-green-600' : 
                      percentage > 20 ? 'text-yellow-600' : 'text-red-600';
    
    const ringColor = percentage > 50 ? 'stroke-green-500' :
                     percentage > 20 ? 'stroke-yellow-500' : 'stroke-red-500';
    
    return { percentage, strokeOffset, colorClass, ringColor, circumference };
  }, [timeLeft, initialTime]);

  return (
    <div className="flex flex-col items-center space-y-2">
      <div className="relative w-20 h-20">
        {/* Background circle */}
        <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="45"
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            className="text-gray-200"
          />
          {/* Progress circle */}
          <motion.circle
            cx="50"
            cy="50"
            r="45"
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            strokeDasharray={`${progressData.circumference}`}
            strokeLinecap="round"
            className={progressData.ringColor}
            initial={{ strokeDashoffset: 0 }}
            animate={{ 
              strokeDashoffset: progressData.strokeOffset
            }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
          />
        </svg>
        
        {/* Time display */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.span 
            className={`font-bold text-sm ${progressData.colorClass}`}
            animate={{ scale: timeLeft <= 60 && timeLeft % 2 === 0 ? 1.1 : 1 }}
            transition={{ duration: 0.2 }}
          >
            {formatTime(timeLeft)}
          </motion.span>
        </div>
      </div>
      
      {/* Warning message */}
      {timeLeft <= 300 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <p className={`text-xs font-medium ${progressData.colorClass}`}>
            {timeLeft <= 60 ? '⚠️ Sắp hết thời gian!' : '⏰ Còn ít thời gian'}
          </p>
        </motion.div>
      )}
    </div>
  );
}