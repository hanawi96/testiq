import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';

interface TimerProps {
  initialTime: number; // in seconds
  onTimeUp: () => void;
  isActive: boolean;
  timeElapsed?: number; // optional: time already elapsed in seconds
}

export default function Timer({ initialTime, onTimeUp, isActive, timeElapsed = 0 }: TimerProps) {
  const [hasTriggeredTimeUp, setHasTriggeredTimeUp] = useState(false);
  const prevTimeElapsed = useRef(timeElapsed);
  const circleRef = useRef<SVGCircleElement>(null);
  
  // Đảm bảo thời gian hiển thị luôn được cập nhật
  const [currentTimeLeft, setCurrentTimeLeft] = useState(Math.max(0, initialTime - timeElapsed));
  
  // Tạo một key duy nhất cho component khi reset để Framer Motion tạo component hoàn toàn mới
  const resetKey = timeElapsed === 0 && prevTimeElapsed.current > 0 ? Date.now() : 'timer';

  // ✅ SINGLE SOURCE OF TRUTH: Calculate timeLeft from timeElapsed prop
  const timeLeft = Math.max(0, initialTime - timeElapsed);
  
  // Update previous timeElapsed để theo dõi reset
  useEffect(() => {
    prevTimeElapsed.current = timeElapsed;
    // Cập nhật thời gian hiện tại khi prop thay đổi
    setCurrentTimeLeft(Math.max(0, initialTime - timeElapsed));
  }, [timeElapsed, initialTime]);

  // ✅ Reset trigger flag khi restart
  useEffect(() => {
    if (timeElapsed === 0) {
      setHasTriggeredTimeUp(false);
    }
  }, [timeElapsed]);

  // ✅ SMART: Separate effect để handle time up
  useEffect(() => {
    if (timeLeft === 0 && isActive && !hasTriggeredTimeUp && timeElapsed > 0) {
      console.log('⏰ Timer: Time is up! Triggering onTimeUp callback');
      setHasTriggeredTimeUp(true);
      
      // Đảm bảo callback onTimeUp được gọi ngay lập tức
      try {
        onTimeUp();
        console.log('✅ Timer: onTimeUp callback executed successfully');
      } catch (error) {
        console.error('❌ Timer: Error executing onTimeUp callback:', error);
      }
    }
  }, [timeLeft, isActive, onTimeUp, hasTriggeredTimeUp, timeElapsed]);

  // Hiệu ứng cập nhật thời gian hiển thị nếu đang hoạt động
  useEffect(() => {
    if (!isActive || timeLeft <= 0) return;
    
    // Tạo interval để cập nhật thời gian còn lại
    const interval = setInterval(() => {
      setCurrentTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // ✅ SMART: Memoized calculations để tránh tính lại
  const progressData = useMemo(() => {
    // Sử dụng currentTimeLeft thay vì timeLeft để đảm bảo animation mượt
    const percentage = (currentTimeLeft / initialTime) * 100;
    const circumference = 2 * Math.PI * 45;
    const strokeOffset = circumference * (1 - percentage / 100);
    
    const colorClass = percentage > 50 ? 'text-green-600' : 
                      percentage > 20 ? 'text-yellow-600' : 'text-red-600';
    
    const ringColor = percentage > 50 ? 'stroke-green-500' :
                     percentage > 20 ? 'stroke-yellow-500' : 'stroke-red-500';
    
    return { percentage, strokeOffset, colorClass, ringColor, circumference };
  }, [currentTimeLeft, initialTime]);

  // Xác định xem có phải đang reset timer không
  const isReset = timeElapsed === 0 && prevTimeElapsed.current > 0;

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
            key={resetKey} /* Key đặc biệt để buộc render lại hoàn toàn khi reset */
            ref={circleRef}
            cx="50"
            cy="50"
            r="45"
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            strokeDasharray={`${progressData.circumference}`}
            strokeLinecap="round"
            className={progressData.ringColor}
            initial={{ strokeDashoffset: 0 }} /* Bắt đầu từ 0 - không animation khi tạo mới */
            animate={{ 
              strokeDashoffset: progressData.strokeOffset
            }}
            transition={{ 
              type: "tween", /* Sử dụng tween thay vì spring để mượt hơn */
              duration: timeElapsed < 2 ? 0 : 0.3, /* Tắt animation khi mới bắt đầu */
            }}
          />
        </svg>
        
        {/* Time display */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.span 
            key={`time-${resetKey}`} /* Tạo key mới cho text */
            className={`font-bold text-sm ${progressData.colorClass}`}
            animate={{ scale: currentTimeLeft <= 60 && currentTimeLeft % 2 === 0 && !isReset ? 1.1 : 1 }}
            transition={{ duration: 0.2 }}
          >
            {formatTime(currentTimeLeft)}
          </motion.span>
        </div>
      </div>
      
      {/* Warning message - chỉ hiện khi không reset và thời gian thấp */}
      {currentTimeLeft <= 300 && !isReset && (
        <motion.div
          key={`warning-${resetKey}`} /* Key mới cho warning */
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <p className={`text-xs font-medium ${progressData.colorClass}`}>
            {currentTimeLeft <= 60 ? '⚠️ Sắp hết thời gian!' : '⏰ Còn ít thời gian'}
          </p>
        </motion.div>
      )}
    </div>
  );
}