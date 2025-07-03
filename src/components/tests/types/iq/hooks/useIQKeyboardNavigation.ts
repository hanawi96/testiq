/**
 * Hook cung cấp chức năng điều hướng bàn phím cho IQ test
 */
import { useEffect, useCallback } from 'react';

interface UseKeyboardNavigationProps {
  onAnswerSelect: (answerId: number) => void;
  totalAnswers: number;
  onNextQuestion: () => void;
  onPrevQuestion: () => void;
  isActive: boolean;
  highlightedAnswer: number | null;
  setHighlightedAnswer: (answerId: number | null) => void;
}

export function useIQKeyboardNavigation({
  onAnswerSelect,
  totalAnswers,
  onNextQuestion,
  onPrevQuestion,
  isActive,
  highlightedAnswer,
  setHighlightedAnswer
}: UseKeyboardNavigationProps) {
  // Xử lý phím bấm
  const handleKeyPress = useCallback((e: KeyboardEvent) => {
    if (!isActive) return;
    
    console.log('🎮 Key press detected:', e.key);
    
    // Arrow keys for navigation
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault(); // Prevent scrolling
      
      if (e.key === 'ArrowUp') {
        console.log('⬆️ ArrowUp pressed - highlighting previous answer');
      } else {
        console.log('⬇️ ArrowDown pressed - highlighting next answer');
      }
      
      // Instead of using function form, calculate the new value directly
      const current = highlightedAnswer;
      let newHighlight: number;
      
      if (current === null) {
        console.log('🎯 Setting initial highlight to 0');
        newHighlight = 0;
      } else {
        const direction = e.key === 'ArrowUp' ? -1 : 1;
        newHighlight = (current + direction) % totalAnswers;
        
        // Handle negative wrap-around
        if (newHighlight < 0) newHighlight = totalAnswers - 1;
        
        console.log(`🎯 Highlighting answer: ${newHighlight} (was ${current})`);
      }
      
      setHighlightedAnswer(newHighlight);
    }
    
    // Enter to select highlighted answer
    else if (e.key === 'Enter') {
      if (highlightedAnswer !== null) {
        console.log(`✅ Enter pressed - selecting answer: ${highlightedAnswer}`);
        onAnswerSelect(highlightedAnswer);
        setHighlightedAnswer(null);
      }
    }
    
    // Number keys 1-9 for direct selection
    else if (/^[1-9]$/.test(e.key)) {
      const answerIndex = parseInt(e.key) - 1;
      if (answerIndex < totalAnswers) {
        console.log(`✅ Number ${e.key} pressed - selecting answer: ${answerIndex}`);
        onAnswerSelect(answerIndex);
      }
    }
    
    // Left/Right arrow keys for previous/next question
    else if (e.key === 'ArrowLeft') {
      e.preventDefault(); // Prevent browser back navigation
      console.log('⬅️ ArrowLeft pressed - going to previous question');
      onPrevQuestion();
    }
    else if (e.key === 'ArrowRight') {
      e.preventDefault(); // Prevent browser forward navigation
      console.log('➡️ ArrowRight pressed - going to next question');
      onNextQuestion();
    }
  }, [isActive, highlightedAnswer, totalAnswers, onAnswerSelect, onNextQuestion, onPrevQuestion, setHighlightedAnswer]);
  
  // Đăng ký sự kiện phím - sử dụng cả keydown và keyup để đảm bảo hoạt động
  useEffect(() => {
    // Chỉ đăng ký event listener khi isActive là true
    if (isActive) {
      console.log('✅ Keyboard navigation activated');
      window.addEventListener('keydown', handleKeyPress);
      
      return () => {
        console.log('❌ Keyboard navigation deactivated');
        window.removeEventListener('keydown', handleKeyPress);
      };
    }
  }, [isActive, handleKeyPress]);
} 