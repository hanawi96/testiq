import React, { useState, useEffect } from 'react';
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

const TestHistoryComponent: React.FC = () => {
  const [testHistory, setTestHistory] = useState<TestHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'score'>('date');
  
  const itemsPerPage = 10;

  // Load test history
  useEffect(() => {
    const loadTestHistory = async () => {
      try {
        const testUtils = await import('../utils/test');
        const history = await testUtils.getUserRealTestHistory?.() || [];
        
        console.log('Loaded test history:', history);
        
        const formattedHistory = history.map((test: any, index: number) => ({
          id: test.timestamp ? new Date(test.timestamp).getTime() : Date.now() - index,
          date: test.timestamp ? new Date(test.timestamp).toLocaleDateString('vi-VN') : new Date().toLocaleDateString('vi-VN'),
          score: test.iq || 0,
          percentile: test.percentile || Math.round((test.iq - 70) * 1.2),
          timeTaken: test.timeSpent || test.duration_seconds || 0,
          accuracy: test.accuracy || Math.round(70 + (test.iq - 70) * 0.8),
          improvement: index < history.length - 1 ? test.iq - history[index + 1].iq : 0,
          isFirst: index === history.length - 1,
          timestamp: test.timestamp
        }));

        console.log('Formatted history:', formattedHistory);
        setTestHistory(formattedHistory);
      } catch (error) {
        console.error('Error loading test history:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadTestHistory();
  }, []);

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

  const getIQLevel = (score: number) => {
    if (score >= 140) return { level: 'Thiên tài', color: 'purple', icon: '🌟' };
    if (score >= 130) return { level: 'Xuất sắc', color: 'blue', icon: '🏆' };
    if (score >= 115) return { level: 'Trên TB', color: 'green', icon: '⭐' };
    if (score >= 85) return { level: 'Trung bình', color: 'yellow', icon: '✅' };
    return { level: 'Dưới TB', color: 'orange', icon: '📈' };
  };

  // Filter and sort
  const filteredAndSortedHistory = testHistory
    .filter(test => 
      searchTerm === '' || 
      test.score.toString().includes(searchTerm) ||
      test.date.includes(searchTerm)
    )
    .sort((a, b) => {
      if (sortBy === 'score') return b.score - a.score;
      return new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime();
    });

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedHistory.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = filteredAndSortedHistory.slice(startIndex, startIndex + itemsPerPage);

  // Statistics
  const stats = {
    total: testHistory.length,
    averageScore: testHistory.length ? Math.round(testHistory.reduce((sum, test) => sum + test.score, 0) / testHistory.length) : 0,
    bestScore: testHistory.length ? Math.max(...testHistory.map(test => test.score)) : 0,
    totalImprovement: testHistory.length > 1 ? testHistory[0].score - testHistory[testHistory.length - 1].score : 0
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 pt-24 pb-8">
      <div className="max-w-6xl mx-auto px-4 space-y-8">
        
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-indigo-50 to-purple-100 rounded-3xl p-8 text-center">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">📊 Lịch sử Test IQ</h1>
          <p className="text-gray-600 mb-6">Theo dõi tiến bộ và phân tích kết quả qua từng bài test</p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
            <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4">
              <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
              <div className="text-xs text-gray-600">Tổng test</div>
            </div>
            <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4">
              <div className="text-2xl font-bold text-green-600">{stats.averageScore}</div>
              <div className="text-xs text-gray-600">Điểm TB</div>
            </div>
            <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4">
              <div className="text-2xl font-bold text-purple-600">{stats.bestScore}</div>
              <div className="text-xs text-gray-600">Cao nhất</div>
            </div>
            <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4">
              <div className="text-2xl font-bold text-orange-600">+{stats.totalImprovement}</div>
              <div className="text-xs text-gray-600">Tiến bộ</div>
            </div>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                placeholder="Tìm kiếm theo điểm số hoặc ngày..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:outline-none"
              />
              <svg className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            <div className="flex items-center space-x-4">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'date' | 'score')}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none"
              >
                <option value="date">Mới nhất</option>
                <option value="score">Điểm cao nhất</option>
              </select>

              <div className="text-sm text-gray-500">
                {currentItems.length} / {filteredAndSortedHistory.length} kết quả
              </div>
            </div>
          </div>
        </div>

        {/* Test History List */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100" id="test-list">
          <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
            <span className="mr-2">📈</span>
            Danh sách bài test
          </h3>

          {isLoading ? (
            <div className="space-y-4 min-h-[600px]">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="animate-pulse h-24 bg-gray-200 rounded-xl"></div>
              ))}
            </div>
          ) : currentItems.length === 0 ? (
            <div className="text-center py-12 min-h-[400px] flex flex-col justify-center">
              <div className="text-4xl mb-4">📝</div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">
                {searchTerm ? 'Không tìm thấy kết quả' : 'Chưa có bài test nào'}
              </h4>
              <p className="text-gray-600 mb-4">
                {searchTerm ? 'Thử thay đổi từ khóa tìm kiếm' : 'Hãy làm bài test đầu tiên của bạn!'}
              </p>
              {!searchTerm && (
                <button 
                  onClick={() => window.location.href = '/test/iq'}
                  className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors focus:outline-none"
                >
                  Làm bài test ngay
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {currentItems.map((test, index) => {
                const iqLevel = getIQLevel(test.score);
                const globalIndex = startIndex + index;
                
                return (
                  <motion.div
                    key={test.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`p-4 rounded-xl border transition-all duration-300 hover:shadow-md ${
                      globalIndex === 0 
                        ? 'bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200 shadow-sm' 
                        : 'bg-white border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-white shadow-sm ${
                          globalIndex === 0 
                            ? 'bg-gradient-to-br from-purple-400 to-indigo-500' 
                            : 'bg-gradient-to-br from-purple-300 to-indigo-400'
                        }`}>
                          <span className="text-sm">#{filteredAndSortedHistory.length - globalIndex}</span>
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900 text-lg">
                            {globalIndex === 0 ? 'Bài test mới nhất' : 
                             test.isFirst ? 'Bài test đầu tiên' : 
                             `Test IQ #${filteredAndSortedHistory.length - globalIndex}`}
                          </h4>
                          <p className="text-sm text-gray-500 flex items-center mt-1">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            {test.date}
                          </p>
                        </div>
                        {globalIndex === 0 && (
                          <span className="bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-700 text-xs px-3 py-1.5 rounded-full font-semibold shadow-sm">
                            ✨ Mới nhất
                          </span>
                        )}
                      </div>
                      
                      <div className="text-right">
                        <div className={`text-4xl font-bold mb-1 ${
                          globalIndex === 0 
                            ? 'bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent' 
                            : 'text-gray-700'
                        }`}>
                          {test.score}
                        </div>
                        <div className={`text-xs px-3 py-1.5 rounded-full font-medium shadow-sm bg-${iqLevel.color}-100 text-${iqLevel.color}-700`}>
                          {iqLevel.icon} {iqLevel.level}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-6">
                        <div className="text-gray-600">
                          <span className="font-medium text-gray-900">{test.percentile}%</span> percentile
                        </div>
                        <div className="text-gray-600">
                          <span className="font-medium text-gray-900">{test.accuracy}%</span> chính xác
                        </div>
                        <div className="text-gray-600">
                          <span className="font-medium text-gray-900">
                            {test.timeTaken > 0 ? formatTimeDisplay(test.timeTaken) : '—'}
                          </span> thời gian
                        </div>
                        {!test.isFirst && (
                          <div className="text-gray-600">
                            <span className={`font-medium ${
                              test.improvement > 0 ? 'text-green-600' : 
                              test.improvement < 0 ? 'text-red-600' : 'text-gray-900'
                            }`}>
                              {test.improvement > 0 ? '+' : ''}{test.improvement}
                            </span> điểm
                          </div>
                        )}
                      </div>
                      
                      <button 
                        onClick={() => window.open(`/result?name=${encodeURIComponent('Người dùng')}&score=${test.score}&percentile=${test.percentile}&timeSpent=${test.timeTaken}`, '_blank')}
                        className="text-purple-600 hover:text-purple-700 text-sm font-medium focus:outline-none transition-colors flex items-center"
                      >
                        Chi tiết →
                      </button>
                    </div>


                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Trang {currentPage} / {totalPages} • Tổng {filteredAndSortedHistory.length} bài test
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    setCurrentPage(Math.max(1, currentPage - 1));
                    document.getElementById('test-list')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  disabled={currentPage === 1}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none"
                >
                  ← Trước
                </button>

                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = i + Math.max(1, currentPage - 2);
                  if (page > totalPages) return null;
                  
                  return (
                    <button
                      key={page}
                      onClick={() => {
                        setCurrentPage(page);
                        document.getElementById('test-list')?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors focus:outline-none ${
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
                  onClick={() => {
                    setCurrentPage(Math.min(totalPages, currentPage + 1));
                    document.getElementById('test-list')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none"
                >
                  Sau →
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