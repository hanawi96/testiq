import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UsersService } from '../../../../backend';
import type { UserWithProfile, UsersListResponse, UsersFilters } from '../../../../backend';
import CreateUserModal from './CreateUserModal';
import EditUserModal from './EditUserModal';
import QuickRoleEditor from './QuickRoleEditor';
import { ToastContainer, useToast } from '../common/Toast';
import { preloadTriggers } from '../../../utils/admin/preloaders/country-preloader';
import { getCountryFlag, getCountryFlagSvgByCode } from '../../../utils/country-flags';
import countryData from '../../../../Country.json';

interface Props {
  filters?: UsersFilters;
  onFiltersChange?: (filters: UsersFilters) => void;
}

export default function UsersTable({ filters: externalFilters, onFiltersChange }: Props) {
  // State management - Start with defaults, sync with URL in useEffect
  const [usersData, setUsersData] = useState<UsersListResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<UsersFilters>(externalFilters || {
    role: 'all',
    search: '',
    verified: undefined,
    user_type: undefined
  });

  // Sync external filters
  useEffect(() => {
    if (externalFilters) {
      setFilters(externalFilters);
    }
  }, [externalFilters]);

  // Computed current page from URL with validation
  const displayCurrentPage = useMemo(() => {
    if (typeof window === 'undefined') return currentPage;
    const params = new URLSearchParams(window.location.search);
    const urlPage = Math.max(1, parseInt(params.get('page') || '1'));

    // Validate against totalPages if available
    if (usersData?.totalPages && urlPage > usersData.totalPages) {
      console.warn('🚨 INVALID PAGE: URL page', urlPage, 'exceeds totalPages', usersData.totalPages);
      // Redirect to last valid page
      if (typeof window !== 'undefined') {
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.set('page', usersData.totalPages.toString());
        window.history.replaceState({}, '', newUrl.toString());
      }
      return usersData.totalPages;
    }

    return urlPage;
  }, [currentPage, usersData?.totalPages, typeof window !== 'undefined' ? window.location.search : '']);

  // URL sync state
  const [isInitialized, setIsInitialized] = useState(false);
  const [limit, setLimit] = useState(20);
  const [searchInput, setSearchInput] = useState('');

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithProfile | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  // Toast notifications
  const { toasts, addToast, removeToast } = useToast();

  // Cache and optimization
  const cache = useRef(new Map());
  const cacheWithTTL = useRef(new Map());
  const aggressivePrefetchDone = useRef(new Set());
  const [actionLoading, setActionLoading] = useState<string>('');

  // Helper function to check if user is anonymous
  const isAnonymousUser = (user: UserWithProfile): boolean => {
    return !user.email || user.email.includes('@anonymous.local');
  };

  // Get role badge - updated for new roles
  const getRoleBadge = (role: string) => {
    const styles = {
      admin: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800',
      editor: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800',
      author: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800',
      reviewer: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800',
      mod: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800',
      user: 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-400 border-gray-200 dark:border-gray-800'
    };
    return styles[role as keyof typeof styles] || styles.user;
  };

  // Get user type badge
  const getUserTypeBadge = (userType: 'registered' | 'anonymous' | undefined) => {
    if (userType === 'anonymous') {
      return 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800';
    }
    return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800';
  };

  // Format date helper
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Chưa có';
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Fetch users function
  const fetchUsers = useCallback(async (page: number = 1, pageLimit: number = limit, forceRefresh: boolean = false) => {
    try {
      setIsLoading(true);
      setError('');

      // Check for SSR initial data on first load
      if (page === 1 && !forceRefresh) {
        const initialData = (window as any).__USERS_INITIAL_DATA__;
        if (initialData && !cache.current.has('page-1')) {
          console.log('✅ Using SSR initial data');
          setUsersData(initialData);
          cache.current.set('page-1', initialData);
          setIsLoading(false);
          return;
        }
      }

      // Check cache first
      const cacheKey = `page-${page}-limit-${pageLimit}-${JSON.stringify(filters)}`;
      if (!forceRefresh && cache.current.has(cacheKey)) {
        console.log('📦 Using cached data for', cacheKey);
        setUsersData(cache.current.get(cacheKey));
        setIsLoading(false);
        return;
      }

      console.log('🔄 Fetching users:', { page, limit: pageLimit, filters });
      const response = await UsersService.getUsers({
        page,
        limit: pageLimit,
        ...filters
      });

      setUsersData(response);
      cache.current.set(cacheKey, response);

    } catch (err) {
      console.error('❌ Error fetching users:', err);
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra khi tải dữ liệu');
    } finally {
      setIsLoading(false);
    }
  }, [filters, limit]);

  // Initial load
  useEffect(() => {
    if (!isInitialized) return;
    fetchUsers(displayCurrentPage, limit);
  }, [displayCurrentPage, limit, filters, isInitialized]);

  // URL sync on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Parse URL and sync filters only (page handled by displayCurrentPage)
    const params = new URLSearchParams(window.location.search);
    const urlRole = params.get('role') || 'all';
    const urlSearch = params.get('search') || '';
    const urlVerified = params.get('verified') ? params.get('verified') === 'true' : undefined;
    const urlUserType = params.get('user_type') || undefined;

    const urlFilters = {
      role: urlRole as UsersFilters['role'],
      search: urlSearch,
      verified: urlVerified,
      user_type: urlUserType as UsersFilters['user_type']
    };

    setFilters(urlFilters);
    setSearchInput(urlSearch);
    setIsInitialized(true);
  }, []);

  // Handle user selection
  const handleUserSelect = (userId: string, isSelected: boolean) => {
    setSelectedUsers(prev => 
      isSelected 
        ? [...prev, userId]
        : prev.filter(id => id !== userId)
    );
  };

  // Handle select all
  const handleSelectAll = (isSelected: boolean) => {
    if (isSelected) {
      const selectableUsers = usersData?.users.filter(user => !isAnonymousUser(user)).map(user => user.id) || [];
      setSelectedUsers(selectableUsers);
    } else {
      setSelectedUsers([]);
    }
  };

  // Handle edit user
  const handleEditUser = (userId: string) => {
    const user = usersData?.users.find(u => u.id === userId);
    if (user) {
      setSelectedUser(user);
      setShowEditModal(true);
    }
  };

  // Handle create user success
  const handleCreateUserSuccess = () => {
    setShowCreateModal(false);
    fetchUsers(displayCurrentPage, limit, true);
    addToast('Tạo người dùng thành công!', 'success');
  };

  // Handle edit user success
  const handleEditUserSuccess = () => {
    setShowEditModal(false);
    setSelectedUser(null);
    fetchUsers(displayCurrentPage, limit, true);
    addToast('Cập nhật người dùng thành công!', 'success');
  };

  // Handle edit user close
  const handleEditUserClose = () => {
    setShowEditModal(false);
    setSelectedUser(null);
  };

  // Handle optimistic user update
  const handleOptimisticUserUpdate = (updatedUser: UserWithProfile) => {
    if (!usersData) return;

    const updatedUsers = usersData.users.map(user =>
      user.id === updatedUser.id ? updatedUser : user
    );

    setUsersData({
      ...usersData,
      users: updatedUsers
    });
  };

  // Handle role update with validation
  const handleRoleUpdate = async (userId: string, newRole: 'admin' | 'editor' | 'author' | 'reviewer' | 'user') => {
    // Find user and validate
    const user = usersData?.users.find(u => u.id === userId);
    if (!user) {
      addToast('Không tìm thấy người dùng', 'error');
      return;
    }

    if (isAnonymousUser(user)) {
      addToast('Không thể thay đổi vai trò của người dùng chưa đăng ký', 'error');
      return;
    }

    try {
      setActionLoading(`role-${userId}`);

      // Optimistic update
      const updatedUser = { ...user, role: newRole };
      handleOptimisticUserUpdate(updatedUser);

      // API call
      await UsersService.updateUserRole(userId, newRole);

    } catch (error) {
      console.error('❌ Error updating role:', error);
      addToast('Có lỗi xảy ra khi cập nhật vai trò', 'error');

      // Revert optimistic update
      fetchUsers(displayCurrentPage, limit, true);
    } finally {
      setActionLoading('');
    }
  };

  // Handle verification toggle with validation
  const handleVerificationToggle = async (userId: string) => {
    // Find user and validate
    const user = usersData?.users.find(u => u.id === userId);
    if (!user) {
      addToast('Không tìm thấy người dùng', 'error');
      return;
    }

    if (isAnonymousUser(user)) {
      addToast('Không thể thay đổi trạng thái xác thực của người dùng chưa đăng ký', 'error');
      return;
    }

    try {
      setActionLoading(`verify-${userId}`);

      // Optimistic update
      const updatedUser = { ...user, is_verified: !user.is_verified };
      handleOptimisticUserUpdate(updatedUser);

      // API call
      await UsersService.toggleUserVerification(userId);

    } catch (error) {
      console.error('❌ Error toggling verification:', error);
      addToast('Có lỗi xảy ra khi cập nhật trạng thái xác thực', 'error');

      // Revert optimistic update
      fetchUsers(displayCurrentPage, limit, true);
    } finally {
      setActionLoading('');
    }
  };

  // Handle edit hover for preloading
  const handleEditHover = () => {
    preloadTriggers.country();
  };

  return (
    <div className="space-y-6">
      {/* Users Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Table Header */}
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
                      checked={selectedUsers.length > 0 && selectedUsers.length === usersData?.users.filter(user => !isAnonymousUser(user)).length}
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
              {isLoading ? (
                <tr>
                  <td colSpan={10} className="px-6 py-8 text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">Đang tải...</p>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={10} className="px-6 py-8 text-center">
                    <p className="text-red-600 dark:text-red-400">{error}</p>
                  </td>
                </tr>
              ) : !usersData?.users.length ? (
                <tr>
                  <td colSpan={10} className="px-6 py-8 text-center">
                    <p className="text-gray-600 dark:text-gray-400">Không có người dùng nào</p>
                  </td>
                </tr>
              ) : (
                usersData.users.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    {/* User Info */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {/* Checkbox - only for non-anonymous users */}
                        <div className="flex-shrink-0 mr-3">
                          {!isAnonymousUser(user) ? (
                            <input
                              type="checkbox"
                              checked={selectedUsers.includes(user.id)}
                              onChange={(e) => handleUserSelect(user.id, e.target.checked)}
                              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600 rounded"
                            />
                          ) : (
                            <div className="h-4 w-4"></div>
                          )}
                        </div>
                        <div className="flex-shrink-0 h-12 w-12 mr-4">
                          <div className={`h-12 w-12 rounded-full flex items-center justify-center ${
                            isAnonymousUser(user) ? 'bg-orange-100 dark:bg-orange-900/30' : 'bg-primary-100 dark:bg-primary-900/30'
                          }`}>
                            <span className={`text-lg font-semibold ${
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
                          disabled={false}
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

                    {/* Country - Placeholder for now */}
                    <td className="hidden lg:table-cell px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-gray-100">
                        {user.country_name || 'Chưa có'}
                      </div>
                    </td>

                    {/* Gender */}
                    <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-gray-100">
                        {user.gender === 'male' ? 'Nam' : user.gender === 'female' ? 'Nữ' : 'Chưa có'}
                      </div>
                    </td>

                    {/* Age */}
                    <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-gray-100">
                        {user.age || 'Chưa có'}
                      </div>
                    </td>

                    {/* Test Count */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-gray-100">
                        {user.test_count || 0}
                      </div>
                    </td>

                    {/* Join Date */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-gray-100">
                        {formatDate(user.created_at)}
                      </div>
                    </td>

                    {/* Last Login */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-gray-100">
                        {formatDate(user.last_login)}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {isAnonymousUser(user) ? (
                        <div className="flex justify-end">
                          <span className="text-xs text-gray-400 dark:text-gray-500 italic">Chỉ xem</span>
                        </div>
                      ) : (
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
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

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
}
