/**
 * Hook quản lý thời gian cho IQ Test
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { getAccurateTimeElapsed } from '../../../../../utils/test-state';

interface UseIQTimerProps {
  timeLimit: number; // Thời gian giới hạn (giây)
  initialTimeElapsed?: number; // Thời gian đã trôi qua ban đầu (giây)
  onTimeUp?: () => void; // Callback khi hết thời gian
  isActive?: boolean; // Trạng thái hoạt động của timer
}

export function useIQTimer({
  timeLimit,
  initialTimeElapsed = 0,
  onTimeUp,
  isActive: initialIsActive = false
}: UseIQTimerProps) {
  // Lấy thời gian đã trôi qua chính xác nếu loading từ saved state
  const accurateInitialTime = initialTimeElapsed > 0 
    ? getAccurateTimeElapsed() 
    : initialTimeElapsed;
  
  // Đặt trạng thái với thời gian đã điều chỉnh
  const [isActive, setIsActive] = useState(initialIsActive);
  const [timeElapsed, setTimeElapsed] = useState(accurateInitialTime);
  const [startTime, setStartTime] = useState<number | null>(
    initialIsActive ? Date.now() - (accurateInitialTime * 1000) : null
  );
  const [hasTriggeredTimeUp, setHasTriggeredTimeUp] = useState(false);
  const [isTimeUp, setIsTimeUp] = useState(accurateInitialTime >= timeLimit);
  
  // Ref để lưu trữ intervalId
  const intervalRef = useRef<number | null>(null);
  // Ref để lưu trữ thời điểm cập nhật cuối cùng
  const lastUpdateRef = useRef<number>(Date.now());
  
  // Tính toán thời gian còn lại
  const timeRemaining = Math.max(0, timeLimit - timeElapsed);

  // Bắt đầu timer
  const startTimer = useCallback((startFromElapsed?: number) => {
    // Kiểm tra nếu initialTimeElapsed > 0, sử dụng thời gian chính xác từ getAccurateTimeElapsed
    let elapsed;
    if (typeof startFromElapsed === 'number' && startFromElapsed > 0) {
      const accurateTime = getAccurateTimeElapsed();
      elapsed = accurateTime > startFromElapsed ? accurateTime : startFromElapsed;
      console.log(`⏱️ Using accurate time: ${elapsed}s (was ${startFromElapsed}s)`);
    } else {
      elapsed = typeof startFromElapsed === 'number' ? startFromElapsed : timeElapsed;
    }
    
    // Tính toán startTime mới dựa trên thời gian đã trôi qua
    const newStartTime = Date.now() - (elapsed * 1000);
    lastUpdateRef.current = Date.now();
    
    setTimeElapsed(elapsed);
    setStartTime(newStartTime);
    setIsActive(true);
    setHasTriggeredTimeUp(false);
    setIsTimeUp(elapsed >= timeLimit);
    
    console.log(`⏰ Timer started with ${elapsed}s elapsed, startTime: ${new Date(newStartTime).toISOString()}`);
  }, [timeElapsed, timeLimit]);

  // Tạm dừng timer
  const pauseTimer = useCallback(() => {
    setIsActive(false);
    
    // Lưu thời gian đã trôi qua chính xác khi tạm dừng
    if (startTime) {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      setTimeElapsed(elapsed);
    }
    
    // Clear interval khi tạm dừng
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    console.log('⏸️ Timer paused');
  }, [startTime]);

  // Reset timer
  const resetTimer = useCallback(() => {
    setIsActive(false);
    setStartTime(null);
    setTimeElapsed(0);
    setHasTriggeredTimeUp(false);
    setIsTimeUp(false);
    lastUpdateRef.current = Date.now();
    
    // Clear interval khi reset
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    console.log('🔄 Timer reset');
  }, []);

  // Cập nhật thời gian đã trôi qua mỗi giây
  useEffect(() => {
    if (!isActive || !startTime) return;
    
    // Clear any existing interval
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
    }

    // Hàm cập nhật thời gian đã trôi qua
    const updateTimeElapsed = () => {
      if (startTime) {
        // Sử dụng requestAnimationFrame để đảm bảo cập nhật mượt mà
        const now = Date.now();
        const elapsed = Math.floor((now - startTime) / 1000);
        
        // Chỉ cập nhật khi có sự thay đổi thời gian
        if (elapsed !== timeElapsed) {
          setTimeElapsed(elapsed);
          lastUpdateRef.current = now;
        }
      }
    };
    
    // Cập nhật ngay lập tức lần đầu
    updateTimeElapsed();
    
    // Thiết lập interval mới để cập nhật mỗi 500ms để tăng độ chính xác
    intervalRef.current = window.setInterval(updateTimeElapsed, 500);
    
    // Thiết lập watchdog để đảm bảo timer luôn chạy
    const watchdogInterval = window.setInterval(() => {
      const now = Date.now();
      // Nếu thời gian từ lần cập nhật cuối lớn hơn 2s, đảm bảo timer được cập nhật
      if (now - lastUpdateRef.current > 2000) {
        console.log('⚠️ Timer watchdog triggered - forcing update');
        updateTimeElapsed();
      }
    }, 2000);

    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      clearInterval(watchdogInterval);
    };
  }, [isActive, startTime, timeElapsed]);

  // Xử lý khi hết thời gian
  useEffect(() => {
    if (timeElapsed >= timeLimit && isActive && !hasTriggeredTimeUp) {
      console.log('⏰ Timer: Time is up!');
      setHasTriggeredTimeUp(true);
      setIsTimeUp(true);
      setIsActive(false);
      
      // Clear interval khi hết thời gian
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      
      if (onTimeUp) {
        try {
          onTimeUp();
          console.log('✅ Timer: onTimeUp callback executed successfully');
        } catch (error) {
          console.error('❌ Timer: Error executing onTimeUp callback:', error);
        }
      }
    }
  }, [timeElapsed, timeLimit, isActive, hasTriggeredTimeUp, onTimeUp]);

  return {
    isActive,
    setIsActive,
    timeElapsed,
    setTimeElapsed,
    startTime,
    setStartTime,
    timeRemaining,
    isTimeUp,
    startTimer,
    pauseTimer,
    resetTimer
  };
} 