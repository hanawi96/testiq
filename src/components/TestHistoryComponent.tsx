import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';

interface TestHistoryItem {
  id: number;
  date: string;
  score: number;
  percentile: number;
  timeTaken: number;
  accuracy: number;
  improvement: number;
  isFirst?: boolean;
  timestamp?: string;
}

// Smart formatter with memoization-friendly structure
const formatTestData = (testHistory: any[]): TestHistoryItem[] => 
  testHistory.map((test: any, index: number) => ({
    id: test.timestamp ? new Date(test.timestamp).getTime() : Date.now() - index,
    date: test.timestamp ? new Date(test.timestamp).toLocaleDateString('vi-VN') : new Date().toLocaleDateString('vi-VN'),
    score: test.iq || 0,
    percentile: test.percentile || Math.round((test.iq - 70) * 1.2),
    timeTaken: test.timeSpent || test.duration_seconds || 0,
    accuracy: test.accuracy || Math.round(70 + (test.iq - 70) * 0.8),
    improvement: index < testHistory.length - 1 ? test.iq - testHistory[index + 1].iq : 0,
    isFirst: index === testHistory.length - 1,
    timestamp: test.timestamp
  }));

// Optimized skeleton with minimal DOM
const FastSkeleton = ({ count = 3 }: { count?: number }) => (
  <div className="space-y-3">
    {[...Array(count)].map((_, i) => (
      <div key={i} className="animate-pulse h-20 bg-gray-200 rounded-xl" 
           style={{ animationDelay: `${i * 100}ms` }} />
    ))}
  </div>
);

