import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import UnifiedCountrySelector from '../UnifiedCountrySelector';
import { validateUserInfo } from '@/utils/testing/iq-test/helpers';

interface UserInfo {
  name: string;
  email: string;
  age: string;
  location: string;
  countryCode?: string;
  gender?: string;
}

  interface CongratulationsPopupProps {
    isOpen: boolean;
    onComplete: (userInfo: UserInfo) => Promise<void>;
    onReview?: () => void;
    onConfettiTrigger?: () => void;
    preloadedUserInfo?: UserInfo | null;
    isAuthenticatedUser?: boolean;
    remainingTimeSeconds?: number; // ✅ Thời gian còn lại (giây)
  }

  export default function CongratulationsPopup({ isOpen, onComplete, onReview, onConfettiTrigger, preloadedUserInfo, isAuthenticatedUser = false, remainingTimeSeconds }: CongratulationsPopupProps) {
  const [userInfo, setUserInfo] = useState<UserInfo>({ name: '', email: '', age: '', location: '', countryCode: '', gender: 'male' });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [hasTriggeredConfetti, setHasTriggeredConfetti] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  // ✅ SMART: Sử dụng validation function tái sử dụng được
  const isFormValid = validateUserInfo(userInfo);

  // Khởi tạo Dark Mode từ localStorage khi component mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldBeDark = savedTheme === 'dark' || (!savedTheme && prefersDark);
    
    setIsDarkMode(shouldBeDark);
  }, []);

  // ✅ Format thời gian còn lại
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Load saved user info on component mount
  useEffect(() => {
    const loadSavedUserInfo = async () => {
      if (isOpen) {
        // Try preloaded info first (for authenticated users)
        if (preloadedUserInfo) {
          setUserInfo({
            name: preloadedUserInfo.name || '',
            email: preloadedUserInfo.email || '',
            age: preloadedUserInfo.age || '',
            location: preloadedUserInfo.location || '',
            countryCode: preloadedUserInfo.countryCode || '',
            gender: preloadedUserInfo.gender || ''
          });
          console.log('✅ Using pre-loaded user info for authenticated user');
          return;
        }

        // For anonymous users, load from localStorage
        try {
          const { getAnonymousUserInfo } = await import('@/utils/testing/iq-test/core');
          const savedInfo = getAnonymousUserInfo();
          if (savedInfo) {
            setUserInfo({
              name: savedInfo.name || '',
              email: savedInfo.email || '',
              age: savedInfo.age || '',
              location: savedInfo.location || '',
              countryCode: savedInfo.countryCode || '',
              gender: savedInfo.gender || ''
            });
            console.log('✅ Loaded saved anonymous user info from localStorage');
          }
        } catch (error) {
          console.warn('⚠️ Error loading anonymous user info:', error);
        }
      }
    };

    loadSavedUserInfo();
  }, [isOpen, preloadedUserInfo]);

  // Theo dõi thay đổi chế độ tối
  useEffect(() => {
    const handleThemeChange = () => {
      const isDark = document.documentElement.classList.contains('dark');
      setIsDarkMode(isDark);
    };

    // Lắng nghe sự kiện thay đổi theme
    window.addEventListener('storage', (e) => {
      if (e.key === 'theme') {
        handleThemeChange();
      }
    });

    // Lắng nghe thay đổi từ MutationObserver
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          handleThemeChange();
        }
      });
    });

    observer.observe(document.documentElement, { attributes: true });

    return () => {
      window.removeEventListener('storage', handleThemeChange);
      observer.disconnect();
    };
  }, []);

  // Trigger confetti when popup opens
  useEffect(() => {
    if (isOpen && !hasTriggeredConfetti && onConfettiTrigger) {
      console.log('CongratulationsPopup: triggering confetti on open');
      onConfettiTrigger();
      setHasTriggeredConfetti(true);
    }
    if (!isOpen) {
      setHasTriggeredConfetti(false);
    }
  }, [isOpen, hasTriggeredConfetti, onConfettiTrigger]);

  const handleSubmit = async () => {
    if (!isFormValid || isAnalyzing) return;
    
    setIsAnalyzing(true);
    
    // Save anonymous user info to localStorage (for non-authenticated users)
    try {
      const { AuthService, updateUserProfile } = await import('@/backend');
      const { user } = await AuthService.getCurrentUser();
      
      if (user) {
        // Authenticated user - update profile
        console.log('📝 Updating user profile...');
        await updateUserProfile(user.id, {
          full_name: userInfo.name,
          age: parseInt(userInfo.age) || undefined,
          country_name: userInfo.location || undefined,
          country_code: userInfo.countryCode,
          email: userInfo.email,
          gender: userInfo.gender
        });
        console.log('✅ User profile updated');
      } else {
        // Anonymous user - save to localStorage
        const { saveAnonymousUserInfo } = await import('@/utils/testing/iq-test/core');
        saveAnonymousUserInfo(userInfo);
        console.log('💾 Anonymous user info saved to localStorage');
      }
    } catch (error) {
      console.warn('⚠️ Could not save user info:', error);
    }
    
    // Complete test and redirect to result page
    setTimeout(async () => {
      // Save result and get data
      await onComplete(userInfo);
      
      // Get saved result from localStorage
      const savedResult = localStorage.getItem('current-test-result');
      if (savedResult) {
        const result = JSON.parse(savedResult);
        
        // Create shareable URL with result data
        const resultUrl = new URL('/result', window.location.origin);
        resultUrl.searchParams.set('name', userInfo.name);
        resultUrl.searchParams.set('email', userInfo.email);
        if (userInfo.age) resultUrl.searchParams.set('age', userInfo.age);
        if (userInfo.location) resultUrl.searchParams.set('location', userInfo.location);
        resultUrl.searchParams.set('score', result.iq || result.score);
        resultUrl.searchParams.set('percentile', result.percentile);
        resultUrl.searchParams.set('accuracy', result.detailed?.accuracy || 0);
        resultUrl.searchParams.set('time', result.timeSpent);
        resultUrl.searchParams.set('classification', result.classification);
        
        console.log('🚀 Redirecting with userInfo:', userInfo);
        console.log('🔗 URL:', resultUrl.toString());
        window.location.href = resultUrl.toString();
      }
    }, 500);
  };

  const handleInputChange = (field: string, value: string) => {
    setUserInfo(prev => ({ ...prev, [field]: value }));
    
    // If email changed and we're not authenticated, try to lookup user
    if (field === 'email' && !isAuthenticatedUser && value.includes('@')) {
      handleEmailLookup(value);
    }
  };

  // Email lookup for auto-fill
  const handleEmailLookup = async (email: string) => {
    if (!email?.trim() || isAuthenticatedUser) return;
    
    try {
      const { getAnonymousUserByEmail } = await import('@/utils/testing/iq-test/core');
      const userData = await getAnonymousUserByEmail(email);
      
      if (userData) {
        console.log('🎯 Found user data for email, auto-filling...');
        setUserInfo(userData);
      }
    } catch (error) {
      console.warn('⚠️ Email lookup failed:', error);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.1 }}
        >
          <motion.div
            className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 max-w-lg w-full mx-4 border border-gray-100 dark:border-gray-700 relative"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.1, ease: "easeOut" }}
          >
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 mb-3">
                <span className="text-3xl">🎉</span>
                <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Hoàn thành test!
                </h3>
              </div>
              <p className="text-sm text-green-600 dark:text-green-400">
                Nhập thông tin để hiển thị thành tích của bạn trên bảng xếp hạng
              </p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Họ và tên <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={userInfo.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  disabled={isAnalyzing}
                  className={`w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none dark:bg-gray-700 dark:text-white transition-none ${
                    isAnalyzing ? 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed' : 'hover:border-gray-400 dark:hover:border-gray-500'
                  }`}
                  placeholder="Nhập họ tên của bạn"
                  style={{WebkitTapHighlightColor: 'transparent'}}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email <span className="text-red-500">*</span>
                  {isAuthenticatedUser && (
                    <span className="ml-2 text-xs text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-1 rounded-full">
                      🔒 Tài khoản đã xác thực
                    </span>
                  )}
                </label>
                <input
                  type="email"
                  value={userInfo.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  disabled={isAnalyzing || isAuthenticatedUser}
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none transition-none ${
                    isAuthenticatedUser 
                      ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700 text-blue-800 dark:text-blue-300 cursor-not-allowed' 
                      : isAnalyzing 
                        ? 'bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 cursor-not-allowed dark:text-gray-400' 
                        : 'border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white hover:border-gray-400 dark:hover:border-gray-500'
                  }`}
                  placeholder={isAuthenticatedUser ? "Email đã được xác thực" : "Nhập email của bạn"}
                  title={isAuthenticatedUser ? "Email không thể thay đổi với tài khoản đã đăng nhập" : ""}
                  style={{WebkitTapHighlightColor: 'transparent'}}
                />
               
              </div>
              
              <div className="flex gap-4">
                <div className="w-[30%]">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tuổi <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={userInfo.age}
                    onChange={(e) => handleInputChange('age', e.target.value)}
                    disabled={isAnalyzing}
                    className={`w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none dark:bg-gray-700 dark:text-white transition-none ${
                      isAnalyzing ? 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed' : 'hover:border-gray-400 dark:hover:border-gray-500'
                    } [&::-webkit-inner-spin-button]:opacity-100 [&::-webkit-inner-spin-button]:m-0 [&::-webkit-outer-spin-button]:opacity-100 [&::-webkit-outer-spin-button]:m-0 dark:[&::-webkit-inner-spin-button]:bg-gray-700 dark:[&::-webkit-outer-spin-button]:bg-gray-700 dark:[&::-webkit-inner-spin-button]:text-white dark:[&::-webkit-outer-spin-button]:text-white`}
                    placeholder="Tuổi"
                    min="1"
                    max="120"
                    required
                    style={{
                      colorScheme: isDarkMode ? 'dark' : 'light',
                      WebkitTapHighlightColor: 'transparent'
                    }}
                  />
                </div>
                
                <div className="w-[70%]">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Quốc gia <span className="text-red-500">*</span>
                  </label>
                  <UnifiedCountrySelector
                    value={userInfo.location}
                    onChange={(country, countryName, countryCode) => {
                      handleInputChange('location', countryName || '');
                      setUserInfo(prev => ({ ...prev, countryCode: countryCode || '' }));
                    }}
                    disabled={isAnalyzing}
                    placeholder="Chọn quốc gia của bạn"
                    variant="popup"
                    showFlag={true}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Giới tính <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  {[
                    { value: 'male', label: 'Nam', icon: '♂️' },
                    { value: 'female', label: 'Nữ', icon: '♀️' },
                    { value: 'other', label: 'Khác', icon: '⚧️' }
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleInputChange('gender', option.value)}
                      disabled={isAnalyzing}
                      className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border-2 transition-none ${
                        userInfo.gender === option.value
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-600 dark:text-gray-300'
                      } ${isAnalyzing ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                    >
                      <span className="text-sm">{option.icon}</span>
                      <span className="text-sm font-medium">{option.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 mt-8">
              {/* Xem kết quả button - 70% width - moved to left */}
              <button
                onClick={handleSubmit}
                disabled={!isFormValid || isAnalyzing}
                className={`w-[70%] px-4 py-2.5 rounded-lg font-medium transition-none ${
                  isFormValid && !isAnalyzing
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-xl hover:shadow-blue-500/25'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                }`}
              >
                {isAnalyzing ? (
                  <div className="flex items-center justify-center">
                    <svg 
                      className="w-4 h-4 mr-2 animate-spin" 
                      viewBox="0 0 24 24" 
                      fill="none"
                    >
                      <circle 
                        cx="12" 
                        cy="12" 
                        r="10" 
                        stroke="currentColor" 
                        strokeWidth="4" 
                        className="opacity-25"
                      />
                      <path 
                        fill="currentColor" 
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        className="opacity-75"
                      />
                    </svg>
                    Đang phân tích...
                  </div>
                ) : (
                  'Xem kết quả'
                )}
              </button>
              
              {/* Xem lại button - 30% width - moved to right with green background */}
              <button
                onClick={onReview}
                disabled={isAnalyzing}
                className={`w-[30%] px-4 py-2.5 rounded-lg font-medium transition-none ${
                isAnalyzing
                  ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed border border-gray-200 dark:border-gray-700'
                  : 'bg-green-600 text-white hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 hover:shadow-lg'
                }`}
              >
                Xem lại
              </button>
            </div>

            {/* ✅ Thông báo thời gian còn lại - cập nhật màu sắc cho dark mode */}
            {remainingTimeSeconds && remainingTimeSeconds > 0 && onReview && (
              <motion.div
                className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                  <span className="text-lg">✅</span>
                  <p className="text-sm font-medium">
                    Bạn đã hoàn thành bài test, thời lượng vẫn còn <span className="font-bold text-blue-800 dark:text-blue-200">{formatTime(remainingTimeSeconds)}</span>, hãy xem lại bài test để kiểm tra kết quả cho chắc chắn nếu muốn.
                  </p>
                </div>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export type { UserInfo }; 