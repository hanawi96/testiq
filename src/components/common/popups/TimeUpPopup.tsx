import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CountrySelector from '../selectors/CountrySelector';
import { validateUserInfo } from '@/utils/test-helpers';

interface UserInfo {
  name: string;
  email: string;
  age: string;
  location: string;
  countryCode?: string;
  gender?: string;
}

interface TimeUpPopupProps {
  isOpen: boolean;
  onComplete: (userInfo: UserInfo) => void;
  onRetakeTest?: () => void;
  preloadedUserInfo?: UserInfo | null;
  isAuthenticatedUser?: boolean;
}

export default function TimeUpPopup({ isOpen, onComplete, onRetakeTest, preloadedUserInfo, isAuthenticatedUser = false }: TimeUpPopupProps) {
  const [userInfo, setUserInfo] = useState<UserInfo>({ name: '', email: '', age: '', location: '', countryCode: '', gender: 'male' });
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  // Initialize with preloaded data when popup opens
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
            gender: preloadedUserInfo.gender || 'male'
          });
          console.log('✅ Using pre-loaded user info for authenticated user');
          return;
        }

        // For anonymous users, load from localStorage
        try {
          const { getAnonymousUserInfo } = await import('@/utils/test');
          const savedInfo = getAnonymousUserInfo();
          if (savedInfo) {
            setUserInfo({
              name: savedInfo.name || '',
              email: savedInfo.email || '',
              age: savedInfo.age || '',
              location: savedInfo.location || '',
              countryCode: savedInfo.countryCode || '',
              gender: savedInfo.gender || 'male'
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

  const handleSubmit = async () => {
    if (!isFormValid || isSubmitting) return;
    
    setIsSubmitting(true);

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
          country_name: userInfo.location,
          country_code: userInfo.countryCode,
          email: userInfo.email,
          gender: userInfo.gender
        });
        console.log('✅ User profile updated');
      } else {
        // Anonymous user - save to localStorage
        const { saveAnonymousUserInfo } = await import('@/utils/test');
        saveAnonymousUserInfo(userInfo);
        console.log('💾 Anonymous user info saved to localStorage');
      }
    } catch (error) {
      console.warn('⚠️ Could not save user info:', error);
    }

    // Complete test and redirect to result page
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
      
      console.log('🚀 TimeUp - Redirecting with userInfo:', userInfo);
      console.log('🔗 URL:', resultUrl.toString());
      window.location.href = resultUrl.toString();
    }
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
      const { getAnonymousUserByEmail } = await import('@/utils/test');
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
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 relative"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.1 }}
          >


            <div className="text-center mb-4">
              <div className="inline-flex items-center gap-2 mb-2">
                <span className="text-2xl">⏰</span>
                <h3 className="text-lg font-bold text-red-600 dark:text-red-500">Hết thời gian!</h3>
              </div>
              <p className="text-gray-600 dark:text-gray-300 text-xs">
                Nhập thông tin để hiển thị thành tích của bạn trên bảng xếp hạng
              </p>
            </div>
            
            <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Họ và tên <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={userInfo.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    disabled={isSubmitting}
                    className={`w-full px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none dark:bg-gray-700 dark:text-white transition-none ${
                      isSubmitting ? 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed' : ''
                    }`}
                    placeholder="Nhập họ tên của bạn"
                    style={{WebkitTapHighlightColor: 'transparent'}}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                    disabled={isSubmitting || isAuthenticatedUser}
                    className={`w-full px-3 py-3 border rounded-lg focus:outline-none transition-none ${
                      isAuthenticatedUser 
                        ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700 text-blue-800 dark:text-blue-300 cursor-not-allowed' 
                        : isSubmitting 
                          ? 'bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 cursor-not-allowed' 
                          : 'border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white'
                    }`}
                    placeholder={isAuthenticatedUser ? "Email đã được xác thực" : "Nhập email của bạn"}
                    title={isAuthenticatedUser ? "Email không thể thay đổi với tài khoản đã đăng nhập" : ""}
                    style={{WebkitTapHighlightColor: 'transparent'}}
                  />
                  
                </div>
                
                <div className="flex gap-4">
                  <div className="w-[30%]">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Tuổi <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={userInfo.age}
                      onChange={(e) => handleInputChange('age', e.target.value)}
                      disabled={isSubmitting}
                      className={`w-full px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none dark:bg-gray-700 dark:text-white transition-none ${
                        isSubmitting ? 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed' : ''
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
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Quốc gia <span className="text-red-500">*</span>
                    </label>
                    <CountrySelector
                        value={userInfo.location}
                        onChange={(countryName, countryCode) => {
                          handleInputChange('location', countryName);
                          setUserInfo(prev => ({ ...prev, countryCode: countryCode || '' }));
                        }}
                        disabled={isSubmitting}
                        placeholder="Chọn quốc gia"
                      />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                        disabled={isSubmitting}
                        className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border transition-none ${
                          userInfo.gender === option.value
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-600 dark:text-gray-300'
                        } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <span className="text-sm">{option.icon}</span>
                        <span className="text-sm font-medium">{option.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            
            <div className="flex gap-3 mt-6">
              {/* Xem kết quả button - 70% width - moved to left */}
              <button
                onClick={handleSubmit}
                disabled={!isFormValid || isSubmitting}
                className={`w-[70%] px-4 py-3 rounded-lg font-medium transition-none ${
                  isFormValid && !isSubmitting
                    ? 'bg-green-600 text-white hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 hover:shadow-lg'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                }`}
              >
                {isSubmitting ? (
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
              
              {/* Làm lại button - 30% width - moved to right */}
              {onRetakeTest && (
                <button
                  onClick={onRetakeTest}
                  disabled={isSubmitting}
                  className={`w-[30%] px-4 py-3 rounded-lg font-medium transition-none ${
                    isSubmitting
                      ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  Làm lại
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export type { UserInfo }; 