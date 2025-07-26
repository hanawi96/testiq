/**
 * USERS STATE HOOK
 * Hook quản lý state cơ bản cho Users module
 */

import { useState, useMemo, useRef } from 'react';
import type { UserWithProfile, UsersListResponse, UsersFilters } from '../../../../../backend';
import { useToast } from '../../common/Toast';

export const useUsersState = () => {
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

  return {
    // State
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
    
    // Toast
    toasts,
    removeToast,
    showSuccess,
    showError,
    
    // Refs và constants
    cache,
    cacheWithTTL,
    prefetchQueue,
    searchTimeoutRef,
    aggressivePrefetchDone,
    usersDataRef,
    CACHE_TTL
  };
};
