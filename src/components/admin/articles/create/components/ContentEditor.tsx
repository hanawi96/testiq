import React, { useState } from 'react';
import TiptapEditor from '../editor/TiptapEditor';
import type { ContentEditorProps } from '../types/articleForm';

export default function ContentEditor({
  value,
  onChange,
  placeholder = "Bắt đầu viết nội dung...",
  disabled = false,
  onFocus,
  onBlur
}: ContentEditorProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [characterCount, setCharacterCount] = useState(0);

  const handleFocus = () => {
    setIsFocused(true);
    onFocus?.();
  };

  const handleBlur = () => {
    setIsFocused(false);
    onBlur?.();
  };

  const handleChange = (content: string) => {
    onChange(content);
    
    // Calculate word and character count
    const text = content.replace(/<[^>]*>/g, '').trim();
    const words = text ? text.split(/\s+/).length : 0;
    const characters = text.length;
    
    setWordCount(words);
    setCharacterCount(characters);
  };

  const readingTime = Math.ceil(wordCount / 200); // Average reading speed

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
            Nội dung bài viết
          </h2>
          
          {/* Stats */}
          <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
            <span>{wordCount} từ</span>
            <span>{characterCount} ký tự</span>
            {readingTime > 0 && (
              <span>{readingTime} phút đọc</span>
            )}
          </div>
        </div>
      </div>

      {/* Editor */}
      <div className={`relative ${isFocused ? 'ring-2 ring-blue-500 ring-opacity-20' : ''}`}>
        <TiptapEditor
          content={value}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          className="min-h-[500px] p-6"
        />
      </div>

      {/* Footer with additional info */}
      <div className="px-6 py-3 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700 rounded-b-lg">
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center space-x-4">
            <span>Markdown được hỗ trợ</span>
            <span>Ctrl+S để lưu</span>
          </div>
          
          {disabled && (
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin"></div>
              <span>Đang xử lý...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
