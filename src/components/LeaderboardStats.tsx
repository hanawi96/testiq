import React, { useMemo, useState, useEffect } from 'react';

interface DashboardStats {
  totalCountries: number;
  totalParticipants: number;
  globalAverageIQ: number;
  averageTestTime: string;
  geniusBadges: number;
  smartBadges: number;
  excellentBadges: number;
  topCountriesByIQ: Array<{ country: string; flag: string; avgIQ: number }>;
  topCountriesByParticipants: Array<{ country: string; flag: string; participants: number }>;
  ageDistribution: Array<{ age: string; percentage: number }>;
  iqDistribution: Array<{ range: string; count: number }>;
}

interface Props {
  initialStats?: DashboardStats;
}

// Stats mặc định cho loading state
const defaultStats: DashboardStats = {
  totalCountries: 0,
  totalParticipants: 0,
  globalAverageIQ: 100,
  averageTestTime: "5:00",
  geniusBadges: 0,
  smartBadges: 0,
  excellentBadges: 0,
  topCountriesByIQ: [],
  topCountriesByParticipants: [],
  ageDistribution: [
    { age: "16-20", percentage: 0 },
    { age: "21-25", percentage: 0 },
    { age: "26-30", percentage: 0 },
    { age: "31-35", percentage: 0 },
    { age: "36+", percentage: 0 }
  ],
  iqDistribution: [
    { range: "70-85", count: 0 },
    { range: "85-100", count: 0 },
    { range: "100-115", count: 0 },
    { range: "115-130", count: 0 },
    { range: "130+", count: 0 }
  ]
};

/**
 * Component dashboard thống kê IQ thông minh
 * 🚀 SKELETON LOADING: Hiển thị skeleton cho đến khi data được load
 */
