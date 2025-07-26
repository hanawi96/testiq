/**
 * USERS EFFECTS HOOK
 * Hook quản lý URL sync, effects và lifecycle cho Users module
 */

import { useEffect, useCallback } from 'react';
import type { UsersFilters } from '../../../../../backend';

interface UseUsersEffectsProps {
  setFilters: (filters: UsersFilters | ((prev: UsersFilters) => UsersFilters)) => void;
  setIsInitialized: (initialized: boolean) => void;
  setIsMobile: (mobile: boolean) => void;
  setCurrentPage: (page: number) => void;
  searchInput: string;
  setSearchInput: (search: string) => void;
  searchTimeoutRef: React.MutableRefObject<NodeJS.Timeout | undefined>;
  usersDataRef: React.MutableRefObject<any>;
  usersData: any;
  filters: UsersFilters;
}

export const useUsersEffects = ({
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
}: UseUsersEffectsProps) => {

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
    setSearchInput(urlSearch); // Sync search input with URL search
    setIsInitialized(true);

    // Handle browser back/forward
    const handlePopState = () => {
      window.location.reload(); // Simple reload on navigation
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [setFilters, setSearchInput, setIsInitialized]);

  // Detect screen size
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, [setIsMobile]);

  // Sync usersDataRef with usersData state
  useEffect(() => {
    usersDataRef.current = usersData;
  }, [usersData, usersDataRef]);

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
  }, [searchInput, setFilters, setCurrentPage, searchTimeoutRef]);

  return {
    updateURL
  };
};
