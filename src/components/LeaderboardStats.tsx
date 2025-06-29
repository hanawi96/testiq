import React, { useMemo } from 'react';

interface LeaderboardStats {
  totalParticipants: number;
  highestScore: number;
  averageScore: number;
  geniusPercentage: number;
  medianScore?: number;
  topPercentileScore?: number;
  recentGrowth?: number;
  averageImprovement?: number;
}

interface Props {
  initialStats: LeaderboardStats;
}

const LeaderboardStats: React.FC<Props> = ({ initialStats }) => {
  // Memoized formatter
  const formatNumber = useMemo(() => (num: number) => 
    new Intl.NumberFormat('vi-VN').format(num), []
  );

  // Optimized stat card component
  const StatCard = useMemo(() => ({ 
    value, 
    label, 
    icon 
  }: { 
    value: string | number; 
    label: string; 
    icon?: string; 
  }) => (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-gray-200 transition-all duration-200 hover:shadow-md group">
      <div className="text-xl font-bold mb-1 transition-transform group-hover:scale-105">
        {icon && <span className="mr-2">{icon}</span>}
        {typeof value === 'number' ? formatNumber(value) : value}
      </div>
      <div className="text-sm text-gray-600">{label}</div>
    </div>
  ), [formatNumber]);

  return (
    <div className="space-y-6">
      {/* Main Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
        <StatCard 
          value={initialStats.totalParticipants}
          label="Người tham gia"
          icon="👥"
        />
        <StatCard 
          value={initialStats.highestScore}
          label="Điểm cao nhất"
          icon="🏆"
        />
        <StatCard 
          value={initialStats.averageScore}
          label="Điểm trung bình"
          icon="📊"
        />
        <StatCard 
          value={`${initialStats.geniusPercentage}%`}
          label="Thiên tài"
          icon="🧠"
        />
      </div>

      {/* Optional Advanced Stats */}
      {initialStats.medianScore && (
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-blue-700 mb-1">{initialStats.medianScore}</div>
              <div className="text-xs text-blue-600">Điểm trung vị</div>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-violet-50 border border-purple-100 rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-purple-700 mb-1">{initialStats.topPercentileScore || 0}</div>
              <div className="text-xs text-purple-600">Top 10%</div>
            </div>
            <div className="bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-100 rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-emerald-700 mb-1">+{initialStats.recentGrowth || 0}%</div>
              <div className="text-xs text-emerald-600">Tăng trưởng</div>
            </div>
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100 rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-amber-700 mb-1">+{initialStats.averageImprovement || 0}</div>
              <div className="text-xs text-amber-600">Cải thiện TB</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaderboardStats; 