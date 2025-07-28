import React, { useState, useEffect, useCallback } from 'react';
import { loadTagsService } from '../../../../backend';
import type { Tag, TagStats, TagsFilters, TagsListResponse } from '../../../../backend';
import TagModal from './TagModal';

export default function AdminTags() {
  // State management
  const [tagsData, setTagsData] = useState<TagsListResponse | null>(null);
  const [stats, setStats] = useState<TagStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState('');

  // Pagination & filters
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(10);
  const [filters, setFilters] = useState<TagsFilters>({
    search: '',
    status: 'all'
  });

  // UI state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);

  // Fetch tags data
  const fetchTags = useCallback(async (page: number = currentPage) => {
    console.log(`🔍 Fetch tags page ${page}`);
    setError('');

    try {
      const TagsService = await loadTagsService();
      const { data, error: fetchError } = await TagsService.getTags(page, limit, filters);

      if (fetchError || !data) {
        setError(fetchError?.message || 'Không thể tải danh sách tags');
        return;
      }

      console.log(`✅ Loaded tags page ${page}`);
      setTagsData(data);

    } catch (err: any) {
      setError(err?.message || 'Có lỗi xảy ra khi tải dữ liệu');
    }
  }, [currentPage, filters]);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const TagsService = await loadTagsService();
      const { data, error: statsError } = await TagsService.getTagStats();
      if (!statsError && data) {
        setStats(data);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  }, []);

  // Initial load
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchTags(1), fetchStats()]);
      setIsLoading(false);
    };
    loadData();
  }, []);

  // Reload when filters change
  useEffect(() => {
    if (!isLoading) {
      setCurrentPage(1);
      fetchTags(1);
    }
  }, [filters]);

  // Handle filter changes
  const handleFilterChange = (newFilters: Partial<TagsFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchTags(page);
  };

  // Handle tag selection
  const handleTagSelect = (tagId: string, checked: boolean) => {
    setSelectedTags(prev => {
      const newSelection = checked
        ? [...prev, tagId]
        : prev.filter(id => id !== tagId);
      setShowBulkActions(newSelection.length > 0);
      return newSelection;
    });
  };

  // Handle select all
  const handleSelectAll = (checked: boolean) => {
    if (checked && tagsData) {
      setSelectedTags(tagsData.tags.map(tag => tag.id));
      setShowBulkActions(true);
    } else {
      setSelectedTags([]);
      setShowBulkActions(false);
    }
  };

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (selectedTags.length === 0) return;

    // Check if any selected tags have usage
    const selectedTagsData = tagsData?.tags.filter(tag => selectedTags.includes(tag.id)) || [];
    const tagsWithUsage = selectedTagsData.filter(tag => tag.usage_count > 0);

    if (tagsWithUsage.length > 0) {
      const tagNames = tagsWithUsage.map(tag => `"${tag.name}" (${tag.usage_count} bài viết)`).join(', ');
      alert(`Không thể xóa các tag sau vì đang được sử dụng: ${tagNames}`);
      return;
    }

    if (!confirm(`Bạn có chắc chắn muốn xóa ${selectedTags.length} tag đã chọn?`)) return;

    setIsUpdating(true);
    try {
      const { error } = await TagsService.bulkDeleteTags(selectedTags);
      if (error) {
        setError(error.message || 'Không thể xóa tags');
        return;
      }

      // Refresh data
      await Promise.all([fetchTags(currentPage), fetchStats()]);
      setSelectedTags([]);
      setShowBulkActions(false);
      alert(`Đã xóa ${selectedTags.length} tag thành công`);
    } catch (err: any) {
      setError(err?.message || 'Có lỗi xảy ra khi xóa tags');
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle delete tag
  const handleDeleteTag = async (tagId: string) => {
    const tag = tagsData?.tags.find(t => t.id === tagId);
    if (!tag) {
      console.error('Tag not found:', tagId);
      return;
    }

    console.log('Attempting to delete tag:', { id: tagId, name: tag.name, usage_count: tag.usage_count });

    if (tag.usage_count > 0) {
      alert(`Không thể xóa tag "${tag.name}" vì có ${tag.usage_count} bài viết`);
      return;
    }

    if (!confirm(`Bạn có chắc chắn muốn xóa tag "${tag.name}"?`)) return;

    setIsUpdating(true);
    setError(''); // Clear previous errors

    try {
      console.log('Calling TagsService.deleteTag with tagId:', tagId);
      const result = await TagsService.deleteTag(tagId);
      console.log('Delete result:', result);

      if (result.error) {
        console.error('Delete error:', result.error);
        const errorMessage = result.error.message || result.error.toString() || 'Không thể xóa tag';
        setError(errorMessage);
        alert(errorMessage);
      } else if (result.data === true) {
        console.log('Tag deleted successfully, refreshing data...');
        // Optimistic update - remove tag from UI immediately
        if (tagsData) {
          const updatedTags = tagsData.tags.filter(t => t.id !== tagId);
          setTagsData({ ...tagsData, tags: updatedTags, total: tagsData.total - 1 });
        }

        // Refresh data from server
        await Promise.all([fetchTags(currentPage), fetchStats()]);
        alert(`Tag "${tag.name}" đã được xóa thành công!`);
      } else {
        console.error('Unexpected delete result:', result);
        setError('Kết quả xóa không như mong đợi');
      }
    } catch (err: any) {
      console.error('Exception during delete:', err);
      const errorMessage = err?.message || 'Có lỗi xảy ra khi xóa tag';
      setError(errorMessage);
      alert(errorMessage);
    } finally {
      setIsUpdating(false);
    }
  };



  // Skeleton components
  const SkeletonStatsCard = () => (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 animate-pulse">
      <div className="flex items-center">
        <div className="p-2 bg-gray-200 dark:bg-gray-600 rounded-lg">
          <div className="w-6 h-6 bg-gray-200 dark:bg-gray-600 rounded"></div>
        </div>
        <div className="ml-4 space-y-2">
          <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-20"></div>
          <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded w-12"></div>
        </div>
      </div>
    </div>
  );

  const SkeletonTableRow = () => (
    <tr className="animate-pulse hover:bg-gray-50 dark:hover:bg-gray-700/30">
      {/* Checkbox - ~3% */}
      <td className="px-3 sm:px-6 py-4 whitespace-nowrap" style={{ width: '3%' }}>
        <div className="w-4 h-4 bg-gray-200 dark:bg-gray-600 rounded"></div>
      </td>

      {/* Tag (color + name + slug + SEO + mobile desc) - ~45% */}
      <td className="px-3 sm:px-6 py-4 whitespace-nowrap" style={{ width: '45%' }}>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-gray-200 dark:bg-gray-600 rounded-full mr-3 flex-shrink-0"></div>
          <div className="min-w-0 space-y-1">
            {/* Name */}
            <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-32"></div>
            {/* Slug */}
            <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-40"></div>
            {/* SEO title */}
            <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-36"></div>
            {/* Mobile description */}
            <div className="md:hidden h-3 bg-gray-200 dark:bg-gray-600 rounded w-48"></div>
          </div>
        </div>
      </td>

      {/* Mô tả (hidden md:table-cell) - ~22% */}
      <td className="hidden md:table-cell px-3 sm:px-6 py-4" style={{ width: '22%' }}>
        <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-56 max-w-xs"></div>
      </td>

      {/* Sử dụng - ~15% */}
      <td className="px-3 sm:px-6 py-4 whitespace-nowrap" style={{ width: '15%' }}>
        <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded-full w-24"></div>
      </td>

      {/* Ngày tạo (hidden lg:table-cell) - ~10% */}
      <td className="hidden lg:table-cell px-3 sm:px-6 py-4 whitespace-nowrap" style={{ width: '10%' }}>
        <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-20"></div>
      </td>

      {/* Thao tác - ~5% */}
      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-right" style={{ width: '5%' }}>
        <div className="flex items-center justify-end space-x-1 sm:space-x-2">
          <div className="w-4 h-4 bg-gray-200 dark:bg-gray-600 rounded p-1"></div>
          <div className="w-4 h-4 bg-gray-200 dark:bg-gray-600 rounded p-1"></div>
        </div>
      </td>
    </tr>
  );

  return (
    <div className="space-y-6">
  

      {/* Stats Cards - Progressive Loading */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats ? (
          <>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Tổng Tags</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Đang sử dụng</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.active}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Phổ biến nhất</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {stats.mostUsed[0]?.usage_count || 0}
                </p>
              </div>
            </div>
          </div>
          </>
        ) : (
          // Skeleton stats cards
          <>
            <SkeletonStatsCard />
            <SkeletonStatsCard />
            <SkeletonStatsCard />
          </>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}



      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tìm kiếm</label>
            <input
              type="text"
              value={filters.search || ''}
              onChange={(e) => handleFilterChange({ search: e.target.value })}
              placeholder="Tên tag, tiêu đề, mô tả..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
            />
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Trạng thái</label>
            <select
              value={filters.status || 'all'}
              onChange={(e) => handleFilterChange({ status: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="all">Tất cả</option>
              <option value="active">Đang sử dụng</option>
              <option value="inactive">Không sử dụng</option>
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
                Đã chọn {selectedTags.length} tag
              </span>
              <button
                onClick={() => {
                  setSelectedTags([]);
                  setShowBulkActions(false);
                }}
                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
              >
                Bỏ chọn tất cả
              </button>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleBulkDelete}
                disabled={isUpdating}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg text-sm font-medium transition-colors disabled:cursor-not-allowed"
              >
                {isUpdating ? 'Đang xóa...' : 'Xóa đã chọn'}
              </button>

              {/* Close button */}
              <button
                onClick={() => {
                  setSelectedTags([]);
                  setShowBulkActions(false);
                }}
                disabled={isUpdating}
                className="flex items-center justify-center w-8 h-8 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors ml-2 disabled:opacity-50 disabled:cursor-not-allowed"
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

      {/* Tags Table - Always show container */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Table Header - Thiết kế mới giống ảnh */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Icon với background màu cam */}
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
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
                  <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
                  <line x1="7" y1="7" x2="7.01" y2="7"/>
                </svg>
              </div>

              {/* Tiêu đề và mô tả */}
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  Danh sách tags
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                  Quản lý {tagsData ? tagsData.total.toLocaleString() : '0'} tags và từ khóa
                </p>
              </div>
            </div>

            {/* Action button */}
            <div>
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center justify-center w-10 h-10 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors shadow-lg hover:shadow-xl"
                title="Thêm tag mới"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
          </div>
        </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={tagsData ? selectedTags.length === tagsData.tags.length && tagsData.tags.length > 0 : false}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      disabled={!tagsData}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600 rounded disabled:opacity-50"
                    />
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Tag
                  </th>
                  <th className="hidden md:table-cell px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Mô tả
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Sử dụng
                  </th>
                  <th className="hidden lg:table-cell px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Ngày tạo
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {/* Real tags */}
                {tagsData?.tags.map((tag) => (
                  <tr key={tag.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedTags.includes(tag.id)}
                        onChange={(e) => handleTagSelect(tag.id, e.target.checked)}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600 rounded"
                      />
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div
                          className="w-4 h-4 rounded-full mr-3 flex-shrink-0"
                          style={{ backgroundColor: tag.color }}
                        ></div>
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                            {tag.name}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {tag.slug}
                          </div>
                          {tag.title && (
                            <div className="text-xs text-blue-600 dark:text-blue-400 truncate mt-1">
                              SEO: {tag.title}
                            </div>
                          )}
                          {/* Show description on mobile when description column is hidden */}
                          <div className="md:hidden text-xs text-gray-500 dark:text-gray-400 truncate mt-1">
                            {tag.description || ''}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="hidden md:table-cell px-3 sm:px-6 py-4">
                      <div className="text-sm text-gray-900 dark:text-gray-100 max-w-xs truncate">
                        {tag.description || '-'}
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200">
                        <span className="hidden sm:inline">{tag.usage_count} bài viết</span>
                        <span className="sm:hidden">{tag.usage_count}</span>
                      </span>
                    </td>
                    <td className="hidden lg:table-cell px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(tag.created_at).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-1 sm:space-x-2">
                        <button
                          onClick={() => setEditingTag(tag)}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 p-1"
                          title="Chỉnh sửa"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteTag(tag.id)}
                          disabled={tag.usage_count > 0 || isUpdating}
                          className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed p-1"
                          title={
                            isUpdating
                              ? 'Đang xử lý...'
                              : tag.usage_count > 0
                                ? `Không thể xóa tag đang được sử dụng trong ${tag.usage_count} bài viết`
                                : 'Xóa tag'
                          }
                        >
                          {isUpdating ? (
                            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
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
            {!isLoading && tagsData?.tags.length === 0 && (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">Không có tag nào</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Thử điều chỉnh bộ lọc để xem kết quả khác</p>
              </div>
            )}
          </div>

          {/* Pagination */}
          {tagsData && tagsData.total > limit && (
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  Hiển thị {((currentPage - 1) * limit) + 1} đến {Math.min(currentPage * limit, tagsData.total)} trong tổng số {tagsData.total} tags
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={!tagsData.hasPrev}
                    className="px-3 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Trước
                  </button>

                  <span className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Trang {currentPage}
                  </span>

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={!tagsData.hasNext}
                    className="px-3 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Sau
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

      {/* Tag Modal */}
      <TagModal
        isOpen={showCreateModal || !!editingTag}
        onClose={() => {
          setShowCreateModal(false);
          setEditingTag(null);
        }}
        onSuccess={async () => {
          await fetchTags(currentPage);
          await fetchStats();
        }}
        onOptimisticUpdate={(updatedTag) => {
          if (tagsData && editingTag) {
            const updatedTags = tagsData.tags.map(tag =>
              tag.id === editingTag.id ? { ...tag, ...updatedTag } : tag
            );
            setTagsData({ ...tagsData, tags: updatedTags });
          }
        }}
        tag={editingTag}
      />
    </div>
  );
}
