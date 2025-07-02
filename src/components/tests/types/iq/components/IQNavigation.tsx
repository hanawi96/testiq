/**
 * Component hiển thị các nút điều hướng trong IQ test
 */
import React from 'react';
import { motion } from 'framer-motion';

interface IQNavigationProps {
  currentQuestion: number;
  totalQuestions: number;
  answers: (number | null)[];
  onPrevious: () => void;
  onNext: () => void;
  onJumpToQuestion: (questionIndex: number) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  isReviewMode: boolean;
  allAnswered: boolean;
}

const IQNavigation: React.FC<IQNavigationProps> = ({
  currentQuestion,
  totalQuestions,
  answers,
  onPrevious,
  onNext,
  onJumpToQuestion,
  onSubmit,
  isSubmitting,
  isReviewMode,
  allAnswered
}) => {
  const currentAnswer = answers[currentQuestion];
  
  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
      <div className="flex items-center justify-between">
        {/* Professional Previous Button */}
        <motion.button
          onClick={onPrevious}
          disabled={currentQuestion === 0}
          className={`group flex items-center justify-center w-11 h-11 rounded-lg border transition-all duration-200 ${
            currentQuestion === 0
              ? 'bg-gray-50 border-gray-200 text-gray-300 cursor-not-allowed'
              : 'bg-white border-gray-300 text-gray-600 hover:border-gray-400 hover:bg-gray-50 hover:text-gray-700 active:bg-gray-100'
          }`}
          whileHover={currentQuestion > 0 ? { scale: 1.02 } : {}}
          whileTap={currentQuestion > 0 ? { scale: 0.98 } : {}}
          title={currentQuestion > 0 ? "Câu hỏi trước" : "Đã ở câu đầu tiên"}
        >
          <svg className="w-5 h-5 transition-transform duration-200 group-hover:-translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </motion.button>

        {/* Centered Smart Question Navigator */}
        <div className="flex-1 flex justify-center">
          <div className="flex items-center space-x-2">
            {/* Show range navigation for 60+ questions */}
            {totalQuestions > 10 ? (
              <div className="flex items-center space-x-1">
                {/* Previous range button */}
                {currentQuestion >= 5 && (
                  <button
                    onClick={() => onJumpToQuestion(Math.max(0, currentQuestion - 5))}
                    className="w-7 h-7 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 text-xs font-medium transition-all duration-200"
                    title="Nhảy về 5 câu trước"
                  >
                    ‹‹
                  </button>
                )}
                
                {/* Dynamic visible range */}
                {(() => {
                  const total = totalQuestions;
                  const current = currentQuestion;
                  let start, end;
                  
                  // Smart range calculation
                  if (current <= 2) {
                    start = 0; end = Math.min(5, total);
                  } else if (current >= total - 3) {
                    start = Math.max(0, total - 5); end = total;
                  } else {
                    start = current - 2; end = current + 3;
                  }
                  
                  const visibleQuestions = [];
                  for (let i = start; i < end; i++) {
                    visibleQuestions.push(i);
                  }
                  
                  return visibleQuestions.map(index => (
                    <button
                      key={index}
                      onClick={() => onJumpToQuestion(index)}
                      className={`w-8 h-8 rounded-full text-xs font-medium transition-all duration-200 ${
                        index === currentQuestion
                          ? 'bg-blue-600 text-white shadow-md ring-2 ring-blue-200'
                          : answers[index] !== null
                          ? 'bg-green-500 text-white hover:bg-green-600'
                          : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                      }`}
                      title={`Câu ${index + 1}${answers[index] !== null ? ' (đã trả lời)' : ''}`}
                    >
                      {index + 1}
                    </button>
                  ));
                })()}
                
                {/* Progress indicator */}
                <div className="mx-2 px-3 py-1.5 bg-gray-100 rounded-full text-xs text-gray-600 font-medium border">
                  {currentQuestion + 1}/{totalQuestions}
                </div>
                
                {/* Next range button */}
                {currentQuestion < totalQuestions - 6 && (
                  <button
                    onClick={() => onJumpToQuestion(Math.min(totalQuestions - 1, currentQuestion + 5))}
                    className="w-7 h-7 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 text-xs font-medium transition-all duration-200"
                    title="Nhảy tới 5 câu sau"
                  >
                    ››
                  </button>
                )}
              </div>
            ) : (
              /* Original design for <= 10 questions */
              <div className="flex space-x-2">
                {Array.from({ length: totalQuestions }).map((_, index) => (
                  <button
                    key={index}
                    onClick={() => onJumpToQuestion(index)}
                    className={`w-8 h-8 rounded-full text-xs font-medium transition-all duration-200 ${
                      index === currentQuestion
                        ? 'bg-blue-600 text-white shadow-md ring-2 ring-blue-200'
                        : answers[index] !== null
                        ? 'bg-green-500 text-white hover:bg-green-600'
                        : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                    }`}
                    title={`Câu ${index + 1}${answers[index] !== null ? ' (đã trả lời)' : ''}`}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Show Complete button in review mode when all answered */}
        {isReviewMode && allAnswered ? (
          <motion.button
            onClick={onSubmit}
            disabled={isSubmitting}
            className={`flex items-center px-6 py-2.5 rounded-lg font-medium transition-all duration-200 ${
              isSubmitting
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                : 'bg-green-600 text-white hover:bg-green-700 border border-green-600 hover:border-green-700 shadow-sm hover:shadow-md'
            }`}
            whileHover={!isSubmitting ? { scale: 1.02 } : {}}
            whileTap={!isSubmitting ? { scale: 0.98 } : {}}
          >
            {isSubmitting ? (
              <>
                <div className="loading-spinner mr-2"></div>
                Đang xử lý...
              </>
            ) : (
              <>
                Xem kết quả
              </>
            )}
          </motion.button>
        ) : (
          <div className="invisible w-[120px]"></div>
        )}
      </div>
      
      {/* Keyboard shortcuts hint */}
      <div className="mt-4 text-center text-xs text-gray-500">
        Phím tắt: 1-4 hoặc ↑ ↓ ← → (chọn đáp án) • Enter (xác nhận)
      </div>
    </div>
  );
};

export default IQNavigation; 