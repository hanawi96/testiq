/**
 * Hook cung cấp chức năng điều hướng bàn phím cho IQ test
 */
import { useState, useEffect, useCallback } from 'react';

interface UseKeyboardNavigationProps {
  onAnswerSelect: (answerId: number) => void;
  totalAnswers: number;
  onNextQuestion: () => void;
  onPrevQuestion: () => void;
  isActive: boolean;
}

export function useIQKeyboardNavigation({
  onAnswerSelect,
  totalAnswers,
  onNextQuestion,
  onPrevQuestion,
  isActive
}: UseKeyboardNavigationProps) {
  const [highlightedAnswer, setHighlightedAnswer] = useState<number | null>(null);

  // Xử lý phím bấm
  const handleKeyPress = useCallback((e: KeyboardEvent) => {
    if (!isActive) return;
    
    console.log('🎮 Key press detected:', e.key);
    
    // Arrow keys for navigation
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault(); // Prevent scrolling
      
      setHighlightedAnswer(current => {
        if (current === null) return 0;
        
        const direction = e.key === 'ArrowUp' ? -1 : 1;
        const newHighlight = (current + direction) % totalAnswers;
        
        // Handle negative wrap-around
        return newHighlight < 0 ? totalAnswers - 1 : newHighlight;
      });
    }
    
    // Enter to select highlighted answer
    else if (e.key === 'Enter') {
      if (highlightedAnswer !== null) {
        onAnswerSelect(highlightedAnswer);
        setHighlightedAnswer(null);
      }
    }
    
    // Number keys 1-9 for direct selection
    else if (/^[1-9]$/.test(e.key)) {
      const answerIndex = parseInt(e.key) - 1;
      if (answerIndex < totalAnswers) {
        onAnswerSelect(answerIndex);
      }
    }
    
    // Left/Right arrow keys for previous/next question
    else if (e.key === 'ArrowLeft') {
      onPrevQuestion();
    }
    else if (e.key === 'ArrowRight') {
      onNextQuestion();
    }
  }, [isActive, highlightedAnswer, totalAnswers, onAnswerSelect, onNextQuestion, onPrevQuestion]);
  
  // Đăng ký sự kiện phím
  useEffect(() => {
    if (isActive) {
      window.addEventListener('keydown', handleKeyPress);
      return () => {
        window.removeEventListener('keydown', handleKeyPress);
      };
    }
  }, [isActive, handleKeyPress]);
  
  return {
    highlightedAnswer,
    setHighlightedAnswer
  };
} 