import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';

interface LeaderboardEntry {
  rank: number;
  name: string;
  score: number;
  location: string;
  date: string;
  badge: string;
  isAnonymous?: boolean;
  gender?: string;
  age?: number;
  duration?: number; // Thời gian hoàn thành (giây)
}

interface Props {
  initialData?: LeaderboardEntry[] | null;
  totalCount?: number;
  enableVirtualScroll?: boolean;
}

// 🚀 ULTRA-SCALABLE LEADERBOARD COMPONENT for 10,000+ records
export default function ScalableLeaderboard({ 
  initialData, 
  totalCount = 0, 
  enableVirtualScroll = false 
}: Props) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50); // Larger page size for better performance
  const [data, setData] = useState<LeaderboardEntry[]>(initialData || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // 🧠 SMART PAGINATION CONFIG based on total count
  const paginationConfig = useMemo(() => {
    if (totalCount <= 1000) {
      return { strategy: 'full', maxVisiblePages: 10, pageSize: 25 };
    } else if (totalCount <= 5000) {
      return { strategy: 'smart', maxVisiblePages: 7, pageSize: 50 };
    } else if (totalCount <= 10000) {
      return { strategy: 'minimal', maxVisiblePages: 5, pageSize: 100 };
    } else {
      return { strategy: 'enterprise', maxVisiblePages: 3, pageSize: 200 };
    }
  }, [totalCount]);

  const totalPages = Math.ceil(totalCount / paginationConfig.pageSize);

  // 🎯 SMART PAGE RANGE calculation
  const getVisiblePageRange = useCallback(() => {
    const { maxVisiblePages } = paginationConfig;
    const half = Math.floor(maxVisiblePages / 2);
    
    let start = Math.max(1, currentPage - half);
    let end = Math.min(totalPages, start + maxVisiblePages - 1);
    
    // Adjust start if we're near the end
    if (end - start < maxVisiblePages - 1) {
      start = Math.max(1, end - maxVisiblePages + 1);
    }
    
    return { start, end };
  }, [currentPage, totalPages, paginationConfig.maxVisiblePages]);

  // 🔥 OPTIMIZED DATA FETCHING with debouncing
  const fetchPageData = useCallback(async (page: number) => {
    if (loading) return;
    
    setLoading(true);
    try {
      // 🚀 Use scalable backend function
      const backend = await import('../../backend');
      const result = await backend.getScalableLeaderboard(page, paginationConfig.pageSize);
      
      if (result.data) {
        setData(result.data);
      } else {
        setError('Không thể tải dữ liệu');
      }
    } catch (err: any) {
      setError(err.message || 'Lỗi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  }, [loading, paginationConfig.pageSize]);

  // 🎯 DEBOUNCED PAGE CHANGE
  const debouncedPageChange = useCallback((page: number) => {
    const timer = setTimeout(() => {
      fetchPageData(page);
    }, 150); // 150ms debounce

    return () => clearTimeout(timer);
  }, [fetchPageData]);

  const handlePageChange = useCallback((page: number) => {
    if (page === currentPage || page < 1 || page > totalPages) return;
    
    setCurrentPage(page);
    
    // Only fetch if we don't have data for this page
    if (!data.some(item => {
      const expectedStart = (page - 1) * paginationConfig.pageSize + 1;
      const expectedEnd = page * paginationConfig.pageSize;
      return item.rank >= expectedStart && item.rank <= expectedEnd;
    })) {
      debouncedPageChange(page);
    }
  }, [currentPage, totalPages, data, paginationConfig.pageSize, debouncedPageChange]);

  // 🎨 OPTIMIZED RENDERING with memoization
  const getBadgeInfo = useCallback((badge: string) => {
    switch(badge) {
      case 'genius': return { label: 'Thiên tài', color: 'purple', icon: '🧠' };
      case 'superior': return { label: 'Xuất sắc', color: 'blue', icon: '🏆' };
      case 'above': return { label: 'Trên TB', color: 'green', icon: '⭐' };
      default: return { label: 'Tốt', color: 'orange', icon: '✨' };
    }
  }, []);

  const formatDate = useCallback((dateString: string) => {
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
  }, []);

  // ✅ SMART: Format thời gian hoàn thành
  const formatDuration = useCallback((seconds?: number): string => {
    if (!seconds || seconds <= 0) return '';
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes === 0) return `${remainingSeconds}s`;
    if (remainingSeconds === 0) return `${minutes}m`;
    return `${minutes}m${remainingSeconds}s`;
  }, []);

  // 🚀 VIRTUAL SCROLLING for massive datasets (optional)
  const VirtualizedList = useMemo(() => {
    if (!enableVirtualScroll || data.length < 100) {
      return null;
    }

    // Simplified virtual scrolling implementation
    return (
      <div 
        className="virtual-scroll-container" 
        style={{ height: '600px', overflowY: 'auto' }}
        onScroll={(e) => {
          const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
          
          // Load next page when near bottom
          if (scrollTop + clientHeight >= scrollHeight - 100) {
            if (currentPage < totalPages && !loading) {
              handlePageChange(currentPage + 1);
            }
          }
        }}
      >
        {data.map((entry, index) => (
          <LeaderboardRow key={`${entry.rank}-${entry.score}`} entry={entry} />
        ))}
      </div>
    );
  }, [enableVirtualScroll, data, currentPage, totalPages, loading, handlePageChange]);

  // 🎯 OPTIMIZED ROW COMPONENT - TopTenLeaderboard Style
  const LeaderboardRow = React.memo(({ entry }: { entry: LeaderboardEntry }) => {
    const badgeInfo = getBadgeInfo(entry.badge);
    const isTopTier = entry.rank <= 10;
    
    return (
      <div className={`relative group rounded-xl p-3 border transition-all duration-200 w-full hover:shadow-md active:scale-[0.98] ${
        isTopTier ? 'bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200 shadow-sm' : 'bg-white border-gray-200 hover:border-gray-300'
      }`}>
                 {/* Rank Badge - Góc trái trên */}
         <div className="absolute -top-1 -left-1 z-10">
           <div className={`w-10 h-8 bg-gradient-to-br ${
             entry.rank <= 3 ? 'from-yellow-400 to-orange-500' :
             entry.rank <= 10 ? 'from-blue-400 to-indigo-500' :
             'from-gray-400 to-gray-500'
           } rounded-full flex items-center justify-center border-2 border-white shadow-sm`}>
             <span className="text-white text-xs font-bold">{entry.rank}</span>
           </div>
         </div>

        {/* Top Tier Indicator */}
        {isTopTier && (
          <div className="absolute -top-1 -right-1 z-10">
            <div className="bg-blue-500 rounded-full p-1 shadow-sm border border-white">
              <span className="text-sm text-white">✨</span>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pl-6 pr-2">
          {/* User Info - Compact */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <h3 className="font-bold text-gray-900 truncate text-sm">
                {entry.name}
              </h3>
              {entry.gender && (
                <span className="text-xs opacity-70">
                  {entry.gender === 'male' ? '♂️' : entry.gender === 'female' ? '♀️' : '⚧️'}
                </span>
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
              isTopTier ? 'text-blue-600' : 'text-gray-700'
            }`}>
              {entry.score}
            </div>
            
            <div className="flex flex-col items-end space-y-1">
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium bg-${badgeInfo.color}-100 text-${badgeInfo.color}-700`}>
                {badgeInfo.label}
              </span>
              {isTopTier && (
                <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-medium">
                  Top {entry.rank <= 5 ? '5' : '10'}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  });

  const { start, end } = getVisiblePageRange();

  return (
    <div className="w-full bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header with performance info */}
      <div className="bg-gray-50 border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              Bảng xếp hạng tối ưu {totalCount >= 10000 && '(Enterprise Scale)'}
            </h3>
            <p className="text-sm text-gray-600">
              {totalCount.toLocaleString()} kết quả • Chiến lược: {paginationConfig.strategy.toUpperCase()}
            </p>
          </div>
          
          {/* Page size selector for advanced users */}
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Kích thước trang:</span>
            <select 
              value={paginationConfig.pageSize}
              onChange={(e) => {
                const newSize = parseInt(e.target.value);
                setPageSize(newSize);
                setCurrentPage(1);
                fetchPageData(1);
              }}
              className="border border-gray-300 rounded px-2 py-1 text-sm"
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              {totalCount > 5000 && <option value={200}>200</option>}
            </select>
          </div>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="p-8 text-center">
          <div className="inline-flex items-center space-x-2">
            <div className="animate-spin w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
            <span className="text-gray-600">Đang tải...</span>
          </div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="p-6 text-center">
          <div className="text-red-600 bg-red-50 rounded-lg p-4">
            ⚠️ {error}
          </div>
        </div>
      )}

      {/* Data display */}
      {!loading && !error && (
        <>
          {/* Virtual scrolling or regular list */}
          {VirtualizedList || (
            <div className="p-6 space-y-3">
              {data.map((entry) => (
                <LeaderboardRow key={`${entry.rank}-${entry.score}`} entry={entry} />
              ))}
            </div>
          )}
          
          {/* Smart pagination */}
          {totalPages > 1 && (
            <div className="bg-gray-50 border-t border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Trang {currentPage} / {totalPages.toLocaleString()} 
                  ({totalCount.toLocaleString()} kết quả)
                </div>
                
                <div className="flex items-center space-x-1">
                  {/* First page */}
                  {start > 1 && (
                    <>
                      <button
                        onClick={() => handlePageChange(1)}
                        className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
                      >
                        1
                      </button>
                      {start > 2 && <span className="text-gray-400">...</span>}
                    </>
                  )}
                  
                  {/* Visible page range */}
                  {Array.from({ length: end - start + 1 }, (_, i) => start + i).map(page => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`px-3 py-1 text-sm rounded transition-colors ${
                        page === currentPage
                          ? 'bg-blue-600 text-white'
                          : 'border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {page.toLocaleString()}
                    </button>
                  ))}
                  
                  {/* Last page */}
                  {end < totalPages && (
                    <>
                      {end < totalPages - 1 && <span className="text-gray-400">...</span>}
                      <button
                        onClick={() => handlePageChange(totalPages)}
                        className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
                      >
                        {totalPages.toLocaleString()}
                      </button>
                    </>
                  )}
                  
                  {/* Jump to page input for enterprise scale */}
                  {totalCount > 10000 && (
                    <div className="ml-4 flex items-center space-x-2">
                      <span className="text-sm text-gray-600">Đến trang:</span>
                      <input
                        type="number"
                        min={1}
                        max={totalPages}
                        className="w-20 px-2 py-1 text-sm border border-gray-300 rounded"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const page = parseInt((e.target as HTMLInputElement).value);
                            if (page >= 1 && page <= totalPages) {
                              handlePageChange(page);
                            }
                          }
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
} 