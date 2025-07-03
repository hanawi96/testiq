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
  onSkip?: () => void;
}

// Component đơn giản chỉ truyền props xuống QuestionCard
const IQQuestion: React.FC<IQQuestionProps> = ({
  question,
  currentAnswer,
  onAnswerSelect,
  highlightedAnswer,
  justAnswered,
  answersDisabled,
  showAnimation,
  onSkip
}) => {
  // Sử dụng key để đảm bảo component được tạo mới hoàn toàn khi câu hỏi thay đổi
  return (
    <div key={`question-container-${question.id}`}>
      <QuestionCard
        question={question}
        selectedAnswer={currentAnswer}
        onAnswerSelect={onAnswerSelect}
        highlightedAnswer={highlightedAnswer}
        isReviewMode={answersDisabled}
        onSkip={onSkip}
      />
    </div>
  );
};

// Sử dụng memo để tránh re-render không cần thiết
export default memo(IQQuestion, (prevProps, nextProps) => {
  // Nếu câu hỏi thay đổi, luôn re-render
  if (prevProps.question.id !== nextProps.question.id) {
    return false;
  }
  
  // Nếu câu hỏi không thay đổi, chỉ re-render khi các props quan trọng khác thay đổi
  return (
    prevProps.currentAnswer === nextProps.currentAnswer &&
    prevProps.highlightedAnswer === nextProps.highlightedAnswer &&
    prevProps.answersDisabled === nextProps.answersDisabled
  );
}); 