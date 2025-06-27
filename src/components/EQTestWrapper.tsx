import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface EQTestWrapperProps {
  questions?: any[];
  timeLimit?: number;
}

export default function EQTestWrapper({ questions = [], timeLimit = 30 }: EQTestWrapperProps) {
  const [isStarted, setIsStarted] = useState(false);

  if (!isStarted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-purple-100">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center bg-white rounded-2xl p-8 shadow-xl max-w-md mx-4"
        >
          <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Test EQ</h2>
          <p className="text-gray-600 mb-6">
            Đánh giá chỉ số cảm xúc của bạn trong {timeLimit} phút
          </p>

          <motion.button
            onClick={() => setIsStarted(true)}
            className="w-full bg-gradient-to-r from-pink-600 to-purple-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-pink-700 hover:to-purple-700 transition-all duration-200"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Bắt đầu Test
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-purple-100">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center bg-white rounded-2xl p-8 shadow-xl max-w-md mx-4"
      >
        <h2 className="text-xl font-semibold text-gray-900 mb-4">EQ Test đang được phát triển</h2>
        <p className="text-gray-600 mb-6">Chức năng này sẽ sớm có mặt!</p>
        
        <motion.a
          href="/"
          className="inline-block bg-gradient-to-r from-pink-600 to-purple-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-pink-700 hover:to-purple-700 transition-all duration-200"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Về trang chủ
        </motion.a>
      </motion.div>
    </div>
  );
} 