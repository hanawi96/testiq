import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface EyeRestPopupProps {
  isOpen: boolean;
  onSkip: () => void;
  onStartRest: () => void;
  onDisable?: () => void; // Thêm prop để tắt hiển thị popup trong phiên test
  autoHideTime?: number; // Thời gian tự động ẩn (giây)
}

export default function EyeRestPopup({ 
  isOpen, 
  onSkip, 
  onStartRest, 
  onDisable,
  autoHideTime = 6 // Mặc định tự động ẩn sau 6 giây
}: EyeRestPopupProps) {
  // Xử lý tự động ẩn popup sau thời gian quy định
  useEffect(() => {
    if (!isOpen) return;
    
    // Đặt timeout để tự động đóng popup sau thời gian quy định
    const timeout = setTimeout(() => {
      onSkip();
    }, autoHideTime * 1000);
    
    return () => clearTimeout(timeout);
  }, [isOpen, autoHideTime, onSkip]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed top-4 left-0 right-0 flex justify-center z-50">
          <motion.div
            className="bg-green-50 dark:bg-green-900/40 border border-green-200 dark:border-green-700 rounded-lg shadow-md p-4 pt-6 max-w-md w-full relative"
            style={{ minHeight: '80px' }}
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            {/* Nút X ở viền phía trên của popup */}
            <button
              onClick={onSkip}
              className="absolute -top-3 -right-3 bg-white dark:bg-gray-800 text-green-500 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 rounded-full w-6 h-6 flex items-center justify-center border border-green-200 dark:border-green-700 shadow-sm transition-colors"
              aria-label="Đóng"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>

            <div className="flex items-start">
              <div className="flex-shrink-0 mr-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-100 dark:bg-green-800">
                  <span className="text-xl" role="img" aria-label="nghỉ mắt">👁️</span>
                </div>
              </div>
              
              <div className="flex-grow">
                <h3 className="text-sm font-medium text-green-800 dark:text-green-300">Nghỉ mắt 10 giây?</h3>
                <p className="text-xs text-green-700 dark:text-green-400">
                  Bạn đã làm bài test liên tục trong 10 giây
                </p>
              </div>
            </div>
            
            {/* Buttons ở góc dưới bên phải */}
            <div className="flex justify-end mt-4 gap-2">
              <button
                onClick={onDisable}
                className="py-1.5 px-3 text-xs rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Không hiển thị
              </button>
              <button
                onClick={onStartRest}
                className="py-1.5 px-3 text-xs rounded-md bg-green-600 dark:bg-green-700 text-white hover:bg-green-700 dark:hover:bg-green-600 transition-colors"
              >
                Nghỉ ngay
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
} 