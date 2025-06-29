import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UsersService } from '../../../backend';
import type { UserWithProfile, UsersListResponse, UsersFilters } from '../../../backend';

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
  const [searchInput, setSearchInput] = useState(''); // Separate search input for debouncing
  const [stats, setStats] = useState<any>(null);
  const [actionLoading, setActionLoading] = useState<string>('');
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{top: number, left: number} | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  
  // Cache for instant pagination and filtering
  const cache = useRef<Map<string, UsersListResponse>>(new Map());
  const prefetchQueue = useRef<Set<number>>(new Set());
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const aggressivePrefetchDone = useRef<Set<string>>(new Set()); // Track completed aggressive prefetches

  const limit = 5;

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
  const getCacheKey = (page: number, currentFilters: UsersFilters) => {
    return `${page}-${JSON.stringify(currentFilters)}`;
  };

  // Prefetch data for instant pagination
  const prefetchPage = useCallback(async (page: number, currentFilters: UsersFilters) => {
    const cacheKey = getCacheKey(page, currentFilters);
    
    if (cache.current.has(cacheKey)) {
      return;
    }
    
    if (prefetchQueue.current.has(page)) {
      return;
    }

    prefetchQueue.current.add(page);
    
    try {
      const { data, error: fetchError } = await UsersService.getUsers(page, limit, currentFilters);
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
  const smartAggressivePrefetch = useCallback(async (totalPages: number, currentFilters: UsersFilters) => {
    const filterKey = JSON.stringify(currentFilters);
    
    if (aggressivePrefetchDone.current.has(filterKey)) {
      return; // Already done for this filter set
    }
    
    console.log(`🚀 SMART AGGRESSIVE PREFETCH: ${totalPages} pages (ONCE ONLY)`);
    aggressivePrefetchDone.current.add(filterKey);
    
    // Prefetch all pages with smart timing
    for (let page = 1; page <= totalPages; page++) {
      const cacheKey = getCacheKey(page, currentFilters);
      
      if (!cache.current.has(cacheKey)) {
        setTimeout(() => prefetchPage(page, currentFilters), page * 50); // Faster 50ms
      }
    }
  }, [prefetchPage]);

  // Fetch users data with instant cache lookup
  const fetchUsers = useCallback(async (page: number = currentPage) => {
    const cacheKey = getCacheKey(page, filters);
    
    console.log(`🔍 Fetch page ${page}`);
    
    // Instant display from cache
    const cachedData = cache.current.get(cacheKey);
    if (cachedData) {
      console.log(`⚡ INSTANT page ${page}`);
      setUsersData(cachedData);
      setError('');
      
      // Smart aggressive prefetch - ONCE ONLY
      smartAggressivePrefetch(cachedData.totalPages, filters);
      
      return;
    }

    console.log(`🔄 Loading page ${page}...`);
    if (page === 1 && !usersData) setIsLoading(true);
    setError('');
    
    try {
      const { data, error: fetchError } = await UsersService.getUsers(page, limit, filters);
      
      if (fetchError || !data) {
        setError('Không thể tải danh sách users');
        return;
      }
      
      console.log(`✅ Loaded page ${page}`);
      cache.current.set(cacheKey, data);
      setUsersData(data);
      
      // Smart aggressive prefetch - ONCE ONLY
      smartAggressivePrefetch(data.totalPages, filters);
      
    } catch (err) {
      setError('Có lỗi xảy ra khi tải dữ liệu');
    } finally {
      if (page === 1 && !usersData) setIsLoading(false);
    }
  }, [currentPage, filters, usersData, smartAggressivePrefetch]);

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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setOpenDropdown(null);
      setDropdownPosition(null);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Handle page change - INSTANT
  const handlePageChange = (newPage: number) => {
    console.log(`🔄 PAGE CHANGE: ${currentPage} → ${newPage}`);
    setCurrentPage(newPage);
    fetchUsers(newPage);
  };

  // Handle filter change - OPTIMIZED
  const handleFilterChange = useCallback((newFilters: Partial<UsersFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setCurrentPage(1);
  }, []);

  // Handle role update
  const handleRoleUpdate = async (userId: string, newRole: 'user' | 'admin' | 'mod') => {
    setActionLoading(`role-${userId}`);
    
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
      } else {
        // Revert về role cũ nếu fail
        await fetchUsers(currentPage);
        setError('Không thể cập nhật role');
      }
    } catch (err) {
      // Revert về role cũ nếu fail
      await fetchUsers(currentPage);
      setError('Có lỗi xảy ra khi cập nhật role');
    } finally {
      setActionLoading('');
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
    console.log('Edit user:', userId);
    setOpenDropdown(null);
    setDropdownPosition(null);
    // TODO: Implement edit user functionality
    alert(`Chức năng sửa user ${userId} sẽ được triển khai sau`);
  };

  // Handle delete user
  const handleDeleteUser = (userId: string) => {
    console.log('Delete user:', userId);
    setOpenDropdown(null);
    setDropdownPosition(null);
    // TODO: Implement delete user functionality
    if (confirm('Bạn có chắc chắn muốn xóa user này?')) {
      alert(`Chức năng xóa user ${userId} sẽ được triển khai sau`);
    }
  };

  // Handle dropdown toggle with position calculation
  const handleDropdownToggle = (userId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (openDropdown === userId) {
      setOpenDropdown(null);
      setDropdownPosition(null);
    } else {
      const button = event.currentTarget as HTMLElement;
      const rect = button.getBoundingClientRect();
      
      setDropdownPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX - 192 + rect.width // 192px = w-48
      });
      setOpenDropdown(userId);
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

  // Get role badge
  const getRoleBadge = (role: string) => {
    const styles = {
      admin: 'bg-red-100 text-red-700 border-red-200',
      mod: 'bg-blue-100 text-blue-700 border-blue-200',
      user: 'bg-gray-100 text-gray-700 border-gray-200'
    };
    return styles[role as keyof typeof styles] || styles.user;
  };

  // Get user type badge
  const getUserTypeBadge = (userType: 'registered' | 'anonymous' | undefined) => {
    if (userType === 'anonymous') {
      return 'bg-orange-100 text-orange-700 border-orange-200';
    }
    return 'bg-green-100 text-green-700 border-green-200';
  };

  // Check if user is anonymous
  const isAnonymousUser = (user: UserWithProfile) => {
    return user.user_type === 'anonymous';
  };

  if (isLoading && !usersData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
          <span className="text-gray-600 font-medium">Đang tải...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý người dùng</h1>
          <p className="text-gray-600 mt-1">Quản lý tài khoản và quyền hạn người dùng</p>
        </div>
        
        {/* Quick Stats */}
        {stats && (
          <div className="flex items-center space-x-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary-600">{stats.total}</div>
              <div className="text-xs text-gray-500">Tổng</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.registered}</div>
              <div className="text-xs text-gray-500">Đã đăng ký</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{stats.anonymous}</div>
              <div className="text-xs text-gray-500">Ẩn danh</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.verified}</div>
              <div className="text-xs text-gray-500">Đã xác thực</div>
            </div>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tìm kiếm</label>
            <div className="relative">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Tên, email, địa điểm..."
                className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg outline-none focus:outline-none focus:ring-0 focus:border-gray-300"
                style={{ textIndent: '6px' }}
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Loại người dùng</label>
            <select
              value={filters.user_type || 'all'}
              onChange={(e) => handleFilterChange({ user_type: e.target.value === 'all' ? undefined : e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none"
            >
              <option value="all">Tất cả</option>
              <option value="registered">Đã đăng ký</option>
              <option value="anonymous">Ẩn danh</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Vai trò</label>
            <select
              value={filters.role || 'all'}
              onChange={(e) => handleFilterChange({ role: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none"
            >
              <option value="all">Tất cả</option>
              <option value="admin">Admin</option>
              <option value="mod">Moderator</option>
              <option value="user">User</option>
              <option value="anonymous">Người chơi chưa đăng ký</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Trạng thái</label>
            <select
              value={filters.verified === undefined ? 'all' : filters.verified.toString()}
              onChange={(e) => {
                const value = e.target.value;
                handleFilterChange({ 
                  verified: value === 'all' ? undefined : value === 'true'
                });
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none"
            >
              <option value="all">Tất cả</option>
              <option value="true">Đã xác thực</option>
              <option value="false">Chưa xác thực</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-200 rounded-lg p-4"
        >
          <div className="flex">
            <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {usersData?.users.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Không có người dùng nào</h3>
            <p className="mt-1 text-sm text-gray-500">Thử điều chỉnh bộ lọc để xem kết quả khác</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Người dùng
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vai trò
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ngày tham gia
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Đăng nhập cuối
                  </th>
                  <th className="relative px-6 py-3">
                    <span className="sr-only">Hành động</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {usersData?.users.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-gray-50"
                  >
                    {/* User Info */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-12 w-12 mr-4">
                          <div className={`h-12 w-12 rounded-full flex items-center justify-center ${
                            isAnonymousUser(user) ? 'bg-orange-100' : 'bg-primary-100'
                          }`}>
                            <span className={`text-lg font-semibold ${
                              isAnonymousUser(user) ? 'text-orange-700' : 'text-primary-700'
                            }`}>
                              {user.full_name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <div className="text-sm font-medium text-gray-900">{user.full_name}</div>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getUserTypeBadge(user.user_type)}`}>
                              {user.user_type === 'anonymous' ? 'Ẩn danh' : 'Đã đăng ký'}
                            </span>
                          </div>
                          <div className="text-sm text-gray-500">
                            {isAnonymousUser(user) ? 'Người chơi ẩn danh' : user.email}
                          </div>
                          {user.age && (
                            <div className="text-xs text-gray-400">
                              Tuổi: {user.age}{user.location && `, ${user.location}`}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {isAnonymousUser(user) ? (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRoleBadge(user.role)}`}>
                          User (Ẩn danh)
                        </span>
                      ) : (
                        <select
                          value={user.role}
                          onChange={(e) => handleRoleUpdate(user.id, e.target.value as any)}
                          disabled={actionLoading === `role-${user.id}`}
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border outline-none ${getRoleBadge(user.role)} ${
                            actionLoading === `role-${user.id}` ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                          }`}
                          style={{ transition: 'none' }}
                        >
                          <option value="user">User</option>
                          <option value="mod">Mod</option>
                          <option value="admin">Admin</option>
                        </select>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {isAnonymousUser(user) ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                          </svg>
                          Không áp dụng
                        </span>
                      ) : (
                        <button
                          onClick={() => handleVerificationToggle(user.id)}
                          disabled={actionLoading === `verify-${user.id}`}
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium outline-none ${
                            user.is_verified
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          } ${actionLoading === `verify-${user.id}` ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:opacity-80'}`}
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

                    {/* Join Date */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(user.created_at)}
                    </td>

                    {/* Last Login */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(user.last_sign_in_at)}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {isAnonymousUser(user) ? (
                        <div className="flex justify-end">
                          <span className="text-xs text-gray-400 italic">Chỉ xem</span>
                        </div>
                      ) : (
                        <button 
                          onClick={(e) => handleDropdownToggle(user.id, e)}
                          className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 outline-none"
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                          </svg>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Fixed positioned dropdown */}
      {openDropdown && dropdownPosition && (
        <div 
          className="fixed w-48 bg-white rounded-md shadow-lg border border-gray-200 z-50"
          style={{
            top: dropdownPosition.top,
            left: dropdownPosition.left
          }}
        >
          <div className="py-1">
            <button
              onClick={() => handleEditUser(openDropdown)}
              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors outline-none"
            >
              <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Sửa thông tin
            </button>
            <button
              onClick={() => handleDeleteUser(openDropdown)}
              className="flex items-center w-full px-4 py-2 text-sm text-red-700 hover:bg-red-50 transition-colors outline-none"
            >
              <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Xóa người dùng
            </button>
          </div>
        </div>
      )}

      {/* Pagination - Clean & Simple */}
      {usersData && usersData.totalPages > 1 && (
        <div className="flex items-center justify-center">
          <nav className="flex items-center space-x-1 sm:space-x-2">
            {/* First Page - Hidden on mobile */}
            <button
              onClick={() => handlePageChange(1)}
              disabled={currentPage === 1}
              className="hidden sm:flex items-center justify-center w-10 h-10 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              aria-label="Trang đầu"
            >
              ⇤
            </button>

            {/* Previous Page */}
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={!usersData.hasPrev}
              className="flex items-center justify-center w-10 h-10 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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
                    className={`flex items-center justify-center w-10 h-10 text-sm font-medium rounded-lg transition-colors ${
                      page === currentPage
                        ? 'bg-primary-600 text-white shadow-sm'
                        : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
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
              className="flex items-center justify-center w-10 h-10 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              aria-label="Trang sau"
            >
              →
            </button>

            {/* Last Page - Hidden on mobile */}
            <button
              onClick={() => handlePageChange(usersData.totalPages)}
              disabled={currentPage === usersData.totalPages}
              className="hidden sm:flex items-center justify-center w-10 h-10 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              aria-label="Trang cuối"
            >
              ⇥
            </button>
          </nav>

          {/* Mobile-only: Jump to page input */}
          {usersData.totalPages > 5 && (
            <div className="flex sm:hidden items-center ml-4 space-x-2">
              <span className="text-xs text-gray-500">Đến:</span>
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
                className="w-12 h-8 text-xs text-center border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
} 