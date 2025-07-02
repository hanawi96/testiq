/**
 * Hook quản lý việc lưu và khôi phục tiến độ làm bài IQ test
 */
import { useState, useCallback } from 'react';
import type { Question } from '../../../../../utils/test';
import { 
  saveTestState, 
  loadTestState, 
  clearTestState
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
  }, []);
  
  return {
    saveProgress,
    markTestCompleted,
    clearProgress
  };
} 