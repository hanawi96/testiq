import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface UserProfile {
  name: string;
  age: string;
  location: string;
  email?: string;
  joinDate?: string;
  totalTests?: number;
  averageScore?: number;
  bestScore?: number;
  testHistory?: any[];
  isAuthenticated?: boolean;
}

interface Props {
  initialProfile?: UserProfile;
}

// Generate avatar from name
const generateAvatar = (name: string): string => {
  const colors = [
    'bg-gradient-to-br from-blue-400 to-blue-600',
    'bg-gradient-to-br from-green-400 to-green-600', 
    'bg-gradient-to-br from-purple-400 to-purple-600',
    'bg-gradient-to-br from-pink-400 to-pink-600',
    'bg-gradient-to-br from-indigo-400 to-indigo-600',
    'bg-gradient-to-br from-yellow-400 to-orange-500',
    'bg-gradient-to-br from-red-400 to-red-600',
    'bg-gradient-to-br from-teal-400 to-cyan-600'
  ];
  
  const nameHash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[nameHash % colors.length];
};

// Get initials from name
const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .substring(0, 2)
    .toUpperCase();
};

// Enhanced loading states
const ProgressiveLoader = ({ progress }: { progress: number }) => (
  <div className="fixed top-0 left-0 right-0 z-50">
    <div className="h-1 bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-300" 
         style={{ width: `${progress}%` }} />
  </div>
);

// Optimized skeleton with better animations
const OptimizedSkeleton = ({ className = '', delay = 0 }: { className?: string; delay?: number }) => (
  <div 
    className={`bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-pulse rounded ${className}`}
    style={{ animationDelay: `${delay}ms` }}
  />
);

// Smart content loader with fade-in
const ContentLoader = ({ children, isLoading, skeleton }: { 
  children: React.ReactNode; 
  isLoading: boolean; 
  skeleton: React.ReactNode;
}) => (
  <AnimatePresence mode="wait">
    {isLoading ? (
      <motion.div
        key="skeleton"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        {skeleton}
      </motion.div>
    ) : (
      <motion.div
        key="content"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        {children}
      </motion.div>
    )}
  </AnimatePresence>
);

// Smart skeleton components
const SkeletonProfile = () => (
  <div className="bg-gradient-to-br from-indigo-50 to-purple-100 rounded-3xl p-8 text-center relative overflow-hidden">
    <div className="relative z-10">
      <div className="mb-6">
        <OptimizedSkeleton className="w-24 h-24 rounded-full mx-auto" />
      </div>
      <div className="mb-6">
        <OptimizedSkeleton className="h-8 w-48 mx-auto mb-2" delay={100} />
        <div className="flex items-center justify-center space-x-4">
          <OptimizedSkeleton className="h-4 w-20" delay={200} />
          <OptimizedSkeleton className="h-4 w-16" delay={300} />
          <OptimizedSkeleton className="h-4 w-24" delay={400} />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white/70 backdrop-blur-sm rounded-xl p-4">
            <OptimizedSkeleton className="h-6 w-8 mx-auto mb-1" delay={i * 100} />
            <OptimizedSkeleton className="h-3 w-12 mx-auto" delay={i * 100 + 50} />
          </div>
        ))}
      </div>
    </div>
  </div>
);

