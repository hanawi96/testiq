import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface QuickVerificationEditorProps {
  userId: string;
  userName: string;
  currentStatus: boolean;
  onStatusUpdate: (userId: string) => Promise<void>;
  isLoading?: boolean;
  disabled?: boolean;
}

export default function QuickVerificationEditor({ 
  userId, 
  userName,
  currentStatus, 
  onStatusUpdate, 
  isLoading = false,
  disabled = false 
}: QuickVerificationEditorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close popup
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isOpen &&
        popupRef.current &&
        buttonRef.current &&
        !popupRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Handle ESC key
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscKey);
    return () => document.removeEventListener('keydown', handleEscKey);
  }, [isOpen]);

  // Calculate popup position
  const getPopupPosition = () => {
    if (!buttonRef.current) return { top: 0, left: 0 };
    
    const rect = buttonRef.current.getBoundingClientRect();
    const popupWidth = 280;
    const popupHeight = 120;
    
    let left = rect.left + (rect.width / 2) - (popupWidth / 2);
    let top = rect.bottom + 8;
    
    // Adjust if popup goes off screen
    if (left + popupWidth > window.innerWidth - 16) {
      left = window.innerWidth - popupWidth - 16;
    }
    if (left < 16) {
      left = 16;
    }
    
    if (top + popupHeight > window.innerHeight - 16) {
      top = rect.top - popupHeight - 8;
    }
    
    return { top, left };
  };

  // Handle status confirmation
  const handleConfirm = async () => {
    setIsOpen(false);
    try {
      await onStatusUpdate(userId);
    } catch (error) {
      console.error('Error updating verification status:', error);
    }
  };

  const popupPosition = isOpen ? getPopupPosition() : { top: 0, left: 0 };
  const newStatus = !currentStatus;

  return (
    <>
      {/* Toggle Button */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(true)}
        disabled={isLoading || disabled}
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border outline-none ${
          currentStatus
            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 border-green-200 dark:border-green-800'
            : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800'
        } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:opacity-80 hover:scale-105'}`}
      >
        {isLoading ? (
          <div className="w-3 h-3 border border-current border-r-transparent rounded-full animate-spin mr-1"></div>
        ) : currentStatus ? (
          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        ) : (
          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        )}
        {currentStatus ? 'Đã xác thực' : 'Chưa xác thực'}
      </button>

      {/* Confirmation Popup */}
      <AnimatePresence>
        {isOpen && !isLoading && (
          <div className="fixed inset-0 z-50 pointer-events-none">
            <motion.div
              ref={popupRef}
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className="absolute pointer-events-auto"
              style={{
                top: popupPosition.top,
                left: popupPosition.left,
                zIndex: 1000
              }}
            >
              <div className="w-70 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl p-4">
                {/* Header */}
                <div className="flex items-center space-x-2 mb-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                    newStatus ? 'bg-green-100 dark:bg-green-900/30' : 'bg-yellow-100 dark:bg-yellow-900/30'
                  }`}>
                    {newStatus ? (
                      <svg className="w-3 h-3 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="w-3 h-3 text-yellow-600 dark:text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {newStatus ? 'Xác thực người dùng' : 'Hủy xác thực'}
                  </h4>
                </div>

                {/* Message */}
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {newStatus 
                    ? `Xác thực người dùng "${userName}"?`
                    : `Hủy xác thực người dùng "${userName}"?`
                  }
                </p>

                {/* Actions */}
                <div className="flex space-x-2">
                  <button
                    onClick={handleConfirm}
                    className={`flex-1 px-3 py-2 text-sm font-medium text-white rounded-lg transition-colors ${
                      newStatus 
                        ? 'bg-green-600 hover:bg-green-700' 
                        : 'bg-yellow-600 hover:bg-yellow-700'
                    }`}
                  >
                    {newStatus ? 'Xác thực' : 'Hủy xác thực'}
                  </button>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg transition-colors"
                  >
                    Hủy
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
