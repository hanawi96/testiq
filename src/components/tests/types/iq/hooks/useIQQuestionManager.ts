/**
 * Hook quản lý các câu hỏi và câu trả lời trong IQ Test
 */
import { useState, useCallback, useMemo } from 'react';
import { globalAudioContext } from './useIQSounds';
import type { Question } from '../../../../../utils/test';

interface UseIQQuestionManagerProps {
  questions: Question[];
  initialQuestion?: number;
  initialAnswers?: (number | null)[];
  playSound?: (type: 'correct' | 'wrong' | 'warning' | 'complete') => void;
  isTimeUp?: boolean;
  isReviewMode?: boolean;
}

export function useIQQuestionManager({
  questions,
  initialQuestion = 0,
  initialAnswers,
  playSound,
  isTimeUp = false,
  isReviewMode = false
}: UseIQQuestionManagerProps) {
  const [currentQuestion, setCurrentQuestion] = useState(initialQuestion);
  const [answers, setAnswers] = useState<(number | null)[]>(
    initialAnswers || new Array(questions.length).fill(null)
  );
  const [justAnswered, setJustAnswered] = useState(false);
  const [highlightedAnswer, setHighlightedAnswer] = useState<number | null>(null);
  
  // Kiểm tra nếu tất cả các câu hỏi đã được trả lời - sử dụng useMemo thay vì useCallback
  const allAnswered = useMemo(() => {
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
      return;
    }
    
    // Cập nhật câu trả lời
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = answerIndex;
    setAnswers(newAnswers);
    setJustAnswered(true);
    
    // Phản hồi ngay lập tức
    if (playSound && !globalAudioContext.isMuted) {
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
    if (isReviewMode) {
      // Trong chế độ xem lại, đơn giản là di chuyển đến câu tiếp theo
      const nextQuestionIndex = (currentQuestion + 1) % questions.length;
      setCurrentQuestion(nextQuestionIndex);
      setJustAnswered(false);
      setHighlightedAnswer(null); // Xóa highlight
    } else {
      // Trong chế độ làm bài, tìm câu hỏi chưa trả lời tiếp theo
      const nextUnanswered = findNextUnanswered(currentQuestion + 1);
      if (nextUnanswered !== -1) {
        setCurrentQuestion(nextUnanswered);
        setJustAnswered(false);
        setHighlightedAnswer(null); // Xóa highlight
      }
    }
  }, [currentQuestion, findNextUnanswered, isReviewMode, questions.length]);

  // Quay lại câu hỏi trước
  const previousQuestion = useCallback(() => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
      setJustAnswered(false);
      setHighlightedAnswer(null); // Xóa highlight
    } else if (isReviewMode) {
      // Trong chế độ xem lại, nếu đang ở câu đầu tiên thì quay lại câu cuối cùng
      setCurrentQuestion(questions.length - 1);
      setJustAnswered(false);
      setHighlightedAnswer(null);
    }
  }, [currentQuestion, isReviewMode, questions.length]);

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
    allAnswered,
    handleAnswerSelect,
    nextQuestion,
    previousQuestion,
    jumpToQuestion,
    resetQuestionState,
    findNextUnanswered
  };
} 