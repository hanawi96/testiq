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
  duration?: number; // Thời gian hoàn thành (giây)
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

// ✅ SMART: Format thời gian hoàn thành (compact cho top 10)
const formatDuration = (seconds?: number): string => {
  if (!seconds || seconds <= 0) return '';
  
  const minutes = Math.floor(seconds / 60);
  if (minutes === 0) return `${seconds}s`;
  return `${minutes}m`;
};

const handleProfileClick = (userId?: string, name?: string) => {
  if (userId) {
    // TODO: Cần lấy username từ userId, tạm thời dùng userId
    window.location.href = `/u/${userId}`;
  } else {
    // For anonymous users, show a modal or redirect to test
    console.log(`Anonymous user: ${name}`);
  }
};

export default function TopTenLeaderboard({ initialData }: Props) {
  // ✅ SKELETON LOADING: Luôn bắt đầu với loading để có smooth effect
  const [topTen, setTopTen] = useState<TopTenEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (initialData?.length) {
        // Có initialData: hiển thị skeleton ngắn rồi show data
        setTimeout(() => {
          setTopTen(initialData);
          setLoading(false);
        }, 200); // Skeleton loading ngắn cho UX mượt mà
      } else {
        // Không có initialData: fetch từ client
        try {
          const backend = await import('@/backend');
          const result = await backend.getLeaderboard(1, 10);
          
          if (result.data?.length) {
            setTopTen(result.data.slice(0, 10));
          }
        } catch (error) {
          console.error('Error loading top 10:', error);
        } finally {
          setLoading(false);
        }
      }
    };
    
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-2">
        {/* Header skeleton */}
        <div className="text-center mb-6">
          <div className="w-48 h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mx-auto mb-2"></div>
          <div className="w-64 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mx-auto"></div>
        </div>

        {/* Top 10 skeleton - 2 cols layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded-xl h-20 relative" 
                 style={{ animationDelay: `${i * 50}ms` }}>
              {/* Skeleton rank badge */}
              <div className="absolute -top-1 -left-1 w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full animate-pulse"></div>
              {/* Skeleton corner badge */}
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-gray-300 dark:bg-gray-600 rounded-full animate-pulse"></div>
            </div>
          ))}
        </div>

        {/* Call to action skeleton */}
        <div className="mt-6 p-4 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse">
          <div className="text-center space-y-2">
            <div className="w-32 h-5 bg-gray-300 dark:bg-gray-600 rounded mx-auto"></div>
            <div className="w-48 h-4 bg-gray-300 dark:bg-gray-600 rounded mx-auto"></div>
            <div className="w-36 h-8 bg-gray-300 dark:bg-gray-600 rounded mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!topTen.length) {
    return (
      <div className="text-center py-8">
        <span className="text-4xl mb-3 block">🏆</span>
        <p className="text-gray-600 dark:text-gray-400">Chưa có dữ liệu xếp hạng</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-1">Top 10 Thiên Tài IQ</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">Nhấn vào profile để xem hành trình phát triển trí tuệ</p>
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
                relative group rounded-xl p-3 border w-full
                ${isTop3 
                  ? 'bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-yellow-200 dark:border-yellow-800 shadow-sm' 
                  : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }
                ${isClickable ? 'cursor-pointer hover:shadow-md active:scale-[0.98]' : 'cursor-default'}
              `}
            >
              {/* Rank Badge - Special for top 10 */}
              <div className="absolute -top-1 -left-1 z-10">
                <div className={`w-10 h-8 bg-gradient-to-br ${specialBadge.color} rounded-full flex items-center justify-center border-2 border-white dark:border-gray-800 shadow-sm`}>
                  <span className="text-white text-xs font-bold">{entry.rank}</span>
                </div>
              </div>

              {/* Special Badge Corner */}
              <div className="absolute -top-1 -right-1 z-10">
                <div className="bg-white dark:bg-gray-700 rounded-full p-1 shadow-sm border border-gray-200 dark:border-gray-600">
                  <span className="text-sm">{specialBadge.emoji}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pl-6 pr-6">
                {/* User Info - Compact */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <h3 className="font-bold text-gray-900 dark:text-gray-100 truncate text-sm">
                      {entry.name}
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
                    isTop3 ? 'text-yellow-600 dark:text-yellow-500' : 'text-gray-700 dark:text-gray-300'
                  }`}>
                    {entry.score}
                  </div>
                  
                  <div className="flex flex-col md:flex-row items-end md:items-center space-y-1 md:space-y-0 md:space-x-1 justify-end">
                    <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium bg-${badgeInfo.color}-100 dark:bg-${badgeInfo.color}-900/30 text-${badgeInfo.color}-700 dark:text-${badgeInfo.color}-400`}>
                      {badgeInfo.label}
                    </span>
                    <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-1.5 py-0.5 rounded-full font-medium">
                      {entry.score >= 145 ? 'Top 1%' : entry.score >= 130 ? 'Top 5%' : entry.score >= 120 ? 'Top 10%' : ''}
                    </span>
                  </div>
                </div>
              </div>

              {/* Verified indicator */}
              {entry.user_id && (
                <div className="absolute bottom-1 right-2 text-xs text-gray-400 opacity-0 group-hover:opacity-100">
                  ✓ Đã xác thực
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Call to action */}
      <div className="mt-6 p-4 bg-gray-100 dark:bg-gray-800 rounded-xl text-center">
        <p className="text-gray-700 dark:text-gray-300 font-medium mb-1">Bạn có thể đạt thứ hạng cao?</p>
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">Thử thách bản thân với bài test IQ chuẩn quốc tế</p>
        <a 
          href="/test/iq" 
          className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
        >
          Làm Test IQ Ngay
        </a>
      </div>
    </div>
  );
} 