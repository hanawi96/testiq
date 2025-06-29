import React, { useState, useEffect, useRef } from 'react';

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

const getBadgeInfo = (badge: string) => {
  switch(badge) {
    case 'genius': return { 
      label: 'Thiên tài', 
      color: 'purple', 
      icon: '🧠',
      gradient: 'from-purple-400 to-indigo-500',
      bgGradient: 'from-purple-50 to-indigo-50',
      textColor: 'text-purple-700'
    };
    case 'superior': return { 
      label: 'Xuất sắc', 
      color: 'blue', 
      icon: '🏆',
      gradient: 'from-blue-400 to-cyan-500',
      bgGradient: 'from-blue-50 to-cyan-50',
      textColor: 'text-blue-700'
    };
    case 'above': return { 
      label: 'Trên TB', 
      color: 'green', 
      icon: '⭐',
      gradient: 'from-green-400 to-emerald-500',
      bgGradient: 'from-green-50 to-emerald-50',
      textColor: 'text-green-700'
    };
    default: return { 
      label: 'Tốt', 
      color: 'orange', 
      icon: '✨',
      gradient: 'from-orange-400 to-amber-500',
      bgGradient: 'from-orange-50 to-amber-50',
      textColor: 'text-orange-700'
    };
  }
};

// Client-side cache for instant navigation
const clientCache = new Map<number, { data: LeaderboardEntry[], stats: LeaderboardStats, totalPages: number, timestamp: number }>();
const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes client cache

// Pre-import backend service to avoid dynamic import delays
let backendService: any = null;
const initBackend = async () => {
  if (!backendService) {
    backendService = await import('../../backend');
  }
  return backendService;
};