const SkeletonTestList = () => (
  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
    <div className="flex items-center justify-between mb-6">
      <OptimizedSkeleton className="h-6 w-40" />
      <OptimizedSkeleton className="h-8 w-24 rounded-xl" delay={100} />
    </div>
    <div className="space-y-3">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="p-4 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <OptimizedSkeleton className="w-12 h-12 rounded-full" delay={i * 100} />
              <div className="space-y-2">
                <OptimizedSkeleton className="w-32 h-4" delay={i * 100 + 50} />
                <OptimizedSkeleton className="w-24 h-3" delay={i * 100 + 100} />
              </div>
            </div>
            <div className="text-right space-y-1">
              <OptimizedSkeleton className="w-12 h-6" delay={i * 100 + 150} />
              <OptimizedSkeleton className="w-8 h-3" delay={i * 100 + 200} />
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const SkeletonPersonalInfo = () => (
  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
    <OptimizedSkeleton className="h-6 w-32 mb-6" />
    <div className="grid md:grid-cols-2 gap-6">
      {[...Array(2)].map((col) => (
        <div key={col} className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl">
              <OptimizedSkeleton className="w-10 h-10 rounded-full" delay={col * 200 + i * 100} />
              <div className="space-y-2">
                <OptimizedSkeleton className="w-16 h-3" delay={col * 200 + i * 100 + 50} />
                <OptimizedSkeleton className="w-24 h-4" delay={col * 200 + i * 100 + 100} />
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  </div>
);

const ProfileComponent: React.FC<Props> = ({ initialProfile }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [dataReady, setDataReady] = useState(false);
  
  // 🚀 CLEAN INIT: Always start fresh, load from correct source based on auth
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    return initialProfile || {
      name: 'Người dùng',
      age: '',
      location: '',
      totalTests: 0,
      averageScore: 0,
      bestScore: 0,
      testHistory: [],
      isAuthenticated: false
    };
  });
  
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(initialProfile?.isAuthenticated || null);

  // Memoized calculations
  const profileStats = useMemo(() => {
    if (!userProfile.testHistory?.length) return { average: 0, best: 0, joinDate: new Date().toLocaleDateString('vi-VN') };
    
    const scores = userProfile.testHistory.map(test => test.iq || 0);
    const average = Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
    const best = Math.max(...scores);
    
    const oldestTest = userProfile.testHistory[userProfile.testHistory.length - 1];
    const joinDate = oldestTest?.timestamp 
      ? new Date(oldestTest.timestamp).toLocaleDateString('vi-VN')
      : new Date().toLocaleDateString('vi-VN');
    
    return { average, best, joinDate };
  }, [userProfile.testHistory]);

  // 💯 SMART DATA LOADING: Auth-first, then fallback (page reload on auth change)
  useEffect(() => {
    let isMounted = true;
    
    const loadDataSmartly = async () => {
      try {
        setLoadingProgress(20);

        // 1️⃣ Load modules
        const [testUtils, backend] = await Promise.all([
          import('@/utils/test'),
          import('@/backend').catch(() => null)
        ]);
        
        setLoadingProgress(40);

        // 2️⃣ Check authentication status
        const isAuth = await (backend?.AuthService?.getCurrentUser?.()
          .then(result => !!result?.user)
          .catch(() => false)) || false;

        if (!isMounted) return;
        setIsAuthenticated(isAuth);
        setLoadingProgress(60);

        // 3️⃣ Load data based on auth - PRIORITY: Database > localStorage
        let profileData: UserProfile = {
          name: 'Người dùng',
          age: '',
          location: '',
          totalTests: 0,
          averageScore: 0,
          bestScore: 0,
          testHistory: [],
          isAuthenticated: isAuth
        };

        if (isAuth && backend) {
          // 🔥 AUTHENTICATED: Only use database data
          console.log('🔐 Loading from DATABASE (authenticated user)');
          try {
            // Get user data first, then profile
            const currentUser = await backend.AuthService.getCurrentUser();
            const userId = currentUser?.user?.id;
            
            if (!userId) {
              throw new Error('No user ID found');
            }
            
            const [profileResult, historyResult] = await Promise.all([
              backend.getUserProfile?.(userId),
              testUtils.getUserRealTestHistory?.()
            ]);

            if (profileResult?.success && profileResult.data) {
              const profile = profileResult.data;
              const user = currentUser?.user;
              
              profileData = {
                name: profile.full_name || user?.email?.split('@')[0] || 'Người dùng',
                age: profile.age?.toString() || '',
                location: profile.location || '',
                email: profile.email || user?.email || '',
                totalTests: historyResult?.length || 0,
                averageScore: 0,
                bestScore: 0,
                testHistory: historyResult || [],
                isAuthenticated: true
              };
              
              console.log('💾 Database profile loaded:', {
                name: profileData.name,
                email: profileData.email,
                tests: profileData.totalTests
              });
            } else {
              // Fallback to basic auth info if no profile exists
              const user = currentUser?.user;
              profileData = {
                name: user?.email?.split('@')[0] || 'Người dùng',
                age: '',
                location: '',
                email: user?.email || '',
                totalTests: historyResult?.length || 0,
                averageScore: 0,
                bestScore: 0,
                testHistory: historyResult || [],
                isAuthenticated: true
              };
              
              console.log('📧 Using auth fallback data:', {
                name: profileData.name,
                email: profileData.email,
                tests: profileData.totalTests
              });
            }
          } catch (error) {
            console.error('❌ Database load failed:', error);
          }
        } else {
          // 📱 ANONYMOUS: Use localStorage only
          console.log('📱 Loading from LOCALSTORAGE (anonymous user)');
          try {
            const [freshHistory, freshUserInfo] = await Promise.all([
              testUtils.getUserRealTestHistory?.() || [],
              testUtils.getAnonymousUserInfo?.() || null
            ]);

            profileData = {
              name: freshUserInfo?.name || 'Người dùng',
              age: freshUserInfo?.age || '',
              location: freshUserInfo?.location || '',
              totalTests: freshHistory?.length || 0,
              averageScore: 0,
              bestScore: 0,
              testHistory: freshHistory || [],
              isAuthenticated: false
            };
          } catch (error) {
            console.warn('⚠️ LocalStorage load failed:', error);
          }
        }

        if (!isMounted) return;
        
        console.log('✅ Profile loaded:', {
          source: isAuth ? 'DATABASE' : 'LOCALSTORAGE',
          authenticated: isAuth,
          name: profileData.name,
          totalTests: profileData.totalTests,
          testHistory: profileData.testHistory?.length || 0
        });
        setUserProfile(profileData);
        setLoadingProgress(100);
        setDataReady(true);

      } catch (error) {
        console.error('💥 Profile loading failed:', error);
        setLoadingProgress(100);
        setDataReady(true);
      }
    };

    // Start loading after smooth delay
    const timer = setTimeout(loadDataSmartly, 300);
    
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, []);

  // Optimized helper functions with memoization
  const formatTimeDisplay = useCallback((totalSeconds: number): string => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    
    if (minutes > 0 && seconds > 0) return `${minutes} phút ${seconds} giây`;
    if (minutes > 0) return `${minutes} phút`;
    return `${seconds} giây`;
  }, []);

  const getTimeAgo = useCallback((date: Date): string => {
    const diffDays = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Hôm nay';
    if (diffDays === 1) return 'Hôm qua';
    if (diffDays < 7) return `${diffDays} ngày trước`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} tuần trước`;
    return `${Math.floor(diffDays / 30)} tháng trước`;
  }, []);

  const getIQColor = useCallback((iq: number) => {
    if (iq >= 140) return { bg: 'bg-gradient-to-br from-purple-100 to-purple-200', text: 'text-purple-700' };
    if (iq >= 130) return { bg: 'bg-gradient-to-br from-indigo-100 to-indigo-200', text: 'text-indigo-700' };
    if (iq >= 120) return { bg: 'bg-gradient-to-br from-blue-100 to-blue-200', text: 'text-blue-700' };
    if (iq >= 110) return { bg: 'bg-gradient-to-br from-green-100 to-green-200', text: 'text-green-700' };
    if (iq >= 90) return { bg: 'bg-gradient-to-br from-yellow-100 to-yellow-200', text: 'text-yellow-700' };
    return { bg: 'bg-gradient-to-br from-orange-100 to-orange-200', text: 'text-orange-700' };
  }, []);

  const HeroSection = () => (
    <div className="bg-gradient-to-br from-indigo-50 to-purple-100 rounded-3xl p-8 text-center relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-400/10 to-purple-400/10"></div>
      <div className="relative z-10">
        {/* Avatar */}
        <div className="mb-6">
          <div className={`w-24 h-24 rounded-full ${generateAvatar(userProfile.name)} flex items-center justify-center text-white text-2xl font-bold mx-auto shadow-lg`}>
            {getInitials(userProfile.name)}
          </div>
        </div>

        {/* User Info */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            {userProfile.name}
          </h1>
          <div className="flex items-center justify-center space-x-4 text-sm text-gray-600">
            {userProfile.age && (
              <span className="flex items-center">
                <span className="mr-1">🎂</span>
                {userProfile.age} tuổi
              </span>
            )}
            {userProfile.location && (
              <span className="flex items-center">
                <span className="mr-1">📍</span>
                {userProfile.location}
              </span>
            )}
            <span className="flex items-center">
              <span className="mr-1">📅</span>
              Tham gia {profileStats.joinDate}
            </span>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
          <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4">
            <div className="text-2xl font-bold text-blue-600">{userProfile.totalTests || 0}</div>
            <div className="text-xs text-gray-600">Bài test</div>
          </div>
          <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4">
            <div className="text-2xl font-bold text-green-600">{profileStats.average || 0}</div>
            <div className="text-xs text-gray-600">Điểm TB</div>
          </div>
          <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4">
            <div className="text-2xl font-bold text-purple-600">{profileStats.best || 0}</div>
            <div className="text-xs text-gray-600">Tốt nhất</div>
          </div>
        </div>
      </div>
    </div>
  );

  const AnonymousUserWarning = () => (
    isAuthenticated === false && (
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
        <div className="flex items-center space-x-3">
          <svg className="w-6 h-6 text-amber-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.232 15.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <div className="flex-1">
            <h4 className="font-semibold text-amber-800 mb-1">⚠️ Tài khoản tạm thời</h4>
            <p className="text-sm text-amber-700 mb-3">
              Dữ liệu profile và kết quả test của bạn chỉ được lưu trên thiết bị này. 
              Khi xóa dữ liệu trình duyệt, mọi thông tin sẽ bị mất vĩnh viễn.
            </p>
            <button 
              onClick={() => window.location.href = '/admin/login'}
              className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors text-sm font-medium"
            >
              🔐 Đăng ký tài khoản để lưu dữ liệu
            </button>
          </div>
        </div>
      </div>
    )
  );

  const PersonalInfo = () => (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
        <span className="mr-2">👤</span>
        Thông tin cá nhân
      </h3>
      
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600">🏷️</span>
            </div>
            <div>
              <div className="text-sm text-gray-500">Tên</div>
              <div className="font-semibold text-gray-900">{userProfile.name}</div>
            </div>
          </div>

          {userProfile.age && (
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600">🎂</span>
              </div>
              <div>
                <div className="text-sm text-gray-500">Tuổi</div>
                <div className="font-semibold text-gray-900">{userProfile.age} tuổi</div>
              </div>
            </div>
          )}

          {userProfile.location && (
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-purple-600">📍</span>
              </div>
              <div>
                <div className="text-sm text-gray-500">Địa điểm</div>
                <div className="font-semibold text-gray-900">{userProfile.location}</div>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl">
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
              <span className="text-orange-600">📅</span>
            </div>
            <div>
              <div className="text-sm text-gray-500">Ngày tham gia</div>
              <div className="font-semibold text-gray-900">{profileStats.joinDate}</div>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <span className="text-red-600">🎯</span>
            </div>
            <div>
              <div className="text-sm text-gray-500">Trạng thái</div>
              <div className="font-semibold text-green-600">Đang hoạt động</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const RecentTestsOverview = () => (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-gray-900 flex items-center">
          <span className="mr-2">📝</span>
          10 bài test gần nhất
        </h3>
        {(userProfile.testHistory?.length || 0) > 0 && (
          <button 
            onClick={() => window.location.href = '/test-history'}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg text-sm font-medium"
          >
            <span>Xem tất cả</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>
      
      <ContentLoader
        isLoading={!dataReady && (!userProfile.testHistory || userProfile.testHistory.length === 0)}
        skeleton={<SkeletonTestList />}
      >
        {(userProfile.testHistory?.length || 0) > 0 ? (
          <div className="space-y-3">
            {(userProfile.testHistory || []).slice(0, 10).map((test, index) => {
              const date = test.timestamp ? new Date(test.timestamp) : new Date();
              const timeAgo = getTimeAgo(date);
              const iqColor = getIQColor(test.iq);
              const testNumber = (userProfile.testHistory?.length || 0) - index;
              
              return (
                <motion.div 
                  key={`${test.timestamp || index}-${test.iq}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.3 }}
                  className="group flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100/50 rounded-xl hover:from-blue-50 hover:to-indigo-50 transition-all duration-200 border border-gray-100 hover:border-blue-200 hover:shadow-md"
                >
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 ${iqColor.bg} rounded-full flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow`}>
                      <span className={`${iqColor.text} font-bold text-sm`}>{test.iq}</span>
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 group-hover:text-blue-900 transition-colors">
                        Bài test IQ #{testNumber}
                      </div>
                      <div className="text-sm text-gray-500 flex items-center space-x-3">
                        <span>{date.toLocaleDateString('vi-VN')}</span>
                        <span className="text-gray-400">•</span>
                        <span>{timeAgo}</span>
                        {test.totalTime && (
                          <>
                            <span className="text-gray-400">•</span>
                            <span>{formatTimeDisplay(test.totalTime)}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-xl font-bold ${iqColor.text}`}>{test.iq}</div>
                    <div className="text-xs text-gray-500">điểm</div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">Chưa có bài test nào</h4>
            <p className="text-gray-500 mb-6">Hãy bắt đầu với bài test IQ đầu tiên của bạn</p>
            <button 
              onClick={() => window.location.href = '/test/iq'}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg font-medium"
            >
              Làm bài test đầu tiên
            </button>
          </div>
        )}
      </ContentLoader>
    </div>
  );



  const TabNavigation = () => (
    <div className="bg-white rounded-2xl p-2 shadow-sm border border-gray-100">
      <div className="flex space-x-2">
        {[
          { id: 'overview', label: 'Tổng quan', icon: '📊' },
          { id: 'settings', label: 'Cài đặt', icon: '⚙️' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-xl font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-blue-500 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <span>{tab.icon}</span>
            <span className="text-sm">{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  );

  const renderTabContent = () => {
    if (!dataReady) {
      return (
        <>
          <SkeletonPersonalInfo />
          <SkeletonTestList />
        </>
      );
    }

    // Normal content rendering
    switch (activeTab) {
      case 'overview':
        return (
          <>
            <PersonalInfo />
            <RecentTestsOverview />
          </>
        );
      case 'settings':
        return (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
              <span className="mr-2">⚙️</span>
              Cài đặt tài khoản
            </h3>
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">🔧</div>
              <p>Chức năng đang phát triển</p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-8">
      {/* Loading indicator for background updates */}
      {loadingProgress < 100 && <ProgressiveLoader progress={loadingProgress} />}
      
      <div className="max-w-4xl mx-auto px-4">
        <div className="space-y-6">
          <ContentLoader
            isLoading={!dataReady}
            skeleton={<SkeletonProfile />}
          >
            <HeroSection />
          </ContentLoader>
          
          {isAuthenticated === false && <AnonymousUserWarning />}
          <TabNavigation />
          
          <AnimatePresence mode="wait">
            <motion.div
              key={`${activeTab}-${dataReady}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {renderTabContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default ProfileComponent; 