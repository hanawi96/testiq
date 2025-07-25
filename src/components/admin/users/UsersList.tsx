import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UsersService } from '../../../../backend';
import type { UserWithProfile, UsersListResponse, UsersFilters } from '../../../../backend';
import CreateUserModal from './CreateUserModal';
import EditUserModal from './EditUserModal';
import QuickRoleEditor from './QuickRoleEditor';
import { ToastContainer, useToast } from '../common/Toast';
import { preloadTriggers } from '../../../utils/admin/preloaders/country-preloader';

export default function UsersList() {
  const [usersData, setUsersData] = useState<UsersListResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<UsersFilters>({
    role: 'all',
    search: '',
    verified: undefined,
    user_type: undefined
  });

  // Toast notifications
  const { toasts, removeToast, showSuccess, showError } = useToast();
  const [searchInput, setSearchInput] = useState(''); // Separate search input for debouncing
  const [stats, setStats] = useState<any>(null);
  const [actionLoading, setActionLoading] = useState<string>('');

  const [isMobile, setIsMobile] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithProfile | null>(null);

  // Bulk actions state
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  
  // Cache for instant pagination and filtering
  const cache = useRef<Map<string, UsersListResponse>>(new Map());
  const prefetchQueue = useRef<Set<number>>(new Set());
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const aggressivePrefetchDone = useRef<Set<string>>(new Set()); // Track completed aggressive prefetches

  const [limit, setLimit] = useState(10);

  // Detect screen size
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Debounced search effect
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: searchInput }));
      setCurrentPage(1);
    }, 300); // 300ms debounce

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchInput]);

  // Generate cache key
  const getCacheKey = (page: number, currentFilters: UsersFilters, pageLimit: number = limit) => {
    return `${page}-${pageLimit}-${JSON.stringify(currentFilters)}`;
  };

  // Prefetch data for instant pagination
  const prefetchPage = useCallback(async (page: number, currentFilters: UsersFilters, pageLimit: number = limit) => {
    const cacheKey = getCacheKey(page, currentFilters, pageLimit);

    if (cache.current.has(cacheKey)) {
      return;
    }

    if (prefetchQueue.current.has(page)) {
      return;
    }

    prefetchQueue.current.add(page);

    try {
      const { data, error: fetchError } = await UsersService.getUsers(page, pageLimit, currentFilters);
      if (!fetchError && data) {
        cache.current.set(cacheKey, data);
        console.log(`✅ Prefetch SUCCESS page ${page}`);
      }
    } catch (err) {
      console.log(`❌ Prefetch ERROR page ${page}`);
    } finally {
      prefetchQueue.current.delete(page);
    }
  }, []);

  // Smart aggressive prefetch - ONCE ONLY per filter set
  const smartAggressivePrefetch = useCallback(async (totalPages: number, currentFilters: UsersFilters, pageLimit: number = limit) => {
    const filterKey = `${JSON.stringify(currentFilters)}-${pageLimit}`;

    if (aggressivePrefetchDone.current.has(filterKey)) {
      return; // Already done for this filter set
    }

    console.log(`🚀 SMART AGGRESSIVE PREFETCH: ${totalPages} pages (ONCE ONLY)`);
    aggressivePrefetchDone.current.add(filterKey);

    // Prefetch all pages with smart timing
    for (let page = 1; page <= totalPages; page++) {
      const cacheKey = getCacheKey(page, currentFilters, pageLimit);

      if (!cache.current.has(cacheKey)) {
        setTimeout(() => prefetchPage(page, currentFilters, pageLimit), page * 50); // Faster 50ms
      }
    }
  }, [prefetchPage]);

  // Fetch users data with instant cache lookup
  const fetchUsers = useCallback(async (page: number = currentPage, pageLimit: number = limit) => {
    const cacheKey = getCacheKey(page, filters, pageLimit);
    
    console.log(`🔍 Fetch page ${page}`);
    
    // Instant display from cache
    const cachedData = cache.current.get(cacheKey);
    if (cachedData) {
      console.log(`⚡ INSTANT page ${page}`);
      setUsersData(cachedData);
      setError('');
      
      // Smart aggressive prefetch - ONCE ONLY
      smartAggressivePrefetch(cachedData.totalPages, filters, pageLimit);
      
      return;
    }

    console.log(`🔄 Loading page ${page}...`);
    if (page === 1 && !usersData) setIsLoading(true);
    setError('');
    
    try {
      const { data, error: fetchError } = await UsersService.getUsers(page, pageLimit, filters);
      
      if (fetchError || !data) {
        setError('Không thể tải danh sách users');
        return;
      }
      
      console.log(`✅ Loaded page ${page}`);
      console.log('🔍 UsersList: First user data:', data.users[0]); // Debug username
      cache.current.set(cacheKey, data);
      setUsersData(data);
      
      // Smart aggressive prefetch - ONCE ONLY
      smartAggressivePrefetch(data.totalPages, filters, pageLimit);
      
    } catch (err) {
      setError('Có lỗi xảy ra khi tải dữ liệu');
    } finally {
      if (page === 1 && !usersData) setIsLoading(false);
    }
  }, [currentPage, limit, filters, usersData, smartAggressivePrefetch]);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const { data: statsData, error: statsError } = await UsersService.getUserStats();
      if (!statsError && statsData) {
        setStats(statsData);
      }
    } catch (err) {
      console.warn('Could not fetch user stats:', err);
    }
  }, []);

  // Initial load
  useEffect(() => {
    // Clear all caches when filters change
    cache.current.clear();
    prefetchQueue.current.clear();
    aggressivePrefetchDone.current.clear();
    
    fetchUsers(1);
    fetchStats();
  }, [filters]);



  // Handle page change - INSTANT
  const handlePageChange = (newPage: number) => {
    console.log(`🔄 PAGE CHANGE: ${currentPage} → ${newPage}`);
    setCurrentPage(newPage);
    fetchUsers(newPage);
  };

  // Handle limit change - Reset to page 1
  const handleLimitChange = (newLimit: number) => {
    console.log(`🔄 LIMIT CHANGE: ${limit} → ${newLimit}`);
    setLimit(newLimit);
    setCurrentPage(1);
    // Clear cache since page size changed
    cache.current.clear();
    aggressivePrefetchDone.current.clear();
    fetchUsers(1, newLimit);
  };

  // Handle filter change - OPTIMIZED
  const handleFilterChange = useCallback((newFilters: Partial<UsersFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setCurrentPage(1);
  }, []);

  // Handle role update - only show error toast, no success toast
  const handleRoleUpdate = async (userId: string, newRole: 'admin' | 'editor' | 'author' | 'reviewer') => {
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

  // Handle verification toggle
  const handleVerificationToggle = async (userId: string) => {
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

  // Handle edit user
  const handleEditUser = (userId: string) => {
    const user = usersData?.users.find(u => u.id === userId);
    if (user) {
      setSelectedUser(user);
      setShowEditModal(true);
    }
  };

  // Handle edit button hover - preload country data
  const handleEditHover = useCallback(() => {
    preloadTriggers.onUserInteraction();
  }, []);

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
      // Only select non-anonymous users for bulk actions
      const selectableUsers = usersData.users.filter(user => !isAnonymousUser(user));
      setSelectedUsers(selectableUsers.map(user => user.id));
      setShowBulkActions(selectableUsers.length > 0);
    } else {
      setSelectedUsers([]);
      setShowBulkActions(false);
    }
  };

  // Handle bulk role update
  const handleBulkRoleUpdate = async (newRole: 'admin' | 'editor' | 'author' | 'reviewer') => {
    if (selectedUsers.length === 0) return;

    if (!confirm(`Bạn có chắc chắn muốn cập nhật role thành "${newRole}" cho ${selectedUsers.length} người dùng đã chọn?`)) return;

    setActionLoading('bulk-role');
    try {
      const { success, error } = await UsersService.bulkUpdateUserRole(selectedUsers, newRole);
      if (success) {
        // Clear cache và refresh data
        cache.current.clear();
        await Promise.all([fetchUsers(currentPage), fetchStats()]);
        setSelectedUsers([]);
        setShowBulkActions(false);
        showSuccess(`Đã cập nhật role cho ${selectedUsers.length} người dùng thành công`);
      } else {
        showError(error?.message || 'Không thể cập nhật role cho người dùng');
      }
    } catch (err: any) {
      showError(err?.message || 'Có lỗi xảy ra khi cập nhật role');
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

  // Handle edit user success
  const handleEditUserSuccess = () => {
    // Clear cache to ensure fresh data on next fetch
    cache.current.clear();
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
    fetchUsers(1); // Reset to first page
    fetchStats();
    setCurrentPage(1);
  };

  // Handle delete user
  const handleDeleteUser = (userId: string) => {
    console.log('Delete user:', userId);
    // TODO: Implement delete user functionality
    if (confirm('Bạn có chắc chắn muốn xóa user này?')) {
      alert(`Chức năng xóa user ${userId} sẽ được triển khai sau`);
    }
  };



  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Chưa có';
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Get role badge - updated for new roles
  const getRoleBadge = (role: string) => {
    const styles = {
      admin: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800',
      editor: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800',
      author: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800',
      reviewer: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800',
      mod: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800',
      user: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600'
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

  // Check if user is anonymous
  const isAnonymousUser = (user: UserWithProfile) => {
    return user.user_type === 'anonymous';
  };

  // Helper functions để format dữ liệu
  const formatCountry = (country: string | null | undefined): string => {
    if (!country || country.trim() === '') return 'Chưa có';
    return country;
  };

  const formatGender = (gender: string | null | undefined): string => {
    if (!gender || gender.trim() === '') return 'Chưa có';
    // Chuyển đổi giá trị tiếng Anh sang tiếng Việt
    switch (gender.toLowerCase()) {
      case 'male':
        return 'Nam';
      case 'female':
        return 'Nữ';
      case 'other':
        return 'Khác';
      default:
        return gender;
    }
  };

  const formatTestCount = (count: number | undefined): { text: string; className: string } => {
    const testCount = count || 0;
    if (testCount === 0) {
      return {
        text: 'Chưa có',
        className: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
      };
    } else if (testCount === 1) {
      return {
        text: '1 lần',
        className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      };
    } else if (testCount <= 5) {
      return {
        text: `${testCount} lần`,
        className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      };
    } else {
      return {
        text: `${testCount} lần`,
        className: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
      };
    }
  };

  // Skeleton components
  const SkeletonStatsCard = () => (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-20"></div>
          <div className="h-8 bg-gray-200 dark:bg-gray-600 rounded w-16"></div>
        </div>
        <div className="w-12 h-12 bg-gray-200 dark:bg-gray-600 rounded-full"></div>
      </div>
    </div>
  );

  const SkeletonTableRow = () => (
    <tr className="animate-pulse">
      {/* Người dùng */}
      <td className="px-6 py-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gray-200 dark:bg-gray-600 rounded-full"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-32"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-24"></div>
          </div>
        </div>
      </td>

      {/* Vai trò */}
      <td className="px-6 py-4">
        <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded-full w-20"></div>
      </td>

      {/* Trạng thái */}
      <td className="px-6 py-4">
        <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded-full w-24"></div>
      </td>

      {/* Quốc gia (hidden lg:table-cell) */}
      <td className="hidden lg:table-cell px-6 py-4">
        <div className="flex items-center space-x-2">
          <div className="w-5 h-4 bg-gray-200 dark:bg-gray-600 rounded"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-16"></div>
        </div>
      </td>

      {/* Giới tính (hidden md:table-cell) */}
      <td className="hidden md:table-cell px-6 py-4">
        <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-12"></div>
      </td>

      {/* Số lần test IQ */}
      <td className="px-6 py-4">
        <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-8"></div>
      </td>

      {/* Ngày tham gia */}
      <td className="px-6 py-4">
        <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-20"></div>
      </td>

      {/* Đăng nhập cuối */}
      <td className="px-6 py-4">
        <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-20"></div>
      </td>

      {/* Hành động */}
      <td className="px-6 py-4">
        <div className="flex space-x-2">
          <div className="w-8 h-8 bg-gray-200 dark:bg-gray-600 rounded"></div>
          <div className="w-8 h-8 bg-gray-200 dark:bg-gray-600 rounded"></div>
        </div>
      </td>
    </tr>
  );

  return (
    <div className="space-y-6">


      {/* Stats Cards - Progressive Loading */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {stats ? (
          [
            {
              title: 'Tổng người dùng',
              value: stats.total.toString(),
              icon: '👥',
              bgColor: 'bg-blue-50 dark:bg-blue-900/30',
              textColor: 'text-blue-600 dark:text-blue-400'
            },
            {
              title: 'Đã đăng ký',
              value: stats.registered.toString(),
              icon: '✅',
              bgColor: 'bg-green-50 dark:bg-green-900/30',
              textColor: 'text-green-600 dark:text-green-400'
            },
            {
              title: 'Chưa đăng ký',
              value: stats.anonymous.toString(),
              icon: '👤',
              bgColor: 'bg-orange-50 dark:bg-orange-900/30',
              textColor: 'text-orange-600 dark:text-orange-400'
            },
            {
              title: 'Đã xác thực',
              value: stats.verified.toString(),
              icon: '🔐',
              bgColor: 'bg-purple-50 dark:bg-purple-900/30',
              textColor: 'text-purple-600 dark:text-purple-400'
            }
          ].map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{stat.value}</p>
                </div>
                <div className={`w-12 h-12 ${stat.bgColor} rounded-lg flex items-center justify-center ${stat.textColor}`}>
                  <span className="text-2xl">{stat.icon}</span>
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          // Skeleton stats cards
          <>
            <SkeletonStatsCard />
            <SkeletonStatsCard />
            <SkeletonStatsCard />
            <SkeletonStatsCard />
          </>
        )}
      </div>

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
              <option value="mod">Moderator</option>
              <option value="user">User</option>
              <option value="anonymous">Người chơi chưa đăng ký</option>
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
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Đã chọn {selectedUsers.length} người dùng
              </span>
              <button
                onClick={() => {
                  setSelectedUsers([]);
                  setShowBulkActions(false);
                }}
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
                      handleBulkRoleUpdate(e.target.value as 'admin' | 'editor' | 'author' | 'reviewer');
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
                </select>
              </div>

              {/* Verification Actions */}
              <button
                onClick={() => handleBulkVerificationToggle(true)}
                disabled={actionLoading === 'bulk-verification'}
                className="px-3 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg text-sm font-medium transition-colors disabled:cursor-not-allowed"
              >
                {actionLoading === 'bulk-verification' ? 'Đang xử lý...' : 'Xác thực'}
              </button>
              <button
                onClick={() => handleBulkVerificationToggle(false)}
                disabled={actionLoading === 'bulk-verification'}
                className="px-3 py-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-yellow-400 text-white rounded-lg text-sm font-medium transition-colors disabled:cursor-not-allowed"
              >
                {actionLoading === 'bulk-verification' ? 'Đang xử lý...' : 'Hủy xác thực'}
              </button>

              {/* Close button */}
              <button
                onClick={() => {
                  setSelectedUsers([]);
                  setShowBulkActions(false);
                }}
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
                          {user.age && (
                            <div className="text-xs text-gray-400 dark:text-gray-500">
                              Tuổi: {user.age}{user.country_name && `, ${user.country_name}`}
                            </div>
                          )}
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
                    <td className="hidden lg:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {formatCountry(user.country)}
                    </td>

                    {/* Gender */}
                    <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {formatGender(user.gender)}
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

                          {/* Delete Button */}
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="text-gray-400 hover:text-red-600 dark:text-gray-500 dark:hover:text-red-400 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                            title="Xóa người dùng"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      )}
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
      {usersData && usersData.users.length > 0 && (
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <div className="flex items-center justify-between">
            {/* Left: Results Info */}
            <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
              <span>
                Hiển thị {Math.min(currentPage * limit, usersData.total)}/{usersData.total} người dùng
              </span>

              {/* Items Per Page Selector - Compact */}
              <div className="flex items-center space-x-2">
                <select
                  value={limit}
                  onChange={(e) => handleLimitChange(Number(e.target.value))}
                  className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span className="text-xs text-gray-500 dark:text-gray-400">/ trang</span>
              </div>
            </div>

            {/* Right: Pagination Controls - Only show if more than 1 page */}
            {usersData.totalPages > 1 && (
              <nav className="flex items-center space-x-1">
            {/* First Page - Hidden on mobile */}
            <button
              onClick={() => handlePageChange(1)}
              disabled={currentPage === 1}
              className="hidden sm:flex items-center justify-center w-10 h-10 text-sm font-medium text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Trang đầu"
            >
              ⇤
            </button>

            {/* Previous Page */}
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={!usersData.hasPrev}
              className="flex items-center justify-center w-10 h-10 text-sm font-medium text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Trang trước"
            >
              ←
            </button>
            
            {/* Page Numbers - Responsive count */}
            <div className="flex items-center space-x-1">
              {Array.from({ 
                length: Math.min(
                  isMobile ? 3 : 5, // 3 on mobile, 5 on desktop
                  usersData.totalPages
                ) 
              }, (_, i) => {
                const maxVisible = isMobile ? 3 : 5;
                const page = i + Math.max(1, currentPage - Math.floor(maxVisible / 2));
                if (page > usersData.totalPages) return null;
                
                return (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`flex items-center justify-center w-10 h-10 text-sm font-medium rounded-lg ${
                      page === currentPage
                        ? 'bg-primary-600 dark:bg-primary-500 text-white shadow-sm'
                        : 'text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                    aria-label={`Trang ${page}`}
                    aria-current={page === currentPage ? 'page' : undefined}
                  >
                    {page}
                  </button>
                );
              })}
            </div>
            
            {/* Next Page */}
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={!usersData.hasNext}
              className="flex items-center justify-center w-10 h-10 text-sm font-medium text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Trang sau"
            >
              →
            </button>

            {/* Last Page - Hidden on mobile */}
            <button
              onClick={() => handlePageChange(usersData.totalPages)}
              disabled={currentPage === usersData.totalPages}
              className="hidden sm:flex items-center justify-center w-10 h-10 text-sm font-medium text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Trang cuối"
            >
              ⇥
            </button>

                {/* Mobile-only: Jump to page input */}
                {usersData.totalPages > 5 && (
                  <div className="flex sm:hidden items-center ml-2 space-x-1">
                    <span className="text-xs text-gray-500 dark:text-gray-400">Đến:</span>
                    <input
                      type="number"
                      min="1"
                      max={usersData.totalPages}
                      value={currentPage}
                      onChange={(e) => {
                        const page = parseInt(e.target.value);
                        if (page >= 1 && page <= usersData.totalPages) {
                          handlePageChange(page);
                        }
                      }}
                      className="w-12 h-8 text-xs text-center border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-primary-500 dark:focus:ring-primary-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                )}
              </nav>
            )}
          </div>
        </div>
      )}

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