const TestHistoryComponent: React.FC = () => {
  const [testHistory, setTestHistory] = useState<TestHistoryItem[]>(() => {
    // Optimistic loading from cache
    if (typeof window === 'undefined') return [];
    
    try {
      const cached = sessionStorage.getItem('test-history-cache');
      if (cached) {
        const data = JSON.parse(cached);
        if (Date.now() - data.timestamp < 30000) { // 30s cache
          return data.history;
        }
      }

      // Fallback to localStorage for instant display
      const localHistory = localStorage.getItem('iq-test-history');
      if (localHistory) {
        const history = formatTestData(JSON.parse(localHistory));
        // Cache for next time
        sessionStorage.setItem('test-history-cache', JSON.stringify({
          history,
          timestamp: Date.now()
        }));
        return history;
      }
    } catch (error) {
      console.warn('Cache load failed:', error);
    }
    
    return [];
  });

  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'highest' | 'lowest'>('newest');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  
  const itemsPerPage = 10;

  // Optimized screen size detection
  useEffect(() => {
    const checkScreenSize = () => setIsMobile(window.innerWidth < 640);
    checkScreenSize();
    const cleanup = () => window.removeEventListener('resize', checkScreenSize);
    window.addEventListener('resize', checkScreenSize);
    return cleanup;
  }, []);

  // Streamlined data loading
  useEffect(() => {
    let isMounted = true;
    
    const loadFreshData = async () => {
      // Only show loading if we have no data
      const needsLoading = testHistory.length === 0;
      if (needsLoading) setIsLoading(true);
      
      try {
        // Parallel loading
        const [authPromise, testUtilsPromise] = [
          import('../../backend')
            .then(backend => backend?.AuthService?.getCurrentUser?.())
            .then(result => !!result?.user)
            .catch(() => false),
          import('../utils/test')
        ];

        const [isAuth, testUtils] = await Promise.all([authPromise, testUtilsPromise]);
        
        if (!isMounted) return;
        setIsAuthenticated(isAuth);

        // Get fresh data
        const freshHistory = await testUtils.getUserRealTestHistory?.() || [];
        const formattedHistory = formatTestData(freshHistory);
        
        if (!isMounted) return;

        // Only update if data actually changed
        const hasChanged = formattedHistory.length !== testHistory.length ||
          formattedHistory.some((item, i) => item.id !== testHistory[i]?.id);

        if (hasChanged) {
          setTestHistory(formattedHistory);
          
          // Update cache
          try {
            sessionStorage.setItem('test-history-cache', JSON.stringify({
              history: formattedHistory,
              timestamp: Date.now()
            }));
          } catch (error) {
            console.warn('Cache save failed:', error);
          }
        }
        
      } catch (error) {
        console.error('Load error:', error);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    // Start fresh data load with small delay
    const timer = setTimeout(loadFreshData, 100);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, []);

  // Memoized helper functions
  const formatTimeDisplay = useCallback((totalSeconds: number): string => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    
    if (minutes > 0 && seconds > 0) return `${minutes}p ${seconds}s`;
    if (minutes > 0) return `${minutes}p`;
    return `${seconds}s`;
  }, []);

  const getIQLevel = useCallback((score: number) => {
    if (score >= 140) return { level: 'Thiên tài', color: 'purple', icon: '🌟' };
    if (score >= 130) return { level: 'Xuất sắc', color: 'blue', icon: '🏆' };
    if (score >= 115) return { level: 'Trên TB', color: 'green', icon: '⭐' };
    if (score >= 85) return { level: 'Trung bình', color: 'yellow', icon: '✅' };
    return { level: 'Dưới TB', color: 'orange', icon: '📈' };
  }, []);

  // Memoized computations
  const filteredAndSortedHistory = useMemo(() => {
    return testHistory
      .filter(test => 
        searchTerm === '' || 
        test.score.toString().includes(searchTerm) ||
        test.date.includes(searchTerm)
      )
      .sort((a, b) => {
        switch (sortBy) {
          case 'newest': return new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime();
          case 'oldest': return new Date(a.timestamp || 0).getTime() - new Date(b.timestamp || 0).getTime();
          case 'highest': return b.score - a.score;
          case 'lowest': return a.score - b.score;
          default: return 0;
        }
      });
  }, [testHistory, searchTerm, sortBy]);

  const stats = useMemo(() => ({
    total: testHistory.length,
    averageScore: testHistory.length ? Math.round(testHistory.reduce((sum, test) => sum + test.score, 0) / testHistory.length) : 0,
    bestScore: testHistory.length ? Math.max(...testHistory.map(test => test.score)) : 0,
    totalImprovement: testHistory.length > 1 ? testHistory[0].score - testHistory[testHistory.length - 1].score : 0
  }), [testHistory]);

  const { totalPages, currentItems } = useMemo(() => {
    const total = Math.ceil(filteredAndSortedHistory.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const items = filteredAndSortedHistory.slice(startIndex, startIndex + itemsPerPage);
    return { totalPages: total, currentItems: items };
  }, [filteredAndSortedHistory, currentPage, itemsPerPage]);

  // Optimized handlers
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    document.getElementById('test-list')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page
  }, []);

  const handleSortChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortBy(e.target.value as typeof sortBy);
    setCurrentPage(1); // Reset to first page
  }, []);

  // Lightweight components
  const AnonymousUserWarning = () => (
    isAuthenticated === false && (
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-amber-50 border border-amber-200 rounded-2xl p-4"
      >
        <div className="flex items-start space-x-3">
          <div className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5">⚠️</div>
          <div className="flex-1">
            <h4 className="font-semibold text-amber-800 mb-1">Dữ liệu tạm thời</h4>
            <p className="text-sm text-amber-700 mb-3">
              Lịch sử test chỉ lưu trên thiết bị này. Đăng ký để bảo vệ dữ liệu vĩnh viễn.
            </p>
            <button 
              onClick={() => window.location.href = '/admin/login'}
              className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors text-sm font-medium"
            >
              🔐 Đăng ký ngay
            </button>
          </div>
        </div>
      </motion.div>
    )
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 pt-24 pb-8">
      <div className="max-w-6xl mx-auto px-4 space-y-6">
        
        {/* Optimized Hero Section */}
        <section className="relative bg-gradient-to-br from-slate-50 via-white to-blue-50 rounded-3xl p-6 md:p-8 overflow-hidden">
          {/* Simplified background */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-400/5 to-purple-500/5 rounded-3xl"></div>
          
          <div className="relative text-center">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              Lịch sử <span className="text-blue-600">Test IQ</span>
            </h1>
            
            <p className="text-gray-600 mb-6">Theo dõi hành trình phát triển trí tuệ</p>

            {/* Optimized Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl mx-auto">
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 border border-gray-200">
                <div className="text-xl font-bold text-blue-600">{stats.total}</div>
                <div className="text-xs text-gray-600">Tổng test</div>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 border border-gray-200">
                <div className="text-xl font-bold text-purple-600">{stats.bestScore}</div>
                <div className="text-xs text-gray-600">Cao nhất</div>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 border border-gray-200">
                <div className="text-xl font-bold text-green-600">{stats.averageScore}</div>
                <div className="text-xs text-gray-600">Trung bình</div>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 border border-gray-200">
                <div className="text-xl font-bold text-orange-600">+{stats.totalImprovement}</div>
                <div className="text-xs text-gray-600">Cải thiện</div>
              </div>
            </div>
          </div>
        </section>

        <AnonymousUserWarning />

        {/* Streamlined Filter Controls */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                placeholder="Tìm kiếm theo điểm số..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <svg className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            <div className="flex items-center space-x-3">
              <select
                value={sortBy}
                onChange={handleSortChange}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="newest">Mới nhất</option>
                <option value="oldest">Cũ nhất</option>
                <option value="highest">Cao nhất</option>
                <option value="lowest">Thấp nhất</option>
              </select>

              <div className="text-sm text-gray-500">
                {currentItems.length}/{filteredAndSortedHistory.length}
              </div>
            </div>
          </div>
        </div>

        {/* Optimized Test History List */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100" id="test-list">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
            <span className="mr-2">📈</span>
            Danh sách bài test
          </h3>

          {isLoading && testHistory.length === 0 ? (
            <FastSkeleton count={3} />
          ) : currentItems.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">📝</div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">
                {searchTerm ? 'Không tìm thấy kết quả' : 'Chưa có bài test nào'}
              </h4>
              <p className="text-gray-600 mb-4">
                {searchTerm ? 'Thử từ khóa khác' : 'Hãy làm bài test đầu tiên!'}
              </p>
              {!searchTerm && (
                <button 
                  onClick={() => window.location.href = '/test/iq'}
                  className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                >
                  Làm bài test ngay
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {currentItems.map((test, index) => {
                const iqLevel = getIQLevel(test.score);
                const globalIndex = (currentPage - 1) * itemsPerPage + index;
                const isTop = globalIndex === 0;
                
                return (
                  <motion.div
                    key={test.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03, duration: 0.2 }}
                    className={`p-4 rounded-xl border transition-all duration-200 hover:shadow-md ${
                      isTop 
                        ? 'bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200' 
                        : 'bg-white border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white text-sm ${
                          isTop 
                            ? 'bg-gradient-to-br from-purple-500 to-indigo-600' 
                            : 'bg-gradient-to-br from-gray-400 to-gray-500'
                        }`}>
                          #{filteredAndSortedHistory.length - globalIndex}
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">
                            {isTop ? 'Bài test mới nhất' : `Test IQ #${filteredAndSortedHistory.length - globalIndex}`}
                          </h4>
                          <div className="text-sm text-gray-500 flex items-center space-x-4">
                            <span>{test.date}</span>
                            <span>•</span>
                            <span>{test.timeTaken > 0 ? formatTimeDisplay(test.timeTaken) : '—'}</span>
                            <span>•</span>
                            <span>{test.accuracy}% chính xác</span>
                          </div>
                        </div>
                        {isTop && (
                          <span className="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded-full font-medium">
                            ✨ Mới
                          </span>
                        )}
                      </div>
                      
                      <div className="text-right">
                        <div className={`text-2xl font-bold ${isTop ? 'text-purple-600' : 'text-gray-700'}`}>
                          {test.score}
                        </div>
                        <div className={`text-xs px-2 py-1 rounded-full font-medium bg-${iqLevel.color}-100 text-${iqLevel.color}-700`}>
                          {iqLevel.icon} {iqLevel.level}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Simplified Pagination */}
        {totalPages > 1 && (
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Trang {currentPage}/{totalPages} • {filteredAndSortedHistory.length} kết quả
              </div>
              
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="w-8 h-8 flex items-center justify-center text-sm text-gray-500 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ←
                </button>

                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = i + Math.max(1, currentPage - 2);
                  if (page > totalPages) return null;
                  
                  return (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`w-8 h-8 flex items-center justify-center text-sm rounded ${
                        currentPage === page
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}

                <button
                  onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="w-8 h-8 flex items-center justify-center text-sm text-gray-500 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  →
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TestHistoryComponent; 