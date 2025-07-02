/**
 * Component hiển thị thanh tiến độ và thời gian
 */
import React from 'react';
import { motion } from 'framer-motion';
import ProgressBar from '../../../core/ProgressBar';
import Timer from '../../../core/Timer';

interface IQProgressHeaderProps {
  currentQuestion: number;
  totalQuestions: number;
  timeElapsed: number;
  timeLimit: number;
  isActive: boolean;
  onTimeUp: () => void;
  answers?: (number | null)[]; // Thêm prop answers để tính toán số câu đã trả lời chính xác
}

const IQProgressHeader: React.FC<IQProgressHeaderProps> = ({
  currentQuestion,
  totalQuestions,
  timeElapsed,
  timeLimit,
  isActive,
  onTimeUp,
  answers = []
}) => {
  // Tính toán số câu đã trả lời dựa trên mảng answers thay vì currentQuestion
  const answeredCount = answers.length > 0 
    ? answers.filter(answer => answer !== null).length 
    : currentQuestion;

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <motion.div 
          className="flex-1"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="mb-1">
            <ProgressBar
              current={answeredCount}
              total={totalQuestions}
              className="w-full"
            />
          </div>
        </motion.div>

        <motion.div
          className="ml-6"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Timer
            initialTime={timeLimit}
            timeElapsed={timeElapsed}
            isActive={isActive}
            onTimeUp={onTimeUp}
          />
        </motion.div>
      </div>
    </div>
  );
};

export default IQProgressHeader; 