/**
 * AUTOSAVE INDICATOR COMPONENT
 * Hiển thị trạng thái autosave cho user
 */

import React from 'react';

interface AutosaveIndicatorProps {
  isAutoSaving: boolean;
  lastSaved: Date | null;
  hasUnsavedChanges: boolean;
  className?: string;
}

export const AutosaveIndicator: React.FC<AutosaveIndicatorProps> = ({
  isAutoSaving,
  lastSaved,
  hasUnsavedChanges,
  className = ''
}) => {
  const getStatusText = () => {
    if (isAutoSaving) return 'Đang lưu...';
    if (hasUnsavedChanges) return 'Có thay đổi chưa lưu';
    if (lastSaved) return `Đã lưu ${formatTimeAgo(lastSaved)}`;
    return 'Chưa lưu';
  };

  const getStatusColor = () => {
    if (isAutoSaving) return 'text-blue-600 dark:text-blue-400';
    if (hasUnsavedChanges) return 'text-amber-600 dark:text-amber-400';
    if (lastSaved) return 'text-green-600 dark:text-green-400';
    return 'text-gray-500 dark:text-gray-400';
  };

  const getStatusIcon = () => {
    if (isAutoSaving) {
      return (
        <div className="w-3 h-3 animate-spin text-blue-600 dark:text-blue-400">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" className="opacity-25"/>
            <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" className="opacity-75"/>
          </svg>
        </div>
      );
    }
    
    if (hasUnsavedChanges) {
      return (
        <div className="w-3 h-3">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
      );
    }
    
    if (lastSaved) {
      return (
        <div className="w-3 h-3">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M5 13l4 4L19 7" />
          </svg>
        </div>
      );
    }
    
    return (
      <div className="w-3 h-3">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
    );
  };

  return (
    <div className={`flex items-center gap-2 text-xs ${getStatusColor()} ${className}`}>
      {getStatusIcon()}
      <span className="font-medium">{getStatusText()}</span>
    </div>
  );
};

// Helper function để format time ago
function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'vừa xong';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} phút trước`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} giờ trước`;
  
  return date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export default AutosaveIndicator;
