import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Image } from 'lucide-react';
import { MediaAPI } from '../../../services/media-api';

interface MediaFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  created_at: string;
  updated_at: string;
  metadata?: {
    width?: number;
    height?: number;
    duration?: number;
  };
}

interface MediaEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: MediaFile | null;
  onOptimisticUpdate: (fileId: string, newName: string) => void;
}

export default function MediaEditModal({ isOpen, onClose, file, onOptimisticUpdate }: MediaEditModalProps) {
  const [formData, setFormData] = useState({
    name: ''
  });

  // Helper functions to handle file name and extension
  const getFileNameWithoutExtension = (fileName: string) => {
    const lastDotIndex = fileName.lastIndexOf('.');
    return lastDotIndex > 0 ? fileName.substring(0, lastDotIndex) : fileName;
  };

  const getFileExtension = (fileName: string) => {
    const lastDotIndex = fileName.lastIndexOf('.');
    return lastDotIndex > 0 ? fileName.substring(lastDotIndex) : '';
  };


  // Initialize form data when file changes
  useEffect(() => {
    if (file) {
      setFormData({
        name: getFileNameWithoutExtension(file.name || '')
      });
    }
  }, [file]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Sanitize filename to remove invalid characters
  const sanitizeFileName = (fileName: string) => {
    return fileName
      .normalize('NFD') // Decompose accented characters
      .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
      .replace(/[^a-zA-Z0-9.-]/g, '_') // Replace invalid chars with underscore
      .replace(/_+/g, '_') // Replace multiple underscores with single
      .replace(/^_|_$/g, ''); // Remove leading/trailing underscores
  };

  const handleSave = async () => {
    if (!file) return;

    // Sanitize and combine name with original extension
    const sanitizedName = sanitizeFileName(formData.name.trim());
    const fullFileName = sanitizedName + getFileExtension(file.name);
    const originalFileName = file.name;
    const hasFileNameChanged = fullFileName !== originalFileName;

    // Close modal immediately
    onClose();

    // Only rename if filename actually changed
    if (hasFileNameChanged) {
      // Optimistic update - show new name immediately
      onOptimisticUpdate(file.id, fullFileName);
    }
  };



  if (!isOpen || !file) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.15 }}
          className="w-full max-w-2xl bg-white dark:bg-gray-800 shadow-xl rounded-2xl border border-gray-200 dark:border-gray-700 relative z-10"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Image className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Đổi tên file
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {file.name}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Tên file
              </label>
              <div className="flex items-center space-x-3">
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Nhập tên file (không bao gồm đuôi)"
                  className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <span className="px-4 py-3 bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300 rounded-lg border border-gray-300 dark:border-gray-600 text-sm font-mono">
                  {file ? getFileExtension(file.name) : ''}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Chỉ có thể thay đổi tên file, không thể thay đổi đuôi file
              </p>
              {formData.name && formData.name !== getFileNameWithoutExtension(file?.name || '') && (
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                  Tên cuối cùng: <span className="font-mono">{sanitizeFileName(formData.name.trim())}{file ? getFileExtension(file.name) : ''}</span>
                </p>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Hủy
            </button>
            <button
              onClick={handleSave}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>Lưu thay đổi</span>
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
