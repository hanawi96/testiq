import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface CategoryCreationLoaderProps {
  message?: string;
  isVisible: boolean;
  mode?: 'create' | 'edit' | 'delete';
  onAnimationComplete?: () => void;
}

const CategoryCreationLoader: React.FC<CategoryCreationLoaderProps> = ({
  message,
  isVisible,
  mode = 'create',
  onAnimationComplete
}) => {
  const [showSuccess, setShowSuccess] = useState(false);
  
  // Determine appropriate messages based on mode
  const loadingMessage = message || (
    mode === 'create' ? 'Đang tạo danh mục...' :
    mode === 'edit' ? 'Đang cập nhật danh mục...' : 
    'Đang xóa danh mục...'
  );
    
  const successMessage = 
    mode === 'create' ? 'Danh mục đã được tạo thành công!' :
    mode === 'edit' ? 'Danh mục đã được cập nhật thành công!' :
    'Danh mục đã được xóa thành công!';
  
  // Determine colors based on mode
  const getBorderColorClass = () => {
    if (showSuccess) {
      return 'border-green-200 dark:border-green-800';
    }
    
    switch(mode) {
      case 'create':
      case 'edit':
        return 'border-blue-200 dark:border-blue-800';
      case 'delete':
        return 'border-red-200 dark:border-red-800';
      default:
        return 'border-blue-200 dark:border-blue-800';
    }
  };
  
  const getBackgroundColorClass = () => {
    if (showSuccess) {
      return 'bg-green-50 dark:bg-green-900/20';
    }
    
    switch(mode) {
      case 'create':
      case 'edit':
        return 'bg-white dark:bg-gray-800';
      case 'delete':
        return 'bg-white dark:bg-gray-800';
      default:
        return 'bg-white dark:bg-gray-800';
    }
  };
  
  const getSpinnerColorClass = () => {
    switch(mode) {
      case 'create':
      case 'edit':
        return 'text-blue-600 dark:text-blue-400';
      case 'delete':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-blue-600 dark:text-blue-400';
    }
  };
  
  useEffect(() => {
    if (isVisible) {
      // After 1 second, show success message
      const timer = setTimeout(() => {
        setShowSuccess(true);
        // Call animation complete callback when we show success
        if (onAnimationComplete) {
          onAnimationComplete();
        }
      }, 1000);
      
      return () => clearTimeout(timer);
    } else {
      // Reset state when component is hidden
      setShowSuccess(false);
    }
  }, [isVisible, onAnimationComplete]);
  
  if (!isVisible) return null;
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className={`rounded-xl border shadow-lg p-4 mb-4 flex items-center ${getBackgroundColorClass()} ${getBorderColorClass()}`}
    >
      <div className="mr-3">
        {showSuccess ? (
          <div className="flex items-center justify-center w-5 h-5 text-green-600 dark:text-green-400">
            <motion.svg 
              initial={{ scale: 0 }}
              animate={{ scale: 1, rotate: 360 }}
              transition={{ duration: 0.3 }}
              className="w-5 h-5" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M5 13l4 4L19 7" 
              />
            </motion.svg>
          </div>
        ) : (
          <svg 
            className={`animate-spin h-5 w-5 ${getSpinnerColorClass()}`}
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24"
          >
            <circle 
              className="opacity-25" 
              cx="12" 
              cy="12" 
              r="10" 
              stroke="currentColor" 
              strokeWidth="4"
            ></circle>
            <path 
              className="opacity-75" 
              fill="currentColor" 
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        )}
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
          {showSuccess ? successMessage : loadingMessage}
        </p>
      </div>
    </motion.div>
  );
};

export default CategoryCreationLoader; 