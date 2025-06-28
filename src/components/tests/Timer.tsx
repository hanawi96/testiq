import React, { useState, useEffect } from 'react';
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

  const getProgressPercentage = (): number => {
    return ((initialTime - timeLeft) / initialTime) * 100;
  };

  const getColorClass = (): string => {
    const percentage = (timeLeft / initialTime) * 100;
    if (percentage > 50) return 'text-green-600';
    if (percentage > 20) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getRingColor = (): string => {
    const percentage = (timeLeft / initialTime) * 100;
    if (percentage > 50) return 'stroke-green-500';
    if (percentage > 20) return 'stroke-yellow-500';
    return 'stroke-red-500';
  };

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
            strokeDasharray={`${2 * Math.PI * 45}`}
            strokeLinecap="round"
            className={getRingColor()}
            initial={{ strokeDashoffset: 2 * Math.PI * 45 }}
            animate={{ 
              strokeDashoffset: (2 * Math.PI * 45) - (getProgressPercentage() / 100) * (2 * Math.PI * 45)
            }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
          />
        </svg>
        
        {/* Time display */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.span 
            className={`font-bold text-sm ${getColorClass()}`}
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
          <p className={`text-xs font-medium ${getColorClass()}`}>
            {timeLeft <= 60 ? '⚠️ Sắp hết thời gian!' : '⏰ Còn ít thời gian'}
          </p>
        </motion.div>
      )}
    </div>
  );
}