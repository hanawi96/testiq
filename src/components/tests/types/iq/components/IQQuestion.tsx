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

// Memo để tránh re-render không cần thiết
export default memo(IQQuestion); 