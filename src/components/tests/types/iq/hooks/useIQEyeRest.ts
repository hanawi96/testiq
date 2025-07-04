import { useState, useEffect, useCallback, useRef } from 'react';
import { globalAudioContext } from './useIQSounds';

interface UseIQEyeRestProps {
  isActive: boolean; // Trạng thái hoạt động của bài test
  startTime: number | null; // Thời gian bắt đầu bài test
  restDuration?: number; // Thời gian nghỉ mắt (giây)
  isReviewMode?: boolean; // Chế độ xem lại bài làm
  timeLimit?: number; // Tổng thời gian của bài test (giây)
  timeElapsed?: number; // Thời gian đã trôi qua (giây)
  playSound?: (type: 'correct' | 'wrong' | 'warning' | 'complete') => void; // Function phát âm thanh
}

export function useIQEyeRest({
  isActive,
  startTime,
  restDuration = 30, // Mặc định nghỉ 30 giây
  isReviewMode = false, // Mặc định không phải chế độ review
  timeLimit = 0, // Tổng thời gian bài test
  timeElapsed = 0, // Thời gian đã trôi qua
  playSound // Function phát âm thanh
}: UseIQEyeRestProps) {
  // 1. Tất cả useState phải được khai báo trước
  const [showRestPopup, setShowRestPopup] = useState(false);
  const [isResting, setIsResting] = useState(false);
  const [restTimeRemaining, setRestTimeRemaining] = useState(0);
  const [lastRestTime, setLastRestTime] = useState<number | null>(null);
  const [isDisabled, setIsDisabled] = useState(false); // Trạng thái tắt hiển thị
  const [hasShownPopup, setHasShownPopup] = useState(false); // Đã hiển thị popup chưa
  const [soundPlayed, setSoundPlayed] = useState(false); // Đã phát âm thanh chưa
  
  // 2. Tất cả useRef phải được khai báo sau useState
  const halfTimePointReachedRef = useRef(false);
  const autoHideTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const prevStartTimeRef = useRef<number | null>(null); // Lưu giá trị startTime trước đó
  const playSoundRef = useRef(playSound); // Lưu tham chiếu đến playSound
  
  // Cập nhật playSoundRef khi playSound thay đổi
  useEffect(() => {
    playSoundRef.current = playSound;
  }, [playSound]);
  
  // 3. Tất cả useCallback phải được khai báo sau useRef
  const handleSkipRest = useCallback(() => {
    setShowRestPopup(false);
    setSoundPlayed(false); // Đặt lại trạng thái âm thanh khi bỏ qua nghỉ mắt
    // Cập nhật thời gian nghỉ mắt gần nhất để tính toán lần tiếp theo
    setLastRestTime(Date.now());
  }, []);

  const handleStartRest = useCallback(() => {
    // Đảm bảo popup ẩn đi ngay lập tức trước khi bắt đầu nghỉ
    setShowRestPopup(false);
    
    // Đảm bảo hasShownPopup vẫn là true để tránh hiển thị lại popup
    setHasShownPopup(true);
    halfTimePointReachedRef.current = true; // Đánh dấu đã đạt mốc 50%
    
    // Đặt timeout ngắn để đảm bảo UI đã cập nhật trước khi tiếp tục
    setTimeout(() => {
      setIsResting(true);
      setRestTimeRemaining(restDuration);
      setSoundPlayed(false); // Reset trạng thái âm thanh khi bắt đầu nghỉ mắt
      
      // Tạo interval để đếm ngược thời gian nghỉ
      const interval = setInterval(() => {
        setRestTimeRemaining(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            setIsResting(false);
            // Cập nhật thời gian nghỉ mắt gần nhất
            setLastRestTime(Date.now());
            
            // Chỉ phát âm thanh nếu chưa phát và không bị mute
            if (playSoundRef.current && !soundPlayed && !globalAudioContext.isMuted) {
              setSoundPlayed(true); // Đánh dấu đã phát âm thanh
              
              // Phát tiếng tít tít đầu tiên
              playSoundRef.current('warning');
              
              // Phát tiếng tít tít thứ hai sau 500ms
              setTimeout(() => {
                if (playSoundRef.current && !globalAudioContext.isMuted) {
                  playSoundRef.current('warning');
                }
              }, 500);
            }
            
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      return () => {
        clearInterval(interval);
      };
    }, 0);
  }, [restDuration, soundPlayed]);

  const handleDisableRest = useCallback(() => {
    setShowRestPopup(false);
    setIsDisabled(true); // Đánh dấu đã tắt hiển thị
    setLastRestTime(Date.now()); // Cũng cập nhật thời gian để tránh hiển thị lại ngay
  }, []);
  
  // 4. Tất cả useEffect phải được khai báo sau useCallback
  useEffect(() => {
    // Khi timeElapsed = 0 hoặc rất nhỏ (< 2), có khả năng là test mới được bắt đầu
    if (timeElapsed < 2) {
      setHasShownPopup(false);
      halfTimePointReachedRef.current = false;
      setIsDisabled(false); // Reset cả trạng thái disabled
    }
  }, [timeElapsed]);
  
  useEffect(() => {
    // Chỉ reset khi startTime thay đổi và khác với giá trị trước đó (test mới thực sự)
    if (startTime && startTime !== prevStartTimeRef.current && timeElapsed < 2) {
      setHasShownPopup(false);
      halfTimePointReachedRef.current = false;
      setIsDisabled(false); // Reset cả trạng thái disabled
    }
    
    // Luôn cập nhật giá trị startTime để so sánh cho lần sau
    if (startTime !== prevStartTimeRef.current) {
      prevStartTimeRef.current = startTime;
    }
  }, [startTime, timeElapsed]);
  
  useEffect(() => {
    // Khi chế độ nghỉ mắt kết thúc, đảm bảo hasShownPopup vẫn là true
    if (!isResting && halfTimePointReachedRef.current) {
      setHasShownPopup(true);
    }
  }, [isResting]);

  useEffect(() => {
    // Không hiển thị popup nghỉ mắt khi đang ở chế độ review hoặc đã tắt hiển thị hoặc đã hiển thị rồi
    if (isReviewMode || isDisabled || hasShownPopup || !timeLimit || isResting) {
      return;
    }

    // Nếu thời gian đạt 50% và chưa hiển thị popup
    const halfTimePoint = Math.floor(timeLimit / 2);
    
    if (isActive && timeElapsed >= halfTimePoint && !halfTimePointReachedRef.current) {
      setShowRestPopup(true);
      setHasShownPopup(true);
      halfTimePointReachedRef.current = true; // Đánh dấu đã đạt mốc 50%
      
      // Tự động ẩn popup sau 5 giây nếu không có tương tác
      autoHideTimeoutRef.current = setTimeout(() => {
        if (showRestPopup) {
          handleSkipRest();
        }
      }, 5000);
      
      return () => {
        if (autoHideTimeoutRef.current) {
          clearTimeout(autoHideTimeoutRef.current);
        }
      };
    }
  }, [isActive, timeElapsed, timeLimit, isResting, isReviewMode, isDisabled, hasShownPopup, showRestPopup, handleSkipRest]);

  return {
    showRestPopup,
    isResting,
    restTimeRemaining,
    handleSkipRest,
    handleStartRest,
    handleDisableRest
  };
} 