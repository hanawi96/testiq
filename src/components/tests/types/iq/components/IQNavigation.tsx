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
  isDataLoaded?: boolean;
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
  allAnswered,
  isDataLoaded = true
}) => {
  const currentAnswer = answers[currentQuestion];
  
  // Thêm class skeleton loading khi dữ liệu chưa tải
  const skeletonClass = !isDataLoaded ? 'animate-pulse' : '';
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 mt-6 border border-gray-100 dark:border-gray-700">
      <div className="flex items-center justify-between">
        {/* Professional Previous Button */}
        <motion.button
          onClick={onPrevious}
          disabled={currentQuestion === 0 || !isDataLoaded}
          className={`group flex items-center justify-center w-11 h-11 rounded-lg border transition-all duration-200 ${
            currentQuestion === 0 || !isDataLoaded
              ? 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-300 dark:text-gray-500 cursor-not-allowed'
              : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-white active:bg-gray-100 dark:active:bg-gray-600'
          }`}
          whileHover={currentQuestion > 0 && isDataLoaded ? { scale: 1.02 } : {}}
          whileTap={currentQuestion > 0 && isDataLoaded ? { scale: 0.98 } : {}}
          title={currentQuestion > 0 ? "Câu hỏi trước" : "Đã ở câu đầu tiên"}
        >
          <svg className="w-5 h-5 transition-transform duration-200 group-hover:-translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </motion.button>

        {/* Centered Smart Question Navigator */}
        <div className="flex-1 flex justify-center">
          <div className={`flex items-center space-x-2 ${skeletonClass}`}>
            {/* Show range navigation for 60+ questions */}
            {totalQuestions > 10 ? (
              <div className="flex items-center space-x-1">
                {/* Previous range button */}
                {currentQuestion >= 5 && (
                  <button
                    onClick={() => onJumpToQuestion(Math.max(0, currentQuestion - 5))}
                    className="w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 text-xs font-medium transition-all duration-200"
                    title="Nhảy về 5 câu trước"
                    disabled={!isDataLoaded}
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
                  
                  return visibleQuestions.map(index => {
                    // Xác định class dựa trên trạng thái và isDataLoaded
                    let buttonClass = 'w-8 h-8 rounded-full text-xs font-medium transition-all duration-200 ';
                    
                    if (!isDataLoaded) {
                      // Khi dữ liệu chưa tải, tất cả các nút đều có màu xám với hiệu ứng loading
                      buttonClass += 'bg-gray-200 dark:bg-gray-600 text-gray-400 dark:text-gray-400';
                    } else {
                      // Khi dữ liệu đã tải, áp dụng màu sắc dựa trên trạng thái
                      if (index === currentQuestion) {
                        buttonClass += 'bg-blue-600 text-white shadow-md ring-2 ring-blue-200 dark:ring-blue-800';
                      } else if (answers[index] !== null) {
                        buttonClass += 'bg-green-500 text-white hover:bg-green-600';
                      } else {
                        buttonClass += 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600';
                      }
                    }
                    
                    return (
                      <button
                        key={index}
                        onClick={() => onJumpToQuestion(index)}
                        className={buttonClass}
                        title={`Câu ${index + 1}${answers[index] !== null ? ' (đã trả lời)' : ''}`}
                        disabled={!isDataLoaded} // Vô hiệu hóa nút khi dữ liệu chưa tải
                      >
                        {index + 1}
                      </button>
                    );
                  });
                })()}
                
                {/* Progress indicator */}
                <div className={`mx-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-full text-xs text-gray-600 dark:text-gray-300 font-medium border border-gray-200 dark:border-gray-600 ${!isDataLoaded ? 'opacity-70' : ''}`}>
                  {currentQuestion + 1}/{totalQuestions}
                </div>
                
                {/* Next range button */}
                {currentQuestion < totalQuestions - 6 && (
                  <button
                    onClick={() => onJumpToQuestion(Math.min(totalQuestions - 1, currentQuestion + 5))}
                    className="w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 text-xs font-medium transition-all duration-200"
                    title="Nhảy tới 5 câu sau"
                    disabled={!isDataLoaded}
                  >
                    ››
                  </button>
                )}
              </div>
            ) : (
              /* Original design for <= 10 questions */
              <div className="flex space-x-2">
                {Array.from({ length: totalQuestions }).map((_, index) => {
                  // Xác định class dựa trên trạng thái và isDataLoaded
                  let buttonClass = 'w-8 h-8 rounded-full text-xs font-medium transition-all duration-200 ';
                  
                  if (!isDataLoaded) {
                    // Khi dữ liệu chưa tải, tất cả các nút đều có màu xám với hiệu ứng loading
                    buttonClass += 'bg-gray-200 dark:bg-gray-600 text-gray-400 dark:text-gray-400';
                  } else {
                    // Khi dữ liệu đã tải, áp dụng màu sắc dựa trên trạng thái
                    if (index === currentQuestion) {
                      buttonClass += 'bg-blue-600 text-white shadow-md ring-2 ring-blue-200 dark:ring-blue-800';
                    } else if (answers[index] !== null) {
                      buttonClass += 'bg-green-500 text-white hover:bg-green-600';
                    } else {
                      buttonClass += 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600';
                    }
                  }
                  
                  return (
                    <button
                      key={index}
                      onClick={() => onJumpToQuestion(index)}
                      className={buttonClass}
                      title={`Câu ${index + 1}${answers[index] !== null ? ' (đã trả lời)' : ''}`}
                      disabled={!isDataLoaded} // Vô hiệu hóa nút khi dữ liệu chưa tải
                    >
                      {index + 1}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Show Complete button or placeholder with transition between them */}
        <motion.div
          className="flex items-center justify-center min-w-[120px]"
          initial={false}
        >
          {(isReviewMode || allAnswered) ? (
            <motion.button
              onClick={onSubmit}
              disabled={isSubmitting || !isDataLoaded}
              className={`flex items-center px-6 py-2.5 rounded-lg font-medium transition-all duration-200 ${
                isSubmitting || !isDataLoaded
                  ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed border border-gray-200 dark:border-gray-600'
                  : 'bg-green-600 text-white hover:bg-green-700 border border-green-600 hover:border-green-700 shadow-sm hover:shadow-md'
              }`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.1 }}
              whileHover={!isSubmitting && isDataLoaded ? { scale: 1.02 } : {}}
              whileTap={!isSubmitting && isDataLoaded ? { scale: 0.98 } : {}}
            >
              {isSubmitting ? (
                <>
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Xem kết quả
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Xem kết quả
                </>
              )}
            </motion.button>
          ) : (
            <motion.div 
              className="invisible w-[120px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0 }}
            />
          )}
        </motion.div>
      </div>
      
      {/* Keyboard shortcuts hint */}
      <div className={`mt-4 text-center text-xs text-gray-500 dark:text-gray-400 ${!isDataLoaded ? 'opacity-70' : ''}`}>
        Phím tắt: 1-4 hoặc ↑ ↓ ← → (chọn đáp án) • Enter (xác nhận)
      </div>
    </div>
  );
};

export default IQNavigation; 