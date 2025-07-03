import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { useIQSounds } from '../types/iq/hooks/useIQSounds';

// Thêm CSS cho bộ lọc ánh sáng xanh
const addBlueFilterStyles = () => {
  // Kiểm tra xem style đã tồn tại chưa
  if (!document.getElementById('blue-filter-styles')) {
    const style = document.createElement('style');
    style.id = 'blue-filter-styles';
    style.innerHTML = `
      :root {
        --blue-filter: none;
      }
      
      .blue-light-filter * {
        filter: var(--blue-filter);
      }
      
      .blue-light-filter .no-filter {
        filter: none;
      }
    `;
    document.head.appendChild(style);
  }
};

interface TimerProps {
  initialTime: number; // in seconds
  onTimeUp: () => void;
  isActive: boolean;
  timeElapsed?: number; // optional: time already elapsed in seconds
}

export default function Timer({ initialTime, onTimeUp, isActive, timeElapsed = 0 }: TimerProps) {
  const [hasTriggeredTimeUp, setHasTriggeredTimeUp] = useState(false);
  const prevTimeElapsed = useRef(timeElapsed);
  const { playTickSound } = useIQSounds();
  
  // Trạng thái cho chế độ tối, âm thanh, lọc ánh sáng xanh và toàn màn hình
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isSoundOn, setIsSoundOn] = useState(true);
  const [isBlueFilterOn, setIsBlueFilterOn] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Đảm bảo thời gian hiển thị luôn được cập nhật
  const [currentTimeLeft, setCurrentTimeLeft] = useState(Math.max(0, initialTime - timeElapsed));
  
  // Tạo một key duy nhất cho component khi reset để Framer Motion tạo component hoàn toàn mới
  const resetKey = timeElapsed === 0 && prevTimeElapsed.current > 0 ? Date.now() : 'timer';

  // Thêm CSS cho bộ lọc ánh sáng xanh khi component được mount
  useEffect(() => {
    addBlueFilterStyles();
  }, []);

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
    if (!isActive || currentTimeLeft > 10 || currentTimeLeft <= 0 || !isSoundOn) return;
    
    // Phát âm thanh tít mỗi giây trong 10 giây cuối
    const tickInterval = setInterval(() => {
      if (currentTimeLeft <= 10 && currentTimeLeft > 0 && isSoundOn) {
        console.log(`⏱️ Playing tick sound at ${currentTimeLeft}s remaining`);
        playTickSound();
      }
    }, 1000);
    
    return () => clearInterval(tickInterval);
  }, [isActive, currentTimeLeft, playTickSound, isSoundOn]);

  // Hiệu ứng cập nhật thời gian hiển thị nếu đang hoạt động
  useEffect(() => {
    if (!isActive || timeLeft <= 0) return;
    
    // Tạo interval để cập nhật thời gian còn lại
    const interval = setInterval(() => {
      setCurrentTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  // Hiệu ứng áp dụng bộ lọc ánh sáng xanh
  useEffect(() => {
    const root = document.documentElement;
    if (isBlueFilterOn) {
      // Điều chỉnh bộ lọc với tông màu vàng ấm hơn
      root.style.setProperty('--blue-filter', 'brightness(0.97) sepia(35%) saturate(95%) hue-rotate(320deg) contrast(0.95)');
      document.body.classList.add('blue-light-filter');
    } else {
      root.style.setProperty('--blue-filter', 'none');
      document.body.classList.remove('blue-light-filter');
    }
  }, [isBlueFilterOn]);

  // Hiệu ứng theo dõi trạng thái toàn màn hình
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // ✅ SMART: Memoized calculations để tránh tính lại
  const colorClass = useMemo(() => {
    // Sử dụng currentTimeLeft thay vì timeLeft để đảm bảo animation mượt
    const percentage = (currentTimeLeft / initialTime) * 100;
    
    // Xác định màu sắc dựa vào phần trăm thời gian còn lại
    return percentage > 50 ? 'text-green-600' : 
                      percentage > 20 ? 'text-yellow-600' : 'text-red-600';
  }, [currentTimeLeft, initialTime]);

  // Hiệu ứng pulse khi còn ít thời gian
  const shouldPulse = currentTimeLeft <= 30;
  
  // Xử lý chuyển đổi chế độ sáng/tối
  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    // Thực hiện các thay đổi khác liên quan đến chế độ tối ở đây nếu cần
  };
  
  // Xử lý bật/tắt âm thanh
  const toggleSound = () => {
    setIsSoundOn(!isSoundOn);
  };

  // Xử lý bật/tắt bộ lọc ánh sáng xanh
  const toggleBlueFilter = () => {
    setIsBlueFilterOn(!isBlueFilterOn);
  };

  // Xử lý bật/tắt chế độ toàn màn hình
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      // Bật chế độ toàn màn hình
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Không thể vào chế độ toàn màn hình: ${err.message}`);
      });
    } else {
      // Thoát chế độ toàn màn hình
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  return (
    <motion.div 
      className="w-full flex justify-center mb-6 mt-4 relative pb-6"
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.5, type: "spring" }}
    >
      {/* Controls panel */}
      <div className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 flex items-center gap-3">
        {/* Compact Timer */}
        <motion.div 
          key={resetKey}
          className="w-auto px-3 h-10 rounded-full bg-white shadow-md flex items-center justify-center hover:bg-gray-50 transition-colors"
            animate={{ 
            scale: shouldPulse ? [1, 1.05] : 1
            }}
            transition={{ 
            duration: 0.7, 
            repeat: shouldPulse ? Infinity : 0, 
            repeatType: "reverse" 
          }}
        >
          <motion.span 
            key={`time-${resetKey}`}
            className={`font-bold text-sm ${colorClass}`}
            animate={{ 
              opacity: shouldPulse && currentTimeLeft % 2 ? 0.7 : 1
            }}
            transition={{ duration: 0.2 }}
          >
            {formatTime(currentTimeLeft)}
          </motion.span>
        </motion.div>

        <button 
          className="w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center hover:bg-gray-50 transition-colors" 
          aria-label="Chuyển đổi chế độ sáng/tối"
          onClick={toggleDarkMode}
        >
          {isDarkMode ? (
            // Icon mặt trời (chế độ sáng)
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
            </svg>
          ) : (
            // Icon mặt trăng (chế độ tối)
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700" viewBox="0 0 20 20" fill="currentColor">
              <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
            </svg>
          )}
        </button>
        <button 
          className="w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center hover:bg-gray-50 transition-colors" 
          aria-label="Bật/tắt âm thanh"
          onClick={toggleSound}
        >
          {isSoundOn ? (
            // Icon âm thanh bật
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071a1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.983 5.983 0 01-1.757 4.243a1 1 0 01-1.415-1.415A3.982 3.982 0 0013 10a3.982 3.982 0 00-1.172-2.828a1 1 0 010-1.415z" clipRule="evenodd" />
            </svg>
          ) : (
            // Icon âm thanh tắt
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM12.707 7.293a1 1 0 00-1.414 1.414L12.586 10l-1.293 1.293a1 1 0 101.414 1.414L14 11.414l1.293 1.293a1 1 0 001.414-1.414L15.414 10l1.293-1.293a1 1 0 00-1.414-1.414L14 8.586l-1.293-1.293z" clipRule="evenodd" />
            </svg>
          )}
        </button>
        <button 
          className={`w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center hover:bg-gray-50 transition-colors ${isBlueFilterOn ? 'ring-2 ring-blue-400' : ''}`}
          aria-label="Bật/tắt bộ lọc ánh sáng xanh"
          onClick={toggleBlueFilter}
        >
          {isBlueFilterOn ? (
            // Icon khi bộ lọc ánh sáng xanh đang bật
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
              <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
            </svg>
          ) : (
            // Icon khi bộ lọc ánh sáng xanh đang tắt
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
              <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
            </svg>
          )}
        </button>
        <button 
          className={`w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center hover:bg-gray-50 transition-colors ${isFullscreen ? 'ring-2 ring-purple-400' : ''}`}
          aria-label="Bật/tắt chế độ toàn màn hình"
          onClick={toggleFullscreen}
        >
          {isFullscreen ? (
            // Icon khi đang ở chế độ toàn màn hình
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-600" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5 4a1 1 0 00-1 1v4a1 1 0 01-2 0V5a3 3 0 013-3h4a1 1 0 010 2H5zm10 8a1 1 0 01-1 1h-4a1 1 0 010-2h4a1 1 0 011 1zm3-4a1 1 0 00-1-1h-4a1 1 0 010-2h4a3 3 0 013 3v4a1 1 0 01-2 0V8zM5 8a1 1 0 00-1 1v4a3 3 0 003 3h4a1 1 0 000-2H7a1 1 0 01-1-1V9a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          ) : (
            // Icon khi không ở chế độ toàn màn hình
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 01-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12zm-9 7a1 1 0 012 0v1.586l2.293-2.293a1 1 0 011.414 1.414L6.414 15H8a1 1 0 010 2H4a1 1 0 01-1-1v-4zm13-1a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 010-2h1.586l-2.293-2.293a1 1 0 011.414-1.414L15 13.586V12a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
          )}
        </button>
      </div>
    </motion.div>
  );
}