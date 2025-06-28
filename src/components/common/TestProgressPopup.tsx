import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TestProgressPopupProps {
  isOpen: boolean;
  questionNumber: number;
  totalQuestions: number;
  timeRemaining: number; // seconds
  onContinue: () => void;
  onRestart: () => void;
}

export default function TestProgressPopup({ 
  isOpen, 
  questionNumber, 
  totalQuestions,
  timeRemaining,
  onContinue, 
  onRestart 
}: TestProgressPopupProps) {
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const progress = (questionNumber / totalQuestions) * 100;
  const isLowTime = timeRemaining < 300; // 5 minutes

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 400 }}
            className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6"
          >
            {/* Header */}
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none">
                  <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Bài test chưa hoàn thành</h3>
              <p className="text-gray-600 text-sm">Bạn có muốn tiếp tục từ câu đã làm không?</p>
            </div>

            {/* Progress Stats */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-blue-50 rounded-xl p-3 text-center">
                <div className="text-lg font-bold text-blue-600">{questionNumber}/{totalQuestions}</div>
                <div className="text-xs text-gray-600">Câu hỏi</div>
              </div>
              <div className={`rounded-xl p-3 text-center ${isLowTime ? 'bg-red-50' : 'bg-green-50'}`}>
                <div className={`text-lg font-bold ${isLowTime ? 'text-red-600' : 'text-green-600'}`}>
                  {formatTime(timeRemaining)}
                </div>
                <div className="text-xs text-gray-600">Còn lại</div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-gray-600">Tiến độ</span>
                <span className="text-xs font-medium text-blue-600">{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <motion.div 
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <motion.button
                onClick={onRestart}
                className="flex-1 flex items-center justify-center px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none">
                  <path d="M1 4v6h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Làm lại
              </motion.button>
              
              <motion.button
                onClick={onContinue}
                className="flex-1 flex items-center justify-center px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-medium hover:shadow-lg transition-all"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none">
                  <polygon points="5,3 19,12 5,21" fill="currentColor"/>
                </svg>
                Tiếp tục
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
} 