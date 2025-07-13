import React from 'react';

interface TiptapEditorProps {
  content: string;
  onChange: (content: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export default function TiptapEditor({
  content,
  onChange,
  onFocus,
  onBlur,
  placeholder = "Bắt đầu viết...",
  disabled = false,
  className = ""
}: TiptapEditorProps) {
  // Placeholder implementation - sẽ được thay thế bằng Tiptap thật
  return (
    <div className={`relative ${className}`}>
      <textarea
        value={content}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
        onBlur={onBlur}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full h-full resize-none border-none outline-none bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
        style={{ minHeight: '500px' }}
      />
      
      {/* Placeholder toolbar */}
      <div className="absolute top-0 right-0 p-2 text-xs text-gray-400">
        Rich text editor (placeholder)
      </div>
    </div>
  );
}
