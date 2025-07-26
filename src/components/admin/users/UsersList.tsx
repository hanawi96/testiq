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
import UsersChart from './UsersChart';

export default function UsersList() {


  // State management - Start with defaults, sync with URL in useEffect
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
  
  // Enhanced cache with TTL for stale-while-revalidate
  const cache = useRef<Map<string, UsersListResponse>>(new Map());
  const cacheWithTTL = useRef<Map<string, {
    data: UsersListResponse;
    timestamp: number;
    ttl: number;
  }>>(new Map());
  const prefetchQueue = useRef<Set<number>>(new Set());
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const aggressivePrefetchDone = useRef<Set<string>>(new Set()); // Track completed aggressive prefetches
  const usersDataRef = useRef<UsersListResponse | null>(null); // Track usersData without dependency


  const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  const [limit, setLimit] = useState(10);

  // 🚀 URL Sync Utilities
  const updateURL = useCallback((page: number, newFilters: UsersFilters) => {
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams();

    // Only add non-default values to keep URL clean
    if (page > 1) params.set('page', page.toString());
    if (newFilters.role !== 'all') params.set('role', newFilters.role);
    if (newFilters.search) params.set('search', newFilters.search);
    if (newFilters.verified !== undefined) params.set('verified', newFilters.verified.toString());
    if (newFilters.user_type) params.set('user_type', newFilters.user_type);

    const newUrl = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;

    // Use pushState to update URL without page reload
    window.history.pushState({}, '', newUrl);

    console.log('🔗 URL updated:', newUrl);
  }, []);

  // 🚀 Simple URL sync on mount
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
    setIsInitialized(true);

    // Handle browser back/forward
    const handlePopState = () => {
      window.location.reload(); // Simple reload on navigation
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Detect screen size
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Sync usersDataRef with usersData state
  useEffect(() => {
    usersDataRef.current = usersData;
  }, [usersData]);



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

    // Check both caches
    if (cacheWithTTL.current.has(cacheKey) || cache.current.has(cacheKey)) {
      return;
    }

    if (prefetchQueue.current.has(page)) {
      return;
    }

    prefetchQueue.current.add(page);

    try {
      const { data, error: fetchError } = await UsersService.getUsers(page, pageLimit, currentFilters);
      if (!fetchError && data) {
        // Store in both caches
        cache.current.set(cacheKey, data);
        cacheWithTTL.current.set(cacheKey, {
          data,
          timestamp: Date.now(),
          ttl: CACHE_TTL
        });
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

      // Check both caches before prefetching
      if (!cacheWithTTL.current.has(cacheKey) && !cache.current.has(cacheKey)) {
        setTimeout(() => prefetchPage(page, currentFilters, pageLimit), page * 50); // Faster 50ms
      }
    }
  }, [prefetchPage]);

  // Fetch users data with stale-while-revalidate
  const fetchUsers = useCallback(async (page: number = currentPage, pageLimit: number = limit) => {
    const cacheKey = getCacheKey(page, filters, pageLimit);

    console.log(`🔍 Fetch page ${page}`);

    // 🚀 STEP 3: Stale-while-revalidate strategy
    const cached = cacheWithTTL.current.get(cacheKey);

    // Serve stale data immediately if available
    if (cached) {
      console.log(`⚡ INSTANT page ${page} (${cached.data.users.length} users)`);
      setUsersData(cached.data);
      setError('');

      // Check if data is stale
      const isStale = Date.now() - cached.timestamp > cached.ttl;
      if (!isStale) {
        console.log(`✅ Data is fresh, no revalidation needed`);
        // Smart aggressive prefetch - ONCE ONLY
        smartAggressivePrefetch(cached.data.totalPages, filters, pageLimit);
        return; // Fresh data, no need to revalidate
      }

      // Data is stale, revalidate in background
      console.log(`🔄 Data is stale, revalidating page ${page} in background...`);
    } else {
      // No cached data, show loading
      console.log(`🔄 Loading page ${page}...`);
      // Use ref to check current usersData without adding it to dependencies
      if (page === 1 && !usersDataRef.current) setIsLoading(true);
    }

    setError('');

    try {
      const { data, error: fetchError } = await UsersService.getUsers(page, pageLimit, filters);

      if (fetchError || !data) {
        // Only show error if no stale data was served
        if (!cached) {
          setError('Không thể tải danh sách users');
        }
        return;
      }

      console.log(`✅ Loaded fresh page ${page}`);

      // Handle boundary condition: if current page is empty but there are other pages
      if (data.users.length === 0 && data.totalPages > 0 && page > data.totalPages) {
        console.log('🔧 BOUNDARY: Current page is empty, redirecting to last valid page');
        const lastValidPage = Math.max(1, data.totalPages);
        setCurrentPage(lastValidPage);
        updateURL(lastValidPage, filters);
        fetchUsers(lastValidPage, pageLimit);
        return;
      }

      // Update cache with TTL
      cacheWithTTL.current.set(cacheKey, {
        data,
        timestamp: Date.now(),
        ttl: CACHE_TTL
      });

      // Also update old cache for backward compatibility
      cache.current.set(cacheKey, data);

      // Update UI only if no stale data was served
      if (!cached) {
        setUsersData(data);
        console.log('🔍 UsersList: First user data:', data.users[0]); // Debug username
      }

      // Smart aggressive prefetch - ONCE ONLY
      smartAggressivePrefetch(data.totalPages, filters, pageLimit);

    } catch (err) {
      // Only show error if no stale data was served
      if (!cached) {
        setError('Có lỗi xảy ra khi tải dữ liệu');
      }
    } finally {
      // Use ref to check current usersData without adding it to dependencies
      if (page === 1 && !usersDataRef.current) setIsLoading(false);
    }
  }, [currentPage, limit, filters]); // Remove usersData and smartAggressivePrefetch dependencies

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

  // Clear cache when filters change
  const prevFiltersRef = useRef<UsersFilters>(filters);
  useEffect(() => {
    const filtersChanged = JSON.stringify(prevFiltersRef.current) !== JSON.stringify(filters);
    if (filtersChanged) {
      console.log('🧹 CACHE CLEAR: Filters changed');
      cache.current.clear();
      cacheWithTTL.current.clear();
      prefetchQueue.current.clear();
      aggressivePrefetchDone.current.clear();
      prevFiltersRef.current = filters;
    }
  }, [filters]);

  // Initial load with SSR hydration - Simplified
  useEffect(() => {
    // Wait for URL initialization
    if (!isInitialized) return;



    // 🚀 Hydrate from SSR data if available
    if (typeof window !== 'undefined' && (window as any).__USERS_INITIAL_DATA__) {
      const initialData = (window as any).__USERS_INITIAL_DATA__;
      const initialStats = (window as any).__USERS_INITIAL_STATS__;

      console.log('⚡ SSR HYDRATION: Using pre-loaded data', {
        page: initialData?.page,
        usersCount: initialData?.users?.length,
        totalPages: initialData?.totalPages
      });

      // Set data immediately (0ms)
      setUsersData(initialData);
      if (initialStats) setStats(initialStats);
      setIsLoading(false);
      setError('');

      // Cache the initial data with TTL
      const cacheKey = getCacheKey(initialData.page, filters, limit);
      cache.current.set(cacheKey, initialData);
      cacheWithTTL.current.set(cacheKey, {
        data: initialData,
        timestamp: Date.now(),
        ttl: CACHE_TTL
      });

      // Start aggressive prefetch for remaining pages
      smartAggressivePrefetch(initialData.totalPages, filters, limit);

      // Clear the global data to prevent reuse
      delete (window as any).__USERS_INITIAL_DATA__;
      delete (window as any).__USERS_INITIAL_STATS__;

      return; // Skip API call
    }

    // Fallback to API if no SSR data
    console.log('🔄 CLIENT-SIDE: Loading data via API for page', displayCurrentPage);
    fetchUsers(displayCurrentPage);
    fetchStats();
  }, [filters, isInitialized, displayCurrentPage]);



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

    // 🚀 Update URL with new filters and reset to page 1
    updateURL(1, updatedFilters);

    setFilters(updatedFilters);
    setCurrentPage(1);
  }, [filters, updateURL]);

  // Handle role update with validation - only show error toast, no success toast
  const handleRoleUpdate = async (userId: string, newRole: 'admin' | 'editor' | 'author' | 'reviewer' | 'user') => {
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
      // Select all users for bulk actions
      setSelectedUsers(usersData.users.map(user => user.id));
      setShowBulkActions(usersData.users.length > 0);
    } else {
      setSelectedUsers([]);
      setShowBulkActions(false);
    }
  };

  // Handle bulk role update
  const handleBulkRoleUpdate = async (newRole: 'admin' | 'editor' | 'author' | 'reviewer' | 'user') => {
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
        totalUsers: usersData.totalUsers - selectedUsers.length
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

      {/* Tuổi (hidden sm:table-cell) */}
      <td className="hidden sm:table-cell px-6 py-4">
        <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-16"></div>
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


      {/* Compact Stats Bar - Modern Design */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        {stats ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: 'Tổng người dùng',
                value: stats.total.toString(),
                icon: (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                ),
                color: 'text-blue-600 dark:text-blue-400'
              },
              {
                title: 'Đã đăng ký',
                value: stats.registered.toString(),
                icon: (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
                color: 'text-green-600 dark:text-green-400'
              },
              {
                title: 'Chưa đăng ký',
                value: stats.anonymous.toString(),
                icon: (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                ),
                color: 'text-orange-600 dark:text-orange-400'
              },
              {
                title: 'Đã xác thực',
                value: stats.verified.toString(),
                icon: (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                ),
                color: 'text-purple-600 dark:text-purple-400'
              }
            ].map((stat, index) => (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center space-x-3"
              >
                <div className={`${stat.color} flex-shrink-0`}>
                  {stat.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {stat.value}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 truncate">
                    {stat.title}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          // Compact skeleton loading
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="flex items-center space-x-3 animate-pulse">
                <div className="w-5 h-5 bg-gray-200 dark:bg-gray-600 rounded"></div>
                <div className="min-w-0 flex-1">
                  <div className="h-8 bg-gray-200 dark:bg-gray-600 rounded w-12 mb-1"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-20"></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

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
                      handleBulkRoleUpdate(e.target.value as 'admin' | 'editor' | 'author' | 'reviewer' | 'user');
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
                  <option value="user">User</option>
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

              {/* Delete Action */}
              <button
                onClick={handleBulkDelete}
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
      {usersData && usersData.users.length > 0 && (
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <div className="flex items-center justify-between">
            {/* Left: Results Info */}
            <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
              <span>
                Hiển thị {Math.min(displayCurrentPage * limit, usersData.total)}/{usersData.total} người dùng
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

            {/* Right: Pagination Controls - Only show if more than 1 page and data exists */}
            {usersData.totalPages > 1 && usersData.total > 0 && (
              <nav className="flex items-center space-x-1">
            {/* First Page - Hidden on mobile */}
            <button
              onClick={() => handlePageChange(1)}
              disabled={displayCurrentPage === 1}
              className="hidden sm:flex items-center justify-center w-10 h-10 text-sm font-medium text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Trang đầu"
            >
              ⇤
            </button>

            {/* Previous Page */}
            <button
              onClick={() => handlePageChange(displayCurrentPage - 1)}
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
                const page = i + Math.max(1, displayCurrentPage - Math.floor(maxVisible / 2));
                if (page > usersData.totalPages) return null;

                return (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`flex items-center justify-center w-10 h-10 text-sm font-medium rounded-lg ${
                      page === displayCurrentPage
                        ? 'bg-primary-600 dark:bg-primary-500 text-white shadow-sm'
                        : 'text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                    aria-label={`Trang ${page}`}
                    aria-current={page === displayCurrentPage ? 'page' : undefined}
                  >
                    {page}
                  </button>
                );
              })}
            </div>
            
            {/* Next Page */}
            <button
              onClick={() => handlePageChange(displayCurrentPage + 1)}
              disabled={!usersData.hasNext}
              className="flex items-center justify-center w-10 h-10 text-sm font-medium text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Trang sau"
            >
              →
            </button>

            {/* Last Page - Hidden on mobile */}
            <button
              onClick={() => handlePageChange(usersData.totalPages)}
              disabled={displayCurrentPage === usersData.totalPages}
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