import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArticlesService } from '../../../../backend';

interface QuickTagsEditorProps {
  articleId: string;
  currentTags: string[];
  onUpdate: (articleId: string, newTags: string[]) => void;
  onClose: () => void;
  position: { top: number; left: number };
}

export default function QuickTagsEditor({ 
  articleId, 
  currentTags, 
  onUpdate, 
  onClose, 
  position 
}: QuickTagsEditorProps) {
  const [selectedTags, setSelectedTags] = useState<string[]>(currentTags);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load available tags
    const loadTags = async () => {
      const tags = await ArticlesService.getTags();
      setAvailableTags(tags);
    };
    loadTags();

    // Handle click outside
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;

      // Check if click is outside popup and not on a quick edit button
      if (dropdownRef.current &&
          !dropdownRef.current.contains(target) &&
          !target.closest('[data-quick-edit-button]')) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const handleAddNewTag = () => {
    const trimmedTag = newTag.trim();
    if (trimmedTag && !selectedTags.includes(trimmedTag)) {
      setSelectedTags(prev => [...prev, trimmedTag]);
      setAvailableTags(prev => [...prev, trimmedTag].sort());
      setNewTag('');
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    setError('');

    try {
      const { error: updateError } = await ArticlesService.updateTags(articleId, selectedTags);
      
      if (updateError) {
        setError('Không thể cập nhật tags');
        return;
      }

      onUpdate(articleId, selectedTags);
      onClose();
    } catch (err) {
      setError('Có lỗi xảy ra khi cập nhật');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddNewTag();
    }
  };

  return (
    <motion.div
      ref={dropdownRef}
      initial={{ opacity: 0, scale: 0.95, y: -10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -10 }}
      transition={{ duration: 0.15 }}
      className="fixed z-50 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700"
      style={{
        top: position.top,
        left: position.left
      }}
    >
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Chỉnh sửa Tags
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mb-3 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-sm text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        {/* Available Tags */}
        <div className="mb-3">
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
            Tags có sẵn:
          </label>
          <div className="max-h-32 overflow-y-auto space-y-1">
            {availableTags.map(tag => (
              <label
                key={tag}
                className="flex items-center space-x-2 p-1 hover:bg-gray-50 dark:hover:bg-gray-700 rounded cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedTags.includes(tag)}
                  onChange={() => handleTagToggle(tag)}
                  className="rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">{tag}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Add New Tag */}
        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
            Thêm tag mới:
          </label>
          <div className="flex space-x-2">
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Nhập tag mới..."
              className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-transparent"
            />
            <button
              onClick={handleAddNewTag}
              disabled={!newTag.trim()}
              className="px-2 py-1 text-sm bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white rounded transition-colors"
            >
              Thêm
            </button>
          </div>
        </div>

        {/* Selected Tags Preview */}
        {selectedTags.length > 0 && (
          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tags đã chọn ({selectedTags.length}):
            </label>
            <div className="flex flex-wrap gap-1">
              {selectedTags.map(tag => (
                <span
                  key={tag}
                  className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-300"
                >
                  {tag}
                  <button
                    onClick={() => handleTagToggle(tag)}
                    className="ml-1 text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-200"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end space-x-2">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="px-3 py-1 text-sm bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white rounded transition-colors flex items-center space-x-1"
          >
            {isLoading && (
              <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
            )}
            <span>Lưu</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
}
