import React from 'react';
import { motion } from 'framer-motion';
import type { TestHistoryItem } from './types';
import { formatTimeDisplay } from './utils';

interface TestHistoryProps {
  testHistory: TestHistoryItem[];
  isLoadingHistory: boolean;
  realTestHistoryLength: number;
}

const TestHistory: React.FC<TestHistoryProps> = ({ 
  testHistory, 
  isLoadingHistory,
  realTestHistoryLength 
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
      <h3 className="text-lg font-bold text-gray-900 dark:text-gray-200 mb-6 flex items-center">
        <span className="mr-2">📈</span>
        Lịch sử tiến bộ
        {isLoadingHistory && (
          <div className="ml-2 w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        )}
        {!isLoadingHistory && testHistory.length > 1 && (
          <span className="ml-2 text-sm bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full">
            {realTestHistoryLength > 9 ? `${testHistory.length}/${realTestHistoryLength + 1}` : testHistory.length} bài test
          </span>
        )}
      </h3>
      
      {isLoadingHistory ? (
        // Loading skeleton với dark mode
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center space-x-4">
              <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
              <div className="flex-1 bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded animate-pulse mb-2"></div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="h-8 bg-gray-200 dark:bg-gray-600 rounded animate-pulse"></div>
                  <div className="h-8 bg-gray-200 dark:bg-gray-600 rounded animate-pulse"></div>
                  <div className="h-8 bg-gray-200 dark:bg-gray-600 rounded animate-pulse"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : testHistory.length === 1 ? (
        // First time user - welcome message với dark mode
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-2xl mx-auto mb-4">
            🎉
          </div>
          <h4 className="text-lg font-bold text-gray-900 dark:text-gray-200 mb-2">Chúc mừng bài test đầu tiên!</h4>
          <p className="text-gray-600 dark:text-gray-400 mb-4">Đây là điểm baseline của bạn. Hãy quay lại để theo dõi sự tiến bộ!</p>
          <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-xl p-4 max-w-sm mx-auto">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{testHistory[0].score}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Điểm IQ hiện tại</div>
          </div>
        </div>
      ) : (
        // Multiple tests - timeline view với dark mode
        <div className="relative">
          {/* Timeline line với dark mode */}
          <div className="absolute left-8 top-4 bottom-4 w-0.5 bg-gradient-to-b from-purple-200 via-green-200 to-blue-200 dark:from-purple-700 dark:via-green-700 dark:to-blue-700"></div>

          {testHistory.map((test, index) => (
            <motion.div
              key={test.id}
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.2 }}
              className={`relative flex items-center space-x-4 pb-6 ${index === testHistory.length - 1 ? 'pb-0' : ''}`}
            >
              {/* Timeline dot */}
              <div className={`relative z-10 w-4 h-4 rounded-full border-2 ${
                test.isCurrent
                  ? 'bg-purple-500 border-purple-500 shadow-lg'
                  : test.isFirst
                  ? 'bg-blue-500 border-blue-500'
                  : 'bg-green-500 border-green-500'
              }`}>
                {test.isCurrent && (
                  <div className="absolute inset-0 rounded-full bg-purple-500 animate-ping opacity-75"></div>
                )}
              </div>

              {/* Content với dark mode */}
              <div className={`flex-1 p-4 rounded-xl border hover:shadow-md ${
                test.isCurrent
                  ? 'bg-purple-50 dark:bg-purple-900/30 border-purple-200 dark:border-purple-700'
                  : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-700'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <h4 className="font-semibold text-gray-900 dark:text-gray-200">
                      {test.isFirst ? 'Lần đầu tiên' : test.isCurrent ? 'Hôm nay' : 'Lần trước'}
                    </h4>
                    {test.isCurrent && <span className="text-xs bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 px-2 py-1 rounded-full">Mới nhất</span>}
                  </div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">{test.date}</span>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${
                      test.isCurrent ? 'text-purple-600 dark:text-purple-400' : 'text-gray-700 dark:text-gray-300'
                    }`}>
                      {test.score}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">IQ Score</div>
                  </div>

                  <div className="text-center">
                    <div className={`text-lg font-semibold ${
                      test.improvement > 0 ? 'text-green-600 dark:text-green-400' :
                      test.improvement < 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'
                    }`}>
                      {test.improvement > 0 ? '+' : ''}{test.improvement || '—'}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {test.isFirst ? 'Baseline' : 'Tiến bộ'}
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                      {test.timeTaken > 0 ? formatTimeDisplay(test.timeTaken) : '—'}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Thời gian</div>
                  </div>
                </div>

                {test.improvement > 0 && (
                  <div className="mt-3 text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-3 py-1 rounded-full inline-block">
                    🎉 Cải thiện {test.improvement} điểm!
                  </div>
                )}
              </div>
            </motion.div>
          ))}
          
          {/* Show "View All" với dark mode */}
          {realTestHistoryLength > 9 && (
            <div className="mt-4 text-center">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                Hiển thị 10 bài test gần nhất • Còn {realTestHistoryLength - 9} bài test nữa
              </div>
              <a
                href="/test-history"
                className="inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium rounded-xl hover:from-blue-600 hover:to-indigo-700 shadow-md hover:shadow-lg text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span>Xem tất cả {realTestHistoryLength + 1} bài test</span>
              </a>
            </div>
          )}
        </div>
      )}

      {/* Progress summary với dark mode */}
      {!isLoadingHistory && testHistory.length > 1 && (
        <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 rounded-xl border border-blue-100 dark:border-blue-700">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-gray-200">Tổng tiến bộ</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">So với lần đầu tiên ({testHistory.length} bài test)</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                +{testHistory[0].score - testHistory[testHistory.length - 1].score}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">điểm IQ</div>
            </div>
          </div>
          
          <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
            <div className="flex items-center space-x-1">
              <span className="text-blue-500 dark:text-blue-400">⚡</span>
              <span className="text-gray-600 dark:text-gray-400">
                {(() => {
                  const oldestTime = testHistory[testHistory.length - 1].timeTaken;
                  const newestTime = testHistory[0].timeTaken;
                  if (oldestTime > 0 && newestTime > 0) {
                    const timeDiff = oldestTime - newestTime;
                    return timeDiff > 0 ? `Nhanh hơn ${timeDiff} phút` : 'Tốc độ ổn định';
                  }
                  return 'Theo dõi tốc độ';
                })()}
              </span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="text-green-500 dark:text-green-400">📊</span>
              <span className="text-gray-600 dark:text-gray-400">
                Vượt thêm {Math.max(0, testHistory[0].percentile - testHistory[testHistory.length - 1].percentile)}% dân số
              </span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="text-purple-500 dark:text-purple-400">📈</span>
              <span className="text-gray-600 dark:text-gray-400">
                Tốc độ cải thiện: {Math.round((testHistory[0].score - testHistory[testHistory.length - 1].score) / (testHistory.length - 1))} điểm/test
              </span>
            </div>
          </div>

          {/* Mini chart visual với dark mode */}
          <div className="mt-4 flex items-end space-x-1 h-8">
            {testHistory.map((test) => {
              const maxScore = Math.max(...testHistory.map(t => t.score));
              const minScore = Math.min(...testHistory.map(t => t.score));
              const range = maxScore - minScore || 1;
              const height = Math.max(8, ((test.score - minScore) / range) * 24 + 8);

              return (
                <div
                  key={test.id}
                  className={`flex-1 rounded-t ${
                    test.isCurrent ? 'bg-purple-500' : 'bg-blue-400'
                  }`}
                  style={{ height: `${height}px` }}
                  title={`${test.isFirst ? 'Lần đầu' : test.isCurrent ? 'Hiện tại' : 'Lần trước'}: ${test.score} điểm`}
                />
              );
            })}
          </div>
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
            <span>Mới nhất</span>
            <span>Cũ nhất</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestHistory; 