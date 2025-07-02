/**
 * Component hiển thị một câu hỏi IQ và các lựa chọn
 */
import React, { memo } from 'react';
import { motion } from 'framer-motion';
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

// Tạo component bọc ngoài để xử lý animation khi chuyển câu hỏi
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
    <motion.div
      key={`question-container-${question.id}`}
      initial={showAnimation ? { opacity: 0 } : { opacity: 1 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      <QuestionCard
        question={question}
        selectedAnswer={currentAnswer}
        onAnswerSelect={onAnswerSelect}
        highlightedAnswer={highlightedAnswer}
        isReviewMode={answersDisabled}
      />
    </motion.div>
  );
};

// Sử dụng memo để tránh re-render không cần thiết
// Chỉ re-render khi các props thực sự thay đổi
export default memo(IQQuestion, (prevProps, nextProps) => {
  // Chỉ re-render khi các props quan trọng thay đổi
  return (
    prevProps.question.id === nextProps.question.id &&
    prevProps.currentAnswer === nextProps.currentAnswer &&
    prevProps.highlightedAnswer === nextProps.highlightedAnswer &&
    prevProps.answersDisabled === nextProps.answersDisabled
  );
}); 