import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { useIQSounds } from '../types/iq/hooks/useIQSounds';

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
  const { playTickSound } = useIQSounds();
  
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

  // ✅ SOUND EFFECT: Phát âm thanh tít trong 10 giây cuối
  useEffect(() => {
    if (!isActive || currentTimeLeft > 10 || currentTimeLeft <= 0) return;
    
    // Phát âm thanh tít mỗi giây trong 10 giây cuối
    const tickInterval = setInterval(() => {
      if (currentTimeLeft <= 10 && currentTimeLeft > 0) {
        console.log(`⏱️ Playing tick sound at ${currentTimeLeft}s remaining`);
        playTickSound();
      }
    }, 1000);
    
    return () => clearInterval(tickInterval);
  }, [isActive, currentTimeLeft, playTickSound]);

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
    
    const bgColor = percentage > 50 ? 'bg-green-50' :
                   percentage > 20 ? 'bg-yellow-50' : 'bg-red-50';

    const shadowColor = percentage > 50 ? 'shadow-green-200' :
                       percentage > 20 ? 'shadow-yellow-200' : 'shadow-red-200';
                    
    return { 
      percentage, 
      strokeOffset, 
      colorClass, 
      ringColor, 
      circumference,
      bgColor,
      shadowColor
    };
  }, [currentTimeLeft, initialTime]);

  // Xác định xem có phải đang reset timer không
  const isReset = timeElapsed === 0 && prevTimeElapsed.current > 0;
  
  // Hiệu ứng pulse khi còn ít thời gian
  const shouldPulse = currentTimeLeft <= 30;

  return (
    <motion.div 
      className="fixed top-[90px] md:top-[90px] right-[20px] md:right-[30px] z-50"
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.5, type: "spring" }}
    >
      <motion.div 
        className={`flex items-center space-x-3 p-3 rounded-xl shadow-lg ${progressData.bgColor} ${progressData.shadowColor} border border-gray-100`}
        animate={{ 
          boxShadow: shouldPulse 
            ? ['0 4px 6px -1px rgba(0, 0, 0, 0.1)', '0 10px 15px -3px rgba(0, 0, 0, 0.2)'] 
            : '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        }}
        transition={{ 
          duration: 0.7, 
          repeat: shouldPulse ? Infinity : 0, 
          repeatType: "reverse" 
        }}
      >
        <div className="flex items-center justify-center">
          <div className="relative w-16 h-16">
            {/* Background circle */}
            <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 100 100">
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
                className={`font-bold text-base ${progressData.colorClass}`}
                animate={{ 
                  scale: currentTimeLeft <= 60 && currentTimeLeft % 2 === 0 && !isReset ? 1.1 : 1,
                  opacity: shouldPulse && currentTimeLeft % 2 ? 0.7 : 1
                }}
                transition={{ duration: 0.2 }}
              >
                {formatTime(currentTimeLeft)}
              </motion.span>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col">
          <span className={`text-xs uppercase font-semibold tracking-wider ${progressData.colorClass}`}>
            Thời gian
          </span>
          <motion.div 
            className="text-xs text-gray-500 font-medium"
            animate={{ opacity: shouldPulse ? [0.5, 1] : 1 }}
            transition={{ duration: 1, repeat: shouldPulse ? Infinity : 0, repeatType: "reverse" }}
          >
            {currentTimeLeft <= 60 ? 'Sắp hết giờ!' : 'Còn lại'}
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
}