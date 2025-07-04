import React, { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Question } from '../../../utils/test';

interface QuestionCardProps {
  question: Question;
  selectedAnswer: number | null;
  onAnswerSelect: (answerIndex: number) => void;
  showExplanation?: boolean;
  isReviewMode?: boolean;
  isInReviewMode?: boolean; // Trạng thái xem lại bài kiểm tra
  highlightedAnswer?: number | null;
  onSkip?: () => void;
  onPrevious?: () => void; // Quay lại câu trước đó
}

// Component hiển thị phần header của câu hỏi
const QuestionHeader = memo(({ question, onSkip, onPrevious, isInReviewMode }: { 
  question: Question, 
  onSkip?: () => void, 
  onPrevious?: () => void,
  isInReviewMode?: boolean 
}) => {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300';
      case 'medium': return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300';
      case 'hard': return 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300';
      case 'expert': return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300';
      default: return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'logic': return '🧠';
      case 'math': return '🔢';
      case 'verbal': return '📝';
      case 'spatial': return '📐';
      case 'pattern': return '🔍';
      default: return '❓';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'logic': return 'Tư duy logic';
      case 'math': return 'Toán học';
      case 'verbal': return 'Ngôn ngữ';
      case 'spatial': return 'Không gian';
      case 'pattern': return 'Nhận dạng mẫu';
      default: return 'Khác';
    }
  };

  return (
    <div className="bg-gradient-to-r from-primary-50 to-blue-50 dark:from-primary-900/30 dark:to-blue-900/30 p-4 border-b border-gray-100 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span className="text-2xl">{getTypeIcon(question.type)}</span>
          <div>
            <h3 className="font-semibold text-gray-800 dark:text-gray-200">{getTypeLabel(question.type)}</h3>
            <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(question.difficulty)}`}>
              {question.difficulty === 'easy' ? 'Dễ' : 
                question.difficulty === 'medium' ? 'Trung bình' :
                question.difficulty === 'hard' ? 'Khó' : 'Chuyên gia'}
            </span>
          </div>
        </div>
        {onSkip ? (
          <div className="flex items-center">
            {onPrevious && (
              <button 
                onClick={onPrevious}
                className="flex items-center justify-center w-10 h-10 rounded-l-lg bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors mr-px"
                title="Câu trước"
                aria-label="Câu trước"
              >
                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            <button 
              onClick={onSkip}
              className={`flex items-center px-4 py-2 text-blue-600 dark:text-blue-400 font-medium hover:text-blue-800 dark:hover:text-blue-300 focus:outline-none transition-colors ${onPrevious ? 'border-l border-gray-200 dark:border-gray-600 rounded-r-lg bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600' : ''}`}
            >
              {isInReviewMode ? 'Next' : 'Bỏ qua'}
              <svg className="w-4 h-4 ml-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        ) : (
        <div className="text-right">
          <div className="text-sm text-gray-500 dark:text-gray-400">Câu số</div>
          <div className="text-xl font-bold text-primary-600 dark:text-primary-400">#{question.id}</div>
        </div>
        )}
      </div>
    </div>
  );
});

// Component hiển thị nội dung câu hỏi
const QuestionContent = memo(({ question }: { question: Question }) => {
  return (
    <div className="mb-6">
      <p className="text-lg leading-relaxed text-gray-800 dark:text-gray-200 font-medium whitespace-pre-wrap">
        {question.question}
      </p>
    </div>
  );
});

// Component hiển thị các đáp án
const AnswerOptions = memo(({ 
  options, 
  selectedAnswer, 
  onAnswerSelect, 
  isReviewMode, 
  highlightedAnswer 
}: { 
  options: string[], 
  selectedAnswer: number | null, 
  onAnswerSelect: (index: number) => void, 
  isReviewMode: boolean, 
  highlightedAnswer: number | null 
}) => {
  console.log('🔍 Rendering AnswerOptions with highlightedAnswer =', highlightedAnswer);
  
  return (
    <div className="space-y-3">
      {options.map((option: string, index: number) => {
        const isSelected = selectedAnswer === index;
        const isHighlighted = highlightedAnswer === index;
        
        console.log(`🔍 Answer ${index}: isHighlighted=${isHighlighted}, isSelected=${isSelected}`);
        
        // Luôn thêm border vào class chính, không phụ thuộc vào trạng thái
        let buttonClass = 'w-full p-4 text-left border rounded-xl focus:outline-none focus:ring-0';
        
        if (isReviewMode) {
          buttonClass += ' bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700';
        } else if (isSelected) {
          // Đáp án được chọn có màu nền xanh lá cây
          buttonClass += ' bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-300 dark:border-green-700';
        } else if (isHighlighted) {
          buttonClass += ' bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-700';
        } else {
          buttonClass += ' bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border-gray-200 dark:border-gray-700';
        }

        return (
          <button
            key={`answer-${index}`}
            className={buttonClass}
            onClick={() => !isReviewMode && onAnswerSelect(index)}
            disabled={isReviewMode}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-sm font-bold transition-colors duration-150
                  ${isSelected 
                    ? 'border-green-500 dark:border-green-400 bg-green-100 dark:bg-green-800 text-green-600 dark:text-green-300'
                    : isHighlighted
                      ? 'border-blue-500 dark:border-blue-400 bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-300'
                      : 'border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400'
                  }`}>
                  {String.fromCharCode(65 + index)}
                </div>
                <span className="flex-1 font-medium">{option}</span>
              </div>
              {/* Hiển thị biểu tượng dấu "V" ở bên phải khi đáp án được chọn */}
              {isSelected && (
                <span className="text-green-600 dark:text-green-400 font-bold">✓</span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
});

// Component chính kết hợp các phần
export default function QuestionCard({
  question,
  selectedAnswer,
  onAnswerSelect,
  showExplanation = false,
  isReviewMode = false,
  isInReviewMode = false,
  highlightedAnswer = null,
  onSkip,
  onPrevious
}: QuestionCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
      {/* Header - chỉ re-render khi question thay đổi */}
      <QuestionHeader 
        question={question} 
        onSkip={onSkip} 
        onPrevious={onPrevious}
        isInReviewMode={isInReviewMode} 
      />

      <div className="p-6">
        {/* Nội dung câu hỏi - chỉ re-render khi question thay đổi */}
        <QuestionContent question={question} />

        {/* Các đáp án - re-render khi chọn đáp án */}
        <AnswerOptions 
          options={question.options} 
          selectedAnswer={selectedAnswer} 
          onAnswerSelect={onAnswerSelect} 
          isReviewMode={isReviewMode} 
          highlightedAnswer={highlightedAnswer} 
        />

        {/* Explanation */}
        <AnimatePresence>
          {showExplanation && (
            <motion.div
              className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-xl"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-start space-x-2">
                <span className="text-blue-600 dark:text-blue-400 text-lg">💡</span>
                <div>
                  <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-1">Giải thích</h4>
                  <p className="text-blue-700 dark:text-blue-300 text-sm leading-relaxed">{question.explanation}</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}