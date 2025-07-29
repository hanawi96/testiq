/**
 * USERS HOOK - TỐI ƯU HÓA HOÀN CHỈNH
 * Hook tổng hợp tất cả logic Users - gọn gàng, hiệu suất cao, dễ maintain
 */

import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { loadUsersService } from '../../../../../backend';
import type { UserWithProfile, UsersListResponse, UsersFilters } from '../../../../../backend';
import { useToast } from '../../common/Toast';

export const useUsers = () => {
  // === STATE - GỘP NHÓM THÔNG MINH ===
  const [usersData, setUsersData] = useState<UsersListResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [stats, setStats] = useState<any>(null);
  const [actionLoading, setActionLoading] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [filters, setFilters] = useState<UsersFilters>({
    role: undefined, search: '', user_status: undefined, gender: undefined, sort: undefined
  });
  const [searchInput, setSearchInput] = useState('');

  const [isMobile, setIsMobile] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithProfile | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);

  // === REFS ===
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const usersDataRef = useRef<UsersListResponse | null>(null);
  const initialLoadDone = useRef(false);

  // === TOAST ===
  const { toasts, removeToast, showSuccess, showError } = useToast();

  // === HELPER - API CALL WITH OPTIMISTIC UPDATE ===
  const apiCall = useCallback(async (
    apiAction: () => Promise<{ success: boolean; error?: any }>,
    optimisticUpdate: () => void,
    revertUpdate: () => void,
    successMessage: string,
    errorMessage: string
  ) => {
    optimisticUpdate();
    try {
      const { success, error } = await apiAction();
      if (success) {
        showSuccess(successMessage);
      } else {
        revertUpdate();
        showError(errorMessage, (error as any)?.message || 'Vui lòng thử lại sau');
      }
    } catch (err: any) {
      revertUpdate();
      showError('Có lỗi xảy ra', err?.message || errorMessage);
    }
  }, [showSuccess, showError]);

  // === COMPUTED VALUES ===
  const displayCurrentPage = useMemo(() => {
    if (typeof window === 'undefined') return currentPage;
    const params = new URLSearchParams(window.location.search);
    const urlPage = Math.max(1, parseInt(params.get('page') || '1'));

    if (usersData?.totalPages && urlPage > usersData.totalPages) {
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.set('page', usersData.totalPages.toString());
      window.history.replaceState({}, '', newUrl.toString());
      return usersData.totalPages;
    }
    return urlPage;
  }, [currentPage, usersData?.totalPages, typeof window !== 'undefined' ? window.location.search : '']);

  // === URL SYNC ===
  const updateURL = useCallback((page: number, newFilters: UsersFilters) => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams();
    if (page > 1) params.set('page', page.toString());
    if (newFilters.role) params.set('role', newFilters.role);
    if (newFilters.search) params.set('search', newFilters.search);
    if (newFilters.user_status) params.set('user_status', newFilters.user_status);
    if (newFilters.gender) params.set('gender', newFilters.gender);
    if (newFilters.sort) params.set('sort', newFilters.sort);
    const newUrl = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
    window.history.pushState({}, '', newUrl);
  }, []);

  // === DATA FETCHING ===
  const fetchUsers = useCallback(async (page: number = displayCurrentPage, pageLimit: number = limit, customFilters?: UsersFilters) => {
    const currentFilters = customFilters || filters;
    setIsLoading(true);
    setError('');

    try {
      const UsersService = await loadUsersService();
      const { data, error: fetchError } = await UsersService.getUsers(page, pageLimit, currentFilters);

      if (fetchError || !data) {
        setError('Không thể tải danh sách users');
        return;
      }

      if (data.users.length === 0 && data.totalPages > 0 && page > data.totalPages) {
        const lastValidPage = Math.max(1, data.totalPages);
        setCurrentPage(lastValidPage);
        updateURL(lastValidPage, currentFilters);
        fetchUsers(lastValidPage, pageLimit);
        return;
      }

      setUsersData(data);
      usersDataRef.current = data;
    } catch (err) {
      setError('Có lỗi xảy ra khi tải dữ liệu');
    } finally {
      setIsLoading(false);
    }
  }, [filters, limit, displayCurrentPage, setUsersData, setIsLoading, setError, setCurrentPage, updateURL, usersDataRef]);

  const fetchStats = useCallback(async () => {
    try {
      const UsersService = await loadUsersService();
      const { data: statsData, error: statsError } = await UsersService.getUserStats();
      if (!statsError && statsData) setStats(statsData);
    } catch (err) {
      console.warn('Failed to fetch stats:', err);
    }
  }, [setStats]);

  // === ACTIONS ===
  const handlePageChange = useCallback((newPage: number) => {
    if (usersData && newPage > usersData.totalPages) return;
    if (newPage < 1) return;
    setCurrentPage(newPage);
    updateURL(newPage, filters);
    fetchUsers(newPage, limit);
  }, [usersData, setCurrentPage, updateURL, fetchUsers, filters, limit]);

  const handleLimitChange = useCallback((newLimit: number) => {
    setLimit(newLimit);
    setCurrentPage(1);
    updateURL(1, filters);
    fetchUsers(1, newLimit);
  }, [setLimit, setCurrentPage, updateURL, fetchUsers, filters]);

  const handleFilterChange = useCallback((newFilters: UsersFilters) => {
    const mergedFilters = { ...filters, ...newFilters };
    setFilters(mergedFilters);
    setCurrentPage(1);
    updateURL(1, mergedFilters);
    fetchUsers(1, limit, mergedFilters);
  }, [filters, setFilters, setCurrentPage, updateURL, fetchUsers, limit]);

  // === USER UPDATE ACTIONS - GỘP THÔNG MINH ===
  const updateUser = useCallback(async (
    userId: string,
    updateType: 'role' | 'verification',
    newValue?: any
  ) => {
    const user = usersData?.users.find(u => u.id === userId);
    if (!user) return showError('Lỗi', 'Không tìm thấy người dùng');

    setActionLoading(`${updateType}-${userId}`);

    try {
      const UsersService = await loadUsersService();
      let result, updatedUsers, successMsg;

      if (updateType === 'role') {
        result = await UsersService.updateUserRole(userId, newValue);
        updatedUsers = usersData?.users.map(u => u.id === userId ? { ...u, role: newValue as any } : u);
        successMsg = 'Đã cập nhật role thành công';
      } else {
        result = await UsersService.toggleUserVerification(userId);
        updatedUsers = usersData?.users.map(u => u.id === userId ? { ...u, is_verified: !u.is_verified } : u);
        successMsg = 'Đã cập nhật trạng thái xác minh';
      }

      if (result.success) {
        if (usersData && updatedUsers) setUsersData({ ...usersData, users: updatedUsers });
        showSuccess(successMsg);
      } else {
        showError(`Không thể cập nhật ${updateType}`, (result.error as any)?.message || 'Vui lòng thử lại sau');
      }
    } catch (err: any) {
      showError('Có lỗi xảy ra', err?.message || `Không thể cập nhật ${updateType}`);
    } finally {
      setActionLoading('');
    }
  }, [usersData, setUsersData, setActionLoading, showSuccess, showError]);

  const handleRoleUpdate = useCallback((userId: string, newRole: any) =>
    updateUser(userId, 'role', newRole), [updateUser]);

  const handleVerificationToggle = useCallback((userId: string) =>
    updateUser(userId, 'verification'), [updateUser]);

  // === SELECTION & MODAL HANDLERS - GỘP THÔNG MINH ===
  const handleUserSelect = useCallback((userId: string, checked: boolean) => {
    setSelectedUsers(prev => checked ? [...prev, userId] : prev.filter(id => id !== userId));
  }, []);

  const handleSelectAll = useCallback((checked: boolean) => {
    const newSelection = checked && usersData ? usersData.users.map(u => u.id) : [];
    setSelectedUsers(newSelection);
    setShowBulkActions(checked && newSelection.length > 0);
  }, [usersData]);

  const handleClearSelection = useCallback(() => {
    setSelectedUsers([]);
    setShowBulkActions(false);
  }, []);

  const handleEditUser = useCallback((userId: string) => {
    const user = usersData?.users.find(u => u.id === userId);
    if (user) {
      setSelectedUser(user);
      setShowEditModal(true);
    }
  }, [usersData]);

  const handleEditUserClose = useCallback(() => {
    setShowEditModal(false);
    setSelectedUser(null);
  }, []);

  const handleEditHover = useCallback(() => {}, []);

  // === BULK ACTIONS ===
  const handleBulkRoleUpdate = useCallback(async (newRole: any) => {
    if (selectedUsers.length === 0) return;
    if (!confirm(`Bạn có chắc chắn muốn cập nhật role thành "${newRole}" cho ${selectedUsers.length} người dùng đã chọn?`)) return;

    const originalData = usersData;
    if (usersData) {
      const updatedUsers = usersData.users.map(user =>
        selectedUsers.includes(user.id) ? { ...user, role: newRole as any, updated_at: new Date().toISOString() } : user
      );
      setUsersData({ ...usersData, users: updatedUsers });
    }

    setActionLoading('bulk-role');
    try {
      const UsersService = await loadUsersService();
      const { success, error } = await UsersService.bulkUpdateUserRole(selectedUsers, newRole);
      if (success) {
        await fetchStats();
        setSelectedUsers([]);
        setShowBulkActions(false);
        showSuccess(`Đã cập nhật role cho ${selectedUsers.length} người dùng thành công`);
      } else {
        if (originalData) setUsersData(originalData);
        showError((error as any)?.message || 'Không thể cập nhật role cho người dùng');
      }
    } catch (err: any) {
      if (originalData) setUsersData(originalData);
      showError(err?.message || 'Có lỗi xảy ra khi cập nhật role');
    } finally {
      setActionLoading('');
    }
  }, [selectedUsers, usersData, setUsersData, setActionLoading, setSelectedUsers, setShowBulkActions, showSuccess, showError, fetchStats]);

  const handleBulkVerificationToggle = useCallback(async (verified: boolean) => {
    if (selectedUsers.length === 0) return;
    const action = verified ? 'xác thực' : 'hủy xác thực';
    if (!confirm(`Bạn có chắc chắn muốn ${action} ${selectedUsers.length} người dùng đã chọn?`)) return;

    setActionLoading('bulk-verification');
    try {
      const UsersService = await loadUsersService();
      const { success, error } = await UsersService.bulkUpdateUserVerification(selectedUsers, verified);
      if (success) {
        await Promise.all([fetchUsers(currentPage), fetchStats()]);
        setSelectedUsers([]);
        setShowBulkActions(false);
        showSuccess(`Đã ${action} ${selectedUsers.length} người dùng thành công`);
      } else {
        showError((error as any)?.message || `Không thể ${action} người dùng`);
      }
    } catch (err: any) {
      showError(err?.message || `Có lỗi xảy ra khi ${action}`);
    } finally {
      setActionLoading('');
    }
  }, [selectedUsers, currentPage, fetchUsers, fetchStats, setSelectedUsers, setShowBulkActions, setActionLoading, showSuccess, showError]);

  const handleBulkDelete = useCallback(async () => {
    if (selectedUsers.length === 0) return;
    if (!confirm(`⚠️ CẢNH BÁO: Bạn có chắc chắn muốn XÓA VĨNH VIỄN ${selectedUsers.length} người dùng đã chọn?\n\nHành động này KHÔNG THỂ HOÀN TÁC!`)) return;
    if (!confirm(`Xác nhận lần cuối: XÓA ${selectedUsers.length} người dùng?`)) return;

    const originalData = usersData;
    if (usersData) {
      const remainingUsers = usersData.users.filter(user => !selectedUsers.includes(user.id));
      setUsersData({ ...usersData, users: remainingUsers, total: usersData.total - selectedUsers.length });
    }

    setActionLoading('bulk-delete');
    try {
      const UsersService = await loadUsersService();
      const { success, error } = await UsersService.bulkDeleteUsers(selectedUsers);
      if (success) {
        await fetchStats();
        setSelectedUsers([]);
        setShowBulkActions(false);
        showSuccess(`Đã xóa ${selectedUsers.length} người dùng thành công`);
      } else {
        if (originalData) setUsersData(originalData);
        showError((error as any)?.message || 'Không thể xóa người dùng');
      }
    } catch (err: any) {
      if (originalData) setUsersData(originalData);
      showError(err?.message || 'Có lỗi xảy ra khi xóa người dùng');
    } finally {
      setActionLoading('');
    }
  }, [selectedUsers, usersData, setUsersData, setActionLoading, fetchStats, setSelectedUsers, setShowBulkActions, showSuccess, showError]);

  const handleDeleteUser = useCallback(async (userId: string) => {
    const user = usersData?.users.find(u => u.id === userId);
    if (!user) {
      showError('Lỗi', 'Không tìm thấy người dùng');
      return;
    }

    const confirmMessage = `⚠️ CẢNH BÁO: Bạn có chắc chắn muốn XÓA VĨNH VIỄN người dùng "${user.username || user.full_name}"?\n\nHành động này KHÔNG THỂ HOÀN TÁC!`;
    if (!confirm(confirmMessage)) return;

    setActionLoading(`delete-${userId}`);
    const originalData = usersData;
    if (usersData) {
      const remainingUsers = usersData.users.filter(u => u.id !== userId);
      setUsersData({ ...usersData, users: remainingUsers, total: usersData.total - 1 });
    }

    try {
      const UsersService = await loadUsersService();
      const { success, error } = await UsersService.bulkDeleteUsers([userId]);
      if (success) {
        await fetchStats();
        showSuccess('Đã xóa người dùng thành công');
      } else {
        if (originalData) setUsersData(originalData);
        showError('Không thể xóa người dùng', (error as any)?.message || 'Vui lòng thử lại sau');
      }
    } catch (err: any) {
      if (originalData) setUsersData(originalData);
      showError('Có lỗi xảy ra', err?.message || 'Không thể xóa người dùng');
    } finally {
      setActionLoading('');
    }
  }, [usersData, setUsersData, setActionLoading, fetchStats, showSuccess, showError]);

  // === EFFECTS ===
  // URL sync on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const urlFilters = {
      role: params.get('role') as UsersFilters['role'] || undefined,
      search: params.get('search') || '',
      user_status: params.get('user_status') as UsersFilters['user_status'] || undefined,
      gender: params.get('gender') as UsersFilters['gender'] || undefined,
      sort: params.get('sort') as UsersFilters['sort'] || undefined
    };
    setFilters(urlFilters);
    setSearchInput(urlFilters.search);
    setIsInitialized(true);

    const handlePopState = () => window.location.reload();
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Screen size detection
  useEffect(() => {
    const checkScreenSize = () => setIsMobile(window.innerWidth < 768);
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Sync usersDataRef
  useEffect(() => {
    usersDataRef.current = usersData;
  }, [usersData]);

  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: searchInput }));
      setCurrentPage(1);
    }, 300);
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [searchInput]);

  // Initial load
  useEffect(() => {
    if (!isInitialized || initialLoadDone.current) return;
    initialLoadDone.current = true;
    Promise.all([fetchUsers(displayCurrentPage, limit), fetchStats()]);
  }, [isInitialized, displayCurrentPage, limit, fetchUsers, fetchStats]);

  // Reload when filters change
  useEffect(() => {
    if (!isInitialized || !initialLoadDone.current) return;
    fetchUsers(displayCurrentPage, limit);
  }, [filters, isInitialized, displayCurrentPage, limit, fetchUsers]);

  return {
    // State
    usersData, isLoading, error, stats, actionLoading,
    currentPage, displayCurrentPage, limit, filters, searchInput,
    isMobile, isInitialized, showCreateModal, showEditModal,
    selectedUser, selectedUsers, showBulkActions,

    // Toast
    toasts, removeToast, showSuccess, showError,

    // Actions
    handlePageChange, handleLimitChange, handleFilterChange,
    handleRoleUpdate, handleVerificationToggle, handleDeleteUser,
    handleUserSelect, handleSelectAll, handleClearSelection,
    handleEditUser, handleEditUserClose, handleEditHover,
    handleBulkRoleUpdate, handleBulkVerificationToggle, handleBulkDelete,

    // Setters (for modals, etc.)
    setShowCreateModal, setSearchInput, setUsersData, setCurrentPage, setActionLoading,

    // Utils
    fetchUsers, fetchStats, updateURL
  };
};
