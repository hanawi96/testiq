/**
 * Hook quản lý các popup trong IQ Test
 */
import { useState, useCallback, useEffect } from 'react';
import type { UserInfo } from '../../../../common/popups/CongratulationsPopup';

interface UseIQPopupsProps {
  playSound?: (type: 'correct' | 'wrong' | 'warning' | 'complete') => void;
}

export function useIQPopups({ playSound }: UseIQPopupsProps = {}) {
  const [showConfetti, setShowConfetti] = useState(false);
  const [confettiTriggered, setConfettiTriggered] = useState(false);
  const [showCongratulationsPopup, setShowCongratulationsPopup] = useState(false);
  const [showTimeUpPopup, setShowTimeUpPopup] = useState(false);
  const [showProgressPopup, setShowProgressPopup] = useState(false);
  const [showCompletedTestPopup, setShowCompletedTestPopup] = useState(false);
  const [isTimeUp, setIsTimeUp] = useState(false);
  const [savedProgress, setSavedProgress] = useState(0);
  const [savedTimeRemaining, setSavedTimeRemaining] = useState(0);
  const [preloadedUserInfo, setPreloadedUserInfo] = useState<UserInfo | null>(null);
  const [isAuthenticatedUser, setIsAuthenticatedUser] = useState(false);

  // Preload thông tin người dùng
  const preloadUserProfile = useCallback(async () => {
    try {
      const { getCurrentUserInfo } = await import('../../../../../utils/test');
      const { AuthService } = await import('../../../../../../backend');
      
      // Kiểm tra nếu người dùng đã đăng nhập
      const { user } = await AuthService.getCurrentUser();
      const isAuthenticated = !!user;
      setIsAuthenticatedUser(isAuthenticated);
      
      const userInfo = await getCurrentUserInfo();
      
      if (userInfo) {
        setPreloadedUserInfo(userInfo);
        console.log('✅ User info pre-loaded successfully:', {
          name: userInfo.name,
          email: userInfo.email ? '✅ with email' : '❌ no email',
          age: userInfo.age || 'not set',
          location: userInfo.location || 'not set'
        });
      } else {
        console.log('📝 No user info found - user will need to enter info manually');
      }
    } catch (error) {
      console.warn('⚠️ Could not pre-load user info:', error);
    }
  }, []);

  // Xử lý khi hết thời gian
  const handleTimeUp = useCallback(() => {
    console.log('🔔 IQTest: handleTimeUp called');
    setIsTimeUp(true); // ✅ Đánh dấu test đã hết thời gian - không cho phép tương tác nữa
    
    // ✅ Phát âm thanh cảnh báo khi hết thời gian
    console.log('🔔 IQTest: About to play alarm bell');
    
    try {
      // ✅ FIX: Gọi playSound trước và đợi một khoảng thời gian để đảm bảo âm thanh được phát
      if (playSound) {
        playSound('warning');
      
        // ✅ FIX: Chỉ hiển thị popup sau khi đảm bảo âm thanh đã được khởi tạo
        setTimeout(() => {
          setShowTimeUpPopup(true);
          console.log('🔔 IQTest: Time up popup shown after sound initialized');
          
          // Thêm timeout để phát lại âm thanh sau một khoảng thời gian
          setTimeout(() => {
            playSound('warning');
          }, 300);
        }, 50);
      } else {
        setShowTimeUpPopup(true);
      }
    } catch (error) {
      console.error('❌ Error playing timeout sound:', error);
      // Vẫn hiển thị popup nếu có lỗi phát âm thanh
      setShowTimeUpPopup(true);
    }
    
    console.log('🔔 IQTest: handleTimeUp processing complete');
  }, [playSound]);

  // Xử lý hiệu ứng confetti
  const handleConfettiTrigger = useCallback(() => {
    if (!confettiTriggered) {
      console.log('🎉 Triggering confetti once');
      setShowConfetti(true);
      setConfettiTriggered(true);
      
      // Reset confetti state after animation
      setTimeout(() => {
        setShowConfetti(false);
      }, 1000);
    }
  }, [confettiTriggered]);

  // Reset tất cả trạng thái popup
  const resetPopupStates = useCallback(() => {
    setShowConfetti(false);
    setConfettiTriggered(false);
    setShowCongratulationsPopup(false);
    setShowTimeUpPopup(false);
    setShowProgressPopup(false);
    setShowCompletedTestPopup(false);
    setIsTimeUp(false);
    setSavedProgress(0);
    setSavedTimeRemaining(0);
  }, []);

  // Load thông tin người dùng khi component mount
  useEffect(() => {
    preloadUserProfile();
  }, [preloadUserProfile]);

  return {
    // Trạng thái
    showConfetti,
    setShowConfetti,
    confettiTriggered,
    setConfettiTriggered,
    showCongratulationsPopup,
    setShowCongratulationsPopup,
    showTimeUpPopup, 
    setShowTimeUpPopup,
    showProgressPopup,
    setShowProgressPopup,
    showCompletedTestPopup,
    setShowCompletedTestPopup,
    isTimeUp,
    setIsTimeUp,
    savedProgress,
    setSavedProgress,
    savedTimeRemaining,
    setSavedTimeRemaining,
    preloadedUserInfo,
    isAuthenticatedUser,
    
    // Methods
    handleTimeUp,
    handleConfettiTrigger,
    resetPopupStates
  };
} 