const DashboardStatsComponent: React.FC<Props> = ({ initialStats }) => {
  // ✅ SKELETON FIRST: Luôn bắt đầu với loading state để hiển thị skeleton
  const [stats, setStats] = useState<DashboardStats>(defaultStats);
  const [isLoading, setIsLoading] = useState(true);

  const formatNumber = useMemo(() => (num: number) => 
    new Intl.NumberFormat('vi-VN').format(num), []);

  // ✅ CLIENT-SIDE LOADING: Luôn load data từ client để có skeleton effect
  useEffect(() => {
    const loadData = async () => {
      try {
        // Nếu có initialStats, dùng luôn nhưng vẫn show loading ngắn
        if (initialStats) {
          console.log('📊 Using initial stats:', {
            countries: initialStats.totalCountries,
            participants: initialStats.totalParticipants,
            topCountries: initialStats.topCountriesByParticipants.length
          });
          setStats(initialStats);
          setIsLoading(false);
          return;
        }

        // Load data từ client
        console.log('🔄 Loading fresh dashboard stats from client...');
        const { getDashboardStats, clearDashboardCache } = await import('../../backend/utils/dashboard-stats-service');
        
        // Clear cache để đảm bảo dữ liệu mới nhất
        clearDashboardCache();
        const realStats = await getDashboardStats();
        
        console.log('✅ Fresh stats loaded:', {
          countries: realStats.totalCountries,
          participants: realStats.totalParticipants,
          topCountriesByParticipants: realStats.topCountriesByParticipants
        });
        
        setStats(realStats);
        setIsLoading(false);
        
      } catch (error) {
        console.error('❌ Lỗi load dashboard stats:', error);
        setIsLoading(false);
      }
    };

    loadData();
  }, [initialStats]);

  const StatCard = ({ icon, value, label, subtitle, gradient }: {
    icon: string;
    value: string | number;
    label: string;
    subtitle?: string;
    gradient?: string;
  }) => (
    <div className={`${gradient || 'bg-white/90'} backdrop-blur-sm rounded-2xl p-4 border border-white/30 shadow-sm hover:shadow-lg transition-all duration-300 group`}>
      <div className="flex items-center gap-3">
        <span className="text-2xl group-hover:scale-110 transition-transform">{icon}</span>
        <div>
          <div className="text-2xl font-bold text-gray-800">
            {isLoading ? (
              <div className="w-12 h-6 bg-gray-200 rounded animate-pulse"></div>
            ) : (typeof value === 'number' ? formatNumber(value) : value)}
          </div>
          <div className="text-sm text-gray-600 font-medium">{label}</div>
          {subtitle && <div className="text-xs text-gray-500">{subtitle}</div>}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Modern Minimalist Stats */}
      <div className="backdrop-blur-sm bg-white/70 border border-gray-200/50 rounded-2xl p-5 shadow-sm">
        {/* Top Stats - Clean 4-grid */}
        <div className="grid grid-cols-4 gap-3 mb-4">
          <div className="text-center group cursor-pointer">
            <div className="w-8 h-8 mx-auto mb-2 rounded-lg bg-slate-100 flex items-center justify-center text-sm group-hover:bg-slate-200 transition-colors">
              🌍
            </div>
            <div className="text-lg font-bold text-slate-800">
              {isLoading ? (
                <div className="w-8 h-5 bg-gray-200 rounded animate-pulse mx-auto"></div>
              ) : formatNumber(stats.totalCountries)}
            </div>
            <div className="text-xs text-slate-500 font-medium">Quốc gia</div>
          </div>
          
          <div className="text-center group cursor-pointer">
            <div className="w-8 h-8 mx-auto mb-2 rounded-lg bg-slate-100 flex items-center justify-center text-sm group-hover:bg-slate-200 transition-colors">
              👤
            </div>
            <div className="text-lg font-bold text-slate-800">
              {isLoading ? (
                <div className="w-10 h-5 bg-gray-200 rounded animate-pulse mx-auto"></div>
              ) : formatNumber(stats.totalParticipants)}
            </div>
            <div className="text-xs text-slate-500 font-medium">Người test</div>
          </div>
          
          <div className="text-center group cursor-pointer">
            <div className="w-8 h-8 mx-auto mb-2 rounded-lg bg-slate-100 flex items-center justify-center text-sm group-hover:bg-slate-200 transition-colors">
              🧠
            </div>
            <div className="text-lg font-bold text-slate-800">
              {isLoading ? (
                <div className="w-8 h-5 bg-gray-200 rounded animate-pulse mx-auto"></div>
              ) : stats.globalAverageIQ}
            </div>
            <div className="text-xs text-slate-500 font-medium">IQ TB</div>
          </div>
          
          <div className="text-center group cursor-pointer">
            <div className="w-8 h-8 mx-auto mb-2 rounded-lg bg-slate-100 flex items-center justify-center text-sm group-hover:bg-slate-200 transition-colors">
              ⏱️
            </div>
            <div className="text-lg font-bold text-slate-800">
              {isLoading ? (
                <div className="w-10 h-5 bg-gray-200 rounded animate-pulse mx-auto"></div>
              ) : stats.averageTestTime}
            </div>
            <div className="text-xs text-slate-500 font-medium">Thời gian</div>
          </div>
        </div>

        {/* Subtle divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-slate-200/60 to-transparent my-4"></div>

        {/* Bottom badges - Ultra minimal */}
        <div className="flex items-center justify-center gap-6">
          <div className="text-center group cursor-pointer">
            <div className="flex items-center gap-1.5 mb-1">
              <div className="w-6 h-6 rounded-md bg-amber-100 flex items-center justify-center text-xs">🏆</div>
              <span className="text-base font-bold text-slate-800">
                {isLoading ? (
                  <div className="w-6 h-4 bg-gray-200 rounded animate-pulse"></div>
                ) : formatNumber(stats.geniusBadges)}
              </span>
            </div>
            <div className="text-xs text-amber-600 font-medium">Genius</div>
          </div>
          
          <div className="text-center group cursor-pointer">
            <div className="flex items-center gap-1.5 mb-1">
              <div className="w-6 h-6 rounded-md bg-blue-100 flex items-center justify-center text-xs">🎓</div>
              <span className="text-base font-bold text-slate-800">
                {isLoading ? (
                  <div className="w-6 h-4 bg-gray-200 rounded animate-pulse"></div>
                ) : formatNumber(stats.smartBadges)}
              </span>
            </div>
            <div className="text-xs text-blue-600 font-medium">Smart</div>
          </div>
          
          <div className="text-center group cursor-pointer">
            <div className="flex items-center gap-1.5 mb-1">
              <div className="w-6 h-6 rounded-md bg-emerald-100 flex items-center justify-center text-xs">⭐</div>
              <span className="text-base font-bold text-slate-800">
                {isLoading ? (
                  <div className="w-8 h-4 bg-gray-200 rounded animate-pulse"></div>
                ) : formatNumber(stats.excellentBadges)}
              </span>
            </div>
            <div className="text-xs text-emerald-600 font-medium">Excellent</div>
          </div>
        </div>
      </div>

      {/* IQ Distribution & Age Distribution */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* IQ Distribution */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-white/30 shadow-sm">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            📈 Phân bố điểm IQ
          </h3>
          <div className="space-y-3">
            {stats.iqDistribution.map((item, idx) => {
              const maxCount = Math.max(...stats.iqDistribution.map(d => d.count));
              const width = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
              
              return (
                <div key={idx} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">{item.range}</span>
                  <div className="flex items-center gap-2 flex-1 mx-3">
                    <div className="bg-gray-200 rounded-full h-2 flex-1">
                      <div 
                        className="bg-gradient-to-r from-blue-400 to-purple-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${width}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-sm text-gray-600">
                    {isLoading ? (
                      <div className="w-8 h-4 bg-gray-200 rounded animate-pulse"></div>
                    ) : formatNumber(item.count)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Age Distribution */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-white/30 shadow-sm">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            👶 Độ tuổi phổ biến
          </h3>
          <div className="space-y-3">
            {stats.ageDistribution.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">{item.age} tuổi</span>
                <div className="flex items-center gap-2 flex-1 mx-3">
                  <div className="bg-gray-200 rounded-full h-2 flex-1">
                    <div 
                      className="bg-gradient-to-r from-green-400 to-blue-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
                <span className="text-sm text-gray-600">
                  {isLoading ? (
                    <div className="w-8 h-4 bg-gray-200 rounded animate-pulse"></div>
                  ) : `${item.percentage}%`}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Countries */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Top by IQ */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-white/30 shadow-sm">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            🌟 Top 5 quốc gia IQ cao nhất
          </h3>
          <div className="space-y-3">
            {isLoading ? (
              // Loading skeleton
              [...Array(5)].map((_, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-4 bg-gray-300 rounded animate-pulse"></div>
                    <div className="w-20 h-4 bg-gray-300 rounded animate-pulse"></div>
                  </div>
                  <div className="w-8 h-4 bg-gray-300 rounded animate-pulse"></div>
                </div>
              ))
            ) : stats.topCountriesByIQ.length > 0 ? (
              stats.topCountriesByIQ.map((country, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{country.flag}</span>
                    <span className="font-medium text-gray-700">{country.country}</span>
                  </div>
                  <span className="font-bold text-blue-600">{country.avgIQ}</span>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-500 py-4">Chưa có dữ liệu</div>
            )}
          </div>
        </div>

        {/* Top by Participants */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-white/30 shadow-sm">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            🔥 Top 5 quốc gia nhiều người chơi
          </h3>
          <div className="space-y-3">
            {isLoading ? (
              // Loading skeleton
              [...Array(5)].map((_, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-4 bg-gray-300 rounded animate-pulse"></div>
                    <div className="w-20 h-4 bg-gray-300 rounded animate-pulse"></div>
                  </div>
                  <div className="w-12 h-4 bg-gray-300 rounded animate-pulse"></div>
                </div>
              ))
            ) : stats.topCountriesByParticipants.length > 0 ? (
              stats.topCountriesByParticipants.map((country, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{country.flag}</span>
                    <span className="font-medium text-gray-700">{country.country}</span>
                  </div>
                  <span className="font-bold text-green-600">{formatNumber(country.participants)}</span>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-500 py-4">Chưa có dữ liệu</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardStatsComponent; 