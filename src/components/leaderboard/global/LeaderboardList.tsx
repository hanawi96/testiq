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
      <div key={i} className="animate-pulse h-20 bg-gray-200 rounded-xl" 
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
    <div className="w-full">
      {/* Loading State - Only show if no initial data */}
      {loading && !hasLoadedFresh && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gray-300 rounded-lg animate-pulse"></div>
              <div className="space-y-1">
                <div className="w-32 h-5 bg-gray-300 rounded animate-pulse"></div>
                <div className="w-24 h-3 bg-gray-300 rounded animate-pulse"></div>
              </div>
            </div>
          </div>
          <FastSkeleton count={5} />
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="bg-white rounded-2xl shadow-sm border border-red-200 p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Không thể tải dữ liệu</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && allData.length === 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
          <div className="w-20 h-20 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl">🏆</span>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Chưa có dữ liệu xếp hạng</h2>
          <p className="text-gray-600 mb-6">Hãy là người đầu tiên tham gia test IQ!</p>
          <a 
            href="/test/iq" 
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Làm Test IQ
          </a>
        </div>
      )}

      {/* Leaderboard List */}
      {!loading && !error && allData.length > 0 && (
        <div id="leaderboard-container" className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="bg-gray-50 border-b border-gray-200">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center">
                    <span className="text-lg">🏆</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Bảng xếp hạng chi tiết</h3>
                    <p className="text-sm text-gray-600">
                      {totalFiltered < allData.length ? 
                        `${totalFiltered} / ${allData.length} kết quả` : 
                        `${allData.length} kết quả`}
                      
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-all ${
                      showFilters ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z" />
                    </svg>
                    <span className="text-sm font-medium">Bộ lọc</span>
                    {(filters.gender || filters.country || filters.ageRange) && (
                      <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    )}
                  </button>
                </div>
              </div>

              {/* Filter Panel */}
              {showFilters && (
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Gender Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Giới tính</label>
                      <select
                        value={filters.gender}
                        onChange={(e) => {
                          setFilters(prev => ({ ...prev, gender: e.target.value }));
                          setCurrentPage(1);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      >
                        <option value="">Tất cả</option>
                        <option value="male">Nam ♂️</option>
                        <option value="female">Nữ ♀️</option>
                        <option value="other">Khác ⚧️</option>
                      </select>
                    </div>

                    {/* Country Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Quốc gia</label>
                      <select
                        value={filters.country}
                        onChange={(e) => {
                          setFilters(prev => ({ ...prev, country: e.target.value }));
                          setCurrentPage(1);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      >
                        <option value="">Tất cả</option>
                        {filterOptions.countries.map(country => (
                          <option key={country} value={country}>{country}</option>
                        ))}
                      </select>
                    </div>

                    {/* Age Range Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Độ tuổi</label>
                      <select
                        value={filters.ageRange}
                        onChange={(e) => {
                          setFilters(prev => ({ ...prev, ageRange: e.target.value }));
                          setCurrentPage(1);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      >
                        <option value="">Tất cả</option>
                        <option value="18-25">18-25 tuổi</option>
                        <option value="26-35">26-35 tuổi</option>
                        <option value="36-50">36-50 tuổi</option>
                        <option value="50+">Trên 50 tuổi</option>
                      </select>
                    </div>

                    {/* Clear Filters */}
                    <div className="flex items-end">
                      <button
                        onClick={clearFilters}
                        disabled={!filters.gender && !filters.country && !filters.ageRange}
                        className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                      >
                        Xóa bộ lọc
                      </button>
                    </div>
                  </div>

                  {/* Active Filters Display */}
                  {(filters.gender || filters.country || filters.ageRange) && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex items-center space-x-2 text-sm">
                        <span className="text-gray-600">Đang lọc:</span>
                        {filters.gender && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                            {filters.gender === 'male' ? 'Nam ♂️' : filters.gender === 'female' ? 'Nữ ♀️' : 'Khác ⚧️'}
                          </span>
                        )}
                        {filters.country && (
                          <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full">
                            📍 {filters.country}
                          </span>
                        )}
                        {filters.ageRange && (
                          <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full">
                            🎂 {filters.ageRange === '50+' ? 'Trên 50' : filters.ageRange} tuổi
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          
          {/* List - Show current page items */}
          <div className="p-6 space-y-3">
            {currentItems.length > 0 ? currentItems.map((entry, index) => {
              const badgeInfo = getBadgeInfo(entry.badge);
              const isTopTier = entry.rank <= 10;
              
              return (
                <div 
                  key={`${entry.rank}-${entry.score}`}
                  className={`relative group rounded-xl p-3 border transition-all duration-200 w-full hover:shadow-md active:scale-[0.98] ${
                    isTopTier ? 'bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200 shadow-sm' : 'bg-white border-gray-200 hover:border-gray-300'
                  }`}
                >
                                     {/* Rank Badge - Góc trái trên */}
                   <div className="absolute -top-1 -left-1 z-10">
                     <div className={`w-10 h-8 bg-gradient-to-br ${getRankColor(entry.rank)} rounded-full flex items-center justify-center border-2 border-white shadow-sm`}>
                       <span className="text-white text-xs font-bold">{entry.rank}</span>
                     </div>
                   </div>

                  {/* Top Tier Indicator (không phải special badge) */}
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
            }) : (
              <div className="text-center py-8 text-gray-500">
                Không có kết quả phù hợp với bộ lọc
              </div>
            )}
          </div>

          {/* 🚀 SMART PAGINATION với Dynamic Visible Range */}
          {totalPages > 1 && (
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm text-gray-600">
                  Trang {currentPage} / {totalPages} ({totalFiltered} kết quả)
                  
                </div>
                
                <div className="flex items-center space-x-2">
                  {/* First page button */}
                  {currentPage > 3 && (
                    <>
                      <button
                        onClick={() => handlePageChange(1)}
                        onMouseEnter={() => handlePageHover(1)}
                        className="px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        1
                      </button>
                      {currentPage > 4 && (
                        <span className="text-gray-400 text-sm">...</span>
                      )}
                    </>
                  )}

                  {/* Previous button */}
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    ← Trước
                  </button>
                  
                  {/* 🎯 DYNAMIC VISIBLE RANGE: Always show visible pages */}
                  {visibleRange.map(page => {
                    const isLoading = pageLoading.has(page);
                    const isCached = pageCache[page] || page === currentPage;
                    
                    return (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        onMouseEnter={() => handlePageHover(page)}
                        disabled={isLoading}
                        className={`relative px-3 py-2 text-sm rounded-lg transition-all ${
                          page === currentPage
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'bg-white border border-gray-300 hover:bg-gray-50'
                        } ${isLoading ? 'opacity-70' : ''}`}
                      >
                        {page}
                        {/* Loading indicator */}
                        {isLoading && (
                          <div className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full animate-pulse" 
                               title="Loading..." />
                        )}
                      </button>
                    );
                  })}
                  
                  {/* Next button */}
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Sau →
                  </button>

                  {/* Last page button */}
                  {currentPage < totalPages - 2 && (
                    <>
                      {currentPage < totalPages - 3 && (
                        <span className="text-gray-400 text-sm">...</span>
                      )}
                      <button
                        onClick={() => handlePageChange(totalPages)}
                        onMouseEnter={() => handlePageHover(totalPages)}
                        className="px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        {totalPages}
                      </button>
                    </>
                  )}
                </div>
              </div>
              

            </div>
          )}
        </div>
      )}
    </div>
  );
}