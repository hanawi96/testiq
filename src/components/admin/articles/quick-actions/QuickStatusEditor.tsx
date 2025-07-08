import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface QuickStatusEditorProps {
  articleId: string;
  currentStatus: 'published' | 'draft' | 'archived';
  onUpdate: (articleId: string, newStatus: 'published' | 'draft' | 'archived') => void;
  onClose: () => void;
  position: { top: number; left: number };
}

export default function QuickStatusEditor({
  articleId,
  currentStatus,
  onUpdate,
  onClose,
  position
}: QuickStatusEditorProps) {
  const [selectedStatus, setSelectedStatus] = useState<'published' | 'draft' | 'archived'>(currentStatus);
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<'published' | 'draft' | 'archived' | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        // Don't close if clicking on a quick edit button
        const target = event.target as HTMLElement;
        if (target.closest('[data-quick-edit-button]')) {
          return;
        }
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const statusOptions = [
    { value: 'draft', label: 'Nháp', color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800' },
    { value: 'published', label: 'Đã xuất bản', color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800' },
    { value: 'archived', label: 'Lưu trữ', color: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600' }
  ] as const;

  const handleStatusSelect = (status: 'published' | 'draft' | 'archived') => {
    setSelectedStatus(status);
    
    // Show confirmation for status changes that might affect visibility
    if ((currentStatus === 'published' && status !== 'published') || 
        (currentStatus !== 'published' && status === 'published')) {
      setPendingStatus(status);
      setShowConfirmation(true);
    } else {
      // Direct update for non-critical changes
      handleSave(status);
    }
  };

  const handleSave = async (status?: 'published' | 'draft' | 'archived') => {
    const statusToUpdate = status || selectedStatus;
    
    setIsLoading(true);
    setShowConfirmation(false);
    setPendingStatus(null);

    try {
      onUpdate(articleId, statusToUpdate);
    } catch (err) {
      console.error('Error updating status:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmationCancel = () => {
    setShowConfirmation(false);
    setPendingStatus(null);
    setSelectedStatus(currentStatus); // Reset to original status
  };

  const handleConfirmationConfirm = () => {
    if (pendingStatus) {
      handleSave(pendingStatus);
    }
  };

  const getConfirmationMessage = () => {
    if (!pendingStatus) return '';
    
    if (pendingStatus === 'published') {
      return 'Bạn có chắc chắn muốn xuất bản bài viết này? Bài viết sẽ hiển thị công khai.';
    } else if (currentStatus === 'published') {
      return 'Bạn có chắc chắn muốn thay đổi trạng thái? Bài viết sẽ không còn hiển thị công khai.';
    }
    return '';
  };

  return (
    <motion.div
      ref={dropdownRef}
      initial={{ opacity: 0, scale: 0.95, y: -10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -10 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="fixed z-50 w-60 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xl"
      style={{
        top: position.top,
        left: position.left,
      }}
    >
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Chỉnh sửa trạng thái
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {!showConfirmation ? (
          <div className="space-y-2">
            {statusOptions.map((option) => (
              <label
                key={option.value}
                className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
              >
                <input
                  type="radio"
                  name="status"
                  checked={selectedStatus === option.value}
                  onChange={() => handleStatusSelect(option.value)}
                  className="text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600"
                  disabled={isLoading}
                />
                <div className="flex-1">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${option.color}`}>
                    {option.label}
                  </span>
                </div>
              </label>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {getConfirmationMessage()}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={handleConfirmationConfirm}
                disabled={isLoading}
                className="flex-1 px-3 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? 'Đang cập nhật...' : 'Xác nhận'}
              </button>
              <button
                onClick={handleConfirmationCancel}
                disabled={isLoading}
                className="flex-1 px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Hủy
              </button>
            </div>
          </div>
        )}

        {isLoading && !showConfirmation && (
          <div className="mt-3 flex items-center justify-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
            <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">Đang cập nhật...</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
