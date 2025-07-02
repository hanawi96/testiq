/**
 * Hook quản lý các câu hỏi và câu trả lời trong IQ Test
 */
import { useState, useCallback, useEffect } from 'react';
import type { Question } from '../../../../../utils/test';

interface UseIQQuestionManagerProps {
  questions: Question[];
  initialQuestion?: number;
  initialAnswers?: (number | null)[];
  playSound?: (type: 'correct' | 'wrong' | 'warning' | 'complete') => void;
  isTimeUp?: boolean;
}

export function useIQQuestionManager({
  questions,
  initialQuestion = 0,
  initialAnswers,
  playSound,
  isTimeUp = false
}: UseIQQuestionManagerProps) {
  const [currentQuestion, setCurrentQuestion] = useState(initialQuestion);
  const [answers, setAnswers] = useState<(number | null)[]>(
    initialAnswers || new Array(questions.length).fill(null)
  );
  const [justAnswered, setJustAnswered] = useState(false);
  const [highlightedAnswer, setHighlightedAnswer] = useState<number | null>(null);
  
  // Kiểm tra nếu tất cả các câu hỏi đã được trả lời
  const allAnswered = useCallback(() => {
    return answers.every(a => a !== null);
  }, [answers]);

  // Tìm câu hỏi chưa trả lời tiếp theo
  const findNextUnanswered = useCallback((fromIndex: number = 0): number => {
    // Tìm từ vị trí hiện tại đến cuối
    for (let i = fromIndex; i < answers.length; i++) {
      if (answers[i] === null) return i;
    }
    // Nếu không tìm thấy và fromIndex > 0, tìm từ đầu đến vị trí hiện tại
    if (fromIndex > 0) {
      for (let i = 0; i < fromIndex; i++) {
        if (answers[i] === null) return i;
      }
    }
    return -1; // Tất cả đã được trả lời
  }, [answers]);

  // Xử lý khi người dùng chọn câu trả lời
  const handleAnswerSelect = useCallback((answerIndex: number) => {
    // Ngăn việc chọn đáp án nếu đã hết thời gian
    if (isTimeUp) {
      console.log('⏰ Cannot select answer - time is up!');
      return;
    }
    
    console.log(`🎯 handleAnswerSelect: question=${currentQuestion}, answer=${answerIndex}`);
    
    // Cập nhật câu trả lời
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = answerIndex;
    setAnswers(newAnswers);
    setJustAnswered(true);
    
    // Phản hồi ngay lập tức
    if (playSound) {
      const question = questions[currentQuestion];
      if (question) {
        const isCorrect = answerIndex === question.correct;
        playSound(isCorrect ? 'correct' : 'wrong');
        
        // Phản hồi rung cho thiết bị di động
        if (navigator.vibrate) {
          navigator.vibrate(isCorrect ? 50 : 100);
        }
      }
    }
  }, [answers, currentQuestion, isTimeUp, playSound, questions]);

  // Chuyển đến câu hỏi tiếp theo
  const nextQuestion = useCallback(() => {
    const nextUnanswered = findNextUnanswered(currentQuestion + 1);
    if (nextUnanswered !== -1) {
      setCurrentQuestion(nextUnanswered);
      setJustAnswered(false);
      setHighlightedAnswer(null); // Xóa highlight
    }
  }, [currentQuestion, findNextUnanswered]);

  // Quay lại câu hỏi trước
  const previousQuestion = useCallback(() => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
      setJustAnswered(false);
      setHighlightedAnswer(null); // Xóa highlight
    }
  }, [currentQuestion]);

  // Nhảy đến câu hỏi cụ thể
  const jumpToQuestion = useCallback((questionIndex: number) => {
    if (questionIndex >= 0 && questionIndex < questions.length) {
      setCurrentQuestion(questionIndex);
      setJustAnswered(false);
      setHighlightedAnswer(null); // Xóa highlight
    }
  }, [questions.length]);

  // Reset trạng thái câu hỏi
  const resetQuestionState = useCallback(() => {
    setCurrentQuestion(0);
    setAnswers(new Array(questions.length).fill(null));
    setJustAnswered(false);
    setHighlightedAnswer(null);
  }, [questions.length]);

  return {
    currentQuestion,
    setCurrentQuestion,
    answers,
    setAnswers,
    justAnswered,
    setJustAnswered,
    highlightedAnswer,
    setHighlightedAnswer,
    allAnswered: allAnswered(),
    handleAnswerSelect,
    nextQuestion,
    previousQuestion,
    jumpToQuestion,
    resetQuestionState,
    findNextUnanswered
  };
} 