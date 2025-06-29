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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 pt-24 pb-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Hero Section */}
        <div className="text-center mb-16">
          {/* Badge */}
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-800 text-sm font-medium mb-8">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Bảng xếp hạng IQ
          </div>
          
          {/* Trophy Icon */}
          <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          </div>
          
          {/* Main heading */}
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Bảng xếp hạng
          </h1>
          
          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-gray-600 font-medium mb-4">
            Top những người có điểm IQ cao nhất
          </p>
          
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            Khám phá những tài năng xuất sắc và so sánh kết quả của bạn với cộng đồng
          </p>

          {/* Stats Cards */}
          {!loading && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div className="text-2xl font-bold text-blue-600 mb-1">{stats.totalParticipants.toLocaleString()}</div>
                <div className="text-sm text-gray-600">Người tham gia</div>
              </div>
              
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div className="text-2xl font-bold text-purple-600 mb-1">{stats.highestScore}</div>
                <div className="text-sm text-gray-600">Điểm cao nhất</div>
              </div>
              
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div className="text-2xl font-bold text-green-600 mb-1">{stats.averageScore}</div>
                <div className="text-sm text-gray-600">Điểm trung bình</div>
              </div>
              
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                </div>
                <div className="text-2xl font-bold text-orange-600 mb-1">{stats.geniusPercentage}%</div>
                <div className="text-sm text-gray-600">Thiên tài (140+)</div>
              </div>
            </div>
          )}
        </div>

        {/* Loading State */}
        {loading && data.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-blue-500 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Đang tải bảng xếp hạng</h3>
            <p className="text-gray-500">Vui lòng chờ trong giây lát...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-white rounded-2xl shadow-sm border border-red-200 p-8 text-center max-w-md mx-auto">
            <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Không thể tải dữ liệu</h3>
            <p className="text-gray-600 mb-6">{error}</p>
            <button 
              onClick={() => {
                clientCache.clear();
                prefetchedPages.current.clear();
                loadData(currentPage);
              }}
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white font-medium rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Thử lại
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && data.length === 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Chưa có dữ liệu xếp hạng</h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Hãy là người đầu tiên tham gia test IQ và xuất hiện trên bảng xếp hạng!
            </p>
            <a 
              href="/test/iq" 
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Làm Test IQ
            </a>
          </div>
        )}

        {/* Leaderboard Table */}
        {!loading && !error && data.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative">
            {/* Progress indicator for page loading */}
            {pageLoading && (
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500 animate-pulse z-10"></div>
            )}
            
            {/* Header */}
            <div className="px-6 py-5 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Bảng xếp hạng</h2>
                </div>
                <div className="flex items-center space-x-3">
                  {pageLoading && (
                    <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  )}
                  <div className="text-sm text-gray-500 bg-gray-50 px-3 py-1 rounded-full">
                    Trang {currentPage}/{totalPages} • {stats.totalParticipants.toLocaleString()} người
                  </div>
                </div>
              </div>
            </div>
            
            {/* Table */}
            <div className={`overflow-x-auto transition-opacity duration-200 ${pageLoading ? 'opacity-70' : 'opacity-100'}`}>
              <div className="divide-y divide-gray-100">
                {data.map((entry, index) => {
                  const badgeInfo = getBadgeInfo(entry.badge);
                  const isTopThree = entry.rank <= 3;
                  
                  return (
                    <div 
                      key={`${entry.rank}-${entry.score}-${entry.date}`} 
                      className={`flex items-center justify-between p-6 hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50 transition-all duration-200 ${
                        isTopThree ? 'bg-gradient-to-r from-yellow-50 to-orange-50' : ''
                      }`}
                    >
                      {/* Rank & User Info */}
                      <div className="flex items-center space-x-4 flex-1 min-w-0">
                                                 {/* Rank */}
                         <div className="flex-shrink-0">
                           {isTopThree ? (
                             <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-md ${
                               entry.rank === 1 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' : 
                               entry.rank === 2 ? 'bg-gradient-to-br from-gray-400 to-gray-600' : 
                               'bg-gradient-to-br from-amber-500 to-amber-700'
                             }`}>
                               {entry.rank === 1 ? (
                                 // Crown icon for #1
                                 <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                                   <path d="M5 16L3 6l5.5 4L12 4l3.5 6L21 6l-2 10H5zm2.7-2h8.6l.9-4.4L14 12l-2-3.4L10 12l-3.2-2.4L7.7 14z"/>
                                 </svg>
                               ) : entry.rank === 2 ? (
                                 // Medal icon for #2 (Silver)
                                 <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                                   <path d="M12 2L8 8V22L12 20L16 22V8L12 2ZM12 6L14 10V18L12 17L10 18V10L12 6Z"/>
                                 </svg>
                               ) : (
                                 // Medal icon for #3 (Bronze)
                                 <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                                   <path d="M12 2L8 8V22L12 20L16 22V8L12 2ZM12 6L14 10V18L12 17L10 18V10L12 6Z"/>
                                 </svg>
                               )}
                             </div>
                           ) : (
                             <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center">
                               <span className="text-lg font-semibold text-gray-600">#{entry.rank}</span>
                             </div>
                           )}
                         </div>

                        {/* Avatar & Info */}
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm">
                            <span className="text-white font-semibold text-lg">
                              {entry.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-gray-900 truncate">{entry.name}</div>
                            <div className="flex items-center space-x-2 text-sm text-gray-500">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              <span className="truncate">{entry.location}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Score & Badge */}
                      <div className="flex items-center space-x-6 flex-shrink-0">
                        {/* IQ Score */}
                        <div className="text-center">
                          <div className="text-2xl font-bold text-indigo-600">{entry.score}</div>
                          <div className="text-xs text-gray-500">IQ</div>
                        </div>

                        {/* Badge */}
                        <div className="text-center">
                          <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium text-white ${badgeInfo.color}`}>
                            {badgeInfo.label}
                          </span>
                        </div>

                        {/* Date */}
                        <div className="text-right min-w-0">
                          <div className="text-sm font-medium text-gray-900">
                            {new Date(entry.date).toLocaleDateString('vi-VN')}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(entry.date).toLocaleDateString('vi-VN', { weekday: 'short' })}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 py-6 border-t border-gray-100">
                <button
                  onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1 || pageLoading}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Trước
                </button>
                
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = i + 1;
                    
                    return (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        disabled={pageLoading}
                        className={`w-10 h-10 text-sm font-medium rounded-xl transition-all disabled:opacity-70 ${
                          currentPage === page
                            ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md'
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
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Sau
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        )}

        {/* CTA Section */}
        {!loading && (
          <div className="text-center mt-16">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-100">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Thử thách bản thân</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Tham gia test IQ và khám phá vị trí của bạn trên bảng xếp hạng
              </p>
              <a 
                href="/test/iq" 
                className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Làm Test IQ
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}