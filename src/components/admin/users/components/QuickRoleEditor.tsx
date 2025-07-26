import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface QuickRoleEditorProps {
  userId: string;
  currentRole: 'admin' | 'editor' | 'author' | 'reviewer' | 'user' | 'mod';
  onRoleUpdate: (userId: string, newRole: 'admin' | 'editor' | 'author' | 'reviewer') => Promise<void>;
  isLoading?: boolean;
  disabled?: boolean;
}

const ROLES = [
  { 
    value: 'admin', 
    label: 'Admin', 
    description: 'Toàn quyền quản lý hệ thống',
    color: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800',
    icon: '👑'
  },
  { 
    value: 'editor', 
    label: 'Editor', 
    description: 'Quản lý nội dung, bài viết, danh mục',
    color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800',
    icon: '✏️'
  },
  { 
    value: 'author', 
    label: 'Author', 
    description: 'Tạo và chỉnh sửa bài viết của mình',
    color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800',
    icon: '📝'
  },
  { 
    value: 'reviewer', 
    label: 'Reviewer', 
    description: 'Xem xét và phê duyệt nội dung',
    color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800',
    icon: '🔍'
  }
] as const;

export default function QuickRoleEditor({ 
  userId, 
  currentRole, 
  onRoleUpdate, 
  isLoading = false,
  disabled = false 
}: QuickRoleEditorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const badgeRef = useRef<HTMLButtonElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  // Handle legacy roles mapping
  const mapLegacyRole = (role: string) => {
    switch (role) {
      case 'user': return 'author'; // Map user to author
      case 'mod': return 'editor';  // Map mod to editor
      default: return role;
    }
  };

  const mappedRole = mapLegacyRole(currentRole);
  const currentRoleData = ROLES.find(role => role.value === mappedRole) || ROLES[3]; // fallback to reviewer

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popupRef.current && 
        !popupRef.current.contains(event.target as Node) &&
        badgeRef.current &&
        !badgeRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isOpen]);

  // Calculate popup position with viewport boundary checking
  const getPopupPosition = () => {
    if (!badgeRef.current) return { top: 0, left: 0 };

    const badgeRect = badgeRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const popupWidth = 280; // Estimated popup width
    const popupHeight = 200; // Estimated popup height

    let top = badgeRect.bottom + 8; // 8px gap below badge
    let left = badgeRect.left;

    // Check if popup would go off the right edge
    if (left + popupWidth > viewportWidth - 16) {
      left = viewportWidth - popupWidth - 16;
    }

    // Check if popup would go off the left edge
    if (left < 16) {
      left = 16;
    }

    // Check if popup would go off the bottom edge
    if (top + popupHeight > viewportHeight - 16) {
      top = badgeRect.top - popupHeight - 8; // Show above badge instead
    }

    return { top, left };
  };

  const handleBadgeClick = () => {
    if (disabled || isLoading || isUpdating) return;
    setIsOpen(!isOpen);
  };

  // Auto-close popup when loading starts
  useEffect(() => {
    if (isLoading || isUpdating) {
      setIsOpen(false);
    }
  }, [isLoading, isUpdating]);

  const handleRoleSelect = async (newRole: 'admin' | 'editor' | 'author' | 'reviewer') => {
    if (newRole === mappedRole || isUpdating) return;

    // Close popup immediately when user selects a role
    setIsOpen(false);

    setIsUpdating(true);
    try {
      await onRoleUpdate(userId, newRole);
    } catch (error) {
      console.error('Error updating role:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const popupPosition = isOpen ? getPopupPosition() : { top: 0, left: 0 };

  return (
    <>
      {/* Role Badge */}
      <button
        ref={badgeRef}
        onClick={handleBadgeClick}
        disabled={disabled || isLoading || isUpdating}
        className={`
          inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border
          ${currentRoleData.color}
          ${disabled || isLoading || isUpdating 
            ? 'opacity-50 cursor-not-allowed' 
            : 'cursor-pointer hover:opacity-80 transition-opacity duration-200'
          }
          ${isOpen ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}
        `}
        title={
          disabled
            ? 'Không có quyền chỉnh sửa'
            : (isLoading || isUpdating)
              ? 'Đang cập nhật vai trò...'
              : 'Click để thay đổi vai trò'
        }
      >
        {(isLoading || isUpdating) ? (
          <>
            <div className="animate-spin rounded-full h-3 w-3 border border-current border-t-transparent mr-1.5"></div>
            <span>Đang cập nhật...</span>
          </>
        ) : (
          <>
            <span className="mr-1">{currentRoleData.icon}</span>
            <span>{currentRoleData.label}</span>
          </>
        )}
      </button>

      {/* Popup Portal - only show when not loading */}
      <AnimatePresence>
        {isOpen && !isLoading && !isUpdating && (
          <div className="fixed inset-0 z-50 pointer-events-none">
            <motion.div
              ref={popupRef}
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="absolute pointer-events-auto"
              style={{
                top: popupPosition.top,
                left: popupPosition.left,
                zIndex: 1000
              }}
            >
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 min-w-[280px]">
                <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    Chọn vai trò mới
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Vai trò hiện tại: {currentRoleData.label}
                    {currentRole !== mappedRole && (
                      <span className="text-orange-600 dark:text-orange-400"> (được chuyển đổi từ {currentRole})</span>
                    )}
                  </p>
                </div>
                
                <div className="py-1">
                  {ROLES.map((role) => (
                    <button
                      key={role.value}
                      onClick={() => handleRoleSelect(role.value)}
                      disabled={isUpdating}
                      className={`
                        w-full flex items-center px-3 py-2 text-sm text-left
                        ${role.value === mappedRole
                          ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }
                        ${isUpdating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                        transition-colors duration-150
                      `}
                    >
                      <span className="mr-2 text-base">{role.icon}</span>
                      <div className="flex-1">
                        <div className="flex items-center">
                          <span className="font-medium">{role.label}</span>
                          {role.value === mappedRole && (
                            <span className="ml-2 text-xs text-blue-600 dark:text-blue-400">✓</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {role.description}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
