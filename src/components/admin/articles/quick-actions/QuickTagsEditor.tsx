import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArticlesService } from '../../../../../backend';
import { getInstantTagsData, preloadTagsData, isTagsDataReady } from '../../../../utils/admin/preloaders/tags-preloader';
import { processBulkTags, createTagFeedbackMessage, defaultNormalizeTag } from '../../../../utils/tag-processing';

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
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackType, setFeedbackType] = useState<'success' | 'warning' | 'error'>('success');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Autocomplete states
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const newTagInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Set instant data immediately to avoid loading delay
    const instantTags = getInstantTagsData();
    setAvailableTags(instantTags);

    // Always load fresh data in background to ensure completeness
    if (!isTagsDataReady()) {
      preloadTagsData().then(loadedTags => {
        setAvailableTags(loadedTags);
        console.log(`🏷️ QuickTagsEditor: Loaded ${loadedTags.length} tags`);
      }).catch(() => {
        // Keep instant data on error
        console.warn('🏷️ QuickTagsEditor: Failed to load tags, using instant fallback');
      });
    }

    // Auto-focus on new tag input when popup opens
    setTimeout(() => {
      newTagInputRef.current?.focus();
    }, 100);

    // Handle click outside
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;

      // Check if click is outside popup and not on a quick edit button
      if (dropdownRef.current &&
          !dropdownRef.current.contains(target) &&
          !target.closest('[data-quick-edit-button]')) {
        onClose();
      }

      // Close suggestions if clicking outside the suggestions area
      if (suggestionsRef.current && !suggestionsRef.current.contains(target) &&
          newTagInputRef.current && !newTagInputRef.current.contains(target)) {
        setShowSuggestions(false);
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const handleTagToggle = (tag: string) => {
    const selectedTagsLower = selectedTags.map(t => t.toLowerCase());
    const tagLower = tag.toLowerCase();

    if (selectedTagsLower.includes(tagLower)) {
      // Remove tag (case-insensitive)
      setSelectedTags(prev => prev.filter(t => t.toLowerCase() !== tagLower));
    } else {
      // Add tag (normalized)
      const normalizedTag = defaultNormalizeTag(tag);
      setSelectedTags(prev => [...prev, normalizedTag]);
    }
  };

  // Debounced filter function for autocomplete
  const filterSuggestions = useCallback((input: string) => {
    if (!input.trim()) {
      setFilteredSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const inputLower = input.toLowerCase();
    const selectedTagsLower = selectedTags.map(tag => tag.toLowerCase());

    const filtered = availableTags
      .filter(tag =>
        tag.toLowerCase().includes(inputLower) &&
        !selectedTagsLower.includes(tag.toLowerCase())
      )
      .slice(0, 8); // Limit to 8 suggestions for performance

    setFilteredSuggestions(filtered);
    setShowSuggestions(filtered.length > 0);
    setHighlightedIndex(-1);
  }, [availableTags, selectedTags]);

  // Debounce the filter function
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      filterSuggestions(newTag);
    }, 150); // 150ms debounce

    return () => clearTimeout(timeoutId);
  }, [newTag, filterSuggestions]);

  // Hàm xử lý bulk tag input (hỗ trợ comma separation)
  const handleBulkTagInput = (input: string) => {
    if (!input.trim()) return;

    // Sử dụng utility function với options cho QuickTagsEditor
    const result = processBulkTags(input, selectedTags, {
      maxLength: 50,
      caseSensitive: false,
      normalizeFunction: defaultNormalizeTag,
      separator: ','
    });

    // Thêm valid tags
    if (result.validTags.length > 0) {
      setSelectedTags(prev => [...prev, ...result.validTags]);
      setAvailableTags(prev => [...prev, ...result.validTags].sort());
    }

    // Hiển thị feedback
    if (result.duplicates.length > 0 || result.tooLong.length > 0 || result.empty > 0) {
      const feedback = createTagFeedbackMessage(result);
      setFeedbackMessage(feedback.message);
      setFeedbackType(feedback.type);

      // Auto clear feedback sau 4 giây
      setTimeout(() => {
        setFeedbackMessage('');
      }, 4000);
    } else if (result.validTags.length > 0) {
      // Success feedback
      setFeedbackMessage(`✅ Đã thêm ${result.validTags.length} tag`);
      setFeedbackType('success');
      setTimeout(() => {
        setFeedbackMessage('');
      }, 2000);
    }

    // Clear input và reset UI
    setNewTag('');
    setShowSuggestions(false);
    setHighlightedIndex(-1);
    setTimeout(() => newTagInputRef.current?.focus(), 50);
  };

  const handleAddNewTag = (tagToAdd?: string) => {
    const inputValue = tagToAdd || newTag;

    // Kiểm tra xem có phải bulk input không (chứa dấu phẩy)
    if (inputValue.includes(',')) {
      handleBulkTagInput(inputValue);
      return;
    }

    // Single tag processing (logic cũ)
    const trimmedTag = inputValue.trim();
    if (!trimmedTag) return;

    // Case-insensitive duplicate check
    const selectedTagsLower = selectedTags.map(tag => tag.toLowerCase());
    const trimmedTagLower = trimmedTag.toLowerCase();

    if (selectedTagsLower.includes(trimmedTagLower)) {
      // Tag already exists, show feedback
      setFeedbackMessage('⚠️ Tag đã tồn tại');
      setFeedbackType('warning');
      setTimeout(() => setFeedbackMessage(''), 2000);

      setNewTag('');
      setShowSuggestions(false);
      setHighlightedIndex(-1);
      setTimeout(() => newTagInputRef.current?.focus(), 50);
      return;
    }

    // Normalize tag using utility function
    const normalizedTag = defaultNormalizeTag(trimmedTag);

    setSelectedTags(prev => [...prev, normalizedTag]);
    setAvailableTags(prev => [...prev, normalizedTag].sort());
    setNewTag('');
    setShowSuggestions(false);
    setHighlightedIndex(-1);

    // Success feedback
    setFeedbackMessage(`✅ Đã thêm tag: ${normalizedTag}`);
    setFeedbackType('success');
    setTimeout(() => setFeedbackMessage(''), 2000);

    // Refocus input after adding tag
    setTimeout(() => newTagInputRef.current?.focus(), 50);
  };



  const handleSave = () => {
    // Optimistic UI: Close popup immediately and trigger update
    // The parent component (AdminArticles) will handle the API call and loading state
    onUpdate(articleId, selectedTags);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions) {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleAddNewTag();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev =>
          prev < filteredSuggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev =>
          prev > 0 ? prev - 1 : filteredSuggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && filteredSuggestions[highlightedIndex]) {
          handleAddNewTag(filteredSuggestions[highlightedIndex]);
        } else {
          handleAddNewTag();
        }
        break;
      case 'Escape':
        e.preventDefault();
        setShowSuggestions(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewTag(e.target.value);
  };

  const handleSuggestionClick = (suggestion: string) => {
    handleAddNewTag(suggestion);
  };

  // Function to highlight matching text in suggestions
  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return text;

    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, index) =>
      regex.test(part) ? (
        <span key={index} className="font-semibold text-primary-600 dark:text-primary-400">
          {part}
        </span>
      ) : part
    );
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



        {/* Available Tags */}
        <div className="mb-3">
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
            Tags có sẵn:
          </label>
          <div className="max-h-32 overflow-y-auto">
            <div className="flex flex-wrap gap-1">
              {availableTags.map(tag => {
                // Case-insensitive check for selected state
                const selectedTagsLower = selectedTags.map(t => t.toLowerCase());
                const isSelected = selectedTagsLower.includes(tag.toLowerCase());

                return (
                  <button
                    key={tag}
                    onClick={() => handleTagToggle(tag)}
                    className={`
                      inline-flex items-center px-2 py-1 rounded text-xs font-medium transition-all duration-200 cursor-pointer
                      ${isSelected
                        ? 'bg-primary-200 dark:bg-primary-800 text-primary-800 dark:text-primary-200 opacity-60'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary-700 dark:hover:text-primary-300'
                      }
                    `}
                    title={isSelected ? 'Click để bỏ chọn' : 'Click để chọn'}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Add New Tag with Autocomplete */}
        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
            Thêm tag mới:
          </label>
          <div className="relative">
            {/* Input Container with integrated design */}
            <div className={`
              flex border border-gray-300 dark:border-gray-600 overflow-hidden bg-white dark:bg-gray-700
              ${showSuggestions ? 'rounded-t-[5px] rounded-b-[0px] border-b-0' : 'rounded-[5px]'}
            `}>
              <input
                ref={newTagInputRef}
                type="text"
                value={newTag}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Nhập tag (phân tách bằng dấu phẩy)..."
                className="flex-1 px-3 py-2 text-sm bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 border-0 outline-none focus:outline-none focus:ring-0"
                autoComplete="off"
              />
              <button
                onClick={() => handleAddNewTag()}
                disabled={!newTag.trim()}
                className="px-4 py-2 text-sm bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 disabled:opacity-50 text-white transition-colors border-l border-gray-300 dark:border-gray-600"
              >
                Thêm
              </button>
            </div>

            {/* Autocomplete Dropdown - Seamlessly connected */}
            {showSuggestions && (
              <div
                ref={suggestionsRef}
                className="absolute top-full left-0 right-0 mt-0 bg-white dark:bg-gray-800 border-l border-r border-b border-gray-300 dark:border-gray-600 rounded-t-[0px] rounded-b-[5px] shadow-lg z-50 max-h-48 overflow-y-auto"
              >
                {filteredSuggestions.length > 0 ? (
                  filteredSuggestions.map((suggestion, index) => (
                    <div
                      key={suggestion}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className={`
                        px-3 py-2 text-sm cursor-pointer transition-colors border-b border-gray-100 dark:border-gray-700 last:border-b-0
                        ${index === highlightedIndex
                          ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                        }
                        ${index === filteredSuggestions.length - 1 ? 'rounded-b-[5px]' : ''}
                      `}
                    >
                      {highlightMatch(suggestion, newTag)}
                    </div>
                  ))
                ) : (
                  <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400 italic rounded-b-[5px]">
                    Không tìm thấy tag phù hợp
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Feedback Message */}
          {feedbackMessage && (
            <div className={`mt-2 p-2 rounded text-xs ${
              feedbackType === 'success'
                ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800'
                : feedbackType === 'warning'
                ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800'
                : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
            }`}>
              {feedbackMessage.split('\n').map((line, index) => (
                <div key={index}>{line}</div>
              ))}
            </div>
          )}
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
            className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
          >
            Hủy
          </button>
          <button
            onClick={handleSave}
            className="px-3 py-1 text-sm bg-primary-600 hover:bg-primary-700 text-white rounded transition-colors"
          >
            Lưu
          </button>
        </div>
      </div>
    </motion.div>
  );
}
