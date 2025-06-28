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
    case 'genius': return { label: 'Thiên tài', color: 'bg-purple-500' };
    case 'superior': return { label: 'Xuất sắc', color: 'bg-blue-500' };
    case 'above': return { label: 'Trên TB', color: 'bg-green-500' };
    default: return { label: 'Tốt', color: 'bg-orange-500' };
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
        setData(cached.data);
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

      setData(resultData);
      setStats(resultStats);
      setTotalPages(resultTotalPages);

      // Cache the result
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 py-12">
      <div className="max-w-6xl mx-auto px-4">
        
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white">
              <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path>
              <path d="M14 9h1.5a2.5 2.5 0 0 0 0-5H14"></path>
              <path d="M6 9h8"></path>
              <path d="M6 9v10a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V9"></path>
              <path d="M12 16l-1-1 1-1 1 1-1 1"></path>
            </svg>
          </div>
          
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Bảng <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-600 to-orange-600">xếp hạng</span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-8">
            Top những người có điểm IQ cao nhất
          </p>

          {/* Stats */}
          {!loading && (
            <div className="grid md:grid-cols-4 gap-4 mb-8">
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
            </div>
          )}
        </div>

        {/* Initial Loading State - Only for first load */}
        {loading && data.length === 0 && (
          <div className="text-center py-12">
            <div className="w-12 h-12 border-3 border-yellow-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Đang tải bảng xếp hạng...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center max-w-md mx-auto mb-8">
            <div className="text-red-600 text-xl mb-2">⚠️</div>
            <h3 className="text-lg font-semibold text-red-800 mb-2">Lỗi tải dữ liệu</h3>
            <p className="text-red-600 mb-4">{error}</p>
            <button 
              onClick={() => {
                // Clear cache on retry
                clientCache.clear();
                prefetchedPages.current.clear();
                loadData(currentPage);
              }}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Thử lại
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && data.length === 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="text-6xl mb-6">🏆</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Chưa có dữ liệu xếp hạng</h2>
            <p className="text-gray-600 mb-8">Hãy là người đầu tiên tham gia test IQ!</p>
            <a 
              href="/test/iq" 
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-xl font-bold transition-all inline-flex items-center"
            >
              🚀 Làm Test IQ
            </a>
          </div>
        )}

        {/* Leaderboard Table - Show even when page loading */}
        {!loading && !error && data.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden relative">
            {/* Background loading indicator for page changes */}
            {pageLoading && (
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-500 to-orange-500 animate-pulse z-10"></div>
            )}
            
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">Bảng xếp hạng</h2>
              <div className="flex items-center gap-3">
                {pageLoading && (
                  <div className="w-4 h-4 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
                )}
                <div className="text-sm text-gray-500">
                  Trang {currentPage}/{totalPages} - {stats.totalParticipants} người
                </div>
              </div>
            </div>
            
            <div className={`overflow-x-auto transition-opacity duration-200 ${pageLoading ? 'opacity-70' : 'opacity-100'}`}>
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hạng</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Người chơi</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Điểm IQ</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Xếp loại</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ngày</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.map((entry, index) => {
                    const badgeInfo = getBadgeInfo(entry.badge);
                    
                    return (
                      <tr key={`${entry.rank}-${entry.score}-${entry.date}`} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {entry.rank <= 3 && (
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-2 text-white text-sm font-bold ${
                                entry.rank === 1 ? 'bg-yellow-500' : 
                                entry.rank === 2 ? 'bg-gray-400' : 'bg-amber-600'
                              }`}>
                                {entry.rank}
                              </div>
                            )}
                            <span className="text-sm font-medium text-gray-900">
                              {entry.rank <= 3 ? '' : `#${entry.rank}`}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center mr-3">
                              <span className="text-sm font-medium text-white">
                                {entry.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">{entry.name}</div>
                              <div className="text-sm text-gray-500">{entry.location}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-lg font-bold text-indigo-600">{entry.score}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold text-white ${badgeInfo.color}`}>
                            {badgeInfo.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(entry.date).toLocaleDateString('vi-VN')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 py-6">
                <button
                  onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1 || pageLoading}
                  className="px-3 py-2 rounded-lg border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  ←
                </button>
                
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = i + 1;
                  
                  return (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      disabled={pageLoading}
                      className={`px-3 py-2 rounded-lg disabled:opacity-70 ${
                        currentPage === page
                          ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white'
                          : 'border hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
                
                <button
                  onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages || pageLoading}
                  className="px-3 py-2 rounded-lg border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  →
                </button>
              </div>
            )}
          </div>
        )}

        {/* CTA */}
        {!loading && (
          <div className="text-center mt-12">
            <a 
              href="/test/iq" 
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-xl font-bold transition-all inline-flex items-center"
            >
              🧠 Làm Test IQ
            </a>
          </div>
        )}
      </div>
    </div>
  );
} 