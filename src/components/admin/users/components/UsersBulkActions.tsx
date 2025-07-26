/**
 * USERS BULK ACTIONS COMPONENT
 * Component hiển thị thanh công cụ bulk actions - khớp chính xác với design trong UsersList
 */

import React from 'react';

interface UsersBulkActionsProps {
  selectedUsers: string[];
  actionLoading: string;
  onClearSelection: () => void;
  onBulkRoleUpdate: (role: 'admin' | 'editor' | 'author' | 'reviewer' | 'mod' | 'user') => void;
  onBulkVerificationToggle: (verified: boolean) => void;
  onBulkDelete: () => void;
}

export const UsersBulkActions: React.FC<UsersBulkActionsProps> = ({
  selectedUsers,
  actionLoading,
  onClearSelection,
  onBulkRoleUpdate,
  onBulkVerificationToggle,
  onBulkDelete
}) => {
  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
            Đã chọn {selectedUsers.length} người dùng
          </span>
          <button
            onClick={onClearSelection}
            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
          >
            Bỏ chọn tất cả
          </button>
        </div>
        <div className="flex items-center space-x-2">
          {/* Role Update Dropdown */}
          <div className="relative">
            <select
              onChange={(e) => {
                if (e.target.value) {
                  onBulkRoleUpdate(e.target.value as 'admin' | 'editor' | 'author' | 'reviewer' | 'mod' | 'user');
                  e.target.value = '';
                }
              }}
              disabled={actionLoading === 'bulk-role'}
              className="px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">Cập nhật role</option>
              <option value="admin">Admin</option>
              <option value="editor">Editor</option>
              <option value="author">Author</option>
              <option value="reviewer">Reviewer</option>
              <option value="mod">Moderator</option>
              <option value="user">User</option>
            </select>
          </div>

          {/* Verification Actions */}
          <button
            onClick={() => onBulkVerificationToggle(true)}
            disabled={actionLoading === 'bulk-verification'}
            className="px-3 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg text-sm font-medium transition-colors disabled:cursor-not-allowed"
          >
            {actionLoading === 'bulk-verification' ? 'Đang xử lý...' : 'Xác thực'}
          </button>
          <button
            onClick={() => onBulkVerificationToggle(false)}
            disabled={actionLoading === 'bulk-verification'}
            className="px-3 py-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-yellow-400 text-white rounded-lg text-sm font-medium transition-colors disabled:cursor-not-allowed"
          >
            {actionLoading === 'bulk-verification' ? 'Đang xử lý...' : 'Hủy xác thực'}
          </button>

          {/* Delete Action */}
          <button
            onClick={onBulkDelete}
            disabled={actionLoading === 'bulk-delete'}
            className="px-3 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg text-sm font-medium transition-colors disabled:cursor-not-allowed flex items-center space-x-1"
          >
            {actionLoading === 'bulk-delete' ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Đang xóa...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <span>Xóa</span>
              </>
            )}
          </button>

          {/* Close button */}
          <button
            onClick={onClearSelection}
            className="flex items-center justify-center w-8 h-8 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors ml-2"
            title="Đóng thanh công cụ"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};
