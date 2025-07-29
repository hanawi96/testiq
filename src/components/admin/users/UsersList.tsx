import { useCallback } from 'react';
import { motion } from 'framer-motion';
import type { UserWithProfile } from '../../../../backend';
import { CreateUserModal, EditUserModal } from './components/modals';
import { ToastContainer } from '../common/Toast';
import {
  UsersChart, UsersStats, UsersBulkActions,
  UsersPagination, UsersFilters, UsersTable
} from './components';
import { useUsers } from './hooks';

export const UsersList = () => {
  // Sử dụng hook tổng hợp - gọn gàng và hiệu suất cao
  const {
    // State
    usersData, isLoading, error, stats, actionLoading,
    currentPage, displayCurrentPage, limit, filters, searchInput,
    isMobile, showCreateModal, showEditModal, selectedUser,
    selectedUsers, showBulkActions,

    // Toast & Utils
    toasts, removeToast, showSuccess, fetchUsers, fetchStats,

    // Actions
    handlePageChange, handleLimitChange, handleFilterChange,
    handleRoleUpdate, handleVerificationToggle, handleDeleteUser,
    handleUserSelect, handleSelectAll, handleClearSelection,
    handleEditUser, handleEditUserClose, handleEditHover,
    handleBulkRoleUpdate, handleBulkVerificationToggle, handleBulkDelete,

    // Setters & Utils
    setShowCreateModal, setSearchInput, setUsersData, setCurrentPage, updateURL
  } = useUsers();

  // === MODAL SUCCESS HANDLERS - GỘP THÔNG MINH ===
  const handleEditUserSuccess = useCallback(() => {
    fetchUsers(displayCurrentPage);
    fetchStats();
    showSuccess('Cập nhật thông tin người dùng thành công!');
  }, [fetchUsers, displayCurrentPage, fetchStats, showSuccess]);

  const handleOptimisticUserUpdate = useCallback((updatedUser: Partial<UserWithProfile>) => {
    if (usersData && selectedUser) {
      const updatedUsers = usersData.users.map(user =>
        user.id === selectedUser.id ? { ...user, ...updatedUser } : user
      );
      setUsersData({ ...usersData, users: updatedUsers });
    }
  }, [usersData, selectedUser, setUsersData]);

  const handleCreateUserSuccess = useCallback(() => {
    fetchUsers(1);
    fetchStats();
    setCurrentPage(1);
    updateURL(1, filters);
  }, [fetchUsers, fetchStats, setCurrentPage, updateURL, filters]);

  return (
    <div className="space-y-6">
      <UsersStats stats={stats} />
      <UsersChart className="w-full" />
      <UsersFilters {...{ filters, searchInput, onFilterChange: handleFilterChange, onSearchInputChange: setSearchInput }} />

      {showBulkActions && (
        <UsersBulkActions {...{
          selectedUsers, actionLoading,
          onClearSelection: handleClearSelection,
          onBulkRoleUpdate: handleBulkRoleUpdate,
          onBulkVerificationToggle: handleBulkVerificationToggle,
          onBulkDelete: handleBulkDelete
        }} />
      )}

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex"
        >
          <svg className="h-5 w-5 text-red-400 dark:text-red-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </motion.div>
      )}

      <UsersTable {...{
        usersData, isLoading, selectedUsers, actionLoading,
        onUserSelect: handleUserSelect, onSelectAll: handleSelectAll,
        onRoleUpdate: handleRoleUpdate, onVerificationToggle: handleVerificationToggle,
        onEditUser: handleEditUser, onEditHover: handleEditHover, onDeleteUser: handleDeleteUser
      }} />

      <UsersPagination {...{
        usersData, currentPage, displayCurrentPage, limit, isMobile,
        onPageChange: handlePageChange, onLimitChange: handleLimitChange
      }} />

      <CreateUserModal {...{
        isOpen: showCreateModal,
        onClose: () => setShowCreateModal(false),
        onSuccess: handleCreateUserSuccess
      }} />

      <EditUserModal {...{
        isOpen: showEditModal,
        onClose: handleEditUserClose,
        onSuccess: handleEditUserSuccess,
        onOptimisticUpdate: handleOptimisticUserUpdate,
        user: selectedUser
      }} />

      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
};