export default function LeaderboardList() {
  const [data, setData] = useState<LeaderboardEntry[]>([]);
  const [stats, setStats] = useState<LeaderboardStats>({
    totalParticipants: 0,
    highestScore: 0,
    averageScore: 0,
    geniusPercentage: 0
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [pageLoading, setPageLoading] = useState(false);
  const [error, setError] = useState('');
  const prefetchedPages = useRef(new Set<number>());

  const itemsPerPage = 20;

  // Initialize backend service on mount
  useEffect(() => {
    initBackend();
  }, []);

  const loadData = async (page: number = 1, isPageChange: boolean = false) => {
    try {
      // Check client cache first
      const cacheKey = page;
      const cached = clientCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        console.log(`⚡ Using client cache for page ${page}`);
        // Filter out top 3 entries
        const filteredData = cached.data.filter((entry: LeaderboardEntry) => entry.rank > 3);
        setData(filteredData);
        setStats(cached.stats);
        setTotalPages(cached.totalPages);
        if (isPageChange) setPageLoading(false);
        else setLoading(false);
        
        // Prefetch adjacent pages in background
        prefetchAdjacentPages(page, cached.totalPages);
        return;
      }

      // Use different loading states
      if (isPageChange) {
        setPageLoading(true);
      } else {
        setLoading(true);
      }
      setError('');
      
      const backend = await initBackend();
      const result = await backend.getLeaderboard(page, itemsPerPage);
      
      if (result.error) {
        throw new Error('Không thể tải dữ liệu');
      }
      
      const resultData = result.data || [];
      const resultStats = result.stats || stats;
      const resultTotalPages = result.totalPages;

      // Filter out top 3 entries
      const filteredData = resultData.filter((entry: LeaderboardEntry) => entry.rank > 3);
      
      setData(filteredData);
      setStats(resultStats);
      setTotalPages(resultTotalPages);

      // Cache the result (original data)
      clientCache.set(cacheKey, {
        data: resultData,
        stats: resultStats,
        totalPages: resultTotalPages,
        timestamp: Date.now()
      });

      // Prefetch adjacent pages
      prefetchAdjacentPages(page, resultTotalPages);
      
    } catch (err: any) {
      console.error('Load error:', err);
      setError('Không thể tải bảng xếp hạng. Vui lòng thử lại.');
      if (!isPageChange) setData([]);
    } finally {
      setLoading(false);
      setPageLoading(false);
    }
  };

  // Smart prefetching of adjacent pages
  const prefetchAdjacentPages = async (currentPage: number, totalPages: number) => {
    const pagesToPrefetch = [];
    
    // Previous page
    if (currentPage > 1 && !prefetchedPages.current.has(currentPage - 1)) {
      pagesToPrefetch.push(currentPage - 1);
    }
    
    // Next page  
    if (currentPage < totalPages && !prefetchedPages.current.has(currentPage + 1)) {
      pagesToPrefetch.push(currentPage + 1);
    }

    // Prefetch in background
    pagesToPrefetch.forEach(async (page) => {
      if (prefetchedPages.current.has(page)) return;
      prefetchedPages.current.add(page);

      try {
        console.log(`🔮 Prefetching page ${page}`);
        const backend = await initBackend();
        const result = await backend.getLeaderboard(page, itemsPerPage);
        
        if (result.data) {
          clientCache.set(page, {
            data: result.data,
            stats: result.stats,
            totalPages: result.totalPages,
            timestamp: Date.now()
          });
          console.log(`✅ Prefetched page ${page}`);
        }
      } catch (error) {
        console.warn(`Failed to prefetch page ${page}:`, error);
        prefetchedPages.current.delete(page);
      }
    });
  };

  useEffect(() => {
    loadData(currentPage, currentPage > 1);
  }, [currentPage]);

  const handlePageChange = (page: number) => {
    if (page === currentPage || pageLoading) return;
    setCurrentPage(page);
    
    // Cuộn đến đầu bảng xếp hạng thay vì đầu trang
    const leaderboardElement = document.getElementById('leaderboard-container');
    if (leaderboardElement) {
      leaderboardElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const getAvatarInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const getRelativeTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diff = now.getTime() - date.getTime();
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      
      if (days === 0) return 'Hôm nay';
      if (days === 1) return 'Hôm qua';
      if (days < 7) return `${days} ngày trước`;
      if (days < 30) return `${Math.floor(days / 7)} tuần trước`;
      return `${Math.floor(days / 30)} tháng trước`;
    } catch {
      return 'Gần đây';
    }
  };

  const getRankTier = (rank: number) => {
    if (rank <= 5) return { tier: 'Diamond', color: 'from-blue-400 via-purple-400 to-indigo-500', icon: '💎' };
    if (rank <= 10) return { tier: 'Platinum', color: 'from-gray-300 via-gray-400 to-gray-500', icon: '🥈' };
    if (rank <= 25) return { tier: 'Gold', color: 'from-yellow-400 via-yellow-500 to-orange-500', icon: '🥇' };
    if (rank <= 50) return { tier: 'Silver', color: 'from-gray-400 to-gray-600', icon: '🥉' };
    return { tier: 'Bronze', color: 'from-amber-600 to-orange-700', icon: '🏅' };
  };

  return (
    <div className="w-full">
      <div className="w-full">
        {/* Loading State */}
        {loading && data.length === 0 && (
          <div className="bg-white rounded-3xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 p-8 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gray-300 rounded-2xl animate-pulse"></div>
                  <div className="space-y-2">
                    <div className="w-48 h-6 bg-gray-300 rounded animate-pulse"></div>
                    <div className="w-32 h-4 bg-gray-300 rounded animate-pulse"></div>
                  </div>
                </div>
                <div className="w-32 h-8 bg-gray-300 rounded-full animate-pulse"></div>
              </div>
            </div>
            
            <div className="p-8 space-y-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl p-6 border border-gray-200 animate-pulse">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-6">
                      <div className="w-16 h-16 bg-gray-300 rounded-2xl"></div>
                      <div className="space-y-2">
                        <div className="w-32 h-6 bg-gray-300 rounded"></div>
                        <div className="w-24 h-4 bg-gray-300 rounded"></div>
                      </div>
                    </div>
                    <div className="text-right space-y-2">
                      <div className="w-16 h-10 bg-gray-300 rounded"></div>
                      <div className="w-20 h-6 bg-gray-300 rounded-full"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-white rounded-3xl shadow-lg border border-red-200 p-12 text-center">
            <div className="w-20 h-20 bg-red-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Không thể tải dữ liệu</h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">{error}</p>
            <button 
              onClick={() => {
                clientCache.clear();
                prefetchedPages.current.clear();
                loadData(currentPage);
              }}
              className="inline-flex items-center px-6 py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Thử lại
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && data.length === 0 && (
          <div className="bg-white rounded-3xl shadow-lg border border-gray-200 p-16 text-center">
            <div className="w-24 h-24 bg-blue-100 rounded-3xl flex items-center justify-center mx-auto mb-8">
              <span className="text-4xl">🏆</span>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Chưa có dữ liệu xếp hạng</h2>
            <p className="text-gray-600 mb-10 max-w-md mx-auto text-lg">
              Hãy là người đầu tiên tham gia test IQ và xuất hiện trên bảng xếp hạng!
            </p>
            <a 
              href="/test/iq" 
              className="inline-flex items-center px-8 py-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Làm Test IQ
            </a>
          </div>
        )}

        {/* Leaderboard List */}
        {!loading && !error && data.length > 0 && (
          <div id="leaderboard-container" className="bg-white rounded-3xl shadow-lg border border-gray-200 overflow-hidden">
            {/* Progress indicator for page loading */}
            {pageLoading && (
              <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500 z-10 rounded-t-3xl"></div>
            )}
            
            {/* Header */}
            <div className="bg-gray-50 p-8 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 via-orange-400 to-red-400 rounded-2xl flex items-center justify-center shadow-lg">
                    <span className="text-2xl">🏆</span>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">Bảng xếp hạng chi tiết</h3>
                    <p className="text-gray-600 mt-1">Từ hạng 4 trở đi • Cập nhật liên tục</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  {pageLoading && (
                    <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  )}
                                     <div className="bg-white px-4 py-2 rounded-full border border-gray-300 shadow-sm">
                     <span className="text-sm font-medium text-gray-700">
                       Trang {currentPage}/{totalPages} • {stats.totalParticipants.toLocaleString()} người
                     </span>
                   </div>
                </div>
              </div>
            </div>
            
            {/* List */}
            <div className={`p-8 space-y-4 ${pageLoading ? 'opacity-70' : 'opacity-100'}`}>
              {data.map((entry, index) => {
                const badgeInfo = getBadgeInfo(entry.badge);
                const rankTier = getRankTier(entry.rank);
                const isTopTier = entry.rank <= 10;
                
                                  return (
                    <div 
                      key={`${entry.rank}-${entry.score}-${entry.date}`} 
                      className={`group relative bg-white/80 rounded-2xl p-6 border border-gray-200 transition-all duration-200 hover:shadow-lg hover:border-gray-300 ${
                        isTopTier ? 'border-blue-200 shadow-sm' : ''
                      }`}
                    >
                    {/* Rank Tier Indicator */}
                    {isTopTier && (
                      <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center shadow-lg">
                        <span className="text-white text-xs font-bold">✨</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-6">
                        {/* Rank Badge with Tier */}
                                                 <div className="relative">
                           <div className={`w-16 h-16 bg-gradient-to-br ${rankTier.color} rounded-2xl flex items-center justify-center shadow-md`}>
                             <span className="text-white font-bold text-lg">#{entry.rank}</span>
                           </div>
                           <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-sm">
                             <span className="text-xs">{rankTier.icon}</span>
                           </div>
                         </div>
                        
                        {/* User Info */}
                        <div className="space-y-2">
                          <div className="flex items-center space-x-3">
                                                         <h4 className="text-xl font-bold text-gray-900">
                               {entry.name}
                             </h4>
                            {isTopTier && (
                              <div className="bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 text-xs px-3 py-1.5 rounded-full font-semibold shadow-sm">
                                ⭐ Top {entry.rank <= 5 ? '5' : '10'}
                              </div>
                            )}
                          </div>
                          
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <div className="flex items-center space-x-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              <span className="font-medium">{entry.location}</span>
                            </div>
                            <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                            <div className="flex items-center space-x-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span>{getRelativeTime(entry.date)}</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-3">
                            <div className="text-xs text-gray-500 bg-gray-100/60 px-2 py-1 rounded-lg">
                              Tier: {rankTier.tier}
                            </div>
                            <div className="text-xs text-gray-500">
                              {formatDate(entry.date)}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Score & Badge */}
                      <div className="text-right space-y-3">
                                                 <div className={`text-5xl font-bold ${
                           isTopTier 
                             ? 'bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent' 
                             : 'text-gray-700'
                         }`}>
                          {entry.score}
                        </div>
                        
                                                 <div className={`inline-flex items-center px-4 py-2 rounded-2xl font-semibold text-sm shadow-sm bg-gradient-to-r ${badgeInfo.bgGradient} ${badgeInfo.textColor} border border-gray-200`}>
                          <span className="mr-2">{badgeInfo.icon}</span>
                          {badgeInfo.label}
                        </div>
                        
                        <div className="text-xs text-gray-500 font-medium">
                          IQ Score
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-4 pt-4 border-t border-gray-200/50">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-6">
                          <div className="text-gray-600">
                            <span className="font-semibold text-gray-900">Hạng #{entry.rank}</span> trên {stats.totalParticipants.toLocaleString()}
                          </div>
                          <div className="text-gray-600">
                            Percentile: <span className="font-semibold text-gray-900">{Math.round((stats.totalParticipants - entry.rank) / stats.totalParticipants * 100)}%</span>
                          </div>
                        </div>
                        
                                                 <button 
                           onClick={() => {
                             const percentile = Math.round((stats.totalParticipants - entry.rank) / stats.totalParticipants * 100);
                             const timeSpent = Math.floor(Math.random() * 1200) + 600; // 10-30 minutes
                             window.open(`/result?name=${encodeURIComponent(entry.name)}&score=${entry.score}&percentile=${percentile}&timeSpent=${timeSpent}`, '_blank');
                           }}
                           className="text-blue-600 hover:text-blue-700 font-medium flex items-center space-x-1"
                         >
                           <span>Chi tiết</span>
                           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                           </svg>
                         </button>
                      </div>
                      
                      {/* Achievement Progress Bar */}
                      <div className="mt-3">
                                                 <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                           <div 
                             className={`h-full bg-gradient-to-r ${badgeInfo.gradient} rounded-full`}
                             style={{ width: `${Math.min(100, (entry.score / stats.highestScore) * 100)}%` }}
                           ></div>
                         </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-gray-50 p-6 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600 bg-white px-3 py-2 rounded-lg border border-gray-300">
                    Trang {currentPage} / {totalPages} • {data.length} người
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1 || pageLoading}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      ← Trước
                    </button>

                    <div className="flex items-center space-x-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const page = i + Math.max(1, currentPage - 2);
                        if (page > totalPages) return null;
                        
                        return (
                          <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            disabled={pageLoading}
                            className={`w-10 h-10 text-sm font-medium rounded-lg disabled:opacity-50 ${
                              currentPage === page
                                ? 'bg-blue-600 text-white'
                                : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {page}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages || pageLoading}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Sau →
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}