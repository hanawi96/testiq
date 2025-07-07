import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CategoriesService } from '../../../../backend';
import type { Category, CategoryStats, CategoriesFilters, CategoriesListResponse } from '../../../../backend';
import CategoryModal from './CategoryModal';
import QuickStatusEditor from './QuickStatusEditor';

export default function AdminCategories() {
  const [categoriesData, setCategoriesData] = useState<CategoriesListResponse | null>(null);
  const [stats, setStats] = useState<CategoryStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<CategoriesFilters>({
    status: 'all',
    search: '',
    sort_by: 'display_order',
    sort_order: 'asc'
  });
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [tempSlug, setTempSlug] = useState('');
  const [optimisticSlugs, setOptimisticSlugs] = useState<Record<string, string>>({});
  const [pendingSlugUpdates, setPendingSlugUpdates] = useState<Set<string>>(new Set());
  const [targetStatuses, setTargetStatuses] = useState<Record<string, 'active' | 'inactive'>>({});
  const [pendingStatusUpdates, setPendingStatusUpdates] = useState<Set<string>>(new Set());
  const [bulkActionLoading, setBulkActionLoading] = useState<'activate' | 'deactivate' | null>(null);

  const limit = 10;

  // Fetch categories data
  const fetchCategories = useCallback(async (page: number = currentPage) => {
    console.log(`🔍 Fetch categories page ${page}`);
    setError('');

    try {
      const { data, error: fetchError } = await CategoriesService.getCategories(page, limit, filters);

      if (fetchError || !data) {
        setError(fetchError?.message || 'Không thể tải danh sách danh mục');
        return;
      }

      console.log(`✅ Loaded categories page ${page}`);
      setCategoriesData(data);

    } catch (err: any) {
      setError(err?.message || 'Có lỗi xảy ra khi tải dữ liệu');
    }
  }, [currentPage, filters]);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const { data: statsData, error: statsError } = await CategoriesService.getStats();
      if (!statsError && statsData) {
        setStats(statsData);
      }
    } catch (err) {
      console.warn('Could not fetch categories stats:', err);
    }
  }, []);

  // Initial load
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([
        fetchCategories(1),
        fetchStats()
      ]);
      setIsLoading(false);
    };
    
    loadData();
  }, [filters]);

  // Cleanup optimistic updates on unmount
  useEffect(() => {
    return () => {
      setOptimisticSlugs({});
      setPendingSlugUpdates(new Set());
      setTargetStatuses({});
      setPendingStatusUpdates(new Set());
      setBulkActionLoading(null);
    };
  }, []);

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchCategories(page);
  };

  // Handle filter change
  const handleFilterChange = (newFilters: Partial<CategoriesFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setCurrentPage(1);
  };

  // Handle category selection
  const handleSelectCategory = (categoryId: string) => {
    setSelectedCategories(prev => {
      const newSelection = prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId];
      setShowBulkActions(newSelection.length > 0);
      return newSelection;
    });
  };

  // Handle select all
  const handleSelectAll = () => {
    if (selectedCategories.length === categoriesData?.categories.length) {
      setSelectedCategories([]);
      setShowBulkActions(false);
    } else {
      const allIds = categoriesData?.categories.map(c => c.id) || [];
      setSelectedCategories(allIds);
      setShowBulkActions(true);
    }
  };



  // Handle bulk status update with optimistic UI
  const handleBulkStatusUpdate = async (status: 'active' | 'inactive') => {
    if (selectedCategories.length === 0) return;

    const actionType = status === 'active' ? 'activate' : 'deactivate';

    // 1. OPTIMISTIC UPDATE: Set loading state and update UI immediately
    setBulkActionLoading(actionType);
    setIsUpdating(true);

    // Update all selected categories optimistically
    selectedCategories.forEach(categoryId => {
      setTargetStatuses(prev => ({ ...prev, [categoryId]: status }));
      setPendingStatusUpdates(prev => new Set(prev).add(categoryId));
    });

    try {
      // 2. BACKGROUND API CALL
      const { data: updatedCount, error } = await CategoriesService.bulkUpdateStatus(selectedCategories, status);

      if (!error) {
        // 3. SUCCESS: Update local data immediately
        if (categoriesData) {
          const updatedCategories = categoriesData.categories.map(cat =>
            selectedCategories.includes(cat.id)
              ? { ...cat, status: status as 'active' | 'inactive' }
              : cat
          );
          setCategoriesData({
            ...categoriesData,
            categories: updatedCategories
          });
        }

        // Clear optimistic states
        selectedCategories.forEach(categoryId => {
          setTargetStatuses(prev => {
            const updated = { ...prev };
            delete updated[categoryId];
            return updated;
          });
          setPendingStatusUpdates(prev => {
            const updated = new Set(prev);
            updated.delete(categoryId);
            return updated;
          });
        });

        // Clear selections and hide bulk actions
        setSelectedCategories([]);
        setShowBulkActions(false);
        setError('');

        // Update stats and background sync
        fetchStats();
        setTimeout(() => fetchCategories(), 100);

      } else {
        // 4. ERROR: Revert optimistic changes
        selectedCategories.forEach(categoryId => {
          setTargetStatuses(prev => {
            const updated = { ...prev };
            delete updated[categoryId];
            return updated;
          });
          setPendingStatusUpdates(prev => {
            const updated = new Set(prev);
            updated.delete(categoryId);
            return updated;
          });
        });

        setError(`Không thể ${status === 'active' ? 'kích hoạt' : 'vô hiệu hóa'} danh mục`);
        fetchCategories(); // Refresh to ensure consistency
      }
    } catch (err: any) {
      // 5. ERROR: Revert optimistic changes
      selectedCategories.forEach(categoryId => {
        setTargetStatuses(prev => {
          const updated = { ...prev };
          delete updated[categoryId];
          return updated;
        });
        setPendingStatusUpdates(prev => {
          const updated = new Set(prev);
          updated.delete(categoryId);
          return updated;
        });
      });

      setError(err?.message || `Có lỗi xảy ra khi ${status === 'active' ? 'kích hoạt' : 'vô hiệu hóa'} danh mục`);
      fetchCategories(); // Refresh to ensure consistency
    } finally {
      // 6. CLEANUP
      setBulkActionLoading(null);
      setIsUpdating(false);
    }
  };

  // Handle delete category
  const handleDeleteCategory = async (categoryId: string) => {
    const category = categoriesData?.categories.find(c => c.id === categoryId);
    if (!category) return;

    if (category.article_count > 0) {
      alert(`Không thể xóa danh mục "${category.name}" vì có ${category.article_count} bài viết`);
      return;
    }

    if (!confirm(`Bạn có chắc chắn muốn xóa danh mục "${category.name}"?`)) return;
    
    setIsUpdating(true);
    try {
      const { error } = await CategoriesService.deleteCategory(categoryId);
      if (!error) {
        await fetchCategories(currentPage);
        await fetchStats();
      } else {
        setError('Không thể xóa danh mục');
      }
    } catch (err) {
      setError('Có lỗi xảy ra khi xóa');
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle quick status update
  const handleQuickStatusUpdate = async (categoryId: string, newStatus: 'active' | 'inactive') => {
    // 1. OPTIMISTIC UPDATE: Immediately update UI
    setTargetStatuses(prev => ({ ...prev, [categoryId]: newStatus }));
    setPendingStatusUpdates(prev => new Set(prev).add(categoryId));

    try {
      // 2. API CALL: Update status in background
      const { error } = await CategoriesService.updateCategory(categoryId, { status: newStatus });

      if (error) {
        // 3. ERROR: Revert optimistic changes
        setTargetStatuses(prev => {
          const updated = { ...prev };
          delete updated[categoryId];
          return updated;
        });
        throw new Error(error.message || 'Không thể cập nhật trạng thái');
      }

      // 4. SUCCESS: Update local data to match API response
      if (categoriesData) {
        setCategoriesData(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            categories: prev.categories.map(cat =>
              cat.id === categoryId ? { ...cat, status: newStatus } : cat
            )
          };
        });
      }

      // Clear target status since real status is now updated
      setTargetStatuses(prev => {
        const updated = { ...prev };
        delete updated[categoryId];
        return updated;
      });

    } catch (err: any) {
      // ERROR: Revert optimistic changes and show error
      setTargetStatuses(prev => {
        const updated = { ...prev };
        delete updated[categoryId];
        return updated;
      });

      setError(err?.message || 'Có lỗi xảy ra khi cập nhật trạng thái');

      // Refresh data to ensure consistency
      fetchCategories();
    } finally {
      // CLEANUP: Remove from pending updates
      setPendingStatusUpdates(prev => {
        const updated = new Set(prev);
        updated.delete(categoryId);
        return updated;
      });
    }
  };

  // Get status badge color
  const getStatusBadge = (status: string) => {
    const styles = {
      active: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800',
      inactive: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600'
    };
    return styles[status as keyof typeof styles] || styles.inactive;
  };

  // Get status label
  const getStatusLabel = (status: string) => {
    const labels = {
      active: 'Hoạt động',
      inactive: 'Không hoạt động'
    };
    return labels[status as keyof typeof labels] || status;
  };

  // Get status label with loading text when pending
  const getDisplayStatusLabel = (category: Category): string => {
    if (isStatusPending(category.id)) {
      const targetStatus = getDisplayStatus(category);
      return targetStatus === 'active' ? 'Đang kích hoạt...' : 'Đang vô hiệu hóa...';
    }
    return getStatusLabel(getDisplayStatus(category));
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Generate slug from name
  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens
      .trim();
  };

  // Handle quick edit slug
  const handleSlugEdit = (categoryId: string, currentSlug: string) => {
    // Don't allow editing if there's a pending update
    if (isSlugPending(categoryId)) {
      return;
    }

    setEditingSlug(categoryId);
    setTempSlug(currentSlug);
  };

  // Save slug edit with optimistic UI update
  const handleSlugSave = async (categoryId: string) => {
    if (!tempSlug.trim()) {
      setError('Slug không được để trống');
      return;
    }

    // Validate slug format
    const slugRegex = /^[a-z0-9-]+$/;
    if (!slugRegex.test(tempSlug)) {
      setError('Slug chỉ được chứa chữ thường, số và dấu gạch ngang');
      return;
    }

    const newSlug = tempSlug.trim();

    // Cancel any pending update for this category
    if (pendingSlugUpdates.has(categoryId)) {
      console.log('Cancelling previous slug update for category:', categoryId);
    }

    // 1. OPTIMISTIC UPDATE: Close edit mode and show new slug immediately
    setEditingSlug(null);
    setTempSlug('');
    setOptimisticSlugs(prev => ({ ...prev, [categoryId]: newSlug }));
    setPendingSlugUpdates(prev => new Set(prev).add(categoryId));

    // 2. BACKGROUND API CALL
    try {
      const { error } = await CategoriesService.updateCategory(categoryId, {
        slug: newSlug
      });

      // 3. HANDLE API RESPONSE
      if (error) {
        // REVERT: API failed, restore original slug and show error
        console.error('Slug update failed, reverting:', error);
        setOptimisticSlugs(prev => {
          const updated = { ...prev };
          delete updated[categoryId];
          return updated;
        });
        setError(error.message || 'Không thể cập nhật slug');

        // Optionally refresh data to ensure consistency
        fetchCategories();
      } else {
        // SUCCESS: Update local data immediately to avoid delay
        console.log('Slug update successful');

        // Update the category data immediately in local state
        if (categoriesData) {
          const updatedCategories = categoriesData.categories.map(cat =>
            cat.id === categoryId ? { ...cat, slug: newSlug } : cat
          );
          setCategoriesData({
            ...categoriesData,
            categories: updatedCategories
          });
        }

        // Remove optimistic state since we've updated the real data
        setOptimisticSlugs(prev => {
          const updated = { ...prev };
          delete updated[categoryId];
          return updated;
        });

        // Clear any existing errors
        setError('');

        // Optional: Refresh data in background to ensure consistency
        // but don't wait for it since we've already updated the UI
        setTimeout(() => fetchCategories(), 100);
      }
    } catch (err: any) {
      // REVERT: Network error, restore original slug
      console.error('Slug update error, reverting:', err);
      setOptimisticSlugs(prev => {
        const updated = { ...prev };
        delete updated[categoryId];
        return updated;
      });
      setError(err?.message || 'Có lỗi xảy ra khi cập nhật slug');

      // Refresh data to ensure consistency
      fetchCategories();
    } finally {
      // 4. CLEANUP: Remove from pending updates
      setPendingSlugUpdates(prev => {
        const updated = new Set(prev);
        updated.delete(categoryId);
        return updated;
      });
    }
  };

  // Cancel slug edit
  const handleSlugCancel = () => {
    setEditingSlug(null);
    setTempSlug('');
  };

  // Get display slug (optimistic or real)
  const getDisplaySlug = (category: Category): string => {
    return optimisticSlugs[category.id] || category.slug;
  };

  // Check if slug is being updated
  const isSlugPending = (categoryId: string): boolean => {
    return pendingSlugUpdates.has(categoryId);
  };

  // Get display status (target or real)
  const getDisplayStatus = (category: Category): 'active' | 'inactive' => {
    // If there's a pending update, show the target status
    // Otherwise show the current status
    //
    // Example flow:
    // 1. Current: "active" → Click deactivate → Target: "inactive" → Show: "inactive"
    // 2. Current: "inactive" → Click activate → Target: "active" → Show: "active"
    return targetStatuses[category.id] || category.status;
  };

  // Check if status is being updated
  const isStatusPending = (categoryId: string): boolean => {
    return pendingStatusUpdates.has(categoryId);
  };



  if (isLoading && !categoriesData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
          <span className="text-gray-600 dark:text-gray-400 font-medium">Đang tải...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Quản lý danh mục</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Quản lý danh mục bài viết trên website</p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4"
        >
          <div className="flex items-start">
            <svg className="h-5 w-5 text-red-400 dark:text-red-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="ml-3 flex-1">
              <h4 className="text-sm font-medium text-red-800 dark:text-red-200 mb-1">
                Có lỗi xảy ra
              </h4>
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              <div className="mt-3 flex space-x-3">
                <button
                  onClick={() => {
                    setError('');
                    fetchCategories(currentPage);
                    fetchStats();
                  }}
                  className="text-sm bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 px-3 py-1 rounded-md hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                >
                  Thử lại
                </button>
                <button
                  onClick={() => setError('')}
                  className="text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {[
            { 
              title: 'Tổng danh mục', 
              value: stats.total.toString(), 
              icon: '📁',
              bgColor: 'bg-blue-50 dark:bg-blue-900/30',
              textColor: 'text-blue-600 dark:text-blue-400'
            },
            { 
              title: 'Đang hoạt động', 
              value: stats.active.toString(), 
              icon: '✅',
              bgColor: 'bg-green-50 dark:bg-green-900/30',
              textColor: 'text-green-600 dark:text-green-400'
            },
            { 
              title: 'Không hoạt động', 
              value: stats.inactive.toString(), 
              icon: '⏸️',
              bgColor: 'bg-gray-50 dark:bg-gray-700',
              textColor: 'text-gray-600 dark:text-gray-400'
            },
            { 
              title: 'Tổng bài viết', 
              value: stats.totalArticles.toString(), 
              icon: '📄',
              bgColor: 'bg-purple-50 dark:bg-purple-900/30',
              textColor: 'text-purple-600 dark:text-purple-400'
            }
          ].map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg"
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
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tìm kiếm</label>
            <input
              type="text"
              value={filters.search || ''}
              onChange={(e) => handleFilterChange({ search: e.target.value })}
              placeholder="Tên danh mục, mô tả..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Trạng thái</label>
            <select
              value={filters.status || 'all'}
              onChange={(e) => handleFilterChange({ status: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">Tất cả</option>
              <option value="active">Hoạt động</option>
              <option value="inactive">Không hoạt động</option>
            </select>
          </div>

          {/* Sort By */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Sắp xếp theo</label>
            <select
              value={filters.sort_by || 'display_order'}
              onChange={(e) => handleFilterChange({ sort_by: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="display_order">Thứ tự hiển thị</option>
              <option value="name">Tên danh mục</option>
              <option value="created_at">Ngày tạo</option>
              <option value="updated_at">Ngày cập nhật</option>
              <option value="article_count">Số bài viết</option>
            </select>
          </div>

          {/* Sort Order */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Thứ tự</label>
            <select
              value={filters.sort_order || 'asc'}
              onChange={(e) => handleFilterChange({ sort_order: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="asc">Tăng dần</option>
              <option value="desc">Giảm dần</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      <AnimatePresence>
        {showBulkActions && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  {bulkActionLoading && (
                    <div className="w-4 h-4 border border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  )}
                  <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    {bulkActionLoading
                      ? `Đang ${bulkActionLoading === 'activate' ? 'kích hoạt' : 'vô hiệu hóa'} ${selectedCategories.length} danh mục...`
                      : `Đã chọn ${selectedCategories.length} danh mục`
                    }
                  </span>
                </div>
                <button
                  onClick={() => {
                    setSelectedCategories([]);
                    setShowBulkActions(false);
                  }}
                  disabled={bulkActionLoading !== null}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                >
                  Bỏ chọn
                </button>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleBulkStatusUpdate('active')}
                  disabled={isUpdating || bulkActionLoading !== null}
                  className="flex items-center space-x-2 px-3 py-1 bg-green-600 hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed text-white text-sm rounded-md transition-all duration-200"
                >
                  {bulkActionLoading === 'activate' ? (
                    <>
                      <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Đang kích hoạt...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Kích hoạt</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => handleBulkStatusUpdate('inactive')}
                  disabled={isUpdating || bulkActionLoading !== null}
                  className="flex items-center space-x-2 px-3 py-1 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white text-sm rounded-md transition-all duration-200"
                >
                  {bulkActionLoading === 'deactivate' ? (
                    <>
                      <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Đang vô hiệu hóa...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Vô hiệu hóa</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Categories Table */}
      {categoriesData && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Danh sách danh mục ({categoriesData.total.toLocaleString()})
              </h3>
              <div>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="flex items-center justify-center w-10 h-10 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
                  title="Thêm danh mục mới"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {categoriesData.categories.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">Không có danh mục nào</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Thử điều chỉnh bộ lọc để xem kết quả khác</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={selectedCategories.length === categoriesData.categories.length && categoriesData.categories.length > 0}
                          onChange={handleSelectAll}
                          className="rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500"
                        />
                        <span>Danh mục</span>
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Trạng thái
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Bài viết
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Thứ tự
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Ngày tạo
                    </th>
                    <th className="relative px-6 py-3">
                      <span className="sr-only">Hành động</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {categoriesData.categories.map((category) => (
                    <tr
                      key={category.id}
                      className="group hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      {/* Category Info */}
                      <td className="px-6 py-4">
                        <div className="flex items-start space-x-4">
                          <input
                            type="checkbox"
                            checked={selectedCategories.includes(category.id)}
                            onChange={() => handleSelectCategory(category.id)}
                            className="mt-1 rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {category.name}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                              {category.description}
                            </div>
                            <div className="text-xs text-gray-400 dark:text-gray-500 mt-1 flex items-center space-x-2">
                              <span>Slug:</span>
                              {editingSlug === category.id ? (
                                <div className="flex items-center space-x-1">
                                  <input
                                    type="text"
                                    value={tempSlug}
                                    onChange={(e) => setTempSlug(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        handleSlugSave(category.id);
                                      } else if (e.key === 'Escape') {
                                        handleSlugCancel();
                                      }
                                    }}
                                    className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-primary-500 focus:border-transparent"
                                    autoFocus
                                  />
                                  <button
                                    onClick={() => setTempSlug(generateSlug(category.name))}
                                    className="p-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
                                    title="Tạo slug từ tên"
                                  >
                                    🔄
                                  </button>
                                  <button
                                    onClick={() => handleSlugSave(category.id)}
                                    className="p-1 text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200"
                                    title="Lưu"
                                  >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={handleSlugCancel}
                                    className="p-1 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200"
                                    title="Hủy"
                                  >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center space-x-1">
                                  <span className={`font-mono ${
                                    isSlugPending(category.id)
                                      ? 'text-yellow-600 dark:text-yellow-400'
                                      : 'text-blue-600 dark:text-blue-400'
                                  }`}>
                                    {getDisplaySlug(category)}
                                  </span>
                                  {isSlugPending(category.id) && (
                                    <div className="flex items-center">
                                      <div className="w-3 h-3 border border-yellow-500 border-t-transparent rounded-full animate-spin" title="Đang cập nhật..."></div>
                                      <span className="text-xs text-yellow-600 dark:text-yellow-400 ml-1">Đang lưu...</span>
                                    </div>
                                  )}
                                  <button
                                    onClick={() => handleSlugEdit(category.id, getDisplaySlug(category))}
                                    disabled={isSlugPending(category.id)}
                                    className="p-1 text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed"
                                    title={isSlugPending(category.id) ? "Đang cập nhật..." : "Chỉnh sửa slug"}
                                  >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border transition-all duration-200 ${
                            isStatusPending(category.id)
                              ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800'
                              : getStatusBadge(getDisplayStatus(category))
                          }`}>
                            {isStatusPending(category.id) && (
                              <div className="w-3 h-3 border border-yellow-500 border-t-transparent rounded-full animate-spin mr-1"></div>
                            )}
                            {getDisplayStatusLabel(category)}
                          </span>
                          <QuickStatusEditor
                            categoryId={category.id}
                            currentStatus={getDisplayStatus(category)}
                            onStatusUpdate={handleQuickStatusUpdate}
                            isLoading={isStatusPending(category.id)}
                            disabled={isUpdating}
                          />
                        </div>
                      </td>

                      {/* Article Count */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-900 dark:text-gray-100">
                          <span className="font-medium">{category.article_count}</span>
                          {category.article_count > 0 && (
                            <a
                              href={`/admin/articles?category=${category.slug}`}
                              className="ml-2 text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-200"
                              title="Xem bài viết"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                            </a>
                          )}
                        </div>
                      </td>

                      {/* Display Order */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-gray-100">
                          {category.display_order}
                        </div>
                      </td>

                      {/* Created Date */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-gray-100">
                          {formatDate(category.created_at)}
                        </div>
                        {category.updated_at !== category.created_at && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Sửa: {formatDate(category.updated_at)}
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          {/* Edit */}
                          <button
                            onClick={() => setEditingCategory(category)}
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-200"
                            title="Sửa"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => handleDeleteCategory(category.id)}
                            disabled={isUpdating || category.article_count > 0}
                            className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-200 disabled:opacity-50"
                            title={category.article_count > 0 ? `Không thể xóa (có ${category.article_count} bài viết)` : "Xóa"}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {categoriesData.totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  Hiển thị {((currentPage - 1) * limit) + 1} - {Math.min(currentPage * limit, categoriesData.total)}
                  trong tổng số {categoriesData.total.toLocaleString()} danh mục
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={!categoriesData.hasPrev}
                    className="px-3 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Trước
                  </button>

                  <span className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Trang {currentPage} / {categoriesData.totalPages}
                  </span>

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={!categoriesData.hasNext}
                    className="px-3 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Sau
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Category Modal */}
      <CategoryModal
        isOpen={showCreateModal || !!editingCategory}
        onClose={() => {
          setShowCreateModal(false);
          setEditingCategory(null);
        }}
        onSuccess={async () => {
          // Refresh data to get latest state
          await fetchCategories(currentPage);
          await fetchStats();
        }}
        onOptimisticUpdate={(updatedCategory) => {
          // Immediately update local state for better UX
          if (categoriesData && editingCategory) {
            const updatedCategories = categoriesData.categories.map(cat =>
              cat.id === editingCategory.id ? { ...cat, ...updatedCategory } : cat
            );
            setCategoriesData({
              ...categoriesData,
              categories: updatedCategories
            });
          }
        }}
        category={editingCategory}
      />
    </div>
  );
}
