/**
 * USERS ACTIONS HOOK
 * Hook quản lý các actions và handlers cho Users module
 */

import { useCallback } from 'react';
import { UsersService } from '../../../../../backend';
import type { UsersFilters, UsersListResponse, UserWithProfile } from '../../../../../backend';

interface UseUsersActionsProps {
  usersData: UsersListResponse | null;
  setUsersData: (data: UsersListResponse | null) => void;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  filters: UsersFilters;
  setFilters: (filters: UsersFilters | ((prev: UsersFilters) => UsersFilters)) => void;
  limit: number;
  setLimit: (limit: number) => void;
  selectedUsers: string[];
  setSelectedUsers: (users: string[]) => void;
  setShowBulkActions: (show: boolean) => void;
  actionLoading: string;
  setActionLoading: (loading: string) => void;
  setError: (error: string) => void;
  setShowEditModal: (show: boolean) => void;
  setSelectedUser: (user: UserWithProfile | null) => void;
  showSuccess: (message: string) => void;
  showError: (title: string, message?: string) => void;
  updateURL: (page: number, filters: UsersFilters) => void;
  fetchUsers: (page?: number, pageLimit?: number) => Promise<void>;
  fetchStats: () => Promise<void>;
  getCacheKey: (page: number, currentFilters: UsersFilters, pageLimit?: number) => string;
  cache: React.MutableRefObject<Map<string, UsersListResponse>>;
  cacheWithTTL: React.MutableRefObject<Map<string, {
    data: UsersListResponse;
    timestamp: number;
    ttl: number;
  }>>;
  aggressivePrefetchDone: React.MutableRefObject<Set<string>>;
  setIsLoading: (loading: boolean) => void;
  CACHE_TTL: number;
  preloadTriggers?: any;
}

