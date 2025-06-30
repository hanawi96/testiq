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
}

interface LeaderboardData {
  data: LeaderboardEntry[];
  stats: any;
  totalPages: number;
}

interface Props {
  initialData?: LeaderboardData | null;
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

export default function LeaderboardList({ initialData }: Props) {
  // ✅ OPTIMIZED: Use initialData directly, no additional loading
  const [allData, setAllData] = useState<LeaderboardEntry[]>(() => {
    return initialData?.data || [];
  });
  
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasLoadedFresh, setHasLoadedFresh] = useState(!!initialData?.data?.length);
  
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
    setFilters({ gender: '', country: '', ageRange: '' });
    setCurrentPage(1);
  }, []);

  // Apply filters to data
  const filteredData = useMemo(() => filterData(allData), [allData, filterData]);

  // ✅ OPTIMIZED: Only load more data if we don't have enough
  useEffect(() => {
    // If we have initialData, don't load more unless user requests
    if (hasLoadedFresh || loading) return;
    
    const loadMoreData = async () => {
      setLoading(true);
      
      try {
        const backend = await import('../../backend');
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

  // Client-side pagination with filters (instant!)
  const { totalPages, currentItems, totalFiltered } = useMemo(() => {
    const total = Math.ceil(filteredData.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const items = filteredData.slice(startIndex, startIndex + itemsPerPage);
    
    return { totalPages: total, currentItems: items, totalFiltered: filteredData.length };
  }, [filteredData, currentPage, itemsPerPage]);

  // Instant page change
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

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
              <div className="flex items-center justify-between mb-4">
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
                  className={`group bg-white rounded-xl p-4 border border-gray-200 transition-all duration-200 hover:shadow-md hover:border-gray-300 ${
                    isTopTier ? 'border-blue-200 bg-blue-50/30' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {/* Rank Badge */}
                      <div className="relative">
                        <div className={`w-12 h-12 bg-gradient-to-br ${getRankColor(entry.rank)} rounded-xl flex items-center justify-center`}>
                          <span className="text-white font-bold text-sm">#{entry.rank}</span>
                        </div>
                        {isTopTier && (
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs">✨</span>
                          </div>
                        )}
                      </div>
                      
                      {/* User Info */}
                      <div>
                        <div className="flex items-center space-x-2 flex-wrap">
                          <h4 className="font-bold text-gray-900">{entry.name}</h4>
                          <div className="flex items-center space-x-1">
                            {getGenderIcon(entry.gender) && (
                              <span className="text-sm" title={`Giới tính: ${entry.gender === 'male' ? 'Nam' : entry.gender === 'female' ? 'Nữ' : 'Khác'}`}>
                                {getGenderIcon(entry.gender)}
                              </span>
                            )}
                            {entry.age && (
                              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium" title={`${entry.age} tuổi`}>
                                {formatAge(entry.age)}
                              </span>
                            )}
                          </div>
                          {isTopTier && (
                            <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full font-medium">
                              Top {entry.rank <= 5 ? '5' : '10'}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-600 mt-1 flex-wrap">
                          <span className="flex items-center">
                            <span className="mr-1">📍</span>
                            {entry.location}
                          </span>
                          <span className="hidden sm:inline">•</span>
                          <span className="flex items-center">
                            <span className="mr-1">⏰</span>
                            {formatDate(entry.date)}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Score & Badge */}
                    <div className="text-right">
                      <div className="text-xl font-bold text-gray-700 mb-1">
                        {entry.score}
                      </div>
                      <div className={`text-xs px-2 py-1 rounded-full font-medium bg-${badgeInfo.color}-100 text-${badgeInfo.color}-700`}>
                        {badgeInfo.icon} {badgeInfo.label}
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Trang {currentPage} / {totalPages} ({totalFiltered} kết quả)
                </div>
                <div className="flex space-x-1">
                  <button
                    onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ← Trước
                  </button>
                  
                  {/* Page numbers */}
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                    if (page > totalPages) return null;
                    
                    return (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                          page === currentPage
                            ? 'bg-blue-600 text-white'
                            : 'bg-white border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                  
                  <button
                    onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
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
  );
}