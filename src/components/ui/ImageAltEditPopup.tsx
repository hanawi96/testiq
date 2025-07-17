import React, { useState, useEffect, useRef } from 'react';
import { X, Check, Edit3 } from 'lucide-react';

interface ImageAltEditPopupProps {
  currentAlt: string;
  onSave: (newAlt: string) => void;
  onCancel: () => void;
  position: { x: number; y: number };
  imageElement?: HTMLImageElement;
}

export default function ImageAltEditPopup({
  currentAlt,
  onSave,
  onCancel,
  position,
  imageElement
}: ImageAltEditPopupProps) {
  const [altText, setAltText] = useState(currentAlt);
  const [isValid, setIsValid] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Validation
  const MIN_LENGTH = 5;
  const MAX_LENGTH = 125;

  useEffect(() => {
    const trimmed = altText.trim();
    const isValidLength = trimmed.length >= MIN_LENGTH && trimmed.length <= MAX_LENGTH;
    const hasNoHtml = !/[<>"]/.test(trimmed);
    setIsValid(isValidLength && hasNoHtml);
  }, [altText]);

  // Auto-focus input when popup opens
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, []);

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        onCancel();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onCancel]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onCancel();
      } else if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
        if (isValid) {
          handleSave();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isValid, altText, onCancel]);

  const handleSave = () => {
    if (isValid) {
      onSave(altText.trim());
    }
  };

  const getCharacterCount = () => altText.length;
  const getCharacterCountColor = () => {
    const count = getCharacterCount();
    if (count < MIN_LENGTH) return 'text-red-500';
    if (count > MAX_LENGTH * 0.9) return 'text-yellow-500';
    return 'text-green-500';
  };

  // Calculate optimal position
  const getPopupStyle = () => {
    const popupWidth = 320;
    const popupHeight = 180;
    const margin = 16;

    let x = position.x;
    let y = position.y;

    // Adjust if popup would go off-screen
    if (x + popupWidth > window.innerWidth - margin) {
      x = window.innerWidth - popupWidth - margin;
    }
    if (x < margin) {
      x = margin;
    }

    if (y + popupHeight > window.innerHeight - margin) {
      y = position.y - popupHeight - margin;
    }
    if (y < margin) {
      y = margin;
    }

    return {
      position: 'fixed' as const,
      left: `${x}px`,
      top: `${y}px`,
      zIndex: 9999,
      width: `${popupWidth}px`
    };
  };

  return (
    <div
      ref={popupRef}
      style={getPopupStyle()}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-4 animate-in fade-in zoom-in-95 duration-200"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <Edit3 className="w-4 h-4 text-white" />
          </div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Edit Alt Text
          </h3>
        </div>
        
        <button
          onClick={onCancel}
          className="w-6 h-6 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center transition-colors"
        >
          <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
        </button>
      </div>

      {/* Current Alt Display */}
      {currentAlt && (
        <div className="mb-3 p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Current:</p>
          <p className="text-sm text-gray-800 dark:text-gray-200 italic">"{currentAlt}"</p>
        </div>
      )}

      {/* Input Field */}
      <div className="mb-3">
        <textarea
          ref={inputRef}
          value={altText}
          onChange={(e) => setAltText(e.target.value)}
          placeholder="Describe this image for accessibility..."
          rows={3}
          className={`
            w-full px-3 py-2 rounded-lg border-2 transition-all duration-200
            resize-none focus:outline-none text-sm
            ${isValid
              ? 'border-green-300 dark:border-green-600 focus:border-green-500 focus:ring-2 focus:ring-green-500/20'
              : altText.length > 0
                ? 'border-red-300 dark:border-red-600 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                : 'border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
            }
            bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
            placeholder-gray-500 dark:placeholder-gray-400
          `}
        />
      </div>

      {/* Character Count & Status */}
      <div className="flex items-center justify-between text-xs mb-4">
        <span className={`font-medium ${getCharacterCountColor()}`}>
          {getCharacterCount()}/{MAX_LENGTH}
        </span>
        
        {altText.length > 0 && (
          <span className={`flex items-center gap-1 ${isValid ? 'text-green-600' : 'text-red-600'}`}>
            {isValid ? (
              <>
                <Check className="w-3 h-3" />
                Valid
              </>
            ) : (
              <>
                <X className="w-3 h-3" />
                {altText.length < MIN_LENGTH ? `Need ${MIN_LENGTH - altText.length} more` : 'Too long'}
              </>
            )}
          </span>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={onCancel}
          className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          Cancel
        </button>
        
        <button
          onClick={handleSave}
          disabled={!isValid}
          className="flex-1 px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1"
        >
          <Check className="w-3 h-3" />
          Save
        </button>
      </div>

      {/* Keyboard Shortcuts Hint */}
      <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
        <kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs">Ctrl+Enter</kbd> to save • <kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs">Esc</kbd> to cancel
      </div>
    </div>
  );
}
