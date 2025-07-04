/**
 * Component hiển thị một câu hỏi IQ và các lựa chọn
 */
import React, { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  isReviewMode?: boolean;
  onSkip?: () => void;
  onPrevious?: () => void;
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
  isReviewMode = false,
  onSkip,
  onPrevious
}) => {
  // Sử dụng key để đảm bảo component được tạo mới hoàn toàn khi câu hỏi thay đổi
  return (
    <AnimatePresence mode="wait">
      <motion.div 
        key={`question-container-${question.id}`}
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: -100, opacity: 0 }}
        transition={{ 
          type: "tween", 
          ease: "easeInOut", 
          duration: 0.3 
        }}
        className="question-transition-container"
      >
        <QuestionCard
          question={question}
          selectedAnswer={currentAnswer}
          onAnswerSelect={onAnswerSelect}
          highlightedAnswer={highlightedAnswer}
          isReviewMode={answersDisabled}
          isInReviewMode={isReviewMode}
          onSkip={onSkip}
          onPrevious={onPrevious}
        />
      </motion.div>
    </AnimatePresence>
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