/**
 * Hook quản lý việc lưu và khôi phục tiến độ làm bài IQ test
 */
import { useState, useEffect, useCallback } from 'react';
import type { Question } from '../../../../../utils/test';
import { 
  saveTestState, 
  loadTestState, 
  clearTestState, 
  hasInProgressTest, 
  isTestCompleted, 
  calculateRemainingTime,
  getAccurateTimeElapsed
} from '../../../../../utils/test-state';

export interface SavedProgress {
  currentQuestion: number;
  answers: (number | null)[];
  timeElapsed: number;
  timeLimit: number;
}

interface UseIQSaveProgressProps {
  questions: Question[];
  timeLimit: number;
}

export function useIQSaveProgress({ questions, timeLimit }: UseIQSaveProgressProps) {
  const [savedProgress, setSavedProgress] = useState<SavedProgress | null>(null);
  const [hasIncompleteSavedTest, setHasIncompleteSavedTest] = useState(false);
  const [hasCompletedSavedTest, setHasCompletedSavedTest] = useState(false);
  
  // Kiểm tra tiến độ đã lưu và trả về kết quả
  const checkSavedProgress = useCallback(() => {
    if (hasInProgressTest()) {
      if (isTestCompleted()) {
        console.log('🎉 Test completed but not submitted - showing completed test popup');
        setHasCompletedSavedTest(true);
        return {
          hasIncompleteSavedTest: false,
          hasCompletedSavedTest: true,
          savedProgress: null
        };
      } else {
        console.log('📝 Found in-progress test');
        const state = loadTestState();
        if (state) {
          // Sử dụng thời gian chính xác để tính toán thời gian đã trôi qua
          const accurateTimeElapsed = getAccurateTimeElapsed();
          
          const progress = {
            currentQuestion: state.currentQuestion,
            answers: state.answers,
            timeElapsed: accurateTimeElapsed,
            timeLimit: timeLimit
          };
          
          console.log(`⏱️ Loading saved progress with accurate time: ${accurateTimeElapsed}s (original: ${state.timeElapsed}s)`);
          
          setSavedProgress(progress);
          setHasIncompleteSavedTest(true);
          return {
            hasIncompleteSavedTest: true,
            hasCompletedSavedTest: false,
            savedProgress: progress
          };
        }
      }
    }
    
    return {
      hasIncompleteSavedTest: false,
      hasCompletedSavedTest: false,
      savedProgress: null
    };
  }, [timeLimit]);
  
  // Lưu tiến độ hiện tại
  const saveProgress = useCallback((
    currentQuestion: number, 
    answers: (number | null)[],
    timeElapsed: number
  ) => {
    saveTestState({
      currentQuestion,
      answers, 
      timeElapsed,
      startTime: Date.now(),
      totalTime: timeLimit,
      isCompleted: false
    });
    console.log(`💾 Saved progress: question ${currentQuestion + 1}, time: ${timeElapsed}s`);
  }, [timeLimit]);
  
  // Đánh dấu test đã hoàn thành
  const markTestCompleted = useCallback(() => {
    const state = loadTestState();
    if (state) {
      saveTestState({
        ...state,
        isCompleted: true,
        completedAt: Date.now()
      });
    }
  }, []);
  
  // Xóa tiến độ đã lưu
  const clearProgress = useCallback(() => {
    clearTestState();
    setSavedProgress(null);
    setHasIncompleteSavedTest(false);
    setHasCompletedSavedTest(false);
  }, []);
  
  // Kiểm tra tiến độ khi component mount
  useEffect(() => {
    checkSavedProgress();
  }, [checkSavedProgress]);
  
  return {
    savedProgress,
    hasIncompleteSavedTest,
    hasCompletedSavedTest,
    checkSavedProgress,
    saveProgress,
    markTestCompleted,
    clearProgress
  };
} 