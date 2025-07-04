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
        const backend = await import('@/backend');
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
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Làm Test IQ
        </a>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="animate-pulse">
          <div className="flex items-center justify-between mb-4">
            <div className="w-32 h-6 bg-gray-300 dark:bg-gray-600 rounded"></div>
            <div className="w-20 h-4 bg-gray-300 dark:bg-gray-600 rounded"></div>
          </div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-red-200 dark:border-red-800 p-6 text-center">
        <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center mx-auto mb-3">
          <span className="text-xl text-red-500 dark:text-red-400">⚠️</span>
        </div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">Không thể tải vị trí</h3>
        <p className="text-gray-600 dark:text-gray-400 text-sm">{error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-800 dark:to-blue-900/20 rounded-2xl p-8 text-center border border-gray-200 dark:border-gray-700">
        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">📊</span>
        </div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">Chưa có kết quả test</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">Bạn chưa có kết quả nào trong bảng xếp hạng</p>
        <a 
          href="/test/iq" 
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Làm Test IQ ngay
        </a>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header với thông tin vị trí */}
      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 p-4 sm:p-6 border-b border-yellow-200 dark:border-yellow-900/30">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center">
              <span className="text-white text-lg">🎯</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Vị trí của bạn</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Xung quanh bạn trong bảng xếp hạng</p>
            </div>
          </div>
          <div className="text-left sm:text-right">
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-500">#{data.userRank}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">trên {data.totalParticipants} người</div>
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
              <div className={`relative group rounded-xl p-3 border w-full ${
                isCurrentUser 
                  ? 'bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-yellow-200 dark:border-yellow-800 shadow-sm' 
                  : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-md active:scale-[0.98]'
              }`}>
                {/* Rank Badge - Góc trái trên */}
                <div className="absolute -top-1 -left-1 z-10">
                  <div className={`w-10 h-8 bg-gradient-to-br ${getRankColor(entry.rank, isCurrentUser)} rounded-full flex items-center justify-center border-2 border-white dark:border-gray-800 shadow-sm`}>
                    <span className="text-white text-xs font-bold">{entry.rank}</span>
                  </div>
                </div>

                {/* Current User Indicator */}
                {isCurrentUser && (
                  <div className="absolute -top-1 -right-1 z-10">
                    <div className="bg-yellow-500 rounded-full p-1 shadow-sm border border-white dark:border-gray-800">
                      <span className="text-sm text-white">👑</span>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pl-6 pr-2">
                  {/* User Info - Compact */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <h3 className={`font-bold truncate text-sm ${isCurrentUser ? 'text-yellow-800 dark:text-yellow-400' : 'text-gray-900 dark:text-gray-100'}`}>
                        {isCurrentUser ? `${entry.name} (Bạn)` : entry.name}
                      </h3>
                      {getGenderIcon(entry.gender) && (
                        <span className="text-xs opacity-70">{getGenderIcon(entry.gender)}</span>
                      )}
                      {entry.age && (
                        <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-1.5 py-0.5 rounded-full">
                          {entry.age}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2 mt-1 text-xs text-gray-500 dark:text-gray-400">
                      <span className="flex items-center">
                        <span className="mr-1">📍</span>
                        <span className="truncate max-w-16 md:max-w-20">{entry.location}</span>
                      </span>
                      <span className="flex items-center">
                        <span className="mr-1">⏰</span>
                        <span className="truncate">{formatDate(entry.date)}</span>
                      </span>
                      {entry.duration && (
                        <span className="flex items-center" title={`Thời gian hoàn thành: ${formatDuration(entry.duration)}`}>
                          <span className="mr-1">⏱️</span>
                          <span className="truncate">{formatDuration(entry.duration)}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Score & Badges - Right aligned */}
                  <div className="text-right flex-shrink-0 ml-3">
                    <div className={`text-lg font-bold mb-1 ${
                      isCurrentUser ? 'text-yellow-600 dark:text-yellow-500' : 
                      isTopRank ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'
                    }`}>
                      {entry.score}
                    </div>
                    
                    <div className="flex flex-col md:flex-row items-end md:items-center space-y-1 md:space-y-0 md:space-x-1 justify-end">
                      <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium bg-${badgeInfo.color}-100 dark:bg-${badgeInfo.color}-900/30 text-${badgeInfo.color}-700 dark:text-${badgeInfo.color}-400`}>
                        {badgeInfo.label}
                      </span>
                      {isTopRank && (
                        <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-1.5 py-0.5 rounded-full font-medium">
                          Top {entry.rank <= 3 ? '3' : entry.rank <= 10 ? '10' : ''}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          };
          
          return (
            <div className="space-y-6">
              {/* Người dùng ở trên */}
              {topUsers.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Người dùng ở trên bạn</h4>
                  <div className="space-y-2">
                    {topUsers.map(entry => (
                      <UserCard key={entry.user_id || entry.rank} entry={entry} />
                    ))}
                  </div>
                </div>
              )}
              
              {/* Người dùng hiện tại */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-yellow-600 dark:text-yellow-500">Vị trí của bạn</h4>
                <UserCard entry={currentUser} isCurrentUser={true} />
              </div>
              
              {/* Người dùng ở dưới */}
              {bottomUsers.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Người dùng ở dưới bạn</h4>
                  <div className="space-y-2">
                    {bottomUsers.map(entry => (
                      <UserCard key={entry.user_id || entry.rank} entry={entry} />
                    ))}
                  </div>
                </div>
              )}
              
              {/* Call to action */}
              <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-xl text-center">
                <p className="text-gray-700 dark:text-gray-300 font-medium mb-1">Muốn cải thiện thứ hạng?</p>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">Luyện tập thường xuyên để nâng cao chỉ số IQ</p>
                <a 
                  href="/test/iq" 
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Làm Test IQ Lại
                </a>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
} 