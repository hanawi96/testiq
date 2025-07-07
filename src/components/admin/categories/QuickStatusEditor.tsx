import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface QuickStatusEditorProps {
  categoryId: string;
  currentStatus: 'active' | 'inactive';
  onStatusUpdate: (categoryId: string, newStatus: 'active' | 'inactive') => Promise<void>;
  isLoading?: boolean;
  disabled?: boolean;
}

const STATUS_OPTIONS = [
  {
    value: 'active',
    label: 'Hoạt động',
    description: 'Danh mục hiển thị công khai',
    icon: '✓',
    iconBg: 'bg-green-100 dark:bg-green-900/30',
    iconColor: 'text-green-600 dark:text-green-400'
  },
  {
    value: 'inactive',
    label: 'Không hoạt động',
    description: 'Danh mục bị ẩn khỏi công khai',
    icon: '⏸',
    iconBg: 'bg-gray-100 dark:bg-gray-700',
    iconColor: 'text-gray-600 dark:text-gray-400'
  }
] as const;

export default function QuickStatusEditor({ 
  categoryId, 
  currentStatus, 
  onStatusUpdate, 
  isLoading = false,
  disabled = false 
}: QuickStatusEditorProps) {
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

  // Calculate popup position with better logic
  const getPopupPosition = () => {
    if (!buttonRef.current) return { top: 0, left: 0 };

    const buttonRect = buttonRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    const scrollY = window.scrollY;
    const scrollX = window.scrollX;

    // Popup dimensions
    const popupHeight = 160;
    const popupWidth = 260;
    const spacing = 8;

    // Calculate initial position (below button, aligned to left edge)
    let top = buttonRect.bottom + scrollY + spacing;
    let left = buttonRect.left + scrollX;

    // Adjust if popup would go off-screen vertically
    if (buttonRect.bottom + popupHeight + spacing > viewportHeight) {
      top = buttonRect.top + scrollY - popupHeight - spacing;
    }

    // Adjust if popup would go off-screen horizontally (right edge)
    if (buttonRect.left + popupWidth > viewportWidth) {
      left = buttonRect.right + scrollX - popupWidth;
    }

    // Ensure popup doesn't go off left edge
    if (left < spacing) {
      left = spacing + scrollX;
    }

    return { top, left };
  };

  // Handle toggle popup
  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (disabled || isLoading) return;

    setIsOpen(!isOpen);
  };

  // Handle status selection
  const handleStatusSelect = async (newStatus: 'active' | 'inactive') => {
    if (newStatus === currentStatus || isLoading) return;
    
    // Close popup immediately for better UX
    setIsOpen(false);
    
    try {
      await onStatusUpdate(categoryId, newStatus);
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const popupPosition = isOpen ? getPopupPosition() : { top: 0, left: 0 };

  return (
    <>
      {/* Edit Icon Button */}
      <button
        ref={buttonRef}
        onClick={handleToggle}
        disabled={disabled || isLoading}
        className={`
          text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300
          disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200
          p-1 rounded
          ${isOpen ? 'text-blue-600 dark:text-blue-400' : ''}
        `}
        title="Chỉnh sửa trạng thái"
      >
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      </button>

      {/* Popup Portal */}
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
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden w-[260px]">
                {/* Header */}
                <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    Chọn trạng thái
                  </h4>
                </div>

                {/* Options */}
                <div className="py-1">
                  {STATUS_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleStatusSelect(option.value)}
                      disabled={isLoading}
                      className={`
                        w-full px-4 py-3 text-left transition-colors duration-200
                        hover:bg-gray-50 dark:hover:bg-gray-700/30
                        disabled:opacity-50 disabled:cursor-not-allowed
                        ${option.value === currentStatus ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
                      `}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`
                          w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                          ${option.iconBg} ${option.iconColor}
                        `}>
                          {option.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {option.label}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            {option.description}
                          </div>
                        </div>
                        {option.value === currentStatus && (
                          <div className="flex-shrink-0">
                            <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
