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
  isKeyboardDisabled?: boolean; // Thêm prop để hiển thị trạng thái keyboard
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
  isDataLoaded = true,
  isKeyboardDisabled = false
}) => {
  const currentAnswer = answers[currentQuestion];
  
  // Thêm class skeleton loading khi dữ liệu chưa tải
  const skeletonClass = !isDataLoaded ? 'animate-pulse' : '';
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
      <div className="flex items-center justify-center">
        {/* Centered Smart Question Navigator - thiết kế lại để căn giữa hoàn toàn */}
        <div className={`flex items-center space-x-2 ${skeletonClass}`}>
          {/* Show range navigation for 60+ questions */}
          {totalQuestions > 10 ? (
            <div className="flex items-center space-x-1">
              {/* Previous range button */}
              {currentQuestion >= 5 && (
                <button
                  onClick={() => onJumpToQuestion(Math.max(0, currentQuestion - 5))}
                  className="w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 text-xs font-medium focus:outline-none focus:ring-0"
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
                  let buttonClass = 'w-8 h-8 rounded-full text-xs font-medium focus:outline-none focus:ring-0 ';
                  
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
              
              {/* Progress indicator - đặt ở giữa */}
              <div className={`mx-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-full text-xs text-gray-600 dark:text-gray-300 font-medium border border-gray-200 dark:border-gray-600 ${!isDataLoaded ? 'opacity-70' : ''}`}>
                {currentQuestion + 1}/{totalQuestions}
              </div>
              
              {/* Next range button */}
              {currentQuestion < totalQuestions - 6 && (
                <button
                  onClick={() => onJumpToQuestion(Math.min(totalQuestions - 1, currentQuestion + 5))}
                  className="w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 text-xs font-medium focus:outline-none focus:ring-0"
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
                let buttonClass = 'w-8 h-8 rounded-full text-xs font-medium focus:outline-none focus:ring-0 ';
                
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
      
      {/* Keyboard shortcuts hint */}
      <div
        className={`mt-4 text-center text-xs keyboard-shortcuts ${
          !isDataLoaded || isKeyboardDisabled
            ? 'opacity-50 text-gray-400 dark:text-gray-500'
            : 'text-gray-500 dark:text-gray-400'
        }`}
        style={{fontSize: '12px', lineHeight: '1.2'}}
      >
        {isKeyboardDisabled ? (
          'Phím tắt tạm thời vô hiệu hóa (popup đang mở)'
        ) : (
          'Phím tắt: 1-4 hoặc ↑ ↓ (chọn đáp án) ← → (chuyển câu hỏi) • Enter (xác nhận)'
        )}
      </div>
      
      {/* Chỉ hiển thị khi đã hoàn thành tất cả câu hỏi và đang trong chế độ review */}
      {(isReviewMode && allAnswered) && (
        <div className="mt-4 text-center">
          <div className="inline-block px-4 py-2 bg-blue-50 dark:bg-blue-900/30 rounded-full text-sm text-blue-600 dark:text-blue-400 font-medium">
            <span role="img" aria-label="checkmark">✓</span> Đã hoàn thành tất cả câu hỏi
          </div>
        </div>
      )}
    </div>
  );
};

export default IQNavigation; 