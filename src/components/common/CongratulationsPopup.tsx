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

interface CongratulationsPopupProps {
  isOpen: boolean;
  onComplete: (userInfo: UserInfo) => Promise<void>;
  onConfettiTrigger?: () => void;
  preloadedUserInfo?: UserInfo | null;
  isAuthenticatedUser?: boolean;
}

export default function CongratulationsPopup({ isOpen, onComplete, onConfettiTrigger, preloadedUserInfo, isAuthenticatedUser = false }: CongratulationsPopupProps) {
  const [userInfo, setUserInfo] = useState<UserInfo>({ name: '', email: '', age: '', location: '', countryCode: '', gender: '' });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [hasTriggeredConfetti, setHasTriggeredConfetti] = useState(false);

  const isFormValid = userInfo.name?.trim() && userInfo.email?.trim() && 
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userInfo.email?.trim() || '');

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
      const { AuthService, updateUserProfile } = await import('../../../backend');
      const { user } = await AuthService.getCurrentUser();
      
      if (user) {
        // Authenticated user - update profile
        console.log('📝 Updating user profile...');
        await updateUserProfile(user.id, {
          full_name: userInfo.name,
          age: parseInt(userInfo.age) || undefined,
          location: userInfo.location || undefined,
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
            className="bg-white rounded-3xl shadow-2xl p-8 max-w-lg w-full mx-4 border border-gray-100"
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            transition={{ duration: 0.3, type: "spring", damping: 25 }}
          >
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 mb-3">
                <span className="text-3xl">🎉</span>
                <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Hoàn thành test!
                </h3>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Họ và tên <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={userInfo.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  disabled={isAnalyzing}
                  className={`w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${
                    isAnalyzing ? 'bg-gray-100 cursor-not-allowed' : 'hover:border-gray-400'
                  }`}
                  placeholder="Nhập họ tên của bạn"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email <span className="text-red-500">*</span>
                  {isAuthenticatedUser && (
                    <span className="ml-2 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                      🔒 Tài khoản đã xác thực
                    </span>
                  )}
                </label>
                <input
                  type="email"
                  value={userInfo.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  disabled={isAnalyzing || isAuthenticatedUser}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 transition-all duration-200 ${
                    isAuthenticatedUser 
                      ? 'bg-blue-50 border-blue-200 text-blue-800 cursor-not-allowed' 
                      : isAnalyzing 
                        ? 'bg-gray-100 border-gray-300 cursor-not-allowed' 
                        : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400'
                  }`}
                  placeholder={isAuthenticatedUser ? "Email đã được xác thực" : "Nhập email của bạn"}
                  title={isAuthenticatedUser ? "Email không thể thay đổi với tài khoản đã đăng nhập" : ""}
                />
                {isAuthenticatedUser && (
                  <p className="text-xs text-blue-600 mt-1">
                    💡 Email không thể thay đổi vì bạn đã đăng nhập bằng tài khoản này
                  </p>
                )}
              </div>
              
              <div className="flex gap-4">
                <div className="w-[30%]">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tuổi
                  </label>
                  <input
                    type="number"
                    value={userInfo.age}
                    onChange={(e) => handleInputChange('age', e.target.value)}
                    disabled={isAnalyzing}
                    className={`w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${
                      isAnalyzing ? 'bg-gray-100 cursor-not-allowed' : 'hover:border-gray-400'
                    }`}
                    placeholder="Tuổi"
                    min="1"
                    max="120"
                  />
                </div>
                
                <div className="w-[70%]">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quốc gia
                  </label>
                  <CountrySelector
                    value={userInfo.location}
                    onChange={(countryName, countryCode) => {
                      handleInputChange('location', countryName);
                      setUserInfo(prev => ({ ...prev, countryCode: countryCode || '' }));
                    }}
                    disabled={isAnalyzing}
                    placeholder="Chọn quốc gia của bạn"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
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
                      disabled={isAnalyzing}
                      className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border-2 transition-all duration-200 ${
                        userInfo.gender === option.value
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300 text-gray-600'
                      } ${isAnalyzing ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}`}
                      whileHover={!isAnalyzing ? { scale: 1.02 } : {}}
                      whileTap={!isAnalyzing ? { scale: 0.98 } : {}}
                    >
                      <span className="text-sm">{option.icon}</span>
                      <span className="text-sm font-medium">{option.label}</span>
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>
            
            <motion.button
              onClick={handleSubmit}
              disabled={!isFormValid || isAnalyzing}
              className={`w-full mt-8 px-6 py-4 rounded-xl font-semibold text-lg transition-all duration-200 ${
                isFormValid && !isAnalyzing
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-xl hover:shadow-blue-500/25'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
              whileHover={isFormValid && !isAnalyzing ? { scale: 1.02, y: -2 } : {}}
              whileTap={isFormValid && !isAnalyzing ? { scale: 0.98 } : {}}
            >
              {isAnalyzing ? (
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
                  Đang phân tích kết quả...
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