import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArticlesService } from '../../../../backend';

interface QuickAuthorEditorProps {
  articleId: string;
  currentAuthor: string;
  onUpdate: (articleId: string, newAuthor: string) => void;
  onClose: () => void;
  position: { top: number; left: number };
}

export default function QuickAuthorEditor({ 
  articleId, 
  currentAuthor, 
  onUpdate, 
  onClose, 
  position 
}: QuickAuthorEditorProps) {
  const [selectedAuthor, setSelectedAuthor] = useState(currentAuthor);
  const [availableAuthors, setAvailableAuthors] = useState<string[]>([]);
  const [newAuthor, setNewAuthor] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load available authors
    const authors = ArticlesService.getAuthors();
    setAvailableAuthors(authors);

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

  const handleAuthorSelect = (author: string) => {
    setSelectedAuthor(author);
    setNewAuthor(''); // Clear new author input when selecting existing
  };

  const handleSave = async () => {
    const authorToSave = newAuthor.trim() || selectedAuthor;
    
    if (!authorToSave) {
      setError('Vui lòng chọn hoặc nhập tên tác giả');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const { error: updateError } = await ArticlesService.updateAuthor(articleId, authorToSave);
      
      if (updateError) {
        setError('Không thể cập nhật tác giả');
        return;
      }

      onUpdate(articleId, authorToSave);
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
      handleSave();
    }
  };

  const finalAuthor = newAuthor.trim() || selectedAuthor;

  return (
    <motion.div
      ref={dropdownRef}
      initial={{ opacity: 0, scale: 0.95, y: -10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -10 }}
      transition={{ duration: 0.15 }}
      className="fixed z-50 w-72 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700"
      style={{
        top: position.top,
        left: position.left
      }}
    >
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Chỉnh sửa Tác giả
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

        {/* Available Authors */}
        <div className="mb-3">
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
            Chọn tác giả có sẵn:
          </label>
          <div className="max-h-32 overflow-y-auto space-y-1">
            {availableAuthors.map(author => (
              <label
                key={author}
                className="flex items-center space-x-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded cursor-pointer"
              >
                <input
                  type="radio"
                  name="author"
                  checked={selectedAuthor === author && !newAuthor.trim()}
                  onChange={() => handleAuthorSelect(author)}
                  className="border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">{author}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Add New Author */}
        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
            Hoặc nhập tác giả mới:
          </label>
          <input
            type="text"
            value={newAuthor}
            onChange={(e) => setNewAuthor(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Nhập tên tác giả mới..."
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        {/* Preview */}
        {finalAuthor && (
          <div className="mb-4 p-2 bg-gray-50 dark:bg-gray-700 rounded">
            <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Tác giả sẽ được cập nhật:</div>
            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{finalAuthor}</div>
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
            disabled={isLoading || !finalAuthor}
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
