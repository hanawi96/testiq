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
  calculateRemainingTime 
} from '../../../../../utils/test-state';

interface SavedProgress {
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
  
  // Kiểm tra tiến độ đã lưu
  const checkSavedProgress = useCallback(() => {
    if (hasInProgressTest()) {
      if (isTestCompleted()) {
        console.log('🎉 Test completed but not submitted - showing completed test popup');
        setHasCompletedSavedTest(true);
      } else {
        console.log('📝 Found in-progress test');
        const state = loadTestState();
        if (state) {
          setSavedProgress({
            currentQuestion: state.currentQuestion,
            answers: state.answers,
            timeElapsed: state.timeElapsed,
            timeLimit: timeLimit
          });
          setHasIncompleteSavedTest(true);
        }
      }
    }
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
    saveProgress,
    markTestCompleted,
    clearProgress
  };
} 