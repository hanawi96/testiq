/**
 * DROPDOWN SECTION COMPONENT
 * Enhanced dropdown section với beautiful headers và animations
 */

import React from 'react';

interface DropdownSectionProps {
  title: string;
  icon: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  className?: string;
}

export const DropdownSection: React.FC<DropdownSectionProps> = ({ 
  title, 
  icon, 
  isOpen, 
  onToggle, 
  children, 
  className = '' 
}) => {

  // UNIFIED DESIGN: Tất cả boxes đều dùng màu giống box "Xuất bản"
  const getGradientColors = () => {
    // Tất cả sections đều dùng blue-indigo theme giống box "Xuất bản"
    return {
      from: 'from-blue-50/80',
      via: 'via-indigo-50/60',
      to: 'to-purple-50/80',
      iconFrom: 'from-blue-500',
      iconTo: 'to-indigo-600',
      borderColor: 'border-blue-200/60 dark:border-blue-700/40'
    };
  };

  const colors = getGradientColors();

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg border ${colors.borderColor} transition-all duration-300 ${
      isOpen ? 'overflow-visible' : 'overflow-hidden'
    } ${className}`}>
      {/* Header với gradient background */}
      <button
        onClick={onToggle}
        className={`w-full p-4 text-left transition-all duration-300 bg-gradient-to-r ${colors.from} ${colors.via} ${colors.to} dark:from-gray-800/80 dark:via-gray-700/60 dark:to-gray-800/80 hover:shadow-sm`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Icon với gradient */}
            <div className={`p-2 rounded-lg bg-gradient-to-br ${colors.iconFrom} ${colors.iconTo} text-white shadow-sm`}>
              <div className="w-4 h-4 text-white [&>svg]:w-4 [&>svg]:h-4 [&>svg]:text-white [&>svg]:stroke-white">
                {icon}
              </div>
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
              {title}
            </h3>
          </div>

          {/* Chevron icon */}
          <svg
            className={`w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform duration-300 ${
              isOpen ? 'rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Content với smooth animation */}
      <div
        className={`transition-all duration-300 ease-in-out ${
          isOpen ? 'max-h-[2000px] opacity-100 overflow-visible' : 'max-h-0 opacity-0 overflow-hidden'
        }`}
      >
        <div className="border-t border-gray-100 dark:border-gray-700 p-6">
          {children}
        </div>
      </div>
    </div>
  );
};
