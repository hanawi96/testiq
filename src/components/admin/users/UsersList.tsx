// React import removed - not needed in React 17+
import { motion, AnimatePresence } from 'framer-motion';
import { UsersService } from '../../../../backend';
import type { UserWithProfile, UsersListResponse, UsersFilters } from '../../../../backend';
import { CreateUserModal, EditUserModal } from './components/modals';
import { QuickRoleEditor, UsersChart } from './components';
import { ToastContainer } from '../common/Toast';
import { preloadTriggers } from '../../../utils/admin/preloaders/country-preloader';
import { getCountryFlag, getCountryFlagSvgByCode } from '../../../utils/country-flags';
import countryData from '../../../../Country.json';
import { formatDate, formatGender, formatTestCount, getRoleBadge, getUserTypeBadge, isAnonymousUser } from './utils/formatters';
import {
  useUsersState,
  useUsersEffects,
  useUsersData,
  useUsersActions,
  useUsersBulkActions
} from './hooks';
import { SkeletonTableRow } from './components/SkeletonComponents';
import { UsersStats } from './components/UsersStats';
import { UsersBulkActions } from './components/UsersBulkActions';
import { UsersPagination } from './components/UsersPagination';

export const UsersList = () => {
  // Initialize state hook
  const {
    usersData,
    setUsersData,
    isLoading,
    setIsLoading,
    error,
    setError,
    currentPage,
    setCurrentPage,
    displayCurrentPage,
    filters,
    setFilters,
    isInitialized,
    setIsInitialized,
    searchInput,
    setSearchInput,
    stats,
    setStats,
    actionLoading,
    setActionLoading,
    isMobile,
    setIsMobile,
    showCreateModal,
    setShowCreateModal,
    showEditModal,
    setShowEditModal,
    selectedUser,
    setSelectedUser,
    selectedUsers,
    setSelectedUsers,
    showBulkActions,
    setShowBulkActions,
    limit,
    setLimit,
    toasts,
    removeToast,
    showSuccess,
    showError,
    cache,
    cacheWithTTL,
    prefetchQueue,
    searchTimeoutRef,
    aggressivePrefetchDone,
    usersDataRef,
    CACHE_TTL
  } = useUsersState();

  // Initialize effects hook
  const { updateURL } = useUsersEffects({
    setFilters,
    setIsInitialized,
    setIsMobile,
    setCurrentPage,
    searchInput,
    setSearchInput,
    searchTimeoutRef,
    usersDataRef,
    usersData,
    filters
  });

  // Initialize data hook
  const {
    getCacheKey,
    fetchUsers,
    fetchStats
  } = useUsersData({
    filters,
    limit,
    currentPage,
    displayCurrentPage,
    isInitialized,
    setUsersData,
    setIsLoading,
    setError,
    setStats,
    setCurrentPage,
    updateURL,
    usersDataRef,
    cache,
    cacheWithTTL,
    prefetchQueue,
    aggressivePrefetchDone,
    CACHE_TTL
  });

  // Initialize actions hook
  const {
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
  } = useUsersActions({
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
  });

  // Initialize bulk actions hook
  const {
    handleBulkRoleUpdate,
    handleBulkDelete,
    handleBulkVerificationToggle
  } = useUsersBulkActions({
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
  });

  // Handle edit user success
  const handleEditUserSuccess = () => {
    // Smart cache invalidation - only clear current page cache
    const currentCacheKey = getCacheKey(currentPage, filters, limit);
    cache.current.delete(currentCacheKey);
    cacheWithTTL.current.delete(currentCacheKey);

    // Refresh current page data
    fetchUsers(currentPage);
    fetchStats();

    // Show success toast
    showSuccess('Cập nhật thông tin người dùng thành công!');
  };

  // Handle optimistic user update
  const handleOptimisticUserUpdate = (updatedUser: Partial<UserWithProfile>) => {
    if (usersData && selectedUser) {
      console.log('UsersList: Applying optimistic update for user:', selectedUser.id, updatedUser);

      // Immediately update local state for better UX
      const updatedUsers = usersData.users.map(user =>
        user.id === selectedUser.id ? { ...user, ...updatedUser } : user
      );

      setUsersData({
        ...usersData,
        users: updatedUsers
      });
    }
  };

  // Handle create user success
  const handleCreateUserSuccess = () => {
    // Clear cache and refresh data
    cache.current.clear();
    cacheWithTTL.current.clear();
    fetchUsers(1); // Reset to first page
    fetchStats();
    setCurrentPage(1);
    updateURL(1, filters); // Update URL to reflect page change
  };

  // Handle delete user
  const handleDeleteUser = async (userId: string) => {
    const user = usersData?.users.find(u => u.id === userId);
    if (!user) {
      showError('Lỗi', 'Không tìm thấy người dùng');
      return;
    }

    const confirmMessage = `⚠️ CẢNH BÁO: Bạn có chắc chắn muốn XÓA VĨNH VIỄN người dùng "${user.username || user.full_name}"?\n\nHành động này KHÔNG THỂ HOÀN TÁC!`;

    if (!confirm(confirmMessage)) return;

    setActionLoading(`delete-${userId}`);

    // Optimistic UI update
    const originalData = usersData;
    if (usersData) {
      const remainingUsers = usersData.users.filter(u => u.id !== userId);
      setUsersData({
        ...usersData,
        users: remainingUsers,
        total: usersData.total - 1
      });
    }

    try {
      const { success, error } = await UsersService.bulkDeleteUsers([userId]);

      if (success) {
        // Clear cache
        cache.current.clear();
        cacheWithTTL.current.clear();
        await fetchStats();
        showSuccess('Đã xóa người dùng thành công');
      } else {
        // Revert optimistic update
        if (originalData) {
          setUsersData(originalData);
        }
        showError('Không thể xóa người dùng', error?.message || 'Vui lòng thử lại sau');
      }
    } catch (err: any) {
      // Revert optimistic update
      if (originalData) {
        setUsersData(originalData);
      }
      showError('Có lỗi xảy ra', err?.message || 'Không thể xóa người dùng');
    } finally {
      setActionLoading('');
    }
  };







  return (
    <div className="space-y-6">


      {/* Compact Stats Bar - Modern Design */}
      <UsersStats stats={stats} />

      {/* Users Chart */}
      <UsersChart className="w-full" />

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tìm kiếm</label>
            <div className="relative">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Tên, email, địa điểm..."
                className="w-full pr-10 pl-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg outline-none focus:outline-none focus:ring-0 focus:border-gray-300 dark:focus:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                style={{ textIndent: '6px' }}
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Loại người dùng</label>
            <select
              value={filters.user_type || 'all'}
              onChange={(e) => handleFilterChange({ user_type: e.target.value === 'all' ? undefined : e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="all">Tất cả</option>
              <option value="registered">Đã đăng ký</option>
              <option value="anonymous">Ẩn danh</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Vai trò</label>
            <select
              value={filters.role || 'all'}
              onChange={(e) => handleFilterChange({ role: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="all">Tất cả</option>
              <option value="admin">Admin</option>
              <option value="editor">Editor</option>
              <option value="author">Author</option>
              <option value="reviewer">Reviewer</option>
              <option value="mod">Moderator</option>
              <option value="user">User</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Trạng thái</label>
            <select
              value={filters.verified === undefined ? 'all' : filters.verified.toString()}
              onChange={(e) => {
                const value = e.target.value;
                handleFilterChange({
                  verified: value === 'all' ? undefined : value === 'true'
                });
              }}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="all">Tất cả</option>
              <option value="true">Đã xác thực</option>
              <option value="false">Chưa xác thực</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {showBulkActions && (
        <UsersBulkActions
          selectedUsers={selectedUsers}
          actionLoading={actionLoading}
          onClearSelection={handleClearSelection}
          onBulkRoleUpdate={handleBulkRoleUpdate}
          onBulkVerificationToggle={handleBulkVerificationToggle}
          onBulkDelete={handleBulkDelete}
        />
      )}

      {/* Error */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4"
        >
          <div className="flex">
            <svg className="h-5 w-5 text-red-400 dark:text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="ml-3">
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Users Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Table Header - Thiết kế mới giống ảnh */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Icon với background màu xanh */}
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="drop-shadow-sm"
                >
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
              </div>

              {/* Tiêu đề và mô tả */}
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  Danh sách người dùng
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                  Quản lý thông tin người dùng và phân quyền
                </p>
              </div>
            </div>

            {/* Action button */}
            <div>
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center justify-center w-10 h-10 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors shadow-lg hover:shadow-xl"
                title="Thêm người dùng mới"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Table Container - Always show */}
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={selectedUsers.length > 0 && selectedUsers.length === usersData?.users.length}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600 rounded"
                      />
                      <span>Người dùng</span>
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Vai trò
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="hidden lg:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Quốc gia
                  </th>
                  <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Giới tính
                  </th>
                  <th className="hidden sm:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Tuổi
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Số lần test IQ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Ngày tham gia
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Đăng nhập cuối
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Hành động
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {/* Real users */}
                {usersData?.users.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    {/* User Info */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {/* Checkbox - for all users */}
                        <div className="flex-shrink-0 mr-3">
                          <input
                            type="checkbox"
                            checked={selectedUsers.includes(user.id)}
                            onChange={(e) => handleUserSelect(user.id, e.target.checked)}
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600 rounded"
                          />
                        </div>
                        <div className="flex-shrink-0 h-10 w-10 mr-4">
                          <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                            isAnonymousUser(user) ? 'bg-orange-100 dark:bg-orange-900/30' : 'bg-primary-100 dark:bg-primary-900/30'
                          }`}>
                            <span className={`text-base font-semibold ${
                              isAnonymousUser(user) ? 'text-orange-700 dark:text-orange-400' : 'text-primary-700 dark:text-primary-400'
                            }`}>
                              {(user.username || user.full_name).charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{user.username || user.full_name}</div>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getUserTypeBadge(user.user_type)}`}>
                              {user.user_type === 'anonymous' ? 'Chưa đăng ký' : 'Đã đăng ký'}
                            </span>
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {isAnonymousUser(user) ? (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRoleBadge(user.role)}`}>
                          Chưa đăng ký
                        </span>
                      ) : (
                        <QuickRoleEditor
                          userId={user.id}
                          currentRole={user.role as 'admin' | 'editor' | 'author' | 'reviewer' | 'user' | 'mod'}
                          onRoleUpdate={handleRoleUpdate}
                          isLoading={actionLoading === `role-${user.id}`}
                          disabled={false} // TODO: Add role-based access control
                        />
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {isAnonymousUser(user) ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600">
                          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                          </svg>
                          Không áp dụng
                        </span>
                      ) : (
                        <button
                          onClick={() => handleVerificationToggle(user.id)}
                          disabled={actionLoading === `verify-${user.id}`}
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border outline-none ${
                            user.is_verified
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 border-green-200 dark:border-green-800'
                              : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800'
                          } ${actionLoading === `verify-${user.id}` ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:opacity-80 hover:scale-105'}`}
                        >
                          {actionLoading === `verify-${user.id}` ? (
                            <div className="w-3 h-3 border border-current border-r-transparent rounded-full animate-spin mr-1"></div>
                          ) : user.is_verified ? (
                            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          ) : (
                            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          )}
                          {user.is_verified ? 'Đã xác thực' : 'Chưa xác thực'}
                        </button>
                      )}
                    </td>

                    {/* Country */}
                    <td className="hidden lg:table-cell px-6 py-4 whitespace-nowrap">
                      {user.country_name ? (
                        <div className="flex items-center space-x-2">
                          {/* Flag */}
                          <div className="flex-shrink-0">
                            {(() => {
                              // Lấy country_code từ database hoặc fallback mapping
                              let code = user.country_code;

                              // FALLBACK: Nếu backend chưa có country_code, map từ country_name
                              if (!code && user.country_name) {
                                const nameToCode: { [key: string]: string } = {};
                                countryData.forEach((country: any) => {
                                  nameToCode[country.name.toLowerCase()] = country.code;
                                });

                                // Thêm variations
                                nameToCode['viet nam'] = 'VN';
                                nameToCode['vietnam'] = 'VN';
                                nameToCode['antigua and barbuda'] = 'AG';
                                nameToCode['united states'] = 'US';
                                nameToCode['united kingdom'] = 'GB';

                                code = nameToCode[user.country_name.toLowerCase()];
                              }



                              return code ? (
                                <img
                                  src={`/flag/${code}.svg`}
                                  alt={`${user.country_name} flag`}
                                  className="w-5 h-4 object-cover rounded-sm"
                                  onError={(e) => {
                                    console.error('❌ Flag failed:', `/flag/${code}.svg`);
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                  }}
                                  onLoad={() => {
                                    // Flag loaded successfully
                                  }}
                                />
                              ) : (
                                <span className="text-sm text-gray-400">🏳️</span>
                              );
                            })()}
                          </div>
                          {/* Country name */}
                          <div className="text-sm text-gray-900 dark:text-gray-100 truncate">
                            {user.country_name}
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500 dark:text-gray-400">Chưa có</span>
                      )}
                    </td>

                    {/* Gender */}
                    <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {formatGender(user.gender)}
                    </td>

                    {/* Age */}
                    <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {user.age ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400">
                          {user.age} tuổi
                        </span>
                      ) : (
                        <span className="text-gray-500 dark:text-gray-400">Chưa có</span>
                      )}
                    </td>

                    {/* Test Count */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {(() => {
                        const { text, className } = formatTestCount(user.test_count);
                        return (
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}>
                            {text}
                          </span>
                        );
                      })()}
                    </td>

                    {/* Join Date */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {formatDate(user.created_at)}
                    </td>

                    {/* Last Login */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(user.last_sign_in_at)}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        {/* Edit Button */}
                        <button
                          onClick={() => handleEditUser(user.id)}
                          onMouseEnter={handleEditHover}
                          className="text-gray-400 hover:text-blue-600 dark:text-gray-500 dark:hover:text-blue-400 p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                          title="Sửa thông tin"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>

                        {/* Delete Button */}
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          disabled={actionLoading === `delete-${user.id}`}
                          className="text-gray-400 hover:text-red-600 dark:text-gray-500 dark:hover:text-red-400 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Xóa người dùng"
                        >
                          {actionLoading === `delete-${user.id}` ? (
                            <div className="w-4 h-4 border border-current border-r-transparent rounded-full animate-spin"></div>
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {/* Skeleton rows while loading */}
                {isLoading && (
                  <>
                    <SkeletonTableRow />
                    <SkeletonTableRow />
                    <SkeletonTableRow />
                    <SkeletonTableRow />
                    <SkeletonTableRow />
                    <SkeletonTableRow />
                    <SkeletonTableRow />
                    <SkeletonTableRow />
                    <SkeletonTableRow />
                    <SkeletonTableRow />
                  </>
                )}
              </tbody>
            </table>

            {/* Empty State */}
            {!isLoading && usersData?.users.length === 0 && (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">Không có người dùng nào</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Thử điều chỉnh bộ lọc để xem kết quả khác</p>
              </div>
            )}
          </div>
      </div>



      {/* Unified Pagination - Single Row Design */}
      <UsersPagination
        usersData={usersData}
        currentPage={currentPage}
        displayCurrentPage={displayCurrentPage}
        limit={limit}
        isMobile={isMobile}
        onPageChange={handlePageChange}
        onLimitChange={handleLimitChange}
      />

      {/* Create User Modal */}
      <CreateUserModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateUserSuccess}
      />

      {/* Edit User Modal */}
      <EditUserModal
        isOpen={showEditModal}
        onClose={handleEditUserClose}
        onSuccess={handleEditUserSuccess}
        onOptimisticUpdate={handleOptimisticUserUpdate}
        user={selectedUser}
      />

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
};