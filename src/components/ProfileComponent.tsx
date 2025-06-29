import React, { useState, useEffect } from 'react';
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

const ProfileComponent: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: 'Người dùng',
    age: '',
    location: '',
    totalTests: 0,
    averageScore: 0,
    bestScore: 0,
    testHistory: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Load user data
  useEffect(() => {
    const loadUserData = async () => {
      try {
        // Dynamic import with proper error handling
        const testUtils = await import('../utils/test.ts');
        
        // Check authentication status
        try {
          const { AuthService } = await import('../../backend');
          const { user } = await AuthService.getCurrentUser();
          setIsAuthenticated(!!user);
        } catch (error) {
          console.warn('Could not check auth status:', error);
          setIsAuthenticated(false);
        }
        
        // Get user info and test history in parallel
        const [userInfo, testHistory] = await Promise.all([
          Promise.resolve(testUtils.getAnonymousUserInfo?.() || null),
          testUtils.getUserRealTestHistory?.() || Promise.resolve([])
        ]);

        const stats = calculateStats(testHistory);
        setUserProfile({
          name: userInfo?.name || 'Người dùng',
          age: userInfo?.age || '',
          location: userInfo?.location || '',
          joinDate: getJoinDate(testHistory),
          totalTests: testHistory.length,
          averageScore: stats.average,
          bestScore: stats.best,
          testHistory: testHistory
        });
      } catch (error) {
        console.warn('Error loading user data:', error);
        // Set default profile on error
        setUserProfile(prev => ({ ...prev, name: 'Người dùng' }));
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();
  }, []);

  // Calculate test statistics
  const calculateStats = (history: any[]) => {
    if (!history.length) return { average: 0, best: 0 };
    
    const scores = history.map(test => test.iq || 0);
    const average = Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
    const best = Math.max(...scores);
    
    return { average, best };
  };

  // Get join date from first test
  const getJoinDate = (history: any[]) => {
    if (!history.length) return new Date().toLocaleDateString('vi-VN');
    
    const oldestTest = history[history.length - 1];
    return oldestTest.timestamp 
      ? new Date(oldestTest.timestamp).toLocaleDateString('vi-VN')
      : new Date().toLocaleDateString('vi-VN');
  };

  // Format time display
  const formatTimeDisplay = (totalSeconds: number): string => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    
    if (minutes > 0 && seconds > 0) {
      return `${minutes} phút ${seconds} giây`;
    } else if (minutes > 0) {
      return `${minutes} phút`;
    } else {
      return `${seconds} giây`;
    }
  };

  // Get time ago display
  const getTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Hôm nay';
    if (diffDays === 1) return 'Hôm qua';
    if (diffDays < 7) return `${diffDays} ngày trước`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} tuần trước`;
    return `${Math.floor(diffDays / 30)} tháng trước`;
  };

  // Get IQ color scheme
  const getIQColor = (iq: number) => {
    if (iq >= 140) return { bg: 'bg-gradient-to-br from-purple-100 to-purple-200', text: 'text-purple-700' };
    if (iq >= 130) return { bg: 'bg-gradient-to-br from-indigo-100 to-indigo-200', text: 'text-indigo-700' };
    if (iq >= 120) return { bg: 'bg-gradient-to-br from-blue-100 to-blue-200', text: 'text-blue-700' };
    if (iq >= 110) return { bg: 'bg-gradient-to-br from-green-100 to-green-200', text: 'text-green-700' };
    if (iq >= 90) return { bg: 'bg-gradient-to-br from-yellow-100 to-yellow-200', text: 'text-yellow-700' };
    return { bg: 'bg-gradient-to-br from-orange-100 to-orange-200', text: 'text-orange-700' };
  };

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
            {userProfile.joinDate && (
              <span className="flex items-center">
                <span className="mr-1">📅</span>
                Tham gia {userProfile.joinDate}
              </span>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
          <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4">
            <div className="text-2xl font-bold text-blue-600">{userProfile.totalTests}</div>
            <div className="text-xs text-gray-600">Bài test</div>
          </div>
          <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4">
            <div className="text-2xl font-bold text-green-600">{userProfile.averageScore}</div>
            <div className="text-xs text-gray-600">Điểm TB</div>
          </div>
          <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4">
            <div className="text-2xl font-bold text-purple-600">{userProfile.bestScore}</div>
            <div className="text-xs text-gray-600">Tốt nhất</div>
          </div>
        </div>
      </div>
    </div>
  );

  const AnonymousUserWarning = () => (
    !isAuthenticated && (
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
              <div className="font-semibold text-gray-900">{userProfile.joinDate}</div>
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
      
      {(userProfile.testHistory?.length || 0) > 0 ? (
        <div className="space-y-3">
          {(userProfile.testHistory || []).slice(0, 10).map((test, index) => {
            const date = test.timestamp ? new Date(test.timestamp) : new Date();
            const timeAgo = getTimeAgo(date);
            const iqColor = getIQColor(test.iq);
            const testNumber = (userProfile.testHistory?.length || 0) - index;
            
            return (
              <motion.div 
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
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
    </div>
  );

  const RecentTests = () => (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
        <span className="mr-2">🕒</span>
        Bài test gần đây
      </h3>
      
      {userProfile.testHistory?.length ? (
        <div className="space-y-3">
          {userProfile.testHistory.slice(0, 5).map((test, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-bold">{test.iq}</span>
                </div>
                <div>
                  <div className="font-semibold text-gray-900">IQ Test</div>
                  <div className="text-sm text-gray-500">
                    {test.timestamp ? new Date(test.timestamp).toLocaleDateString('vi-VN') : 'Không rõ'}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-green-600">{test.iq}</div>
                <div className="text-xs text-gray-500">điểm</div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-2">📝</div>
          <p>Chưa có bài test nào</p>
          <button 
            onClick={() => window.location.href = '/test/iq'}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
          >
            Làm bài test đầu tiên
          </button>
        </div>
      )}
    </div>
  );

  const TabNavigation = () => (
    <div className="bg-white rounded-2xl p-2 shadow-sm border border-gray-100">
      <div className="flex space-x-2">
        {[
          { id: 'overview', label: 'Tổng quan', icon: '📊' },
          { id: 'tests', label: 'Bài test', icon: '📝' },
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
    switch (activeTab) {
      case 'overview':
        return (
          <>
            <PersonalInfo />
            <RecentTestsOverview />
          </>
        );
      case 'tests':
        return <RecentTests />;
      case 'settings':
        return (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
              <span className="mr-2">⚙️</span>
              Cài đặt tài khoản
            </h3>
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">🔧</div>
              <p>Tính năng cài đặt đang được phát triển</p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 pt-24 pb-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center py-12">
            <div className="w-12 h-12 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Đang tải thông tin profile...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 pt-24 pb-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="space-y-8">
          {/* Hero Section */}
          <HeroSection />
          
          {/* Anonymous User Warning */}
          <AnonymousUserWarning />
          
          {/* Tab Navigation */}
          <TabNavigation />
          
          {/* Tab Content */}
          <AnimatePresence mode="wait">
            <motion.div 
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-8"
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