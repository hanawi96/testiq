import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AdminService } from '../../../../backend';
import type { WeeklyTestStats } from '../../../../backend';
import { exportNewUsersToCSV, exportNewUsersToJSON } from '../../../utils/admin/data/export-utils';

interface Props {
  className?: string;
}

export default function WeeklyTestChart({ className = '' }: Props) {
  const [data, setData] = useState<WeeklyTestStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    loadWeeklyTestData();
  }, []);

  const loadWeeklyTestData = useCallback(async (forceRefresh = false, retryAttempt = 0) => {
    const maxRetries = 3;
    const retryDelay = Math.min(1000 * Math.pow(2, retryAttempt), 5000);
    
    try {
      setIsLoading(true);
      setError('');
      
      console.log('WeeklyTestChart: Loading weekly test data', { forceRefresh, retryAttempt });
      
      if (forceRefresh) {
        AdminService.clearWeeklyTestStatsCache();
      }
      
      const { data: weeklyData, error: weeklyError } = await AdminService.getWeeklyTestStats();
      
      if (weeklyError) {
        console.error('WeeklyTestChart: Error loading data:', weeklyError);
        
        if (retryAttempt < maxRetries && (
          weeklyError.message?.includes('network') || 
          weeklyError.message?.includes('timeout') ||
          weeklyError.code === 'PGRST301'
        )) {
          console.log(`WeeklyTestChart: Retrying in ${retryDelay}ms (attempt ${retryAttempt + 1}/${maxRetries})`);
          setTimeout(() => {
            loadWeeklyTestData(forceRefresh, retryAttempt + 1);
          }, retryDelay);
          return;
        }
        
        setError('Không thể tải dữ liệu thống kê tuần');
        return;
      }
      
      if (weeklyData) {
        console.log('WeeklyTestChart: Data loaded successfully', weeklyData);
        setData(weeklyData);
      }
    } catch (err) {
      console.error('WeeklyTestChart: Exception loading data:', err);
      
      if (retryAttempt < maxRetries) {
        console.log(`WeeklyTestChart: Retrying after exception in ${retryDelay}ms (attempt ${retryAttempt + 1}/${maxRetries})`);
        setTimeout(() => {
          loadWeeklyTestData(forceRefresh, retryAttempt + 1);
        }, retryDelay);
        return;
      }
      
      setError('Có lỗi xảy ra khi tải dữ liệu');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Memoized chart data
  const chartData = useMemo(() => {
    return data?.weeklyData || [];
  }, [data]);

  // Simple SVG Bar Chart Component
  const SimpleBarChart = useCallback(() => {
    if (!chartData.length) return null;

    // Responsive chart dimensions
    const width = 800;
    const height = 280;
    const padding = 50;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    const maxValue = Math.max(...chartData.map(d => d.testCount)) || 1;
    const barWidth = chartWidth / chartData.length * 0.7;
    const barSpacing = chartWidth / chartData.length * 0.3;

    return (
      <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
        <svg
          width="100%"
          height="280"
          viewBox={`0 0 ${width} ${height}`}
          className="overflow-visible h-64 lg:h-72 xl:h-80 2xl:h-96"
          preserveAspectRatio="xMidYMid meet"
        >
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
          
          {/* Bars */}
          {chartData.map((d, i) => {
            const x = padding + i * (barWidth + barSpacing) + barSpacing / 2;
            const barHeight = (d.testCount / maxValue) * chartHeight;
            const y = padding + chartHeight - barHeight;
            
            return (
              <g key={i}>
                {/* Bar */}
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  fill="#3B82F6"
                  className="hover:fill-blue-600 transition-colors duration-200"
                  rx="4"
                />
                
                {/* Value label on top of bar */}
                <text 
                  x={x + barWidth / 2} 
                  y={y - 8} 
                  textAnchor="middle" 
                  fontSize="12" 
                  fill="currentColor" 
                  className="text-gray-700 dark:text-gray-300 font-medium"
                >
                  {d.testCount}
                </text>
                
                {/* Week label */}
                <text 
                  x={x + barWidth / 2} 
                  y={height - 10} 
                  textAnchor="middle" 
                  fontSize="10" 
                  fill="currentColor" 
                  className="text-gray-600 dark:text-gray-400"
                >
                  {d.weekLabel}
                </text>
              </g>
            );
          })}
          
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
  }, [chartData]);

  // Export functions adapted for weekly data
  const exportWeeklyToCSV = useCallback(() => {
    if (!data) return;
    
    const csvData = data.weeklyData.map(week => ({
      'Tuần': week.weekLabel,
      'Từ ngày': week.weekStart,
      'Đến ngày': week.weekEnd,
      'Số lượt test': week.testCount
    }));

    csvData.push({
      'Tuần': 'TỔNG CỘNG',
      'Từ ngày': '',
      'Đến ngày': '',
      'Số lượt test': data.totalTests
    });

    const csvContent = csvData.map(row => 
      Object.values(row).map(val => 
        typeof val === 'string' && val.includes(',') ? `"${val}"` : val
      ).join(',')
    ).join('\n');
    
    const headers = Object.keys(csvData[0]).join(',');
    const finalCsv = headers + '\n' + csvContent;
    
    const blob = new Blob([finalCsv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `luot-test-theo-tuan-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [data]);

  const exportWeeklyToJSON = useCallback(() => {
    if (!data) return;
    
    const exportData = {
      exportedAt: new Date().toISOString(),
      period: '6 tuần gần nhất',
      summary: {
        totalTests: data.totalTests,
        averageTestsPerWeek: Math.round(data.totalTests / data.weeklyData.length)
      },
      weeklyData: data.weeklyData
    };

    const jsonContent = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `luot-test-theo-tuan-${new Date().toISOString().split('T')[0]}.json`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [data]);



  // Simple loading skeleton
  if (isLoading) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 border border-gray-200 dark:border-gray-700 ${className}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 space-y-2 sm:space-y-0">
          <div>
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-56 mb-2 animate-pulse"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-40 animate-pulse"></div>
          </div>
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse"></div>
        </div>
        <div className="h-64 lg:h-72 xl:h-80 2xl:h-96 bg-gray-200 dark:bg-gray-700 rounded-lg mb-6 animate-pulse"></div>
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          {[1, 2].map(i => (
            <div key={i} className="text-center">
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16 mx-auto mb-2 animate-pulse"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20 mx-auto animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 ${className}`}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Lượt làm bài test (6 tuần qua)
          </h3>
          <button 
            onClick={() => loadWeeklyTestData(true)}
            className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 text-sm"
          >
            Thử lại
          </button>
        </div>
        <div className="h-64 lg:h-72 xl:h-80 2xl:h-96 flex items-center justify-center">
          <div className="text-center">
            <div className="text-red-500 dark:text-red-400 mb-2">⚠️</div>
            <div className="text-gray-500 dark:text-gray-400">{error}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 border border-gray-200 dark:border-gray-700 ${className}`}
      role="region"
      aria-label="Biểu đồ thống kê lượt làm bài test theo tuần"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 space-y-2 sm:space-y-0">
        <div className="flex-1">
          <h3 
            className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100"
            id="weekly-test-chart-title"
          >
            Lượt làm bài test (6 tuần qua)
          </h3>
          <p 
            className="text-sm text-gray-600 dark:text-gray-400 mt-1"
            aria-describedby="weekly-test-chart-title"
          >
            Tổng cộng: <span className="font-medium text-blue-600 dark:text-blue-400">{data?.totalTests || 0}</span> lượt test
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {/* Export Dropdown */}
          {data && (
            <div className="relative group">
              <button 
                className="flex items-center space-x-1 px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                title="Xuất dữ liệu thống kê tuần"
                aria-label="Xuất dữ liệu thống kê tuần"
                aria-haspopup="true"
                aria-expanded="false"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="hidden sm:inline">Xuất</span>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              <div 
                className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10"
                role="menu"
                aria-label="Tùy chọn xuất dữ liệu tuần"
              >
                <button
                  onClick={exportWeeklyToCSV}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-t-lg transition-colors focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-700"
                  role="menuitem"
                  aria-label="Xuất dữ liệu tuần dạng CSV"
                >
                  <div className="flex items-center space-x-2">
                    <span role="img" aria-label="Biểu đồ">📊</span>
                    <span>Xuất CSV</span>
                  </div>
                </button>
                <button
                  onClick={exportWeeklyToJSON}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-b-lg transition-colors focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-700"
                  role="menuitem"
                  aria-label="Xuất dữ liệu tuần dạng JSON"
                >
                  <div className="flex items-center space-x-2">
                    <span role="img" aria-label="Tài liệu">📄</span>
                    <span>Xuất JSON</span>
                  </div>
                </button>
              </div>
            </div>
          )}
          
          {/* Refresh Button */}
          <button 
            onClick={() => loadWeeklyTestData(true)}
            className="flex items-center space-x-1 px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
            title="Làm mới dữ liệu thống kê tuần"
            aria-label="Làm mới dữ liệu thống kê tuần"
            disabled={isLoading}
          >
            <svg 
              className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
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
        aria-labelledby="weekly-test-chart-title"
        aria-describedby="weekly-chart-description"
      >
        <div id="weekly-chart-description" className="sr-only">
          Biểu đồ cột thể hiện số lượt làm bài test trong 6 tuần gần nhất. 
          Tổng cộng có {data?.totalTests || 0} lượt test được thực hiện.
        </div>
        <SimpleBarChart />
      </div>

      {/* Summary Stats */}
      <div 
        className="grid grid-cols-2 gap-2 sm:gap-4 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700"
        role="region"
        aria-label="Tóm tắt thống kê tuần"
      >
        <div
          className="text-center p-2 sm:p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20"
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
        </div>
        <div
          className="text-center p-2 sm:p-3 rounded-lg bg-green-50 dark:bg-green-900/20"
          role="group"
          aria-label={`Trung bình mỗi tuần: ${data ? Math.round(data.totalTests / data.weeklyData.length) : 0}`}
        >
          <div
            className="text-lg sm:text-2xl font-bold text-green-600 dark:text-green-400"
            aria-label={`${data ? Math.round(data.totalTests / data.weeklyData.length) : 0} test trung bình mỗi tuần`}
          >
            {data ? Math.round(data.totalTests / data.weeklyData.length) : 0}
          </div>
          <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">TB/tuần</div>
        </div>
      </div>
    </div>
  );
}
