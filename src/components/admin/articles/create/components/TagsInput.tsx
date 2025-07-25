import React, { useState, useRef, useCallback, useEffect } from 'react';
import { X, Hash, Plus } from 'lucide-react';
import { processBulkTags, lowercaseNormalizeTag } from '../../../../../utils/tag-processing';
import { getInstantTagsData, preloadTagsData, isTagsDataReady } from '../../../../../utils/admin/preloaders/tags-preloader';
import TagsTabs from './TagsTabs';

interface TagsInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  maxTags?: number;
  disabled?: boolean;
  className?: string;
  availableTags?: string[]; // Progressive Loading support
}

export default function TagsInput({
  value = [],
  onChange,
  placeholder = "Thêm tags...",
  maxTags = 20,
  disabled = false,
  className = "",
  availableTags: propAvailableTags
}: TagsInputProps) {
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load available tags on component mount
  useEffect(() => {
    if (propAvailableTags) {
      // Use tags from props (Progressive Loading)
      setAvailableTags(propAvailableTags);
      return;
    }

    // Fallback: load tags if not provided via props
    const instantTags = getInstantTagsData();
    setAvailableTags(instantTags);

    // Always load fresh data in background to ensure completeness
    if (!isTagsDataReady()) {
      preloadTagsData().then(loadedTags => {
        setAvailableTags(loadedTags);
        console.log(`🏷️ TagsInput: Loaded ${loadedTags.length} tags`);
      }).catch(() => {
        // Keep instant data on error
        console.warn('🏷️ TagsInput: Failed to load tags, using instant fallback');
      });
    }
  }, [propAvailableTags]);

  // Debounced filter function for autocomplete
  const filterSuggestions = useCallback((input: string) => {
    if (!input.trim()) {
      setFilteredSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const inputLower = input.toLowerCase();
    const selectedTagsLower = value.map(tag => tag.toLowerCase());

    const filtered = availableTags
      .filter(tag =>
        tag.toLowerCase().includes(inputLower) &&
        !selectedTagsLower.includes(tag.toLowerCase())
      )
      .slice(0, 8); // Limit to 8 suggestions for performance

    setFilteredSuggestions(filtered);
    setShowSuggestions(filtered.length > 0);
    setHighlightedIndex(-1);
  }, [availableTags, value]);

  // Debounce the filter function
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      filterSuggestions(newTag);
    }, 150); // 150ms debounce

    return () => clearTimeout(timeoutId);
  }, [newTag, filterSuggestions]);

  // Handle input change
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setNewTag(e.target.value);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (showSuggestions && filteredSuggestions.length > 0) {
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        setHighlightedIndex(prev =>
          prev < filteredSuggestions.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : filteredSuggestions.length - 1);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (highlightedIndex >= 0 && filteredSuggestions[highlightedIndex]) {
          // Add selected suggestion
          const suggestion = filteredSuggestions[highlightedIndex];
          const trimmedTag = suggestion.trim();
          if (trimmedTag && !value.map(t => t.toLowerCase()).includes(trimmedTag.toLowerCase())) {
            const normalizedTag = lowercaseNormalizeTag(trimmedTag);
            onChange([...value, normalizedTag]);
            setNewTag('');
            setShowSuggestions(false);
            setHighlightedIndex(-1);
          }
        } else if (newTag.trim()) {
          // Add new tag from input
          const result = processBulkTags(newTag, value, {
            maxLength: 50,
            caseSensitive: false,
            normalizeFunction: lowercaseNormalizeTag,
            separator: ','
          });
          if (result.validTags.length > 0) {
            onChange([...value, ...result.validTags]);
          }
          setNewTag('');
          setShowSuggestions(false);
          setHighlightedIndex(-1);
        }
        return;
      } else if (e.key === 'Escape') {
        setShowSuggestions(false);
        setHighlightedIndex(-1);
        return;
      }
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      if (newTag.trim()) {
        // Add new tag from input
        const result = processBulkTags(newTag, value, {
          maxLength: 50,
          caseSensitive: false,
          normalizeFunction: lowercaseNormalizeTag,
          separator: ','
        });
        if (result.validTags.length > 0) {
          onChange([...value, ...result.validTags]);
        }
        setNewTag('');
        setShowSuggestions(false);
        setHighlightedIndex(-1);
      }
    } else if (e.key === 'Backspace' && !newTag && value.length > 0) {
      // Remove last tag on backspace when input is empty
      const newTags = value.slice(0, -1);
      onChange(newTags);
    }
  }, [showSuggestions, filteredSuggestions, highlightedIndex, newTag, value, onChange]);



  // Remove tag
  const removeTag = useCallback((tagToRemove: string) => {
    const newTags = value.filter(tag => tag !== tagToRemove);
    onChange(newTags);
  }, [value, onChange]);

  // Handle tag add from tabs
  const handleTagAdd = useCallback((tag: string) => {
    if (!value.map(t => t.toLowerCase()).includes(tag.toLowerCase()) && value.length < maxTags) {
      onChange([...value, tag]);
    }
  }, [value, onChange, maxTags]);

  // Handle suggestion click
  const handleSuggestionClick = useCallback((suggestion: string) => {
    const trimmedTag = suggestion.trim();
    if (trimmedTag && !value.map(t => t.toLowerCase()).includes(trimmedTag.toLowerCase())) {
      const normalizedTag = lowercaseNormalizeTag(trimmedTag);
      onChange([...value, normalizedTag]);
      setNewTag('');
      setShowSuggestions(false);
      setHighlightedIndex(-1);

      // Refocus input after adding tag
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [value, onChange]);

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

  // Click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const canAddMore = value.length < maxTags;

  return (
    <div ref={containerRef} className={`space-y-4 ${className}`} style={{ position: 'relative', zIndex: 1, overflow: 'visible' }}>
      {/* Modern Input Area */}
      <div className="relative group" style={{ position: 'relative', zIndex: 1, overflow: 'visible' }}>
        <div
          className={`
            relative flex flex-wrap items-center gap-3 px-3 py-2 border rounded-xl
            bg-white dark:bg-gray-800/50 backdrop-blur-sm
            border-gray-200 dark:border-gray-700
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-text'}
          `}
          onClick={() => !disabled && inputRef.current?.focus()}
        >
          {/* Modern Tags Display */}
          {value.map((tag, index) => (
            <span
              key={`${tag}-${index}`}
              className="inline-flex items-center gap-2 px-3 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-sm rounded-lg shadow-sm"
            >
              <span className="font-medium">{tag}</span>
              {!disabled && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeTag(tag);
                  }}
                  className="ml-1 p-1 rounded-full"
                  title="Xóa tag"
                >
                  <X size={12} />
                </button>
              )}
            </span>
          ))}

          {/* Modern Input Field */}
          {canAddMore && (
            <div className="flex-1 min-w-[160px] relative">
              <input
                ref={inputRef}
                type="text"
                value={newTag}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder={value.length === 0 ? placeholder : "Nhập tag mới..."}
                disabled={disabled}
                className="w-full bg-transparent border-none outline-none text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 text-sm font-medium py-1"
              />
              {!newTag && value.length === 0 && (
                <div className="absolute right-0 top-1/2 transform -translate-y-1/2 flex items-center gap-2 text-gray-400 text-xs">
                  <Hash size={14} />
                  <span>Gõ để thêm tags</span>
                </div>
              )}
            </div>
          )}

          {/* Add Button */}
          {newTag.trim() && canAddMore && (
            <button
              onClick={() => {
                const result = processBulkTags(newTag, value, {
                  maxLength: 50,
                  caseSensitive: false,
                  normalizeFunction: lowercaseNormalizeTag,
                  separator: ','
                });
                if (result.validTags.length > 0) {
                  onChange([...value, ...result.validTags]);
                }
                setNewTag('');
                setShowSuggestions(false);
                setHighlightedIndex(-1);
              }}
              className="px-3 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-lg text-sm font-medium"
              title="Thêm tag"
            >
              <Plus size={14} />
            </button>
          )}
        </div>

      </div>

      {/* Modern Suggestions Panel */}
      {showSuggestions && filteredSuggestions.length > 0 && (
        <div className="bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl p-3 shadow-lg shadow-gray-100/50 dark:shadow-gray-900/20 backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <Hash size={12} className="text-white" />
            </div>
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Gợi ý tags có sẵn</span>
            <div className="flex-1 h-px bg-gradient-to-r from-gray-200 to-transparent dark:from-gray-700"></div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {filteredSuggestions.map((suggestion, index) => (
              <button
                key={suggestion}
                onClick={() => handleSuggestionClick(suggestion)}
                className={`
                  inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md font-medium
                  ${highlightedIndex === index
                    ? 'bg-gradient-to-r from-primary-500 to-purple-500 text-white'
                    : 'bg-white dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600'
                  }
                `}
              >
                <span>{highlightMatch(suggestion, newTag)}</span>
                <div className={`w-3 h-3 rounded-full flex items-center justify-center ${highlightedIndex === index ? 'bg-white/20' : 'bg-primary-100 dark:bg-primary-900/30'}`}>
                  <Plus size={8} className={highlightedIndex === index ? 'text-white' : 'text-primary-600 dark:text-primary-400'} />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}



      {/* Modern Tags Count & Info */}
      <div className="flex items-center justify-between">
        {value.length > 0 && (
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/25">
              <Hash size={10} className="text-white" />
            </div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {value.length} tag{value.length > 1 ? 's' : ''}
            </span>
            <div className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-lg text-xs text-gray-600 dark:text-gray-400">
              {maxTags - value.length} còn lại
            </div>
          </div>
        )}

        {value.length === 0 && (
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
            <Hash size={14} />
            <span className="text-sm">Chưa có tags nào</span>
          </div>
        )}
      </div>

      {/* Tags Tabs - Always show */}
      <div className="mt-3">
        <TagsTabs
          selectedTags={value}
          onTagAdd={handleTagAdd}
          maxTags={maxTags}
          disabled={disabled}
        />
      </div>
    </div>
  );
}
