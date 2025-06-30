import React, { useMemo } from 'react';

interface GlobalIQStats {
  totalCountries: number;
  totalParticipants: number;
  globalAverageIQ: number;
  averageTestTime: string;
  geniusBadges: number;
  smartBadges: number;
  excellentBadges: number;
  topCountriesByIQ: Array<{ country: string; flag: string; avgIQ: number }>;
  topCountriesByParticipants: Array<{ country: string; flag: string; participants: number }>;
  weeklyTests: Array<{ day: string; tests: number }>;
  ageDistribution: Array<{ age: string; percentage: number }>;
  iqDistribution: Array<{ range: string; count: number }>;
  nearbyUsers?: number;
  userPercentile?: number;
}

// Demo data
const demoStats: GlobalIQStats = {
  totalCountries: 132,
  totalParticipants: 2847392,
  globalAverageIQ: 108.7,
  averageTestTime: "5:32",
  geniusBadges: 45821,
  smartBadges: 234567,
  excellentBadges: 789123,
  topCountriesByIQ: [
    { country: "Singapore", flag: "🇸🇬", avgIQ: 115.2 },
    { country: "Hàn Quốc", flag: "🇰🇷", avgIQ: 114.8 },
    { country: "Nhật Bản", flag: "🇯🇵", avgIQ: 114.1 },
    { country: "Đài Loan", flag: "🇹🇼", avgIQ: 113.7 },
    { country: "Phần Lan", flag: "🇫🇮", avgIQ: 113.2 }
  ],
  topCountriesByParticipants: [
    { country: "Mỹ", flag: "🇺🇸", participants: 421847 },
    { country: "Ấn Độ", flag: "🇮🇳", participants: 387521 },
    { country: "Việt Nam", flag: "🇻🇳", participants: 234891 },
    { country: "Brazil", flag: "🇧🇷", participants: 198734 },
    { country: "Trung Quốc", flag: "🇨🇳", participants: 176523 }
  ],
  weeklyTests: [
    { day: "T2", tests: 12847 },
    { day: "T3", tests: 15234 },
    { day: "T4", tests: 18765 },
    { day: "T5", tests: 21456 },
    { day: "T6", tests: 25891 },
    { day: "T7", tests: 32145 },
    { day: "CN", tests: 28934 }
  ],
  ageDistribution: [
    { age: "16-20", percentage: 22 },
    { age: "21-25", percentage: 28 },
    { age: "26-30", percentage: 24 },
    { age: "31-35", percentage: 14 },
    { age: "36+", percentage: 12 }
  ],
  iqDistribution: [
    { range: "70-85", count: 142847 },
    { range: "85-100", count: 685234 },
    { range: "100-115", count: 1234567 },
    { range: "115-130", count: 524891 },
    { range: "130+", count: 259853 }
  ],
  nearbyUsers: 3,
  userPercentile: 85
};

interface Props {
  stats?: GlobalIQStats;
}

const GlobalIQDashboard: React.FC<Props> = ({ stats = demoStats }) => {
  const formatNumber = useMemo(() => (num: number) => 
    new Intl.NumberFormat('vi-VN').format(num), []);

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
            {typeof value === 'number' ? formatNumber(value) : value}
          </div>
          <div className="text-sm text-gray-600 font-medium">{label}</div>
          {subtitle && <div className="text-xs text-gray-500">{subtitle}</div>}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      
      {/* Modern Minimalist Stats */}
      <div className="backdrop-blur-sm bg-white/70 border border-gray-200/50 rounded-2xl p-5 shadow-sm">
        {/* Top Stats - Clean 4-grid */}
        <div className="grid grid-cols-4 gap-3 mb-4">
          <div className="text-center group cursor-pointer">
            <div className="w-8 h-8 mx-auto mb-2 rounded-lg bg-slate-100 flex items-center justify-center text-sm group-hover:bg-slate-200 transition-colors">
              🌍
            </div>
            <div className="text-lg font-bold text-slate-800">{formatNumber(stats.totalCountries)}</div>
            <div className="text-xs text-slate-500 font-medium">Quốc gia</div>
          </div>
          
          <div className="text-center group cursor-pointer">
            <div className="w-8 h-8 mx-auto mb-2 rounded-lg bg-slate-100 flex items-center justify-center text-sm group-hover:bg-slate-200 transition-colors">
              👤
            </div>
            <div className="text-lg font-bold text-slate-800">{formatNumber(stats.totalParticipants)}</div>
            <div className="text-xs text-slate-500 font-medium">Người test</div>
          </div>
          
          <div className="text-center group cursor-pointer">
            <div className="w-8 h-8 mx-auto mb-2 rounded-lg bg-slate-100 flex items-center justify-center text-sm group-hover:bg-slate-200 transition-colors">
              🧠
            </div>
            <div className="text-lg font-bold text-slate-800">{stats.globalAverageIQ}</div>
            <div className="text-xs text-slate-500 font-medium">IQ TB</div>
          </div>
          
          <div className="text-center group cursor-pointer">
            <div className="w-8 h-8 mx-auto mb-2 rounded-lg bg-slate-100 flex items-center justify-center text-sm group-hover:bg-slate-200 transition-colors">
              ⏱️
            </div>
            <div className="text-lg font-bold text-slate-800">{stats.averageTestTime}</div>
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
              <span className="text-base font-bold text-slate-800">{formatNumber(stats.geniusBadges)}</span>
            </div>
            <div className="text-xs text-amber-600 font-medium">Genius</div>
          </div>
          
          <div className="text-center group cursor-pointer">
            <div className="flex items-center gap-1.5 mb-1">
              <div className="w-6 h-6 rounded-md bg-blue-100 flex items-center justify-center text-xs">🎓</div>
              <span className="text-base font-bold text-slate-800">{formatNumber(stats.smartBadges)}</span>
            </div>
            <div className="text-xs text-blue-600 font-medium">Smart</div>
          </div>
          
          <div className="text-center group cursor-pointer">
            <div className="flex items-center gap-1.5 mb-1">
              <div className="w-6 h-6 rounded-md bg-emerald-100 flex items-center justify-center text-xs">⭐</div>
              <span className="text-base font-bold text-slate-800">{formatNumber(stats.excellentBadges)}</span>
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
            {stats.iqDistribution.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">{item.range}</span>
                <div className="flex items-center gap-2 flex-1 mx-3">
                  <div className="bg-gray-200 rounded-full h-2 flex-1">
                    <div 
                      className="bg-gradient-to-r from-blue-400 to-purple-500 h-2 rounded-full"
                      style={{ width: `${(item.count / Math.max(...stats.iqDistribution.map(d => d.count))) * 100}%` }}
                    />
                  </div>
                </div>
                <span className="text-sm text-gray-600">{formatNumber(item.count)}</span>
              </div>
            ))}
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
                      className="bg-gradient-to-r from-green-400 to-blue-500 h-2 rounded-full"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
                <span className="text-sm text-gray-600">{item.percentage}%</span>
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
            {stats.topCountriesByIQ.map((country, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-lg">{country.flag}</span>
                  <span className="font-medium text-gray-700">{country.country}</span>
                </div>
                <span className="font-bold text-blue-600">{country.avgIQ}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top by Participants */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-white/30 shadow-sm">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            🔥 Top 5 quốc gia nhiều người chơi
          </h3>
          <div className="space-y-3">
            {stats.topCountriesByParticipants.map((country, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-lg">{country.flag}</span>
                  <span className="font-medium text-gray-700">{country.country}</span>
                </div>
                <span className="font-bold text-green-600">{formatNumber(country.participants)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>




    </div>
  );
};

export default GlobalIQDashboard; 