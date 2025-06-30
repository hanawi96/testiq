import React, { useState, useEffect } from 'react';

interface LocalRankingEntry {
  rank: number;
  name: string;
  score: number;
  location: string;
  date: string;
  badge: string;
  isAnonymous?: boolean;
  user_id?: string;
  gender?: string;
  age?: number;
  duration?: number; // Thời gian hoàn thành (giây)
}

interface LocalRankingData {
  userRank: number;
  userEntry: LocalRankingEntry;
  surrounding: LocalRankingEntry[];
  totalParticipants: number;
}

interface Props {
  userId?: string;
}

const getBadgeInfo = (badge: string) => {
  switch(badge) {
    case 'genius': return { label: 'Thiên tài', color: 'purple', icon: '🧠', bgClass: 'from-purple-50 to-indigo-50' };
    case 'superior': return { label: 'Xuất sắc', color: 'blue', icon: '🏆', bgClass: 'from-blue-50 to-cyan-50' };
    case 'above': return { label: 'Trên TB', color: 'green', icon: '⭐', bgClass: 'from-green-50 to-emerald-50' };
    default: return { label: 'Tốt', color: 'orange', icon: '✨', bgClass: 'from-orange-50 to-amber-50' };
  }
};

const getRankColor = (rank: number, isCurrentUser: boolean = false) => {
  if (isCurrentUser) return 'from-yellow-400 to-orange-500';
  if (rank <= 10) return 'from-blue-400 to-indigo-500';
  if (rank <= 50) return 'from-purple-400 to-violet-500';
  if (rank <= 100) return 'from-green-400 to-emerald-500';
  return 'from-gray-400 to-gray-500';
};

const formatDate = (dateString: string) => {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Hôm nay';
    if (diffDays === 1) return 'Hôm qua';
    if (diffDays < 7) return `${diffDays} ngày trước`;
    return date.toLocaleDateString('vi-VN');
  } catch {
    return 'Gần đây';
  }
};

const getGenderIcon = (gender?: string) => {
  switch(gender) {
    case 'male': return '♂️';
    case 'female': return '♀️';
    case 'other': return '⚧️';
    default: return null;
  }
};

// ✅ SMART: Format thời gian hoàn thành
const formatDuration = (seconds?: number): string => {
  if (!seconds || seconds <= 0) return '';
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  if (minutes === 0) return `${remainingSeconds}s`;
  if (remainingSeconds === 0) return `${minutes}m`;
  return `${minutes}m${remainingSeconds}s`;
};

