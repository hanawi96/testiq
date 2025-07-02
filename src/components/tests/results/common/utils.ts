// Utility functions for test results
import type { ResultData, TestHistoryItem } from './types';

// Smart time converter - handles Database vs LocalStorage formats
export const getTimeInSeconds = (testData: any): number => {
  // Database: duration_seconds | LocalStorage: timeSpent
  return testData?.duration_seconds || testData?.timeSpent || 0;
};

// Smart time formatter - formats seconds to "X phút Y giây" or "X giây"
export const formatTimeDisplay = (totalSeconds: number): string => {
  if (totalSeconds <= 0) return '—';
  
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  
  if (minutes > 0 && seconds > 0) {
    return `${minutes} phút ${seconds} giây`;
  } else if (minutes > 0) {
    return `${minutes} phút`;
  } else {
    return `${seconds} giây`;
  }
};

// Convert real test history to timeline format
// realHistory: Database data (authenticated) OR LocalStorage data (anonymous) 
export const convertRealHistoryToTimeline = (realHistory: any[], currentResult: ResultData, limit?: number): TestHistoryItem[] => {
  if (!realHistory || realHistory.length === 0) {
    return [{
      id: Date.now(),
      date: new Date().toLocaleDateString('vi-VN'),
      score: currentResult.score,
      percentile: currentResult.percentile,
      timeTaken: currentResult.timeTaken, // Keep in seconds for proper formatting
      improvement: 0,
      isFirst: true,
      isCurrent: true
    }];
  }

  // Filter duplicates + apply limit
  const filteredHistory = realHistory
    .filter(test => {
      if (!test.timestamp) return true;
      const timeDiff = Math.abs(Date.now() - new Date(test.timestamp).getTime());
      return !(test.iq === currentResult.score && timeDiff < 2 * 60 * 1000);
    })
    .slice(0, limit ? limit - 1 : undefined); // -1 for current test

  const timeline: TestHistoryItem[] = [];
  
  // Current test
  timeline.push({
    id: Date.now(),
    date: new Date().toLocaleDateString('vi-VN'),
    score: currentResult.score,
    percentile: currentResult.percentile,
    timeTaken: currentResult.timeTaken, // Keep in seconds for proper formatting
    improvement: filteredHistory.length > 0 ? currentResult.score - filteredHistory[0].iq : 0,
    isFirst: false,
    isCurrent: true
  });

  // History tests
  filteredHistory.forEach((test, index) => {
    timeline.push({
      id: test.timestamp || (Date.now() - (index + 1) * 1000),
      date: test.timestamp ? new Date(test.timestamp).toLocaleDateString('vi-VN') : new Date().toLocaleDateString('vi-VN'),
      score: test.iq,
      percentile: test.percentile || Math.round((test.iq - 70) * 1.2),
      timeTaken: getTimeInSeconds(test),
      improvement: index < filteredHistory.length - 1 ? test.iq - filteredHistory[index + 1].iq : 0,
      isFirst: index === filteredHistory.length - 1,
      isCurrent: false
    });
  });

  return timeline;
};

export const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}; 