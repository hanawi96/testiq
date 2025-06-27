import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface LeaderboardEntry {
  rank: number;
  name: string;
  score: number;
  location: string;
  date: string;
  badge: string;
  isAnonymous: boolean;
}

interface LeaderboardStats {
  totalParticipants: number;
  highestScore: number;
  averageScore: number;
  geniusPercentage: number;
}

export default function LeaderboardList() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [stats, setStats] = useState<LeaderboardStats>({
    totalParticipants: 0,
    highestScore: 0,
    averageScore: 0,
    geniusPercentage: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    try {
      setIsLoading(true);
      const { getLeaderboard } = await import('../../backend');
      const result = await getLeaderboard(50);
      
      if (result.data && result.stats) {
        setLeaderboard(result.data);
        setStats(result.stats);
      } else {
        setError('Không thể tải bảng xếp hạng');
      }
    } catch (err) {
      setError('Có lỗi xảy ra khi tải dữ liệu');
      console.error('Error loading leaderboard:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getBadgeInfo = (badge: string) => {
    switch(badge) {
      case 'genius': return { label: 'Thiên tài', color: 'from-purple-500 to-pink-500' };
      case 'superior': return { label: 'Xuất sắc', color: 'from-blue-500 to-cyan-500' };
      case 'above': return { label: 'Trên TB', color: 'from-green-500 to-emerald-500' };
      default: return { label: 'Tốt', color: 'from-orange-500 to-red-500' };
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="w-24 h-24 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white">
                <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path>
                <path d="M14 9h1.5a2.5 2.5 0 0 0 0-5H14"></path>
                <path d="M6 9h8"></path>
                <path d="M6 9v10a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V9"></path>
                <path d="M12 16l-1-1 1-1 1 1-1 1"></path>
              </svg>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-4">
              Bảng <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-600 to-orange-600">xếp hạng</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Top những người có điểm IQ cao nhất trong cộng đồng
            </p>
          </div>
          
          <div className="flex items-center justify-center py-12">
            <svg className="w-8 h-8 animate-spin text-yellow-600" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"/>
              <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" className="opacity-75"/>
            </svg>
            <span className="ml-3 text-lg text-gray-600">Đang tải bảng xếp hạng...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <div className="text-red-600 text-xl mb-2">⚠️</div>
            <h3 className="text-lg font-semibold text-red-800 mb-2">Lỗi tải dữ liệu</h3>
            <p className="text-red-600 mb-4">{error}</p>
            <button 
              onClick={loadLeaderboard}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Thử lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (leaderboard.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="w-24 h-24 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white">
                <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path>
                <path d="M14 9h1.5a2.5 2.5 0 0 0 0-5H14"></path>
                <path d="M6 9h8"></path>
                <path d="M6 9v10a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V9"></path>
                <path d="M12 16l-1-1 1-1 1 1-1 1"></path>
              </svg>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-4">
              Bảng <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-600 to-orange-600">xếp hạng</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Top những người có điểm IQ cao nhất trong cộng đồng
            </p>
          </div>
          
          <div className="bg-white rounded-3xl shadow-lg p-12 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Chưa có dữ liệu xếp hạng</h2>
            <p className="text-gray-600 mb-8">Hãy là người đầu tiên tham gia test IQ để xuất hiện trên bảng xếp hạng!</p>
            <a 
              href="/test/iq" 
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all duration-200 transform hover:scale-105 inline-flex items-center"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-3">
                <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44L5 17H2a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1h3l2.04-2.94A2.5 2.5 0 0 1 9.5 2Z"></path>
                <path d="M14.5 7.5a4.5 4.5 0 0 1 0 9"></path>
                <path d="M18.5 4.5a8.5 8.5 0 0 1 0 15"></path>
              </svg>
              Làm Test IQ Ngay
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 py-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-24 h-24 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white">
              <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path>
              <path d="M14 9h1.5a2.5 2.5 0 0 0 0-5H14"></path>
              <path d="M6 9h8"></path>
              <path d="M6 9v10a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V9"></path>
              <path d="M12 16l-1-1 1-1 1 1-1 1"></path>
            </svg>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-4">
            Bảng <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-600 to-orange-600">xếp hạng</span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Top những người có điểm IQ cao nhất trong cộng đồng
          </p>

          {/* Stats Cards */}
          <motion.div 
            className="grid md:grid-cols-4 gap-4 mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="bg-white rounded-xl p-4 shadow-md">
              <div className="text-2xl font-bold text-blue-600">{stats.totalParticipants.toLocaleString()}</div>
              <div className="text-sm text-gray-600">Người tham gia</div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-md">
              <div className="text-2xl font-bold text-purple-600">{stats.highestScore}</div>
              <div className="text-sm text-gray-600">Điểm cao nhất</div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-md">
              <div className="text-2xl font-bold text-green-600">{stats.averageScore}</div>
              <div className="text-sm text-gray-600">Điểm trung bình</div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-md">
              <div className="text-2xl font-bold text-orange-600">{stats.geniusPercentage}%</div>
              <div className="text-sm text-gray-600">Thiên tài (140+)</div>
            </div>
          </motion.div>
        </div>

        {/* Top 3 Section */}
        {leaderboard.length >= 3 && (
          <motion.div 
            className="bg-white rounded-2xl shadow-lg p-6 mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-2 text-yellow-500">
                  <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path>
                  <path d="M14 9h1.5a2.5 2.5 0 0 0 0-5H14"></path>
                  <path d="M6 9h8"></path>
                  <path d="M6 9v10a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V9"></path>
                  <path d="M12 16l-1-1 1-1 1 1-1 1"></path>
                </svg>
                Top 3 xuất sắc nhất
              </h2>
              <div className="text-sm text-gray-500">
                {new Date().toLocaleDateString('vi-VN')}
              </div>
            </div>
            
            <div className="grid md:grid-cols-3 gap-4">
              {/* 1st Place */}
              <div className="order-2 md:order-1 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-4 border-2 border-yellow-200 relative">
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center shadow-lg">
                  <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor" className="text-white">
                    <path d="M4 15h12l-1-8-2.5 3L10 7 7.5 10 5 7l-1 8z"/>
                    <path d="M4 15h12v2H4v-2z"/>
                    <circle cx="6" cy="5" r="1"/>
                    <circle cx="10" cy="3" r="1"/>
                    <circle cx="14" cy="5" r="1"/>
                  </svg>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                    1
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 text-lg">{leaderboard[0].name}</h3>
                    <div className="flex items-center text-sm text-gray-600 mb-1">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-1">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                        <circle cx="12" cy="10" r="3"></circle>
                      </svg>
                      {leaderboard[0].location}
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl font-bold text-yellow-600">{leaderboard[0].score}</span>
                      <span className="px-2 py-1 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs rounded-full font-semibold">
                        Vô địch
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2nd Place */}
              <div className="order-1 md:order-2 bg-gradient-to-br from-gray-50 to-slate-100 rounded-xl p-4 border border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-gray-400 to-gray-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md">
                    2
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900">{leaderboard[1].name}</h3>
                    <div className="flex items-center text-sm text-gray-600 mb-1">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-1">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                        <circle cx="12" cy="10" r="3"></circle>
                      </svg>
                      {leaderboard[1].location}
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xl font-bold text-gray-700">{leaderboard[1].score}</span>
                      <span className={`px-2 py-1 bg-gradient-to-r ${getBadgeInfo(leaderboard[1].badge).color} text-white text-xs rounded-full font-semibold`}>
                        {getBadgeInfo(leaderboard[1].badge).label}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3rd Place */}
              <div className="order-3 md:order-3 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-200">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-amber-600 to-orange-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md">
                    3
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900">{leaderboard[2].name}</h3>
                    <div className="flex items-center text-sm text-gray-600 mb-1">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-1">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                        <circle cx="12" cy="10" r="3"></circle>
                      </svg>
                      {leaderboard[2].location}
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xl font-bold text-amber-600">{leaderboard[2].score}</span>
                      <span className={`px-2 py-1 bg-gradient-to-r ${getBadgeInfo(leaderboard[2].badge).color} text-white text-xs rounded-full font-semibold`}>
                        {getBadgeInfo(leaderboard[2].badge).label}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Full Leaderboard Table */}
        <motion.div 
          className="bg-white rounded-2xl shadow-lg overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Bảng xếp hạng đầy đủ</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hạng</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Người chơi</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Điểm IQ</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Xếp loại</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {leaderboard.map((entry, index) => (
                  <tr key={index} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {entry.rank === 1 && (
                          <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" className="text-yellow-500 mr-2">
                            <path d="M4 15h12l-1-8-2.5 3L10 7 7.5 10 5 7l-1 8z"/>
                            <path d="M4 15h12v2H4v-2z"/>
                            <circle cx="6" cy="5" r="1"/>
                            <circle cx="10" cy="3" r="1"/>
                            <circle cx="14" cy="5" r="1"/>
                          </svg>
                        )}
                        <span className={`text-sm font-medium ${entry.rank <= 3 ? 'text-yellow-600' : 'text-gray-900'}`}>
                          #{entry.rank}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{entry.name}</div>
                        <div className="text-sm text-gray-500 flex items-center">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-1">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                            <circle cx="12" cy="10" r="3"></circle>
                          </svg>
                          {entry.location}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-lg font-bold text-gray-900">{entry.score}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gradient-to-r ${getBadgeInfo(entry.badge).color} text-white`}>
                        {getBadgeInfo(entry.badge).label}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(entry.date).toLocaleDateString('vi-VN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Call to Action */}
        <motion.div 
          className="text-center mt-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <a 
            href="/test/iq" 
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all duration-200 transform hover:scale-105 inline-flex items-center shadow-lg"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-3">
              <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44L5 17H2a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1h3l2.04-2.94A2.5 2.5 0 0 1 9.5 2Z"></path>
              <path d="M14.5 7.5a4.5 4.5 0 0 1 0 9"></path>
              <path d="M18.5 4.5a8.5 8.5 0 0 1 0 15"></path>
            </svg>
            Thử thách IQ của bạn!
          </a>
        </motion.div>
      </div>
    </div>
  );
} 