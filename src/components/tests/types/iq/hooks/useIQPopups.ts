/**
 * Hook quản lý các popup trong IQ Test
 */
import { useState, useCallback, useEffect } from 'react';
import type { UserInfo } from '../../../../common/popups/CongratulationsPopup';
import { globalAudioContext } from './useIQSounds';
import { preloadTriggers } from '../../../../../utils/admin/preloaders/country-preloader';

interface UseIQPopupsProps {
  playSound?: (type: 'correct' | 'wrong' | 'warning' | 'complete') => void;
}

export function useIQPopups({ playSound }: UseIQPopupsProps = {}) {
  const [showConfetti, setShowConfetti] = useState(false);
  const [confettiTriggered, setConfettiTriggered] = useState(false);
  const [showCongratulationsPopup, setShowCongratulationsPopup] = useState(false);
  const [showTimeUpPopup, setShowTimeUpPopup] = useState(false);
  const [showProgressPopup, setShowProgressPopup] = useState(false);
  const [isTimeUp, setIsTimeUp] = useState(false);
  const [savedProgress, setSavedProgress] = useState(0);
  const [savedTimeRemaining, setSavedTimeRemaining] = useState(0);
  const [preloadedUserInfo, setPreloadedUserInfo] = useState<UserInfo | null>(null);
  const [isAuthenticatedUser, setIsAuthenticatedUser] = useState(false);

  // Preload thông tin người dùng
  const preloadUserProfile = useCallback(async () => {
    try {
      const { getCurrentUserInfo } = await import('../../../../../utils/testing/iq-test/core');
      const { AuthService } = await import('../../../../../../backend');
      
      // Kiểm tra nếu người dùng đã đăng nhập
      const { user } = await AuthService.getCurrentUser();
      const isAuthenticated = !!user;
      setIsAuthenticatedUser(isAuthenticated);
      
      const userInfo = await getCurrentUserInfo();
      
      if (userInfo) {
        setPreloadedUserInfo(userInfo);
      }
    } catch (error) {
      console.warn('⚠️ Could not pre-load user info:', error);
    }
  }, []);

  // Xử lý khi hết thời gian
  const handleTimeUp = useCallback(() => {
    setIsTimeUp(true); // ✅ Đánh dấu test đã hết thời gian - không cho phép tương tác nữa
    
    try {
      // ✅ FIX: Gọi playSound trước và đợi một khoảng thời gian để đảm bảo âm thanh được phát
      if (playSound && !globalAudioContext.isMuted) {
        playSound('warning');
      
        // ✅ FIX: Chỉ hiển thị popup sau khi đảm bảo âm thanh đã được khởi tạo
        setTimeout(() => {
          setShowTimeUpPopup(true);
          
          // Thêm timeout để phát lại âm thanh sau một khoảng thời gian
          setTimeout(() => {
            if (!globalAudioContext.isMuted) {
              playSound('warning');
            }
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
  }, [playSound]);

  // Xử lý hiệu ứng confetti
  const handleConfettiTrigger = useCallback(() => {
    if (!confettiTriggered) {
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
    setIsTimeUp(false);
    setSavedProgress(0);
    setSavedTimeRemaining(0);
  }, []);

  // Load thông tin người dùng khi component mount
  useEffect(() => {
    preloadUserProfile();
    // Trigger country data preload on app init (low priority)
    preloadTriggers.onAppInit();
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