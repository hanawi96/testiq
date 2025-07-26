/**
 * USERS BULK ACTIONS HOOK
 * Hook quản lý các bulk actions cho Users module
 */

import { UsersService } from '../../../../../backend';
import type { UsersListResponse } from '../../../../../backend';

interface UseUsersBulkActionsProps {
  selectedUsers: string[];
  setSelectedUsers: (users: string[]) => void;
  setShowBulkActions: (show: boolean) => void;
  usersData: UsersListResponse | null;
  setUsersData: (data: UsersListResponse | null) => void;
  actionLoading: string;
  setActionLoading: (loading: string) => void;
  currentPage: number;
  showSuccess: (message: string) => void;
  showError: (title: string, message?: string) => void;
  fetchUsers: (page?: number, pageLimit?: number) => Promise<void>;
  fetchStats: () => Promise<void>;
  cache: React.MutableRefObject<Map<string, UsersListResponse>>;
  cacheWithTTL: React.MutableRefObject<Map<string, {
    data: UsersListResponse;
    timestamp: number;
    ttl: number;
  }>>;
}

export const useUsersBulkActions = ({
  selectedUsers,
  setSelectedUsers,
  setShowBulkActions,
  usersData,
  setUsersData,
  actionLoading,
  setActionLoading,
  currentPage,
  showSuccess,
  showError,
  fetchUsers,
  fetchStats,
  cache,
  cacheWithTTL
}: UseUsersBulkActionsProps) => {

  // Handle bulk role update
  const handleBulkRoleUpdate = async (newRole: 'admin' | 'editor' | 'author' | 'reviewer' | 'mod' | 'user') => {
    if (selectedUsers.length === 0) return;

    if (!confirm(`Bạn có chắc chắn muốn cập nhật role thành "${newRole}" cho ${selectedUsers.length} người dùng đã chọn?`)) return;

    // Optimistic UI update - cập nhật UI ngay lập tức
    const originalData = usersData;
    if (usersData) {
      const updatedUsers = usersData.users.map(user =>
        selectedUsers.includes(user.id)
          ? { ...user, role: newRole, updated_at: new Date().toISOString() }
          : user
      );
      setUsersData({ ...usersData, users: updatedUsers });
    }

    setActionLoading('bulk-role');
    try {
      const { success, error } = await UsersService.bulkUpdateUserRole(selectedUsers, newRole);
      if (success) {
        // Clear cache để đảm bảo data fresh cho lần fetch tiếp theo
        cache.current.clear();
        cacheWithTTL.current.clear();

        // Refresh stats (không cần fetch lại users vì đã optimistic update)
        await fetchStats();

        setSelectedUsers([]);
        setShowBulkActions(false);
        showSuccess(`Đã cập nhật role cho ${selectedUsers.length} người dùng thành công`);
      } else {
        // Revert optimistic update nếu API call thất bại
        if (originalData) {
          setUsersData(originalData);
        }
        showError(error?.message || 'Không thể cập nhật role cho người dùng');
      }
    } catch (err: any) {
      // Revert optimistic update nếu có lỗi
      if (originalData) {
        setUsersData(originalData);
      }
      showError(err?.message || 'Có lỗi xảy ra khi cập nhật role');
    } finally {
      setActionLoading('');
    }
  };

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (selectedUsers.length === 0) return;

    const confirmMessage = `⚠️ CẢNH BÁO: Bạn có chắc chắn muốn XÓA VĨNH VIỄN ${selectedUsers.length} người dùng đã chọn?\n\nHành động này KHÔNG THỂ HOÀN TÁC!`;

    if (!confirm(confirmMessage)) return;

    // Double confirmation for safety
    if (!confirm(`Xác nhận lần cuối: XÓA ${selectedUsers.length} người dùng?`)) return;

    // Optimistic UI update - xóa users khỏi UI ngay lập tức
    const originalData = usersData;
    if (usersData) {
      const remainingUsers = usersData.users.filter(user => !selectedUsers.includes(user.id));
      setUsersData({
        ...usersData,
        users: remainingUsers,
        total: usersData.total - selectedUsers.length
      });
    }

    setActionLoading('bulk-delete');
    try {
      const { success, error } = await UsersService.bulkDeleteUsers(selectedUsers);

      if (success) {
        // Clear cache để đảm bảo data fresh
        cache.current.clear();
        cacheWithTTL.current.clear();

        // Refresh stats
        await fetchStats();

        setSelectedUsers([]);
        setShowBulkActions(false);
        showSuccess(`Đã xóa ${selectedUsers.length} người dùng thành công`);
      } else {
        // Revert optimistic update nếu API call thất bại
        if (originalData) {
          setUsersData(originalData);
        }
        showError(error?.message || 'Không thể xóa người dùng');
      }
    } catch (err: any) {
      // Revert optimistic update nếu có lỗi
      if (originalData) {
        setUsersData(originalData);
      }
      showError(err?.message || 'Có lỗi xảy ra khi xóa người dùng');
    } finally {
      setActionLoading('');
    }
  };

  // Handle bulk verification toggle
  const handleBulkVerificationToggle = async (verified: boolean) => {
    if (selectedUsers.length === 0) return;

    const action = verified ? 'xác thực' : 'hủy xác thực';
    if (!confirm(`Bạn có chắc chắn muốn ${action} ${selectedUsers.length} người dùng đã chọn?`)) return;

    setActionLoading('bulk-verification');
    try {
      const { success, error } = await UsersService.bulkUpdateUserVerification(selectedUsers, verified);
      if (success) {
        // Clear cache và refresh data
        cache.current.clear();
        await Promise.all([fetchUsers(currentPage), fetchStats()]);
        setSelectedUsers([]);
        setShowBulkActions(false);
        showSuccess(`Đã ${action} ${selectedUsers.length} người dùng thành công`);
      } else {
        showError(error?.message || `Không thể ${action} người dùng`);
      }
    } catch (err: any) {
      showError(err?.message || `Có lỗi xảy ra khi ${action}`);
    } finally {
      setActionLoading('');
    }
  };

  return {
    handleBulkRoleUpdate,
    handleBulkDelete,
    handleBulkVerificationToggle
  };
};
