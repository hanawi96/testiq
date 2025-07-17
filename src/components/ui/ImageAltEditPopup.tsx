import React, { useState, useEffect, useRef } from 'react';
import { X, Check, Edit3, Loader2 } from 'lucide-react';
import { ImageStorageService } from '../../../backend/storage/image-storage';

interface ImageAltEditPopupProps {
  currentAlt: string;
  onSave: (newAlt: string, newFileName?: string) => Promise<void>;
  onCancel: () => void;
  position?: { x: number; y: number }; // Optional - nếu không có thì dùng modal mode
  imageElement?: HTMLImageElement;
  isModal?: boolean; // Explicit modal mode flag
  enableFileNameEdit?: boolean; // Enable filename editing for TipTap images
}

export default function ImageAltEditPopup({
  currentAlt,
  onSave,
  onCancel,
  position,
  imageElement,
  isModal = false,
  enableFileNameEdit = false
}: ImageAltEditPopupProps) {
  const [altText, setAltText] = useState(currentAlt);
  const [fileName, setFileName] = useState('');
  const [isValid, setIsValid] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Validation
  const MIN_LENGTH = 5;
  const MAX_LENGTH = 125;

  // Extract filename from imageElement when enableFileNameEdit is true
  useEffect(() => {
    if (enableFileNameEdit && imageElement?.src) {
      const extractedFileName = ImageStorageService.extractFileNameFromUrl(imageElement.src);
      if (extractedFileName) {
        // Tách tên file và extension
        const lastDotIndex = extractedFileName.lastIndexOf('.');
        const nameWithoutExtension = lastDotIndex > 0
          ? extractedFileName.substring(0, lastDotIndex)
          : extractedFileName;
        setFileName(nameWithoutExtension);
      } else {
        setFileName('');
      }
    }
  }, [enableFileNameEdit, imageElement]);

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

  const handleSave = async () => {
    if (isValid && altText.trim() && !isSaving) {
      try {
        setIsSaving(true);
        if (enableFileNameEdit) {
          // Ghép tên file với extension gốc
          let finalFileName = fileName.trim();
          if (finalFileName && imageElement?.src) {
            const originalFileName = ImageStorageService.extractFileNameFromUrl(imageElement.src);
            if (originalFileName) {
              const lastDotIndex = originalFileName.lastIndexOf('.');
              const extension = lastDotIndex > 0 ? originalFileName.substring(lastDotIndex) : '.jpg';
              finalFileName = finalFileName + extension;
            }
          }
          await onSave(altText.trim(), finalFileName);
        } else {
          await onSave(altText.trim());
        }
      } catch (error) {
        console.error('Error saving alt text:', error);
        // Could add toast notification here
      } finally {
        setIsSaving(false);
      }
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
    const popupHeight = enableFileNameEdit ? 260 : 180; // Tăng height khi có filename field
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

  // Render modal hoặc positioned popup
  const renderContent = () => (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-4 animate-in fade-in zoom-in-95 duration-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <Edit3 className="w-4 h-4 text-white" />
          </div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {enableFileNameEdit ? 'Chỉnh sửa ảnh' : 'Edit Alt Text'}
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

      {/* Filename Field - Only show when enableFileNameEdit is true */}
      {enableFileNameEdit && (
        <div className="mb-3">
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            Tên file (không bao gồm đuôi)
          </label>
          <input
            type="text"
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
            placeholder="Ví dụ: anh-bai-viet-2024"
            className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Đuôi file (.jpg, .png) sẽ được giữ nguyên
          </p>
        </div>
      )}

      {/* Alt Text Field */}
      <div className="mb-3">
        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
          Alt text
        </label>
        <textarea
          ref={inputRef}
          value={altText}
          onChange={(e) => setAltText(e.target.value)}
          placeholder="Describe this image for accessibility..."
          className="w-full h-20 px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          maxLength={125}
        />

        {/* Character Count */}
        <div className="flex justify-between items-center mt-1">
          <span className={`text-xs ${getCharacterCountColor()}`}>
            {getCharacterCount()}/{125} characters
          </span>
          {altText.length < MIN_LENGTH && (
            <span className="text-xs text-red-500">
              Minimum {MIN_LENGTH} characters
            </span>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={onCancel}
          disabled={isSaving}
          className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={!isValid || isSaving}
          className="flex-1 px-3 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-lg transition-all flex items-center justify-center gap-2"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <Check className="w-4 h-4" />
              <span>Save</span>
            </>
          )}
        </button>
      </div>
    </div>
  );

  // Modal mode hoặc positioned mode
  if (isModal || !position) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div ref={popupRef} className="w-full max-w-md">
          {renderContent()}
        </div>
      </div>
    );
  }

  // Positioned mode (existing behavior)
  return (
    <div
      ref={popupRef}
      style={getPopupStyle()}
    >
      {renderContent()}
    </div>
  );
}