export default function LocalRankingView({ userId }: Props) {
  const [data, setData] = useState<LocalRankingData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!userId) return;
    
    const loadLocalRanking = async () => {
      setLoading(true);
      setError('');
      
      try {
        const backend = await import('../../backend');
        const result = await backend.getUserLocalRanking(userId);
        
        if (result.error || !result.data) {
          setError('Không thể tải vị trí cá nhân');
          return;
        }
        
        setData(result.data);
      } catch (err: any) {
        setError(err.message || 'Lỗi tải dữ liệu');
      } finally {
        setLoading(false);
      }
    };

    loadLocalRanking();
  }, [userId]);

  if (!userId) {
    return (
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 text-center border border-blue-200">
        <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">🔐</span>
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">Đăng nhập để xem vị trí của bạn</h3>
        <p className="text-gray-600 mb-4">Khám phá vị trí của bạn trong bảng xếp hạng và so sánh với những người xung quanh</p>
        <a 
          href="/test/iq" 
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Làm Test IQ
        </a>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="flex items-center justify-between mb-4">
            <div className="w-32 h-6 bg-gray-300 rounded"></div>
            <div className="w-20 h-4 bg-gray-300 rounded"></div>
          </div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-red-200 p-6 text-center">
        <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mx-auto mb-3">
          <span className="text-xl text-red-500">⚠️</span>
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">Không thể tải vị trí</h3>
        <p className="text-gray-600 text-sm">{error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl p-8 text-center border border-gray-200">
        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">📊</span>
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">Chưa có kết quả test</h3>
        <p className="text-gray-600 mb-4">Bạn chưa có kết quả nào trong bảng xếp hạng</p>
        <a 
          href="/test/iq" 
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Làm Test IQ ngay
        </a>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header với thông tin vị trí */}
      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-4 sm:p-6 border-b border-yellow-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center">
              <span className="text-white text-lg">🎯</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Vị trí của bạn</h3>
              <p className="text-sm text-gray-600">Xung quanh bạn trong bảng xếp hạng</p>
            </div>
          </div>
          <div className="text-left sm:text-right">
            <div className="text-2xl font-bold text-yellow-600">#{data.userRank}</div>
            <div className="text-sm text-gray-500">trên {data.totalParticipants} người</div>
          </div>
        </div>
      </div>

      {/* Danh sách xung quanh */}
      <div className="p-6">
        <div className="space-y-3">
          {data.surrounding.map((entry) => {
            const isCurrentUser = entry.user_id === userId;
            const badgeInfo = getBadgeInfo(entry.badge);
            const isTopRank = entry.rank <= 10;
            
            // Use real age data from database
            const displayEntry = entry;
            
            return (
              <div 
                key={`${entry.rank}-${entry.user_id || entry.name}`}
                className={`relative group rounded-xl p-4 border transition-all duration-200 ${
                  isCurrentUser 
                    ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-300 shadow-md ring-2 ring-yellow-200' 
                    : 'bg-gray-50 border-gray-200 hover:bg-gray-100 hover:border-gray-300'
                }`}
              >
                {/* Highlight cho user hiện tại */}
                {isCurrentUser && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">!</span>
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {/* Rank Badge */}
                    <div className="relative">
                      <div className={`w-10 h-10 bg-gradient-to-br ${getRankColor(entry.rank, isCurrentUser)} rounded-lg flex items-center justify-center`}>
                        <span className="text-white font-bold text-sm">#{entry.rank}</span>
                      </div>
                      {isTopRank && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs">✨</span>
                        </div>
                      )}
                    </div>
                    
                    {/* User Info */}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 flex-wrap">
                        <h4 className={`font-bold ${isCurrentUser ? 'text-yellow-800' : 'text-gray-900'}`}>
                          {isCurrentUser ? `${displayEntry.name} (Bạn)` : displayEntry.name}
                        </h4>
                        <div className="flex items-center space-x-1">
                          {getGenderIcon(displayEntry.gender) && (
                            <span className="text-sm" title={`Giới tính: ${displayEntry.gender === 'male' ? 'Nam' : displayEntry.gender === 'female' ? 'Nữ' : 'Khác'}`}>
                              {getGenderIcon(displayEntry.gender)}
                            </span>
                          )}
                          {displayEntry.age && (
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium" title={`${displayEntry.age} tuổi`}>
                              {displayEntry.age}
                            </span>
                          )}
                        </div>
                        {isCurrentUser && (
                          <span className="bg-yellow-200 text-yellow-800 text-xs px-2 py-0.5 rounded-full font-medium">
                            Của bạn
                          </span>
                        )}
                        {isTopRank && !isCurrentUser && (
                          <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full font-medium">
                            Top {displayEntry.rank <= 5 ? '5' : '10'}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-600 mt-1 flex-wrap">
                        <span className="flex items-center">
                          <span className="mr-1">📍</span>
                          {displayEntry.location}
                        </span>
                        <span className="hidden sm:inline">•</span>
                        <span className="flex items-center">
                          <span className="mr-1">⏰</span>
                          {formatDate(displayEntry.date)}
                        </span>
                        {displayEntry.duration && (
                          <>
                            <span className="hidden sm:inline">•</span>
                            <span className="flex items-center" title={`Thời gian hoàn thành: ${formatDuration(displayEntry.duration)}`}>
                              <span className="mr-1">⏱️</span>
                              {formatDuration(displayEntry.duration)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Score & Badge */}
                  <div className="text-right">
                    <div className={`text-xl font-bold mb-1 ${
                      isCurrentUser ? 'text-yellow-600' : 
                      isTopRank ? 'text-blue-600' : 'text-gray-700'
                    }`}>
                      {displayEntry.score}
                    </div>
                    <div className={`text-xs px-2 py-1 rounded-full font-medium bg-${badgeInfo.color}-100 text-${badgeInfo.color}-700`}>
                      {badgeInfo.icon} {badgeInfo.label}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Motivation message */}
        <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 flex-1">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm">💪</span>
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-blue-900">
                  {data.userRank === 1 ? '👑 Vua/Nữ hoàng IQ!' : 
                   data.userRank <= 3 ? '🏆 Huy chương!' :
                   data.userRank <= 10 ? '✨ Xuất sắc!' : 
                   data.userRank <= 50 ? '💪 Tốt lắm!' : '🎯 Tiếp tục cố gắng!'}
                </h4>
                <p className="text-sm text-blue-700">
                  {data.userRank === 1 
                    ? 'Bạn là số 1! Thiên tài thực thụ! 🧠'
                    : data.userRank <= 3
                    ? `Bạn đứng ${data.userRank === 2 ? 'thứ 2' : 'thứ 3'}! Xuất sắc quá! 🌟`
                    : data.userRank <= 10 
                    ? 'Bạn đang ở top 10! Thật tuyệt vời! 🎉'
                    : data.userRank <= 50
                    ? 'Bạn đang ở top 50! Hãy thử thách bản thân thêm! 🚀'
                    : 'Làm thêm test để cải thiện vị trí của bạn! 📈'}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                const fullLeaderboard = document.querySelector('#full-leaderboard');
                fullLeaderboard?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              Xem toàn bộ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 