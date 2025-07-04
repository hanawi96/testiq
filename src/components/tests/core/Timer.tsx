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
  onFontSizeClick?: () => void; // Cập nhật để không cần event parameter
}

export default function Timer({ initialTime, onTimeUp, isActive, timeElapsed = 0, onFontSizeClick }: TimerProps) {
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

  // Khởi tạo trạng thái dark mode từ localStorage khi component mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldBeDark = savedTheme === 'dark' || (!savedTheme && prefersDark);
    
    setIsDarkMode(shouldBeDark);
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
      // Điều chỉnh bộ lọc với tông màu vàng ấm rất nhẹ, giảm độ đậm xuống
      root.style.setProperty('--blue-filter', 'brightness(0.98) sepia(8%) saturate(90%) hue-rotate(335deg) contrast(0.98)');
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
    return percentage > 50 ? 'text-green-600 dark:text-green-400' : 
                      percentage > 20 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400';
  }, [currentTimeLeft, initialTime]);

  // Hiệu ứng pulse khi còn ít thời gian
  const shouldPulse = currentTimeLeft <= 30;
  
  // Xử lý chuyển đổi chế độ sáng/tối
  const toggleDarkMode = () => {
    // Lấy trạng thái mới dựa trên trạng thái hiện tại
    const newDarkMode = !isDarkMode;
    
    // Lưu vào state
    setIsDarkMode(newDarkMode);
    
    // Áp dụng vào HTML và localStorage
    document.documentElement.classList.toggle('dark', newDarkMode);
    localStorage.setItem('theme', newDarkMode ? 'dark' : 'light');
    
    console.log('🌓 Timer: Toggle Dark Mode -', newDarkMode ? 'Kích hoạt chế độ tối' : 'Kích hoạt chế độ sáng');
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
      className="w-full flex justify-center relative pb-6"
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.5, type: "spring" }}
    >
      {/* Controls panel - Thời gian bên trái, các nút điều khiển bên phải */}
      <div className="w-full flex justify-between items-center px-4 md:px-8">
        {/* Timer Display with Gradient Background - Left Side */}
        <motion.div 
          key={resetKey}
          className="rounded-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 shadow-lg px-6 py-2.5 min-w-[140px] flex items-center justify-center"
          animate={{ 
            scale: shouldPulse ? [1, 1.02] : 1
          }}
          transition={{ 
            duration: 0.7, 
            repeat: shouldPulse ? Infinity : 0, 
            repeatType: "reverse" 
          }}
        >
          {/* Clock Icon - Phiên bản đẹp hơn, không có vạch chia giờ */}
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-5 w-5 mr-2 text-white" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          
          <motion.span 
            key={`time-${resetKey}`}
            className="font-bold text-base text-white"
            animate={{ 
              opacity: shouldPulse && currentTimeLeft % 2 ? 0.7 : 1
            }}
            transition={{ duration: 0.2 }}
          >
            {formatTime(currentTimeLeft)}
          </motion.span>
        </motion.div>

        {/* Control Buttons - Right Side */}
        <div className="flex items-center gap-3">
          <button 
            className="w-10 h-10 rounded-full bg-white dark:bg-gray-800 shadow-md flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors" 
            aria-label="Chuyển đổi chế độ sáng/tối"
            onClick={toggleDarkMode}
            type="button"
          >
            {isDarkMode ? (
              // Icon mặt trời (chế độ sáng)
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
              </svg>
            ) : (
              // Icon mặt trăng (chế độ tối)
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700 dark:text-gray-300" viewBox="0 0 20 20" fill="currentColor">
                <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
              </svg>
            )}
          </button>
          <button 
            className="w-10 h-10 rounded-full bg-white dark:bg-gray-800 shadow-md flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors" 
            aria-label="Bật/tắt âm thanh"
            onClick={toggleSound}
            type="button"
          >
            {isSoundOn ? (
              // Icon âm thanh bật
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700 dark:text-gray-300" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
              </svg>
            ) : (
              // Icon âm thanh tắt
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 dark:text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            )}
          </button>
          <button 
            className="w-10 h-10 rounded-full bg-white dark:bg-gray-800 shadow-md flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors" 
            aria-label="Bật/tắt bộ lọc ánh sáng xanh"
            onClick={toggleBlueFilter}
            type="button"
          >
            {isBlueFilterOn ? (
              // Icon khi bộ lọc ánh sáng xanh đang bật - màu vàng ấm (mắt được bảo vệ)
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" />
                <circle cx="12" cy="12" r="3" />
                <path d="M12 5V3" />
                <path d="M19 5l-2 2" />
                <path d="M5 5l2 2" />
                <path fill="currentColor" fillOpacity="0.2" d="M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z" />
              </svg>
            ) : (
              // Icon khi bộ lọc ánh sáng xanh đang tắt - màu xanh (mắt với tia sáng xanh)
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500 dark:text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" />
                <circle cx="12" cy="12" r="3" />
                <path d="M12 5V3" strokeDasharray="2" />
                <path d="M19 5l-2 2" strokeDasharray="2" />
                <path d="M5 5l2 2" strokeDasharray="2" />
              </svg>
            )}
          </button>
          
          {/* Font Size Button */}
          {onFontSizeClick && (
            <button 
              className="w-10 h-10 rounded-full bg-white dark:bg-gray-800 shadow-md flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors" 
              aria-label="Điều chỉnh cỡ chữ"
              onClick={onFontSizeClick} // Không cần truyền event
              title="Điều chỉnh kích thước chữ"
              type="button"
            >
              <span className="flex items-baseline">
                <span className="text-xs text-gray-700 dark:text-gray-300">A</span>
                <span className="text-base text-gray-700 dark:text-gray-300">A</span>
              </span>
            </button>
          )}
          
          <button 
            className="w-10 h-10 rounded-full bg-white dark:bg-gray-800 shadow-md flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors" 
            aria-label="Bật/tắt chế độ toàn màn hình"
            onClick={toggleFullscreen}
            type="button"
          >
            {isFullscreen ? (
              // Icon thoát toàn màn hình
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700 dark:text-gray-300" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5 4a1 1 0 00-1 1v4a1 1 0 01-2 0V5a3 3 0 013-3h4a1 1 0 010 2H5zM1 10a1 1 0 011-1h4a1 1 0 010 2H2a1 1 0 01-1-1zm14-3a1 1 0 011 1v4a1 1 0 01-2 0V8a1 1 0 011-1zm-10 9a1 1 0 00-1-1H5a1 1 0 000 2h4a1 1 0 001-1zm5-1a1 1 0 011-1h4a1 1 0 010 2h-4a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
            ) : (
              // Icon toàn màn hình
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700 dark:text-gray-300" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 01-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12zm-9 7a1 1 0 012 0v1.586l2.293-2.293a1 1 0 011.414 1.414L6.414 15H8a1 1 0 010 2H4a1 1 0 01-1-1v-4zm13-1a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 010-2h1.586l-2.293-2.293a1 1 0 011.414-1.414L15 13.586V12a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
}