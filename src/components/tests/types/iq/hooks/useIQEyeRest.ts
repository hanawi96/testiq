import { useState, useEffect, useCallback } from 'react';

interface UseIQEyeRestProps {
  isActive: boolean; // Trạng thái hoạt động của bài test
  startTime: number | null; // Thời gian bắt đầu bài test
  restInterval?: number; // Thời gian làm bài liên tục trước khi hiển thị thông báo nghỉ (giây)
  restDuration?: number; // Thời gian nghỉ mắt (giây)
  isReviewMode?: boolean; // Chế độ xem lại bài làm
}

export function useIQEyeRest({
  isActive,
  startTime,
  restInterval = 10, // Thay đổi từ 600 (10 phút) xuống 10 giây để kiểm tra
  restDuration = 60, // Mặc định nghỉ 60 giây
  isReviewMode = false // Mặc định không phải chế độ review
}: UseIQEyeRestProps) {
  const [showRestPopup, setShowRestPopup] = useState(false);
  const [isResting, setIsResting] = useState(false);
  const [restTimeRemaining, setRestTimeRemaining] = useState(0);
  const [lastRestTime, setLastRestTime] = useState<number | null>(null);
  const [isDisabled, setIsDisabled] = useState(false); // Thêm trạng thái tắt hiển thị

  // Xử lý hiển thị popup nghỉ mắt sau khoảng thời gian làm bài liên tục
  useEffect(() => {
    // Không hiển thị popup nghỉ mắt khi đang ở chế độ review hoặc đã tắt hiển thị
    if (isReviewMode || isDisabled) {
      setShowRestPopup(false);
      setIsResting(false);
      return;
    }

    if (!isActive || !startTime || isResting) return;

    // Nếu đã nghỉ trước đó, tính thời gian từ lần nghỉ cuối
    const baseTime = lastRestTime || startTime;
    const timeSinceLastRest = Date.now() - baseTime;
    
    // Chỉ hiển thị popup nếu đã làm bài liên tục đủ lâu
    if (timeSinceLastRest >= restInterval * 1000) {
      console.log('👁️ Đã làm bài liên tục', Math.floor(timeSinceLastRest / 1000), 'giây, hiển thị popup nghỉ mắt');
      setShowRestPopup(true);
    } else {
      // Thiết lập timeout để hiển thị popup khi đến thời điểm
      const timeUntilRest = restInterval * 1000 - timeSinceLastRest;
      
      const timeout = setTimeout(() => {
        if (isActive && !isReviewMode && !isDisabled) {
          console.log('👁️ Đã đến thời gian nghỉ mắt, hiển thị popup');
          setShowRestPopup(true);
        }
      }, timeUntilRest);
      
      return () => clearTimeout(timeout);
    }
  }, [isActive, startTime, restInterval, lastRestTime, isResting, isReviewMode, isDisabled]);

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
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [restDuration]);

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