export const useUsersActions = ({
  usersData,
  setUsersData,
  currentPage,
  setCurrentPage,
  filters,
  setFilters,
  limit,
  setLimit,
  selectedUsers,
  setSelectedUsers,
  setShowBulkActions,
  actionLoading,
  setActionLoading,
  setError,
  setShowEditModal,
  setSelectedUser,
  showSuccess,
  showError,
  updateURL,
  fetchUsers,
  fetchStats,
  getCacheKey,
  cache,
  cacheWithTTL,
  aggressivePrefetchDone,
  setIsLoading,
  CACHE_TTL,
  preloadTriggers
}: UseUsersActionsProps) => {

  // Handle page change - Simple and reliable
  const handlePageChange = (newPage: number) => {
    // Validate page bounds
    if (newPage < 1 || (usersData?.totalPages && newPage > usersData.totalPages)) {
      return;
    }

    console.log(`🔄 PAGE CHANGE: → ${newPage}`);

    // Update URL and let displayCurrentPage handle the rest
    updateURL(newPage, filters);

    // Simple cache check for instant display
    const cacheKey = getCacheKey(newPage, filters, limit);
    const cached = cacheWithTTL.current.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      setUsersData(cached.data);
      setError('');
    } else {
      setIsLoading(true);
      fetchUsers(newPage);
    }
  };

  // Handle limit change - Reset to page 1
  const handleLimitChange = (newLimit: number) => {
    console.log(`🔄 LIMIT CHANGE: ${limit} → ${newLimit}`);
    setLimit(newLimit);
    setCurrentPage(1);
    // Clear cache since page size changed
    cache.current.clear();
    cacheWithTTL.current.clear();
    aggressivePrefetchDone.current.clear();
    fetchUsers(1, newLimit);
  };

  // Handle filter change - OPTIMIZED + URL SYNC
  const handleFilterChange = useCallback((newFilters: Partial<UsersFilters>) => {
    const updatedFilters = { ...filters, ...newFilters };

    console.log('🔄 FILTER CHANGE: Updating filters and resetting to page 1');

    // 🚀 Update URL with new filters and reset to page 1
    updateURL(1, updatedFilters);

    setFilters(updatedFilters);
    setCurrentPage(1);
  }, [filters, updateURL, setFilters, setCurrentPage]);

  // Handle role update with validation - only show error toast, no success toast
  const handleRoleUpdate = async (userId: string, newRole: 'admin' | 'editor' | 'author' | 'reviewer' | 'mod' | 'user') => {
    // Find user and validate
    const user = usersData?.users.find(u => u.id === userId);
    if (!user) {
      showError('Lỗi', 'Không tìm thấy người dùng');
      return;
    }

    // Optimistic update - update UI ngay lập tức
    if (usersData) {
      const updatedUsers = usersData.users.map(user =>
        user.id === userId ? { ...user, role: newRole } : user
      );
      setUsersData({ ...usersData, users: updatedUsers });
    }

    try {
      const { success, error: updateError } = await UsersService.updateUserRole(userId, newRole);

      if (success) {
        // Clear cache và fetch stats
        cache.current.clear();
        await fetchStats();
        // No success toast - loading state on badge is sufficient feedback
      } else {
        // Revert về role cũ nếu fail
        await fetchUsers(currentPage);
        showError(
          'Không thể cập nhật vai trò',
          updateError?.message || 'Vui lòng thử lại sau'
        );
      }
    } catch (err) {
      // Revert về role cũ nếu fail
      await fetchUsers(currentPage);
      showError(
        'Có lỗi xảy ra',
        'Không thể cập nhật vai trò. Vui lòng thử lại sau'
      );
    }
  };

  // Handle verification toggle with validation
  const handleVerificationToggle = async (userId: string) => {
    // Find user and validate
    const user = usersData?.users.find(u => u.id === userId);
    if (!user) {
      showError('Lỗi', 'Không tìm thấy người dùng');
      return;
    }

    setActionLoading(`verify-${userId}`);

    // Optimistic update - update UI ngay lập tức
    if (usersData) {
      const updatedUsers = usersData.users.map(user =>
        user.id === userId ? { ...user, is_verified: !user.is_verified } : user
      );
      setUsersData({ ...usersData, users: updatedUsers });
    }
    
    try {
      const { success, error: updateError } = await UsersService.toggleUserVerification(userId);
      
      if (success) {
        // Clear cache và fetch stats
        cache.current.clear();
        await fetchStats();
      } else {
        // Revert về status cũ nếu fail
        await fetchUsers(currentPage);
        setError('Không thể cập nhật verification');
      }
    } catch (err) {
      // Revert về status cũ nếu fail
      await fetchUsers(currentPage);
      setError('Có lỗi xảy ra khi cập nhật verification');
    } finally {
      setActionLoading('');
    }
  };

  // Handle edit user with validation
  const handleEditUser = (userId: string) => {
    const user = usersData?.users.find(u => u.id === userId);
    if (!user) {
      setError('Không tìm thấy người dùng');
      return;
    }

    setSelectedUser(user);
    setShowEditModal(true);
  };

  // Handle edit button hover - preload country data
  const handleEditHover = useCallback(() => {
    if (preloadTriggers?.onUserInteraction) {
      preloadTriggers.onUserInteraction();
    }
  }, [preloadTriggers]);

  // Handle edit user modal close
  const handleEditUserClose = () => {
    setShowEditModal(false);
    setSelectedUser(null);
  };

  // Handle user selection
  const handleUserSelect = (userId: string, checked: boolean) => {
    setSelectedUsers(prev => {
      const newSelection = checked
        ? [...prev, userId]
        : prev.filter(id => id !== userId);
      setShowBulkActions(newSelection.length > 0);
      return newSelection;
    });
  };

  // Handle select all users
  const handleSelectAll = (checked: boolean) => {
    if (checked && usersData) {
      // Select all users for bulk actions
      setSelectedUsers(usersData.users.map(user => user.id));
      setShowBulkActions(usersData.users.length > 0);
    } else {
      setSelectedUsers([]);
      setShowBulkActions(false);
    }
  };

  // Handle clear selection
  const handleClearSelection = () => {
    setSelectedUsers([]);
    setShowBulkActions(false);
  };

  return {
    handlePageChange,
    handleLimitChange,
    handleFilterChange,
    handleRoleUpdate,
    handleVerificationToggle,
    handleEditUser,
    handleEditHover,
    handleEditUserClose,
    handleUserSelect,
    handleSelectAll,
    handleClearSelection
  };
};
