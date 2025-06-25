import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Question } from '../../utils/test';

interface QuestionCardProps {
  question: Question;
  selectedAnswer: number | null;
  onAnswerSelect: (answerIndex: number) => void;
  showExplanation?: boolean;
  isReviewMode?: boolean;
}

export default function QuestionCard({
  question,
  selectedAnswer,
  onAnswerSelect,
  showExplanation = false,
  isReviewMode = false
}: QuestionCardProps) {
  
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
    <motion.div
      className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      layout
    >
      {/* Header */}
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

      {/* Question content */}
      <div className="p-6">
        <motion.div
          className="mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <p className="text-lg leading-relaxed text-gray-800 font-medium whitespace-pre-wrap">
            {question.question}
          </p>
        </motion.div>

        {/* Answer options */}
        <div className="space-y-3">
          {question.options.map((option, index) => {
            const isSelected = selectedAnswer === index;
            const isCorrect = isReviewMode && index === question.correct;
            const isWrong = isReviewMode && isSelected && index !== question.correct;
            
            let buttonClass = 'w-full p-4 text-left border-2 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2';
            
            if (isReviewMode) {
              if (isCorrect) {
                buttonClass += ' bg-green-50 border-green-300 text-green-800';
              } else if (isWrong) {
                buttonClass += ' bg-red-50 border-red-300 text-red-800';
              } else {
                buttonClass += ' bg-gray-50 border-gray-200 text-gray-600';
              }
            } else if (isSelected) {
              buttonClass += ' bg-primary-50 border-primary-300 text-primary-800 shadow-md';
            } else {
              buttonClass += ' bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 hover:shadow-sm';
            }

            return (
              <motion.button
                key={index}
                className={buttonClass}
                onClick={() => !isReviewMode && onAnswerSelect(index)}
                disabled={isReviewMode}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                whileHover={!isReviewMode ? { scale: 1.02 } : {}}
                whileTap={!isReviewMode ? { scale: 0.98 } : {}}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-sm font-bold
                    ${isSelected 
                      ? (isReviewMode && isWrong ? 'border-red-400 bg-red-100 text-red-600' : 'border-primary-400 bg-primary-100 text-primary-600')
                      : (isReviewMode && isCorrect ? 'border-green-400 bg-green-100 text-green-600' : 'border-gray-300 text-gray-500')
                    }`}>
                    {String.fromCharCode(65 + index)}
                  </div>
                  <span className="flex-1 font-medium">{option}</span>
                  {isReviewMode && isCorrect && (
                    <span className="text-green-600">✓</span>
                  )}
                  {isReviewMode && isWrong && (
                    <span className="text-red-600">✗</span>
                  )}
                </div>
              </motion.button>
            );
          })}
        </div>

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
    </motion.div>
  );
}