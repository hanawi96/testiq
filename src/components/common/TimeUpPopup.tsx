import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CountrySelector from './CountrySelector';

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
  preloadedUserInfo?: UserInfo | null;
  isAuthenticatedUser?: boolean;
}

export default function TimeUpPopup({ isOpen, onComplete, preloadedUserInfo, isAuthenticatedUser = false }: TimeUpPopupProps) {
  const [userInfo, setUserInfo] = useState<UserInfo>({ name: '', email: '', age: '', location: '', countryCode: '', gender: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isFormValid = userInfo.name?.trim() && userInfo.email?.trim() && 
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userInfo.email?.trim() || '');

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
            gender: preloadedUserInfo.gender || ''
          });
          console.log('✅ Using pre-loaded user info for authenticated user');
          return;
        }

        // For anonymous users, load from localStorage
        try {
          const { getAnonymousUserInfo } = await import('../../utils/test');
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

  const handleSubmit = async () => {
    if (!isFormValid || isSubmitting) return;
    
    setIsSubmitting(true);

    // Save anonymous user info to localStorage (for non-authenticated users)
    try {
      const { AuthService, updateUserProfile } = await import('../../../backend');
      const { user } = await AuthService.getCurrentUser();
      
      if (user) {
        // Authenticated user - update profile
        console.log('📝 Updating user profile...');
        await updateUserProfile(user.id, {
          full_name: userInfo.name,
          age: parseInt(userInfo.age) || undefined,
          location: userInfo.location,
          country_code: userInfo.countryCode,
          email: userInfo.email
        });
        console.log('✅ User profile updated');
      } else {
        // Anonymous user - save to localStorage
        const { saveAnonymousUserInfo } = await import('../../utils/test');
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
      const { getAnonymousUserByEmail } = await import('../../utils/test');
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
        >
          <motion.div
            className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="text-center mb-4">
              <div className="inline-flex items-center gap-2 mb-2">
                <span className="text-2xl">⏰</span>
                <h3 className="text-lg font-bold text-gray-800">Hết thời gian!</h3>
              </div>
            </div>
            
            <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Họ và tên <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={userInfo.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    disabled={isSubmitting}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                      isSubmitting ? 'bg-gray-100 cursor-not-allowed' : ''
                    }`}
                    placeholder="Nhập họ tên của bạn"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email <span className="text-red-500">*</span>
                    {isAuthenticatedUser && (
                      <span className="ml-2 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                        🔒 Đã xác thực
                      </span>
                    )}
                  </label>
                  <input
                    type="email"
                    value={userInfo.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    disabled={isSubmitting || isAuthenticatedUser}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 transition-colors ${
                      isAuthenticatedUser 
                        ? 'bg-blue-50 border-blue-200 text-blue-800 cursor-not-allowed' 
                        : isSubmitting 
                          ? 'bg-gray-100 border-gray-300 cursor-not-allowed' 
                          : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                    placeholder={isAuthenticatedUser ? "Email đã được xác thực" : "Nhập email của bạn"}
                    title={isAuthenticatedUser ? "Email không thể thay đổi với tài khoản đã đăng nhập" : ""}
                  />
                  {isAuthenticatedUser && (
                    <p className="text-xs text-blue-600 mt-1">
                      💡 Email không thể thay đổi vì bạn đã đăng nhập
                    </p>
                  )}
                </div>
                
                <div className="flex gap-4">
                  <div className="w-[30%]">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tuổi
                    </label>
                    <input
                      type="number"
                      value={userInfo.age}
                      onChange={(e) => handleInputChange('age', e.target.value)}
                      disabled={isSubmitting}
                      className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                        isSubmitting ? 'bg-gray-100 cursor-not-allowed' : ''
                      }`}
                      placeholder="Tuổi"
                      min="1"
                      max="120"
                    />
                  </div>
                  
                  <div className="w-[70%]">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quốc gia
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Giới tính
                  </label>
                  <div className="flex gap-2">
                    {[
                      { value: 'male', label: 'Nam', icon: '♂️' },
                      { value: 'female', label: 'Nữ', icon: '♀️' },
                      { value: 'other', label: 'Khác', icon: '⚧️' }
                    ].map((option) => (
                      <motion.button
                        key={option.value}
                        type="button"
                        onClick={() => handleInputChange('gender', option.value)}
                        disabled={isSubmitting}
                        className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg border-2 transition-all duration-200 ${
                          userInfo.gender === option.value
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 hover:border-gray-300 text-gray-600'
                        } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}`}
                        whileHover={!isSubmitting ? { scale: 1.02 } : {}}
                        whileTap={!isSubmitting ? { scale: 0.98 } : {}}
                      >
                        <span className="text-xs">{option.icon}</span>
                        <span className="text-xs font-medium">{option.label}</span>
                      </motion.button>
                    ))}
                  </div>
                </div>
              </div>
            
            <motion.button
              onClick={handleSubmit}
              disabled={!isFormValid || isSubmitting}
              className={`w-full mt-6 px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                isFormValid && !isSubmitting
                  ? 'bg-gradient-to-r from-primary-600 to-blue-600 text-white hover:shadow-lg'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
              whileHover={isFormValid && !isSubmitting ? { scale: 1.02 } : {}}
              whileTap={isFormValid && !isSubmitting ? { scale: 0.98 } : {}}
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center">
                  <svg 
                    className="w-5 h-5 mr-2 animate-spin" 
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
                  Đang xử lý...
                </div>
              ) : (
                'Xem kết quả'
              )}
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export type { UserInfo }; 