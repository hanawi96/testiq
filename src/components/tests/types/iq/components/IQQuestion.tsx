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

// Cấu hình animation mượt mà hơn
const animationConfig = {
  initial: { x: 100, opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: -100, opacity: 0 },
  transition: { 
    type: "tween", 
    ease: "easeOut", 
    duration: 0.2  // Giảm thời gian animation
  }
};

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
    <AnimatePresence mode="wait" initial={false}>
      <motion.div 
        key={`question-container-${question.id}`}
        {...(showAnimation ? animationConfig : { initial: false })}
        className="question-transition-container will-change-transform"
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

export default memo(IQQuestion); 