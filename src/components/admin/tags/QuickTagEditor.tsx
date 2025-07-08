import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TagsService } from '../../../../backend';
import type { Tag } from '../../../../backend';

interface QuickTagEditorProps {
  tagId: string;
  currentTag?: Tag;
  onUpdate: (tagId: string, updatedData: Partial<Tag>) => void;
  onClose: () => void;
  position: { top: number; left: number };
}

export default function QuickTagEditor({ 
  tagId, 
  currentTag, 
  onUpdate, 
  onClose, 
  position 
}: QuickTagEditorProps) {
  const [formData, setFormData] = useState({
    name: currentTag?.name || '',
    description: currentTag?.description || '',
    color: currentTag?.color || '#EF4444'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Position adjustment to keep popup in viewport
  const adjustedPosition = React.useMemo(() => {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const popupWidth = 320; // Estimated popup width
    const popupHeight = 280; // Estimated popup height

    let { top, left } = position;

    // Adjust horizontal position
    if (left + popupWidth > viewportWidth) {
      left = viewportWidth - popupWidth - 20;
    }
    if (left < 20) {
      left = 20;
    }

    // Adjust vertical position
    if (top + popupHeight > viewportHeight) {
      top = position.top - popupHeight - 10; // Show above the trigger
    }
    if (top < 20) {
      top = 20;
    }

    return { top, left };
  }, [position]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Validate form
      if (!formData.name.trim()) {
        setError('Tên tag không được để trống');
        return;
      }

      // Optimistic update
      onUpdate(tagId, {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        color: formData.color
      });

      // API call in background
      const { error: updateError } = await TagsService.updateTag(tagId, {
        name: formData.name.trim(),
        description: formData.description.trim(),
        color: formData.color
      });

      if (updateError) {
        setError(updateError.message || 'Có lỗi xảy ra');
        return;
      }

      console.log('QuickTagEditor: Successfully updated tag:', tagId);

    } catch (err: any) {
      console.error('QuickTagEditor: Error updating tag:', err);
      setError(err?.message || 'Có lỗi xảy ra');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        ref={dropdownRef}
        initial={{ opacity: 0, scale: 0.95, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -10 }}
        transition={{ duration: 0.15 }}
        className="fixed z-50 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 p-4"
        style={{
          top: adjustedPosition.top,
          left: adjustedPosition.left
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Chỉnh sửa nhanh
          </h4>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-3 p-2 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-xs text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Tag Name */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tên tag
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Nhập tên tag..."
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
              disabled={isLoading}
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Mô tả
            </label>
            <textarea
              name="description"
              rows={2}
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Mô tả ngắn..."
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 resize-none"
              disabled={isLoading}
            />
          </div>

          {/* Color */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Màu sắc
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="color"
                name="color"
                value={formData.color}
                onChange={handleInputChange}
                className="w-8 h-8 border border-gray-300 dark:border-gray-600 rounded cursor-pointer"
                disabled={isLoading}
              />
              <input
                type="text"
                value={formData.color}
                onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-3 py-1.5 text-xs font-medium text-white bg-primary-600 hover:bg-primary-700 rounded disabled:opacity-50 flex items-center"
            >
              {isLoading && (
                <svg className="animate-spin -ml-1 mr-1 h-3 w-3 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              Lưu
            </button>
          </div>
        </form>
      </motion.div>
    </AnimatePresence>
  );
}
