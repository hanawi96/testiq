import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArticlesService, UserProfilesService } from '../../../../../backend';
import type { AuthorOption } from '../../../../../backend';
import { getInstantAuthorsData, preloadAuthorsData, isAuthorsDataReady } from '../../../../utils/admin/preloaders/authors-preloader';

interface QuickAuthorEditorProps {
  articleId: string;
  currentAuthor: string;
  currentAuthorId?: string;
  onUpdate: (articleId: string, newAuthor: string, authorId: string, userProfile: any) => Promise<void>;
  onClose: () => void;
  position: { top: number; left: number };
}

export default function QuickAuthorEditor({
  articleId,
  currentAuthor,
  currentAuthorId,
  onUpdate,
  onClose,
  position
}: QuickAuthorEditorProps) {
  const [selectedAuthorId, setSelectedAuthorId] = useState(currentAuthorId || '');
  const [availableAuthors, setAvailableAuthors] = useState<AuthorOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Set instant data immediately to avoid loading delay
    const instantAuthors = getInstantAuthorsData();
    setAvailableAuthors(instantAuthors);
    setIsLoading(false);

    // Background load for better data (non-blocking)
    if (!isAuthorsDataReady()) {
      preloadAuthorsData().then(loadedAuthors => {
        setAvailableAuthors(loadedAuthors);
      }).catch(err => {
        console.error('Error loading authors:', err);
        setError('Có lỗi xảy ra khi tải danh sách tác giả');
      });
    }

    // Handle click outside
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;

      // Don't close if clicking inside the popup
      if (dropdownRef.current && dropdownRef.current.contains(target)) {
        return;
      }

      // Don't close if clicking on edit author buttons (to avoid toggle conflict)
      const editButton = target.closest('[data-quick-edit-button="author"]');
      if (editButton) {
        return;
      }

      // Close popup for other outside clicks
      onClose();
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const handleAuthorSelect = (authorId: string) => {
    setSelectedAuthorId(authorId);
  };

  const handleSave = async () => {
    if (!selectedAuthorId) {
      setError('Vui lòng chọn tác giả');
      return;
    }

    // Find the selected author to get the name for UI update
    const selectedAuthor = availableAuthors.find(author => author.id === selectedAuthorId);
    const authorName = selectedAuthor?.full_name || 'Unknown Author';

    // Pass complete author data for optimistic UI update
    const userProfile = {
      id: selectedAuthorId,
      full_name: authorName,
      email: selectedAuthor?.email,
      role: selectedAuthor?.role
    };

    // Call parent handler (which will close popup and handle API call)
    await onUpdate(articleId, authorName, selectedAuthorId, userProfile);
  };

  const selectedAuthor = availableAuthors.find(author => author.id === selectedAuthorId);

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
        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
            Chọn tác giả:
          </label>
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <div className="w-4 h-4 border border-gray-300 border-t-transparent rounded-full animate-spin"></div>
              <span className="ml-2 text-sm text-gray-500">Đang tải...</span>
            </div>
          ) : (
            <div className="max-h-40 overflow-y-auto space-y-2">
              {availableAuthors.map(author => (
                <label
                  key={author.id}
                  className="flex items-center space-x-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded cursor-pointer border border-gray-200 dark:border-gray-600"
                >
                  <input
                    type="radio"
                    name="author"
                    checked={selectedAuthorId === author.id}
                    onChange={() => handleAuthorSelect(author.id)}
                    className="border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500"
                  />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {author.full_name}
                      </span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${author.role_badge_color}`}>
                        {author.role_display_name}
                      </span>
                    </div>
                    {author.email && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {author.email}
                      </div>
                    )}
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Preview */}
        {selectedAuthor && (
          <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded">
            <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Tác giả sẽ được cập nhật:</div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {selectedAuthor.full_name}
              </span>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${selectedAuthor.role_badge_color}`}>
                {selectedAuthor.role_display_name}
              </span>
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
            disabled={isLoading || !selectedAuthorId}
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
