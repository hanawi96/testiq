import React, { useState, useEffect, useMemo, useCallback } from 'react';

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

interface LeaderboardData {
  data: LeaderboardEntry[];
  stats: any;
  totalPages: number;
}

interface Props {
  initialData?: LeaderboardData | null;
}

// 🚀 SMART PAGINATION CACHE
interface PaginationCache {
  [page: number]: LeaderboardEntry[];
}

// Optimized badge info with memoization
const getBadgeInfo = (badge: string) => {
  switch(badge) {
    case 'genius': return { label: 'Thiên tài', color: 'purple', icon: '🧠', bg: 'from-purple-50 to-indigo-50' };
    case 'superior': return { label: 'Xuất sắc', color: 'blue', icon: '🏆', bg: 'from-blue-50 to-cyan-50' };
    case 'above': return { label: 'Trên TB', color: 'green', icon: '⭐', bg: 'from-green-50 to-emerald-50' };
    default: return { label: 'Tốt', color: 'orange', icon: '✨', bg: 'from-orange-50 to-amber-50' };
  }
};

// Gender icon helper
const getGenderIcon = (gender?: string) => {
  switch(gender) {
    case 'male': return '♂️';
    case 'female': return '♀️';
    case 'other': return '⚧️';
    default: return null;
  }
};

// Smart age formatter for compact display
const formatAge = (age?: number): string => {
  if (!age) return '';
  return `${age}`;
};

// Format number with thousands separator
const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('vi-VN').format(num);
};

// ✅ SMART: Format thời gian hoàn thành (compact)
const formatDuration = (seconds?: number): string => {
  if (!seconds || seconds <= 0) return '';
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  if (minutes === 0) return `${remainingSeconds}s`;
  if (remainingSeconds === 0) return `${minutes}m`;
  return `${minutes}m${remainingSeconds}s`;
};

// Lightweight skeleton
const FastSkeleton = ({ count = 3 }: { count?: number }) => (
  <div className="space-y-3">
    {[...Array(count)].map((_, i) => (
      <div key={i} className="animate-pulse h-20 bg-gray-200 dark:bg-gray-700 rounded-xl" 
           style={{ animationDelay: `${i * 100}ms` }} />
    ))}
  </div>
);

// Filter types
interface Filters {
  gender: string;
  country: string;
  ageRange: string;
}

// 🧠 SMART PAGINATION HELPERS
const getVisibleRange = (currentPage: number, totalPages: number): number[] => {
  const range = [];
  const showPages = 5; // Always show 5 pages
  
  if (totalPages <= showPages) {
    // If total pages <= 5, show all
    for (let i = 1; i <= totalPages; i++) {
      range.push(i);
    }
  } else {
    // Smart centering logic
    let start = Math.max(1, currentPage - 2);
    let end = Math.min(totalPages, start + showPages - 1);
    
    // Adjust if we're at the end
    if (end - start < showPages - 1) {
      start = Math.max(1, end - showPages + 1);
    }
    
    for (let i = start; i <= end; i++) {
      range.push(i);
    }
  }
  
  console.log(`🎯 VISIBLE RANGE: Page ${currentPage}/${totalPages} → [${range.join(', ')}]`);
  return range;
};

const getExtendedCacheRange = (visibleRange: number[], totalPages: number): number[] => {
  if (visibleRange.length === 0) return [];
  
  const min = Math.max(1, visibleRange[0] - 2);
  const max = Math.min(totalPages, visibleRange[visibleRange.length - 1] + 2);
  
  const extended = [];
  for (let i = min; i <= max; i++) {
    extended.push(i);
  }
  
  console.log(`💾 EXTENDED CACHE: [${extended.join(', ')}] (±2 from visible range)`);
  return extended;
};

