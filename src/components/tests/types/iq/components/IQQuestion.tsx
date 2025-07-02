/**
 * Component hiển thị một câu hỏi IQ và các lựa chọn
 */
import React, { memo } from 'react';
import QuestionCard from '../../../core/QuestionCard';
import type { Question } from '../../../../../utils/test';

interface IQQuestionProps {
  question: Question;
  currentAnswer: number | null;
  onAnswerSelect: (answerId: number) => void;
  highlightedAnswer: number | null;
  justAnswered: boolean;
  answersDisabled: boolean;
  showAnimation: boolean;
}

// Component đơn giản chỉ truyền props xuống QuestionCard
const IQQuestion: React.FC<IQQuestionProps> = ({
  question,
  currentAnswer,
  onAnswerSelect,
  highlightedAnswer,
  justAnswered,
  answersDisabled,
  showAnimation
}) => {
  return (
    <QuestionCard
      question={question}
      selectedAnswer={currentAnswer}
      onAnswerSelect={onAnswerSelect}
      highlightedAnswer={highlightedAnswer}
      isReviewMode={answersDisabled}
    />
  );
};

// Sử dụng memo để tránh re-render không cần thiết
export default memo(IQQuestion, (prevProps, nextProps) => {
  // Chỉ re-render khi câu hỏi thay đổi hoặc đáp án được chọn thay đổi
  return (
    prevProps.question.id === nextProps.question.id &&
    prevProps.currentAnswer === nextProps.currentAnswer &&
    prevProps.highlightedAnswer === nextProps.highlightedAnswer &&
    prevProps.answersDisabled === nextProps.answersDisabled
  );
}); 