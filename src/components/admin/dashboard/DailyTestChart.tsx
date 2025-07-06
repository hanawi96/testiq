import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { AdminService } from '../../../../backend';
import type { DailyTestStats } from '../../../../backend';

interface Props {
  className?: string;
}

export default function DailyTestChart({ className = '' }: Props) {
  const [data, setData] = useState<DailyTestStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);

  useEffect(() => {
    loadDailyTestData();
  }, []);

  const loadDailyTestData = useCallback(async (forceRefresh = false, retryAttempt = 0) => {
    const maxRetries = 3;
    const retryDelay = 1000 * (retryAttempt + 1); // 1s, 2s, 3s

    try {
      setIsLoading(true);
      setError('');
      
      if (forceRefresh) {
        AdminService.clearDailyTestStatsCache();
      }
      
      const { data: dailyData, error: dailyError } = await AdminService.getDailyTestStats();
      
      if (dailyError) {
        console.error('DailyTestChart: Error loading data:', dailyError);
        
        if (retryAttempt < maxRetries && (
          dailyError.message?.includes('network') || 
          dailyError.message?.includes('timeout') ||
          dailyError.code === 'PGRST301'
        )) {
          console.log(`DailyTestChart: Retrying in ${retryDelay}ms (attempt ${retryAttempt + 1}/${maxRetries})`);
          setTimeout(() => {
            loadDailyTestData(forceRefresh, retryAttempt + 1);
          }, retryDelay);
          return;
        }
        
        setError('Không thể tải dữ liệu thống kê ngày');
        return;
      }
      
      if (dailyData) {
        console.log('DailyTestChart: Data loaded successfully', dailyData);
        setData(dailyData);
      }
    } catch (err) {
      console.error('DailyTestChart: Exception loading data:', err);
      setError('Có lỗi xảy ra khi tải dữ liệu');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Chart calculations
  const chartData = useMemo(() => {
    if (!data?.dailyData) return [];
    return data.dailyData;
  }, [data]);

  const maxValue = useMemo(() => {
    if (!chartData.length) return 10;
    const max = Math.max(...chartData.map(d => d.testCount));
    return Math.max(max, 1); // Ensure minimum of 1
  }, [chartData]);

  // SVG Line Chart Component
  const LineChart = useCallback(() => {
    if (!chartData.length) {
      return (
        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 flex items-center justify-center h-60">
          <div className="text-center">
            <svg className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Chưa có dữ liệu test</p>
          </div>
        </div>
      );
    }

    const width = 480;
    const height = 260;
    const padding = 45;
    const chartWidth = width - (padding * 2);
    const chartHeight = height - (padding * 2);

    // Calculate points for the line
    const points = chartData.map((d, i) => {
      const x = padding + (i * (chartWidth / (chartData.length - 1)));
      const y = padding + chartHeight - ((d.testCount / maxValue) * chartHeight);
      return { x, y, data: d };
    });

    // Create path string for the line
    const pathData = points.reduce((path, point, i) => {
      const command = i === 0 ? 'M' : 'L';
      return `${path} ${command} ${point.x} ${point.y}`;
    }, '');

    // Create area path (filled area under the line)
    const areaPath = `${pathData} L ${points[points.length - 1].x} ${padding + chartHeight} L ${padding} ${padding + chartHeight} Z`;

    return (
      <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
        <svg width="100%" height="260" viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
          {/* Background */}
          <rect width="100%" height="100%" fill="transparent" />
          
          {/* Grid lines */}
          {[0, 1, 2, 3, 4].map(i => {
            const y = padding + (chartHeight / 4) * i;
            return (
              <line 
                key={`grid-${i}`}
                x1={padding} 
                y1={y} 
                x2={width - padding} 
                y2={y} 
                stroke="currentColor" 
                strokeWidth="1" 
                className="text-gray-200 dark:text-gray-700" 
                opacity="0.3"
              />
            );
          })}
          
          {/* Area under the line */}
          <path
            d={areaPath}
            fill="url(#gradient)"
            opacity="0.3"
          />
          
          {/* Gradient definition */}
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.1" />
            </linearGradient>
          </defs>
          
          {/* Main line */}
          <path
            d={pathData}
            fill="none"
            stroke="#3B82F6"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="drop-shadow-sm"
          />
          
          {/* Data points */}
          {points.map((point, i) => (
            <g key={i}>
              {/* Point circle */}
              <circle
                cx={point.x}
                cy={point.y}
                r={hoveredPoint === i ? "6" : "4"}
                fill="#3B82F6"
                stroke="white"
                strokeWidth="2"
                className="cursor-pointer transition-all duration-200 drop-shadow-sm"
                onMouseEnter={() => setHoveredPoint(i)}
                onMouseLeave={() => setHoveredPoint(null)}
              />
              
              {/* Value label on hover */}
              {hoveredPoint === i && (
                <g>
                  {/* Tooltip background */}
                  <rect
                    x={point.x - 30}
                    y={point.y - 40}
                    width="60"
                    height="30"
                    fill="rgba(0, 0, 0, 0.9)"
                    rx="6"
                    className="animate-in fade-in duration-200 drop-shadow-lg"
                  />
                  {/* Tooltip text - count */}
                  <text
                    x={point.x}
                    y={point.y - 28}
                    textAnchor="middle"
                    fontSize="12"
                    fill="white"
                    className="font-bold animate-in fade-in duration-200"
                  >
                    {point.data.testCount}
                  </text>
                  {/* Tooltip text - date */}
                  <text
                    x={point.x}
                    y={point.y - 16}
                    textAnchor="middle"
                    fontSize="9"
                    fill="rgba(255, 255, 255, 0.8)"
                    className="animate-in fade-in duration-200"
                  >
                    {point.data.dateLabel}
                  </text>
                </g>
              )}
              
              {/* Date label */}
              <text 
                x={point.x} 
                y={height - 10} 
                textAnchor="middle" 
                fontSize="10" 
                fill="currentColor" 
                className="text-gray-600 dark:text-gray-400"
              >
                {point.data.dateLabel}
              </text>
            </g>
          ))}
          
          {/* Y-axis labels */}
          {[0, 1, 2, 3, 4].map(i => {
            const value = Math.round((maxValue / 4) * (4 - i));
            const y = padding + (chartHeight / 4) * i;
            return (
              <text 
                key={`y-label-${i}`}
                x={padding - 10} 
                y={y + 4} 
                textAnchor="end" 
                fontSize="10" 
                fill="currentColor" 
                className="text-gray-600 dark:text-gray-400"
              >
                {value}
              </text>
            );
          })}
        </svg>
      </div>
    );
  }, [chartData, maxValue, hoveredPoint]);

  // Loading skeleton component
  const LoadingSkeleton = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 ${className}`}
    >
      {/* Header skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-2 animate-pulse"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-64 animate-pulse"></div>
        </div>
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse"></div>
      </div>

      {/* Chart skeleton */}
      <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 mb-4">
        <div className="h-60 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
      </div>

      {/* Stats skeleton */}
      <div className="grid grid-cols-2 gap-2 sm:gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="text-center p-2 sm:p-3 rounded-lg bg-gray-100 dark:bg-gray-700/50">
          <div className="h-8 bg-gray-200 dark:bg-gray-600 rounded w-12 mx-auto mb-2 animate-pulse"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-16 mx-auto animate-pulse"></div>
        </div>
        <div className="text-center p-2 sm:p-3 rounded-lg bg-gray-100 dark:bg-gray-700/50">
          <div className="h-8 bg-gray-200 dark:bg-gray-600 rounded w-12 mx-auto mb-2 animate-pulse"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-16 mx-auto animate-pulse"></div>
        </div>
      </div>
    </motion.div>
  );

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 ${className}`}
      >
        <div className="text-center">
          <div className="text-red-500 dark:text-red-400 mb-2">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Lỗi tải dữ liệu</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <button
            onClick={() => loadDailyTestData(true)}
            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
          >
            Thử lại
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 ${className}`}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h3 
            id="daily-test-chart-title"
            className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2"
          >
            Lượt test (7 ngày qua)
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Thống kê số lượng bài test được thực hiện theo ngày
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => loadDailyTestData(true)}
            disabled={isLoading}
            className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
            title="Làm mới dữ liệu"
          >
            <svg className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span className="hidden sm:inline">{isLoading ? 'Đang tải...' : 'Làm mới'}</span>
          </button>
        </div>
      </div>

      {/* Chart */}
      <div 
        className="mb-4"
        role="img"
        aria-labelledby="daily-test-chart-title"
        aria-describedby="daily-chart-description"
      >
        <div id="daily-chart-description" className="sr-only">
          Biểu đồ đường thể hiện số lượt làm bài test trong 7 ngày gần nhất. 
          Tổng cộng có {data?.totalTests || 0} lượt test được thực hiện.
        </div>
        <LineChart />
      </div>

      {/* Summary Stats */}
      <div 
        className="grid grid-cols-2 gap-2 sm:gap-4 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700"
        role="region"
        aria-label="Tóm tắt thống kê ngày"
      >
        <motion.div 
          className="text-center p-2 sm:p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20"
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.2 }}
          role="group"
          aria-label={`Tổng số test: ${data?.totalTests || 0}`}
        >
          <div 
            className="text-lg sm:text-2xl font-bold text-blue-600 dark:text-blue-400"
            aria-label={`${data?.totalTests || 0} lượt test tổng cộng`}
          >
            {data?.totalTests || 0}
          </div>
          <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Tổng test</div>
        </motion.div>
        <motion.div 
          className="text-center p-2 sm:p-3 rounded-lg bg-green-50 dark:bg-green-900/20"
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.2 }}
          role="group"
          aria-label={`Trung bình mỗi ngày: ${data?.averagePerDay || 0}`}
        >
          <div 
            className="text-lg sm:text-2xl font-bold text-green-600 dark:text-green-400"
            aria-label={`${data?.averagePerDay || 0} test trung bình mỗi ngày`}
          >
            {data?.averagePerDay || 0}
          </div>
          <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">TB/ngày</div>
        </motion.div>
      </div>
    </motion.div>
  );
}
