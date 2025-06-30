import React, { useState, useEffect } from 'react';

interface TopTenEntry {
  rank: number;
  name: string;
  score: number;
  location: string;
  date: string;
  badge: string;
  user_id?: string;
  gender?: string;
  age?: number;
}

interface Props {
  initialData?: TopTenEntry[];
}

// Special badges for top 10
const getSpecialBadge = (rank: number) => {
  switch(rank) {
    case 1: return { emoji: '👑', label: 'Vua IQ', color: 'from-yellow-400 to-yellow-600' };
    case 2: return { emoji: '🥈', label: 'Á vương', color: 'from-gray-400 to-gray-600' };
    case 3: return { emoji: '🥉', label: 'Hạng 3', color: 'from-amber-500 to-amber-700' };
    case 4: case 5: return { emoji: '⭐', label: 'Tinh anh', color: 'from-blue-500 to-blue-700' };
    case 6: case 7: return { emoji: '🔥', label: 'Xuất sắc', color: 'from-purple-500 to-purple-700' };
    case 8: case 9: case 10: return { emoji: '💎', label: 'Kim cương', color: 'from-indigo-500 to-indigo-700' };
    default: return { emoji: '🎯', label: 'Top 10', color: 'from-green-500 to-green-700' };
  }
};

const getBadgeInfo = (badge: string) => {
  switch(badge) {
    case 'genius': return { label: 'Thiên tài', color: 'purple' };
    case 'superior': return { label: 'Xuất sắc', color: 'blue' };
    case 'above': return { label: 'Trên TB', color: 'green' };
    default: return { label: 'Tốt', color: 'orange' };
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

const formatDate = (dateString: string) => {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Hôm nay';
    if (diffDays === 1) return 'Hôm qua';
    if (diffDays < 7) return `${diffDays} ngày`;
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
  } catch {
    return 'Gần đây';
  }
};

const handleProfileClick = (userId?: string, name?: string) => {
  if (userId) {
    window.location.href = `/profile?user=${userId}`;
  } else {
    // For anonymous users, show a modal or redirect to test
    console.log(`Anonymous user: ${name}`);
  }
};

export default function TopTenLeaderboard({ initialData }: Props) {
  const [topTen, setTopTen] = useState<TopTenEntry[]>(initialData || []);
  const [loading, setLoading] = useState(!initialData?.length);

  useEffect(() => {
    if (initialData?.length) return;
    
    const loadTopTen = async () => {
      setLoading(true);
      try {
        const backend = await import('../../backend');
        const result = await backend.getLeaderboard(1, 10);
        
        if (result.data?.length) {
          setTopTen(result.data.slice(0, 10));
        }
      } catch (error) {
        console.error('Error loading top 10:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadTopTen();
  }, [initialData]);

  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(10)].map((_, i) => (
          <div key={i} className="animate-pulse bg-gray-200 rounded-xl h-16"></div>
        ))}
      </div>
    );
  }

  if (!topTen.length) {
    return (
      <div className="text-center py-8">
        <span className="text-4xl mb-3 block">🏆</span>
        <p className="text-gray-600">Chưa có dữ liệu xếp hạng</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-1">Top 10 Thiên Tài IQ</h2>
        <p className="text-sm text-gray-600">Nhấn vào profile để xem hành trình phát triển trí tuệ</p>
      </div>

      {/* Top 10 List - Desktop 2 cols, Mobile 1 col */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {topTen.map((entry) => {
          const specialBadge = getSpecialBadge(entry.rank);
          const badgeInfo = getBadgeInfo(entry.badge);
          const isTop3 = entry.rank <= 3;
          const isClickable = !!entry.user_id;
          
          return (
            <div
              key={`${entry.rank}-${entry.score}`}
              onClick={() => isClickable && handleProfileClick(entry.user_id, entry.name)}
              className={`
                relative group rounded-xl p-3 border transition-all duration-200 w-full
                ${isTop3 
                  ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200 shadow-sm' 
                  : 'bg-white border-gray-200 hover:border-gray-300'
                }
                ${isClickable ? 'cursor-pointer hover:shadow-md active:scale-[0.98]' : 'cursor-default'}
              `}
            >
              {/* Rank Badge - Special for top 10 */}
              <div className="absolute -top-1 -left-1 z-10">
                <div className={`w-8 h-8 bg-gradient-to-br ${specialBadge.color} rounded-full flex items-center justify-center border-2 border-white shadow-sm`}>
                  <span className="text-white text-xs font-bold">#{entry.rank}</span>
                </div>
              </div>

              {/* Special Badge Corner */}
              <div className="absolute -top-1 -right-1 z-10">
                <div className="bg-white rounded-full p-1 shadow-sm border border-gray-200">
                  <span className="text-sm">{specialBadge.emoji}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pl-6 pr-6">
                {/* User Info - Compact */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <h3 className="font-bold text-gray-900 truncate text-sm">
                      {entry.name}
                    </h3>
                    {getGenderIcon(entry.gender) && (
                      <span className="text-xs opacity-70">{getGenderIcon(entry.gender)}</span>
                    )}
                    {entry.age && (
                      <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full">
                        {entry.age}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2 mt-1 text-xs text-gray-500">
                    <span className="flex items-center">
                      <span className="mr-1">📍</span>
                      <span className="truncate max-w-16 md:max-w-20">{entry.location}</span>
                    </span>
                    <span className="flex items-center">
                      <span className="mr-1">⏰</span>
                      <span className="truncate">{formatDate(entry.date)}</span>
                    </span>
                  </div>
                </div>

                {/* Score & Badges - Right aligned */}
                <div className="text-right flex-shrink-0 ml-3">
                  <div className={`text-lg font-bold mb-1 ${
                    isTop3 ? 'text-yellow-600' : 'text-gray-700'
                  }`}>
                    {entry.score}
                  </div>
                  
                  <div className="flex flex-col md:flex-row items-end md:items-center space-y-1 md:space-y-0 md:space-x-1 justify-end">
                    <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium bg-${badgeInfo.color}-100 text-${badgeInfo.color}-700`}>
                      {badgeInfo.label}
                    </span>
                    <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full font-medium">
                      {specialBadge.label}
                    </span>
                  </div>
                </div>
              </div>

              {/* Click indicator for registered users */}
              {isClickable && (
                <div className="absolute bottom-1 right-2 text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  👆 Xem profile
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Call to action */}
      <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
        <div className="text-center">
          <h3 className="font-bold text-blue-900 mb-1">Bạn có thể làm được!</h3>
          <p className="text-sm text-blue-700 mb-3">Tham gia thử thách và leo lên Top 10</p>
          <a 
            href="/test/iq"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            🧠 Làm Test IQ ngay
          </a>
        </div>
      </div>
    </div>
  );
} 