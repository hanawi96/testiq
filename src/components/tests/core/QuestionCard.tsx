import React, { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Question } from '../../../utils/test';

interface QuestionCardProps {
  question: Question;
  selectedAnswer: number | null;
  onAnswerSelect: (answerIndex: number) => void;
  showExplanation?: boolean;
  isReviewMode?: boolean;
  highlightedAnswer?: number | null;
}

// Component hiển thị phần header của câu hỏi
const QuestionHeader = memo(({ question }: { question: Question }) => {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-orange-100 text-orange-800';
      case 'expert': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
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
    <div className="bg-gradient-to-r from-primary-50 to-blue-50 p-4 border-b border-gray-100">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span className="text-2xl">{getTypeIcon(question.type)}</span>
          <div>
            <h3 className="font-semibold text-gray-800">{getTypeLabel(question.type)}</h3>
            <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(question.difficulty)}`}>
              {question.difficulty === 'easy' ? 'Dễ' : 
                question.difficulty === 'medium' ? 'Trung bình' :
                question.difficulty === 'hard' ? 'Khó' : 'Chuyên gia'}
            </span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-500">Câu số</div>
          <div className="text-xl font-bold text-primary-600">#{question.id}</div>
        </div>
      </div>
    </div>
  );
});

// Component hiển thị nội dung câu hỏi
const QuestionContent = memo(({ question }: { question: Question }) => {
  return (
    <div className="mb-6">
      <p className="text-lg leading-relaxed text-gray-800 font-medium whitespace-pre-wrap">
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
  return (
    <div className="space-y-3">
      {options.map((option: string, index: number) => {
        const isSelected = selectedAnswer === index;
        const isHighlighted = highlightedAnswer === index;
        
        let buttonClass = 'w-full p-4 text-left border border-gray-200 rounded-xl focus:outline-none focus:ring-0 focus:border-transparent transition-colors duration-150';
        
        if (isReviewMode) {
          if (isSelected) {
            buttonClass += ' bg-primary-50 text-primary-800';
          } else {
            buttonClass += ' bg-gray-50 text-gray-600';
          }
        } else if (isSelected) {
          buttonClass += ' bg-primary-50 text-primary-800';
        } else if (isHighlighted) {
          buttonClass += ' bg-blue-50 text-blue-800';
        } else {
          buttonClass += ' bg-white text-gray-700 hover:bg-gray-50';
        }

        return (
          <button
            key={index}
            className={buttonClass}
            onClick={() => !isReviewMode && onAnswerSelect(index)}
            disabled={isReviewMode}
          >
            <div className="flex items-center space-x-3">
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-sm font-bold transition-colors duration-150
                ${isSelected 
                  ? 'border-primary-400 bg-primary-100 text-primary-600'
                  : 'border-gray-300 text-gray-500'
                }`}>
                {String.fromCharCode(65 + index)}
              </div>
              <span className="flex-1 font-medium">{option}</span>
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
  highlightedAnswer = null
}: QuestionCardProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header - chỉ re-render khi question thay đổi */}
      <QuestionHeader question={question} />

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
              className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-start space-x-2">
                <span className="text-blue-600 text-lg">💡</span>
                <div>
                  <h4 className="font-semibold text-blue-800 mb-1">Giải thích</h4>
                  <p className="text-blue-700 text-sm leading-relaxed">{question.explanation}</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}