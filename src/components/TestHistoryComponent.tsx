import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TestHistoryItem {
  id: number;
  date: string;
  score: number;
  percentile: number;
  timeTaken: number;
  accuracy: number;
  improvement: number;
  timestamp?: string;
}

interface Props {
  initialData?: any;
}

// Simple skeleton
const Skeleton = ({ className = '' }: { className?: string }) => (
  <div className={`bg-gray-200 animate-pulse rounded ${className}`} />
);

const TestHistoryComponent: React.FC<Props> = ({ initialData }) => {
  // 🚀 SIMPLE STATES - CHỈ 2 STATE CHÍNH
  const [isLoading, setIsLoading] = useState(true);
  const [testHistory, setTestHistory] = useState<TestHistoryItem[]>([]);
  
  // UI states
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'highest' | 'lowest'>('newest');
  const itemsPerPage = 10;

  // 🔥 SINGLE DATA LOADING - SIÊU ĐỠN GIẢN
  useEffect(() => {
    let mounted = true;
    
    const loadData = async () => {
      try {
        setIsLoading(true);
        
        // Import utils
        const testUtils = await import('../utils/test');
        
        // Get data - CHỈ 1 NGUỒN DUY NHẤT
        const rawHistory = await testUtils.getUserRealTestHistory() || [];
        
        // Format data - LOGIC ĐƠN GIẢN
        const formattedHistory = rawHistory.map((test: any, index: number) => ({
          id: test.timestamp ? new Date(test.timestamp).getTime() : Date.now() - index,
          date: test.timestamp ? new Date(test.timestamp).toLocaleDateString('vi-VN') : new Date().toLocaleDateString('vi-VN'),
          score: test.iq || 0,
          percentile: test.percentile || Math.round((test.iq - 70) * 1.2),
          timeTaken: test.timeSpent || test.duration_seconds || 0,
          accuracy: test.accuracy || Math.round(70 + (test.iq - 70) * 0.8),
          improvement: index < rawHistory.length - 1 ? test.iq - rawHistory[index + 1].iq : 0,
          timestamp: test.timestamp
        }));

        if (mounted) {
          setTestHistory(formattedHistory);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Load failed:', error);
        if (mounted) setIsLoading(false);
      }
    };

    // Delay để có hiệu ứng loading
    setTimeout(loadData, 800);
    
    return () => { mounted = false; };
  }, []);

  // Helper functions
  const formatTime = useCallback((seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return m > 0 ? `${m}p ${s}s` : `${s}s`;
  }, []);

  const getIQLevel = useCallback((score: number) => {
    if (score >= 140) return { level: 'Thiên tài', color: 'purple', icon: '🌟' };
    if (score >= 130) return { level: 'Xuất sắc', color: 'blue', icon: '🏆' };
    if (score >= 115) return { level: 'Trên TB', color: 'green', icon: '⭐' };
    return { level: 'Trung bình', color: 'yellow', icon: '✅' };
  }, []);

  // Computed data
  const filteredHistory = useMemo(() => {
    return testHistory
      .filter(test => !searchTerm || test.score.toString().includes(searchTerm))
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
    average: testHistory.length ? Math.round(testHistory.reduce((sum, test) => sum + test.score, 0) / testHistory.length) : 0,
    best: testHistory.length ? Math.max(...testHistory.map(test => test.score)) : 0,
    improvement: testHistory.length > 1 ? testHistory[0].score - testHistory[testHistory.length - 1].score : 0
  }), [testHistory]);

  const { totalPages, currentItems } = useMemo(() => {
    const total = Math.ceil(filteredHistory.length / itemsPerPage);
    const start = (currentPage - 1) * itemsPerPage;
    const items = filteredHistory.slice(start, start + itemsPerPage);
    return { totalPages: total, currentItems: items };
  }, [filteredHistory, currentPage]);

  // 🎨 LOADING UI - GIỐNG HỆT PROFILE
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 pt-24 pb-8">
        <div className="max-w-6xl mx-auto px-4 space-y-6">
          
          {/* Hero Skeleton */}
          <div className="bg-white rounded-3xl p-8 text-center">
            <Skeleton className="w-12 h-12 rounded-xl mx-auto mb-4" />
            <Skeleton className="h-8 w-64 mx-auto mb-2" />
            <Skeleton className="h-4 w-48 mx-auto mb-6" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl mx-auto">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white/80 rounded-xl p-3 border">
                  <Skeleton className="h-6 w-8 mx-auto mb-1" />
                  <Skeleton className="h-3 w-12 mx-auto" />
                </div>
              ))}
            </div>
          </div>

          {/* Filters Skeleton */}
          <div className="bg-white rounded-2xl p-4">
            <div className="flex gap-3 justify-between">
              <Skeleton className="h-10 flex-1 max-w-md" />
              <Skeleton className="h-10 w-32" />
            </div>
          </div>

          {/* List Skeleton */}
          <div className="bg-white rounded-2xl p-4">
            <Skeleton className="h-6 w-48 mb-4" />
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="p-4 border rounded-xl">
                  <div className="flex justify-between">
                    <div className="flex space-x-3">
                      <Skeleton className="w-12 h-12 rounded-xl" />
                      <div className="space-y-2">
                        <Skeleton className="w-32 h-4" />
                        <Skeleton className="w-48 h-3" />
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <Skeleton className="w-12 h-8" />
                      <Skeleton className="w-16 h-5 rounded-full" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 🎯 MAIN UI - CLEAN & SIMPLE
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 pt-24 pb-8">
      <div className="max-w-6xl mx-auto px-4 space-y-6">
        
        {/* Hero Section */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-slate-50 via-white to-blue-50 rounded-3xl p-8 text-center"
        >
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Lịch sử <span className="text-blue-600">Test IQ</span>
          </h1>
          <p className="text-gray-600 mb-6">Theo dõi hành trình phát triển trí tuệ</p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl mx-auto">
            <div className="bg-white/80 rounded-xl p-3 border">
              <div className="text-xl font-bold text-blue-600">{stats.total}</div>
              <div className="text-xs text-gray-600">Tổng test</div>
            </div>
            <div className="bg-white/80 rounded-xl p-3 border">
              <div className="text-xl font-bold text-purple-600">{stats.best}</div>
              <div className="text-xs text-gray-600">Cao nhất</div>
            </div>
            <div className="bg-white/80 rounded-xl p-3 border">
              <div className="text-xl font-bold text-green-600">{stats.average}</div>
              <div className="text-xs text-gray-600">Trung bình</div>
            </div>
            <div className="bg-white/80 rounded-xl p-3 border">
              <div className="text-xl font-bold text-orange-600">+{stats.improvement}</div>
              <div className="text-xs text-gray-600">Cải thiện</div>
            </div>
          </div>
        </motion.section>

        {/* Filters */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-4"
        >
          <div className="flex flex-col md:flex-row gap-3 justify-between">
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                placeholder="Tìm kiếm theo điểm số..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <svg className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="newest">Mới nhất</option>
              <option value="oldest">Cũ nhất</option>
              <option value="highest">Cao nhất</option>
              <option value="lowest">Thấp nhất</option>
            </select>
          </div>
        </motion.div>

        {/* Test List */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl p-4"
        >
          <h3 className="text-lg font-bold mb-4 flex items-center">
            📈 Danh sách bài test
          </h3>

          {currentItems.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">📝</div>
              <h4 className="text-lg font-semibold mb-2">
                {searchTerm ? 'Không tìm thấy' : 'Chưa có bài test'}
              </h4>
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
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`p-4 rounded-xl border hover:shadow-md transition-all ${
                      isTop ? 'bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex justify-between">
                      <div className="flex space-x-3">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white text-sm ${
                          isTop ? 'bg-gradient-to-br from-purple-500 to-indigo-600' : 'bg-gray-500'
                        }`}>
                          #{filteredHistory.length - globalIndex}
                        </div>
                        <div>
                          <h4 className="font-semibold">
                            {isTop ? 'Bài test mới nhất' : `Test IQ #${filteredHistory.length - globalIndex}`}
                          </h4>
                          <div className="text-sm text-gray-500 flex space-x-4">
                            <span>{test.date}</span>
                            <span>•</span>
                            <span>{formatTime(test.timeTaken)}</span>
                            <span>•</span>
                            <span>{test.accuracy}% chính xác</span>
                          </div>
                        </div>
                        {isTop && (
                          <span className="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded-full">
                            ✨ Mới
                          </span>
                        )}
                      </div>
                      
                      <div className="text-right">
                        <div className={`text-2xl font-bold ${isTop ? 'text-purple-600' : 'text-gray-700'}`}>
                          {test.score}
                        </div>
                        <div className={`text-xs px-2 py-1 rounded-full bg-${iqLevel.color}-100 text-${iqLevel.color}-700`}>
                          {iqLevel.icon} {iqLevel.level}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Pagination */}
        {totalPages > 1 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl p-4"
          >
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-500">
                Trang {currentPage}/{totalPages} • {filteredHistory.length} kết quả
              </div>
              
              <div className="flex space-x-1">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="w-8 h-8 flex items-center justify-center border rounded hover:bg-gray-50 disabled:opacity-50"
                >
                  ←
                </button>

                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = i + Math.max(1, currentPage - 2);
                  if (page > totalPages) return null;
                  
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-8 h-8 flex items-center justify-center rounded ${
                        currentPage === page ? 'bg-blue-600 text-white' : 'border hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}

                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="w-8 h-8 flex items-center justify-center border rounded hover:bg-gray-50 disabled:opacity-50"
                >
                  →
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default TestHistoryComponent; 