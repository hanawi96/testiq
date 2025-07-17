import React, { useState, useEffect } from 'react';

interface AltTextInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export default function AltTextInput({
  value,
  onChange,
  placeholder = "Describe what's in this image for accessibility...",
  required = true,
  disabled = false,
  className = ""
}: AltTextInputProps) {
  const [localValue, setLocalValue] = useState(value);
  const [isValid, setIsValid] = useState(false);
  const [showTips, setShowTips] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  // Validation rules
  const MIN_LENGTH = 5;
  const MAX_LENGTH = 125;

  // Update local value when prop changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Validate alt text
  useEffect(() => {
    const trimmed = localValue.trim();
    const isValidLength = trimmed.length >= MIN_LENGTH && trimmed.length <= MAX_LENGTH;
    const hasNoHtml = !/[<>"]/.test(trimmed);
    setIsValid(isValidLength && hasNoHtml);
  }, [localValue]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    onChange(newValue);

    // Show typing indicator
    setIsTyping(true);
    setTimeout(() => setIsTyping(false), 1000);
  };

  const getCharacterCount = () => {
    return localValue.length;
  };

  const getCharacterCountColor = () => {
    const count = getCharacterCount();
    if (count < MIN_LENGTH) return 'text-red-500';
    if (count > MAX_LENGTH * 0.9) return 'text-yellow-500';
    return 'text-green-500';
  };

  const tips = [
    "Describe what you see in the image",
    "Include important text if visible",
    "Mention colors, objects, or people",
    "Keep it concise but descriptive"
  ];

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Label */}
      <div className="flex items-center justify-between">
        <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100">
          🏷️ Image Description
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        
        {/* Tips Toggle */}
        <button
          type="button"
          onClick={() => setShowTips(!showTips)}
          className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
        >
          💡 Tips
        </button>
      </div>

      {/* Tips Panel */}
      {showTips && (
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
          <p className="text-xs font-medium text-blue-900 dark:text-blue-100 mb-2">
            Good alt text helps with:
          </p>
          <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
            {tips.map((tip, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">•</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Input Field */}
      <div className="relative">
        <textarea
          value={localValue}
          onChange={handleChange}
          placeholder={placeholder}
          disabled={disabled}
          rows={3}
          className={`
            w-full px-4 py-3 rounded-lg border-2 transition-all duration-200
            resize-none focus:outline-none
            ${disabled 
              ? 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 cursor-not-allowed' 
              : isValid
                ? 'border-green-300 dark:border-green-600 focus:border-green-500 focus:ring-2 focus:ring-green-500/20'
                : localValue.length > 0
                  ? 'border-red-300 dark:border-red-600 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                  : 'border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
            }
            bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
            placeholder-gray-500 dark:placeholder-gray-400
          `}
        />
        
        {/* Validation Icon */}
        {localValue.length > 0 && (
          <div className="absolute top-3 right-3">
            {isValid ? (
              <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
          </div>
        )}
      </div>

      {/* Character Count & Validation */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-4">
          {/* Character Count */}
          <span className={`font-medium ${getCharacterCountColor()}`}>
            {getCharacterCount()}/{MAX_LENGTH}
          </span>
          
          {/* Validation Status */}
          {localValue.length > 0 && (
            <span className={`flex items-center gap-1 ${isValid ? 'text-green-600' : 'text-red-600'}`}>
              {isValid ? (
                <>
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Valid
                </>
              ) : (
                <>
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {localValue.length < MIN_LENGTH ? `Need ${MIN_LENGTH - localValue.length} more chars` : 'Too long'}
                </>
              )}
            </span>
          )}
        </div>

        {/* Required Indicator */}
        {required && localValue.length === 0 && (
          <span className="text-gray-500 dark:text-gray-400">
            Required field
          </span>
        )}
      </div>
    </div>
  );
}
