import { useState, useEffect, useCallback } from 'react';

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
  const [showRestPopup, setShowRestPopup] = useState(false);
  const [isResting, setIsResting] = useState(false);
  const [restTimeRemaining, setRestTimeRemaining] = useState(0);
  const [lastRestTime, setLastRestTime] = useState<number | null>(null);
  const [isDisabled, setIsDisabled] = useState(false); // Trạng thái tắt hiển thị
  const [hasShownPopup, setHasShownPopup] = useState(false); // Đã hiển thị popup chưa
  
  // Reset hasShownPopup khi test bắt đầu lại (phát hiện qua sự thay đổi của startTime hoặc timeElapsed về 0)
  useEffect(() => {
    // Khi timeElapsed = 0 hoặc rất nhỏ (< 2), có khả năng là test mới được bắt đầu
    if (timeElapsed < 2) {
      if (hasShownPopup) {
        console.log('🔄 Reset trạng thái hasShownPopup do phát hiện test mới bắt đầu (timeElapsed = 0)');
        setHasShownPopup(false);
      }
      setIsDisabled(false); // Reset cả trạng thái disabled
    }
  }, [timeElapsed, hasShownPopup, startTime]);
  
  // Reset hasShownPopup khi startTime thay đổi (test mới bắt đầu)
  useEffect(() => {
    if (startTime && hasShownPopup) {
      console.log('🔄 Reset trạng thái hasShownPopup do startTime thay đổi');
      setHasShownPopup(false);
      setIsDisabled(false); // Reset cả trạng thái disabled
    }
  }, [startTime, hasShownPopup]);

  // Xử lý hiển thị popup nghỉ mắt tại điểm 50% thời gian
  useEffect(() => {
    // Không hiển thị popup nghỉ mắt khi đang ở chế độ review hoặc đã tắt hiển thị hoặc đã hiển thị rồi
    if (isReviewMode || isDisabled || hasShownPopup || !timeLimit) {
      return;
    }

    // Nếu thời gian đạt 50% và chưa hiển thị popup
    const halfTimePoint = Math.floor(timeLimit / 2);
    if (isActive && timeElapsed >= halfTimePoint && !isResting) {
      console.log(`👁️ Đã đạt 50% thời gian (${timeElapsed}/${timeLimit} giây), hiển thị popup nghỉ mắt`);
      setShowRestPopup(true);
      setHasShownPopup(true);
      
      // Tự động ẩn popup sau 5 giây nếu không có tương tác
      const autoHideTimeout = setTimeout(() => {
        if (showRestPopup) {
          console.log('👁️ Tự động ẩn popup nghỉ mắt sau 5 giây');
          handleSkipRest();
        }
      }, 5000);
      
      return () => clearTimeout(autoHideTimeout);
    }
  }, [isActive, timeElapsed, timeLimit, isResting, isReviewMode, isDisabled, hasShownPopup, showRestPopup]);

  // Xử lý khi người dùng bỏ qua nghỉ mắt
  const handleSkipRest = useCallback(() => {
    setShowRestPopup(false);
    // Cập nhật thời gian nghỉ mắt gần nhất để tính toán lần tiếp theo
    setLastRestTime(Date.now());
  }, []);

  // Xử lý khi người dùng bắt đầu nghỉ mắt
  const handleStartRest = useCallback(() => {
    setShowRestPopup(false);
    setIsResting(true);
    setRestTimeRemaining(restDuration);
    
    // Tạo interval để đếm ngược thời gian nghỉ
    const interval = setInterval(() => {
      setRestTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsResting(false);
          // Cập nhật thời gian nghỉ mắt gần nhất
          setLastRestTime(Date.now());
          
          // Phát 2 tiếng tít tít thông báo khi kết thúc thời gian nghỉ mắt
          if (playSound) {
            console.log('🔊 Phát âm thanh kết thúc thời gian nghỉ mắt');
            // Phát tiếng tít tít đầu tiên
            playSound('warning');
            
            // Phát tiếng tít tít thứ hai sau 500ms
            setTimeout(() => {
              playSound('warning');
            }, 500);
          }
          
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [restDuration, playSound]);

  // Xử lý khi người dùng tắt vĩnh viễn popup nghỉ mắt
  const handleDisableRest = useCallback(() => {
    console.log('👁️ Người dùng đã tắt hiển thị popup nghỉ mắt cho phiên test này');
    setShowRestPopup(false);
    setIsDisabled(true); // Đánh dấu đã tắt hiển thị
    setLastRestTime(Date.now()); // Cũng cập nhật thời gian để tránh hiển thị lại ngay
  }, []);

  return {
    showRestPopup,
    isResting,
    restTimeRemaining,
    handleSkipRest,
    handleStartRest,
    handleDisableRest
  };
} 