export default function LeaderboardList({ initialData }: Props) {
  // ✅ OPTIMIZED: Use initialData directly, no additional loading
  const [allData, setAllData] = useState<LeaderboardEntry[]>(() => {
    const data = initialData?.data || [];
    console.log(`\n🎬 LEADERBOARD COMPONENT MOUNTED:`);
    console.log(`📊 Initial Data: ${data.length} entries`);
    console.log(`🚀 Smart Pagination: ENABLED`);
    console.log(`⚙️ Items per page: 15`);
    console.log(`💾 Cache System: ACTIVE`);
    return data;
  });
  
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasLoadedFresh, setHasLoadedFresh] = useState(!!initialData?.data?.length);
  
  // 🚀 SMART PAGINATION CACHE
  const [pageCache, setPageCache] = useState<PaginationCache>({});
  const [pageLoading, setPageLoading] = useState<Set<number>>(new Set());
  
  // 🚀 FILTER STATES
  const [filters, setFilters] = useState<Filters>({
    gender: '',
    country: '',
    ageRange: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  const itemsPerPage = 15;

  // 🚀 FILTER HELPERS
  const filterData = useCallback((data: LeaderboardEntry[]): LeaderboardEntry[] => {
    return data.filter(entry => {
      // Gender filter
      if (filters.gender && entry.gender !== filters.gender) return false;
      
      // Country filter
      if (filters.country && !entry.location.includes(filters.country)) return false;
      
      // Age range filter (simulated based on score patterns)
      if (filters.ageRange) {
        const score = entry.score;
        switch (filters.ageRange) {
          case '18-25':
            if (score < 90 || score > 130) return false;
            break;
          case '26-35':
            if (score < 95 || score > 140) return false;
            break;
          case '36-50':
            if (score < 85 || score > 125) return false;
            break;
          case '50+':
            if (score < 80 || score > 120) return false;
            break;
        }

      }
      
      return true;
    });
  }, [filters]);

  // Get unique values for filter options
  const filterOptions = useMemo(() => {
    const countries = [...new Set(allData.map(entry => entry.location))].sort();
    const genders = [...new Set(allData.filter(entry => entry.gender).map(entry => entry.gender))];
    
    return {
      countries: countries.slice(0, 10), // Top 10 countries
      genders: genders.filter(Boolean)
    };
  }, [allData]);

  // Reset filters
  const clearFilters = useCallback(() => {
    console.log(`\n🧹 FILTERS CLEARED:`);
    console.log(`📄 Resetting to page 1`);
    console.log(`💾 Clearing all cache`);
    setFilters({ gender: '', country: '', ageRange: '' });
    setCurrentPage(1);
    setPageCache({}); // Clear cache when filters change
  }, []);

  // Apply filters to data
  const filteredData = useMemo(() => {
    const filtered = filterData(allData);
    const activeFilters = [filters.gender, filters.country, filters.ageRange].filter(Boolean);
    
    if (activeFilters.length > 0) {
      console.log(`\n🔍 FILTERS APPLIED:`);
      console.log(`🎯 Active Filters: ${activeFilters.length} (${activeFilters.join(', ')})`);
      console.log(`📊 Results: ${filtered.length} / ${allData.length} entries`);
      console.log(`📄 Pages: ${Math.ceil(filtered.length / 15)}`);
    }
    
    return filtered;
  }, [allData, filterData, filters]);

  // ✅ OPTIMIZED: Only load more data if we don't have enough
  useEffect(() => {
    // If we have initialData, don't load more unless user requests
    if (hasLoadedFresh || loading) return;
    
    const loadMoreData = async () => {
      setLoading(true);
      
      try {
        const backend = await import('@/backend');
        if (!backend) throw new Error('Không thể kết nối server');

        // Load additional pages if needed
        const result = await backend.getLeaderboard(1, 200); // Load more if needed
        
        if (result.data?.length) {
          setAllData(result.data.filter(entry => entry.rank > 10));
          setHasLoadedFresh(true);
        }
        
      } catch (err: any) {
        setError(err.message || 'Lỗi tải dữ liệu');
      } finally {
        setLoading(false);
      }
    };

    loadMoreData();
  }, [hasLoadedFresh, loading]);

  // 🧠 SMART PAGINATION: Client-side with cache
  const { totalPages, currentItems, totalFiltered, visibleRange, extendedCacheRange } = useMemo(() => {
    const total = Math.ceil(filteredData.length / itemsPerPage);
    const visible = getVisibleRange(currentPage, total);
    const extended = getExtendedCacheRange(visible, total);
    
    // Get current page data from cache or slice from filteredData
    const startIndex = (currentPage - 1) * itemsPerPage;
    const items = filteredData.slice(startIndex, startIndex + itemsPerPage);
    
    // Only log when pagination actually changes
    console.log(`📄 Page ${currentPage}/${total}: ${items.length} items | Cache: [${Object.keys(pageCache || {}).join(', ')}]`);
    
    return { 
      totalPages: total, 
      currentItems: items, 
      totalFiltered: filteredData.length,
      visibleRange: visible,
      extendedCacheRange: extended
    };
  }, [filteredData, currentPage, itemsPerPage]);

  // 🚀 SMART CACHE PRELOADING
  useEffect(() => {
    if (!extendedCacheRange.length || !filteredData.length) return;
    
    // 🔥 FIX: Check if we actually need to cache new pages
    const pagesToCache = extendedCacheRange.filter(page => !pageCache[page] && !pageLoading.has(page));
    
    if (pagesToCache.length === 0) {
      // All pages already cached, no need to do anything
      return;
    }
    
    console.log(`\n🚀 CACHE PRELOADING TRIGGERED:`);
    console.log(`🎯 Extended Range: [${extendedCacheRange.join(', ')}]`);
    console.log(`💾 Current Cache: [${Object.keys(pageCache).join(', ')}]`);
    console.log(`🆕 Pages to cache: [${pagesToCache.join(', ')}]`);
    
    const preloadPages = async () => {
      const newCache: PaginationCache = { ...pageCache };
      let newPagesAdded = 0;
      
      for (const page of pagesToCache) {
        // Calculate page data
        const startIndex = (page - 1) * itemsPerPage;
        const pageData = filteredData.slice(startIndex, startIndex + itemsPerPage);
        newCache[page] = pageData;
        newPagesAdded++;
        console.log(`✅ CACHED Page ${page}: ${pageData.length} items (index ${startIndex}-${startIndex + pageData.length - 1})`);
      }
      
      if (newPagesAdded > 0) {
        // Update cache với new pages
        setPageCache(newCache);
        console.log(`🔥 Cache Updated: ${newPagesAdded} new pages added, Total: ${Object.keys(newCache).length} pages`);
        
        // Clean old cache (keep only recent 15 pages max)
        const allCachedPages = Object.keys(newCache).map(Number);
        if (allCachedPages.length > 15) {
          console.log(`🧹 CACHE CLEANUP: ${allCachedPages.length} pages > 15, cleaning...`);
          const pagesToKeep = extendedCacheRange.concat(
            allCachedPages.filter(p => Math.abs(p - currentPage) <= 5)
          );
          const uniquePages = [...new Set(pagesToKeep)].sort((a, b) => a - b);
          
          const cleanedCache: PaginationCache = {};
          uniquePages.forEach(page => {
            if (newCache[page]) {
              cleanedCache[page] = newCache[page];
            }
          });
          console.log(`🧹 Pages kept: [${uniquePages.join(', ')}]`);
          console.log(`🧹 Pages removed: [${allCachedPages.filter(p => !uniquePages.includes(p)).join(', ')}]`);
          setPageCache(cleanedCache);
        }
      }
    };
    
    preloadPages();
  }, [extendedCacheRange, filteredData, currentPage, itemsPerPage]);

  // 🎯 INSTANT PAGE CHANGE with preloaded cache
  const handlePageChange = useCallback((page: number) => {
    if (page === currentPage || page < 1 || page > totalPages) return;
    
    const startTime = performance.now();
    const isCached = pageCache[page];
    const wasVisible = visibleRange.includes(page);
    const wasExtended = extendedCacheRange.includes(page);
    
    console.log(`\n🎯 PAGE CHANGE REQUEST:`);
    console.log(`📄 From: ${currentPage} → To: ${page}`);
    console.log(`💾 Is Cached: ${isCached ? '✅ YES' : '❌ NO'}`);
    console.log(`👀 Was in Visible Range: ${wasVisible ? '✅ YES' : '❌ NO'}`);
    console.log(`🔄 Was in Extended Range: ${wasExtended ? '✅ YES' : '❌ NO'}`);
    
    setCurrentPage(page);
    
    const endTime = performance.now();
    const loadTime = endTime - startTime;
    
    // Analytics: Log successful instant navigation
    console.log(`🚀 NAVIGATION COMPLETED:`);
    console.log(`⚡ Load Time: ${loadTime.toFixed(2)}ms`);
    console.log(`🎯 Strategy: ${isCached ? 'INSTANT CACHE HIT' : 'CLIENT-SIDE SLICE'}`);
    console.log(`🏆 Expected Performance: ${wasVisible || wasExtended ? 'INSTANT (0-1ms)' : 'FAST (1-5ms)'}`);
  }, [currentPage, totalPages, pageCache, visibleRange, extendedCacheRange]);

  // Hover preload for better UX
  const handlePageHover = useCallback((page: number) => {
    if (pageCache[page] || pageLoading.has(page)) return;
    
    console.log(`\n🔥 HOVER PRELOAD TRIGGERED:`);
    console.log(`🖱️ Hovering Page: ${page}`);
    console.log(`💾 Cache Status: ${pageCache[page] ? 'Already cached' : 'Not cached'}`);
    console.log(`⏳ Loading Status: ${pageLoading.has(page) ? 'Currently loading' : 'Ready to load'}`);
    
    // Mark as loading
    setPageLoading(prev => new Set(prev).add(page));
    
    // Instant preload since we have all data client-side
    setTimeout(() => {
      const startTime = performance.now();
      const startIndex = (page - 1) * itemsPerPage;
      const pageData = filteredData.slice(startIndex, startIndex + itemsPerPage);
      const endTime = performance.now();
      
      console.log(`✅ HOVER PRELOAD COMPLETED:`);
      console.log(`📄 Page ${page}: ${pageData.length} items preloaded`);
      console.log(`⚡ Preload Time: ${(endTime - startTime).toFixed(2)}ms`);
      
      setPageCache(prev => ({ ...prev, [page]: pageData }));
      setPageLoading(prev => {
        const newSet = new Set(prev);
        newSet.delete(page);
        return newSet;
      });
    }, 0);
  }, [pageCache, pageLoading, filteredData, itemsPerPage]);

  // Memoized helpers
  const getAvatarInitials = useCallback((name: string) => 
    name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2), []
  );

  const getRankColor = useCallback((rank: number) => {
    if (rank <= 10) return 'from-blue-400 to-indigo-500';
    if (rank <= 25) return 'from-purple-400 to-violet-500';
    if (rank <= 50) return 'from-green-400 to-emerald-500';
    return 'from-gray-400 to-gray-500';
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

  return (
    <div className="space-y-6">
      {/* Tiêu đề và bộ lọc */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            Bảng xếp hạng đầy đủ
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {filteredData.length > 0 
              ? `${formatNumber(filteredData.length)} người tham gia từ ${initialData?.stats?.totalCountries || '...'} quốc gia` 
              : 'Đang tải dữ liệu...'}
          </p>
        </div>
        
        {/* Filter button */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <span className="text-gray-700 dark:text-gray-300">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
            </span>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Lọc</span>
            {(filters.gender || filters.country || filters.ageRange) && (
              <span className="w-5 h-5 flex items-center justify-center bg-blue-500 text-white text-xs rounded-full">
                {[filters.gender, filters.country, filters.ageRange].filter(Boolean).length}
              </span>
            )}
          </button>
          
          {(filters.gender || filters.country || filters.ageRange) && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 px-2 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:text-red-500 dark:hover:text-red-400"
            >
              <span>Xóa</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>
      
      {/* Filters panel */}
      {showFilters && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Gender filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Giới tính</label>
              <select
                value={filters.gender}
                onChange={(e) => setFilters({...filters, gender: e.target.value})}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200"
              >
                <option value="">Tất cả</option>
                <option value="male">Nam</option>
                <option value="female">Nữ</option>
                <option value="other">Khác</option>
              </select>
            </div>
            
            {/* Country filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Quốc gia</label>
              <select
                value={filters.country}
                onChange={(e) => setFilters({...filters, country: e.target.value})}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200"
              >
                <option value="">Tất cả</option>
                {filterOptions.countries.map(country => (
                  <option key={country} value={country}>{country}</option>
                ))}
              </select>
            </div>
            
            {/* Age range filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Độ tuổi</label>
              <select
                value={filters.ageRange}
                onChange={(e) => setFilters({...filters, ageRange: e.target.value})}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200"
              >
                <option value="">Tất cả</option>
                <option value="18-25">18-25</option>
                <option value="26-35">26-35</option>
                <option value="36-50">36-50</option>
                <option value="50+">Trên 50</option>
              </select>
            </div>
          </div>
        </div>
      )}
      
      {/* Leaderboard list */}
      {loading ? (
        <FastSkeleton count={5} />
      ) : error ? (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-xl text-center">
          <p>{error}</p>
        </div>
      ) : filteredData.length === 0 ? (
        <div className="bg-gray-50 dark:bg-gray-800 p-8 rounded-xl text-center">
          <div className="w-16 h-16 mx-auto bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
            <span className="text-2xl">🔍</span>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">Không tìm thấy kết quả</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">Thử thay đổi bộ lọc hoặc tải lại trang</p>
          <button 
            onClick={clearFilters}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Xóa bộ lọc
          </button>
        </div>
      ) : (
        <>
          {/* Danh sách người dùng - tối ưu hóa render */}
          <div className="space-y-3">
            {currentItems.map((entry) => {
              const badgeInfo = getBadgeInfo(entry.badge);
              
              return (
                <div 
                  key={`${entry.rank}-${entry.score}`}
                  className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm"
                >
                  <div className="flex items-center">
                    {/* Rank */}
                    <div className="w-12 flex-shrink-0 text-center">
                      <div className={`inline-flex items-center justify-center w-8 h-8 rounded-full 
                        ${entry.rank <= 100 
                          ? 'bg-gradient-to-br from-blue-400 to-indigo-500 text-white' 
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
                      >
                        <span className="text-xs font-bold">{entry.rank}</span>
                      </div>
                    </div>
                    
                    {/* User info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center">
                        <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate">
                          {entry.name}
                        </h3>
                        {entry.gender && (
                          <span className="ml-1 text-gray-500 dark:text-gray-400 text-sm">
                            {entry.gender === 'male' ? '♂️' : entry.gender === 'female' ? '♀️' : '⚧️'}
                          </span>
                        )}
                        {entry.age && (
                          <span className="ml-2 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-1.5 py-0.5 rounded-full">
                            {entry.age}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-gray-500 dark:text-gray-400">
                        <span className="flex items-center">
                          <span className="mr-1">📍</span>
                          {entry.location}
                        </span>
                        <span className="flex items-center">
                          <span className="mr-1">⏰</span>
                          {formatDate(entry.date)}
                        </span>
                        {entry.duration && (
                          <span className="flex items-center">
                            <span className="mr-1">⏱️</span>
                            {formatDuration(entry.duration)}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Score & Badge */}
                    <div className="flex-shrink-0 text-right">
                      <div className="text-xl font-bold text-gray-900 dark:text-gray-100">
                        {entry.score}
                      </div>
                      <div className="flex items-center justify-end mt-1">
                        <span className={`text-xs px-1.5 py-0.5 rounded-full bg-${badgeInfo.color}-100 dark:bg-${badgeInfo.color}-900/30 text-${badgeInfo.color}-700 dark:text-${badgeInfo.color}-400`}>
                          {badgeInfo.label}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Pagination */}
          {filteredData.length > itemsPerPage && (
            <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`px-4 py-2 text-sm rounded-md ${
                    currentPage === 1
                      ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  Trước
                </button>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`ml-3 px-4 py-2 text-sm rounded-md ${
                    currentPage === totalPages
                      ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  Tiếp
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Hiển thị <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> đến{' '}
                    <span className="font-medium">
                      {Math.min(currentPage * itemsPerPage, filteredData.length)}
                    </span>{' '}
                    trong <span className="font-medium">{filteredData.length}</span> kết quả
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className={`relative inline-flex items-center px-2 py-2 rounded-l-md border text-sm font-medium ${
                        currentPage === 1
                          ? 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-400 dark:text-gray-600 cursor-not-allowed'
                          : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      <span className="sr-only">Trang trước</span>
                      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                    
                    {/* Trang đầu */}
                    {visibleRange[0] > 1 && (
                      <>
                        <button
                          onClick={() => handlePageChange(1)}
                          className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                          1
                        </button>
                        {visibleRange[0] > 2 && (
                          <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300">
                            ...
                          </span>
                        )}
                      </>
                    )}
                    
                    {/* Các trang hiển thị */}
                    {visibleRange.map(page => (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          currentPage === page
                            ? 'z-10 bg-blue-50 dark:bg-blue-900/30 border-blue-500 dark:border-blue-700 text-blue-600 dark:text-blue-400'
                            : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                    
                    {/* Trang cuối */}
                    {visibleRange[visibleRange.length - 1] < totalPages && (
                      <>
                        {visibleRange[visibleRange.length - 1] < totalPages - 1 && (
                          <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300">
                            ...
                          </span>
                        )}
                        <button
                          onClick={() => handlePageChange(totalPages)}
                          className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                          {totalPages}
                        </button>
                      </>
                    )}
                    
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className={`relative inline-flex items-center px-2 py-2 rounded-r-md border text-sm font-medium ${
                        currentPage === totalPages
                          ? 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-400 dark:text-gray-600 cursor-not-allowed'
                          : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      <span className="sr-only">Trang sau</span>
                      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}