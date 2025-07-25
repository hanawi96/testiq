import React, { useState, useEffect } from 'react';

interface AnalyticsStats {
  completionRate: number;
  abandonmentRate: number;
  inProgressRate: number;
  totalSessions: number;
  completedCount: number;
  abandonedCount: number;
  inProgressCount: number;
  avgCompletionTime: number;
  problemQuestions: Array<{ questionNumber: number; abandonCount: number }>;
  deviceStats: {
    mobile: { completionRate: number; count: number };
    desktop: { completionRate: number; count: number };
  };
  peakHour: number;
  mainAbandonReason: string;
  scoreVsSpeed: {
    fast: { avgScore: number; count: number };
    medium: { avgScore: number; count: number };
    slow: { avgScore: number; count: number };
  };
}

export default function AdminAnalytics() {
  const [stats, setStats] = useState<AnalyticsStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  // Authentication check via API call
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Simple auth check via API call
        const response = await fetch('/api/admin/analytics');

        if (response.status === 401) {
          console.log('AdminAnalytics: Unauthorized, redirecting to login');
          window.location.href = '/admin/login';
          return;
        }

        if (response.status === 403) {
          console.log('AdminAnalytics: Forbidden, redirecting to unauthorized');
          window.location.href = '/admin/unauthorized';
          return;
        }

        // If we get here, user is authenticated
        setIsAuthChecking(false);
      } catch (err) {
        console.log('AdminAnalytics: Auth check error, redirecting to login');
        window.location.href = '/admin/login';
        return;
      }
    };
    checkAuth();
  }, []);

  useEffect(() => {
    if (!isAuthChecking) {
      loadStats();
    }
  }, [isAuthChecking]);

  const loadStats = async () => {
    try {
      setIsLoading(true);
      setError('');

      const response = await fetch('/api/admin/analytics');
      const result = await response.json();

      if (!result.success) {
        console.error('Error loading analytics:', result.error);
        setError('Không thể tải dữ liệu thống kê');
        return;
      }

      setStats(result.data);
    } catch (err) {
      console.error('Exception loading analytics:', err);
      setError('Có lỗi xảy ra khi tải dữ liệu');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Thống kê hành vi người dùng</h1>
          <p className="text-gray-600 dark:text-gray-400">Phân tích dữ liệu test để tối ưu trải nghiệm</p>
        </div>
        
        {/* Loading skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-24 mb-4"></div>
                <div className="h-8 bg-gray-200 dark:bg-gray-600 rounded w-16 mb-2"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-20"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
          <div className="w-12 h-12 mx-auto mb-4 text-red-500">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-red-900 dark:text-red-200 mb-2">Lỗi tải dữ liệu</h3>
          <p className="text-red-700 dark:text-red-300 mb-4">{error}</p>
          <button
            onClick={loadStats}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Thống kê hành vi người dùng</h1>
          <p className="text-gray-600 dark:text-gray-400">Phân tích dữ liệu test để tối ưu trải nghiệm</p>
        </div>
        <button
          onClick={loadStats}
          disabled={isLoading}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors"
        >
          <svg className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Làm mới</span>
        </button>
      </div>

      {/* Main Stats - Completion vs Abandonment */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Hoàn thành */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border border-green-200 dark:border-green-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <div className="text-3xl font-bold text-green-700 dark:text-green-300 mb-1">
            {stats.completionRate}%
          </div>
          <div className="text-green-600 dark:text-green-400 font-medium mb-1">Hoàn thành test</div>
          <div className="text-sm text-green-600 dark:text-green-500">
            {stats.completedCount} người dùng
          </div>
        </div>

        {/* Bỏ dở */}
        <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border border-red-200 dark:border-red-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-red-500 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          </div>
          <div className="text-3xl font-bold text-red-700 dark:text-red-300 mb-1">
            {stats.abandonmentRate}%
          </div>
          <div className="text-red-600 dark:text-red-400 font-medium mb-1">Bỏ dở giữa chừng</div>
          <div className="text-sm text-red-600 dark:text-red-500">
            {stats.abandonedCount} người dùng
          </div>
        </div>

        {/* Đang làm */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border border-blue-200 dark:border-blue-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="text-3xl font-bold text-blue-700 dark:text-blue-300 mb-1">
            {stats.inProgressRate}%
          </div>
          <div className="text-blue-600 dark:text-blue-400 font-medium mb-1">Đang làm dở</div>
          <div className="text-sm text-blue-600 dark:text-blue-500">
            {stats.inProgressCount} người dùng
          </div>
        </div>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Thời gian trung bình */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.avgCompletionTime} phút</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Thời gian TB</div>
            </div>
          </div>
        </div>

        {/* Mobile vs Desktop */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Mobile vs Desktop</div>
              <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {stats.deviceStats.mobile.completionRate}% | {stats.deviceStats.desktop.completionRate}%
              </div>
            </div>
          </div>
        </div>

        {/* Giờ vàng */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.peakHour}:00</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Giờ vàng</div>
            </div>
          </div>
        </div>

        {/* Lý do bỏ cuộc */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div>
              <div className="text-lg font-semibold text-gray-900 dark:text-gray-100 capitalize">{stats.mainAbandonReason}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Lý do chính</div>
            </div>
          </div>
        </div>
      </div>

      {/* Problem Questions */}
      {stats.problemQuestions.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Câu hỏi gây bỏ cuộc nhiều nhất
          </h3>
          <div className="space-y-3">
            {stats.problemQuestions.map((q) => (
              <div key={q.questionNumber} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                    <span className="text-sm font-semibold text-red-600 dark:text-red-400">#{q.questionNumber}</span>
                  </div>
                  <span className="font-medium text-gray-900 dark:text-gray-100">Câu hỏi {q.questionNumber}</span>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold text-red-600 dark:text-red-400">{q.abandonCount}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">lượt bỏ cuộc</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Score vs Speed */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Điểm số theo tốc độ làm bài
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">
              {stats.scoreVsSpeed.fast.avgScore}
            </div>
            <div className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-1">Nhanh (&lt;15p)</div>
            <div className="text-xs text-blue-600 dark:text-blue-400">{stats.scoreVsSpeed.fast.count} người</div>
          </div>
          <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">
              {stats.scoreVsSpeed.medium.avgScore}
            </div>
            <div className="text-sm font-medium text-green-700 dark:text-green-300 mb-1">Trung bình (15-25p)</div>
            <div className="text-xs text-green-600 dark:text-green-400">{stats.scoreVsSpeed.medium.count} người</div>
          </div>
          <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400 mb-1">
              {stats.scoreVsSpeed.slow.avgScore}
            </div>
            <div className="text-sm font-medium text-orange-700 dark:text-orange-300 mb-1">Chậm (&gt;25p)</div>
            <div className="text-xs text-orange-600 dark:text-orange-400">{stats.scoreVsSpeed.slow.count} người</div>
          </div>
        </div>
      </div>
    </div>
  );
}
