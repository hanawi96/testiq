import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface EyeRestPopupProps {
  isOpen: boolean;
  onSkip: () => void;
  onStartRest: () => void;
  autoHideTime?: number; // Thời gian tự động ẩn (giây)
}

export default function EyeRestPopup({ 
  isOpen, 
  onSkip, 
  onStartRest, 
  autoHideTime = 6 // Mặc định tự động ẩn sau 6 giây
}: EyeRestPopupProps) {
  const [timeRemaining, setTimeRemaining] = useState(autoHideTime);
  
  // Xử lý tự động ẩn popup sau thời gian quy định
  useEffect(() => {
    if (!isOpen) {
      setTimeRemaining(autoHideTime);
      return;
    }
    
    // Tạo interval để đếm ngược thời gian
    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          onSkip(); // Tự động bỏ qua khi hết thời gian
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [isOpen, autoHideTime, onSkip]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed top-4 left-0 right-0 flex justify-center z-50">
          <motion.div
            className="bg-green-50 border border-green-200 rounded-lg shadow-md p-3 max-w-md w-full flex items-center"
            style={{ height: '80px' }}
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex-shrink-0 mr-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-100">
                <span className="text-xl" role="img" aria-label="nghỉ mắt">👁️</span>
              </div>
            </div>
            
            <div className="flex-grow">
              <h3 className="text-sm font-medium text-green-800">Nghỉ mắt 10 giây?</h3>
              <p className="text-xs text-green-700">
                Bạn đã làm bài test liên tục trong 10 giây
              </p>
            </div>
            
            <div className="flex-shrink-0 flex items-center gap-2">
              <button
                onClick={onSkip}
                className="py-1.5 px-3 text-xs rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Bỏ qua
              </button>
              <button
                onClick={onStartRest}
                className="py-1.5 px-3 text-xs rounded-md bg-green-600 text-white hover:bg-green-700 transition-colors"
              >
                Nghỉ ngay
              </button>
            </div>
            
            <div className="absolute bottom-1 right-3 text-xs text-green-600">
              {timeRemaining}s
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
} 