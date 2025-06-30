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

      {/* Danh sách xung quanh - Compact Grid Layout */}
      <div className="p-6">
        {(() => {
          const currentUserIndex = data.surrounding.findIndex(entry => entry.user_id === userId);
          const aboveUsers = data.surrounding.slice(0, currentUserIndex);
          const currentUser = data.surrounding[currentUserIndex];
          const belowUsers = data.surrounding.slice(currentUserIndex + 1);
          
          // Ensure we have exactly 4 users above and 4 below if possible
          const topUsers = aboveUsers.slice(-4);
          const bottomUsers = belowUsers.slice(0, 4);
          
          const UserCard = ({ entry, isCurrentUser = false }: { entry: LocalRankingEntry, isCurrentUser?: boolean }) => {
            const badgeInfo = getBadgeInfo(entry.badge);
            const isTopRank = entry.rank <= 10;
            
            return (
              <div className={`relative rounded-lg p-3 sm:p-4 border transition-all duration-200 ${
                isCurrentUser 
                  ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-300 shadow-md ring-2 ring-yellow-200' 
                  : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
              }`}>
                {isCurrentUser && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">!</span>
                  </div>
                )}
                
                                 <div className="flex items-center space-x-2 sm:space-x-3">
                   {/* Responsive Rank */}
                   <div className={`w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br ${getRankColor(entry.rank, isCurrentUser)} rounded-lg flex items-center justify-center flex-shrink-0`}>
                     <span className="text-white font-bold text-xs sm:text-sm">#{entry.rank}</span>
                   </div>
                  
                  {/* User Info - Compact */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-1">
                      <h4 className={`font-bold text-sm truncate ${isCurrentUser ? 'text-yellow-800' : 'text-gray-900'}`}>
                        {isCurrentUser ? 'Bạn' : entry.name}
                      </h4>
                      {getGenderIcon(entry.gender) && (
                        <span className="text-xs">{getGenderIcon(entry.gender)}</span>
                      )}
                      {entry.age && (
                        <span className="text-xs bg-gray-200 text-gray-600 px-1 rounded text-center min-w-[20px]">
                          {entry.age}
                        </span>
                      )}
                    </div>
                    
                                         <div className="flex items-center space-x-1 text-xs text-gray-500 mt-0.5">
                       <span className="truncate max-w-[60px] sm:max-w-[80px]">{entry.location}</span>
                       {entry.duration && (
                         <>
                           <span className="hidden sm:inline">•</span>
                           <span className="text-blue-600" title={`Thời gian: ${formatDuration(entry.duration)}`}>
                             <span className="sm:hidden">⏱️</span>
                             <span className="hidden sm:inline">⏱️{formatDuration(entry.duration)}</span>
                             <span className="sm:hidden">{formatDuration(entry.duration)}</span>
                           </span>
                         </>
                       )}
                     </div>
                  </div>
                  
                                     {/* Score - Responsive */}
                   <div className="text-right flex-shrink-0">
                     <div className={`text-lg sm:text-xl font-bold ${isCurrentUser ? 'text-yellow-600' : 'text-gray-700'}`}>
                       {entry.score}
                     </div>
                     <div className={`text-xs px-1.5 py-0.5 rounded-full bg-${badgeInfo.color}-100 text-${badgeInfo.color}-700`}>
                       {badgeInfo.icon}
                     </div>
                   </div>
                </div>
              </div>
            );
          };
          
          return (
            <div className="space-y-4">
                             {/* 4 users phía trên - Responsive Grid */}
               {topUsers.length > 0 && (
                 <div>
                   <h4 className="text-sm font-medium text-gray-600 mb-2 text-center">Phía trên bạn</h4>
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                     {topUsers.map((entry) => (
                       <UserCard key={`${entry.rank}-${entry.user_id || entry.name}`} entry={entry} />
                     ))}
                   </div>
                 </div>
               )}
              
              {/* Current User - Full Width */}
              {currentUser && (
                <div>
                  <h4 className="text-sm font-medium text-yellow-600 mb-2 text-center">🎯 Vị trí của bạn</h4>
                  <UserCard entry={currentUser} isCurrentUser={true} />
                </div>
              )}
              
                             {/* 4 users phía dưới - Responsive Grid */}
               {bottomUsers.length > 0 && (
                 <div>
                   <h4 className="text-sm font-medium text-gray-600 mb-2 text-center">Phía dưới bạn</h4>
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                     {bottomUsers.map((entry) => (
                       <UserCard key={`${entry.rank}-${entry.user_id || entry.name}`} entry={entry} />
                     ))}
                   </div>
                 </div>
               )}
            </div>
          );
        })()}

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