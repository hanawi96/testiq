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
  currentAnswer?: number | null; // Thêm trạng thái đáp án hiện tại của câu hỏi
}

export function useIQKeyboardNavigation({
  onAnswerSelect,
  totalAnswers,
  onNextQuestion,
  onPrevQuestion,
  isActive,
  highlightedAnswer,
  setHighlightedAnswer,
  currentAnswer = null
}: UseKeyboardNavigationProps) {
  // Xử lý phím bấm
  const handleKeyPress = useCallback((e: KeyboardEvent) => {
    if (!isActive) return;
    
    console.log('🎮 Key press detected:', e.key, 'currentAnswer:', currentAnswer);
    
    // Arrow keys for navigation
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault(); // Prevent scrolling
      
      if (e.key === 'ArrowUp') {
        console.log('⬆️ ArrowUp pressed - highlighting previous answer');
      } else {
        console.log('⬇️ ArrowDown pressed - highlighting next answer');
      }
      
      const direction = e.key === 'ArrowUp' ? -1 : 1;
      const current = highlightedAnswer;
      
      // Tìm đáp án phù hợp tiếp theo (bỏ qua đáp án đã chọn)
      let newHighlight: number;
      
      if (current === null) {
        // Khởi tạo trạng thái ban đầu, bắt đầu từ đáp án 0
        // Nếu đáp án 0 là đáp án hiện tại (đã chọn), tìm đáp án tiếp theo
        newHighlight = currentAnswer === 0 ? 1 % totalAnswers : 0;
        console.log('🎯 Setting initial highlight to', newHighlight);
      } else {
        // Tìm đáp án tiếp theo (bỏ qua đáp án hiện tại)
        let nextHighlight = current;
        
        // Tìm đáp án tiếp theo cho đến khi tìm thấy đáp án khác với currentAnswer
        do {
          nextHighlight = (nextHighlight + direction) % totalAnswers;
          // Xử lý trường hợp số âm
          if (nextHighlight < 0) nextHighlight = totalAnswers - 1;
        } while (nextHighlight === currentAnswer && totalAnswers > 1);
        
        newHighlight = nextHighlight;
        console.log(`🎯 Highlighting answer: ${newHighlight} (was ${current}, skipping ${currentAnswer})`);
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
  }, [isActive, highlightedAnswer, totalAnswers, currentAnswer, onAnswerSelect, onNextQuestion, onPrevQuestion, setHighlightedAnswer]);
  
  // Đăng ký sự kiện phím - sử dụng cả keydown và keyup để đảm bảo hoạt động
  useEffect(() => {
    // Chỉ đăng ký event listener khi isActive là true
    if (isActive) {
      console.log('✅ Keyboard navigation activated');
      window.addEventListener('keydown', handleKeyPress);
      
      // Thêm CSS để vô hiệu hóa outline cho các button khi sử dụng phím mũi tên
      const style = document.createElement('style');
      style.innerHTML = `
        button:focus {
          outline: none !important;
          box-shadow: none !important;
        }
      `;
      document.head.appendChild(style);
      
      return () => {
        console.log('❌ Keyboard navigation deactivated');
        window.removeEventListener('keydown', handleKeyPress);
        // Xóa style khi component unmount
        if (style.parentNode) {
          document.head.removeChild(style);
        }
      };
    }
  }, [isActive, handleKeyPress]);
} 