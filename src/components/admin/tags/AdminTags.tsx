import React, { useState, useEffect, useCallback } from 'react';
import { TagsService } from '../../../../backend';
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

  // Fetch tags data
  const fetchTags = useCallback(async (page: number = currentPage) => {
    console.log(`🔍 Fetch tags page ${page}`);
    setError('');

    try {
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
    setSelectedTags(prev => 
      checked 
        ? [...prev, tagId]
        : prev.filter(id => id !== tagId)
    );
  };

  // Handle select all
  const handleSelectAll = (checked: boolean) => {
    if (checked && tagsData) {
      setSelectedTags(tagsData.tags.map(tag => tag.id));
    } else {
      setSelectedTags([]);
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



  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Quản lý Tags
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Quản lý tags cho bài viết
        </p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
        </div>
      )}

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

      {/* Tags Table */}
      {tagsData && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Danh sách tags ({tagsData.total.toLocaleString()})
              </h3>
              <div>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="flex items-center justify-center w-10 h-10 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
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
                      checked={selectedTags.length === tagsData.tags.length && tagsData.tags.length > 0}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="rounded border-gray-300 dark:border-gray-600"
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
                {tagsData.tags.map((tag) => (
                  <tr key={tag.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedTags.includes(tag.id)}
                        onChange={(e) => handleTagSelect(tag.id, e.target.checked)}
                        className="rounded border-gray-300 dark:border-gray-600"
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
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {tagsData.total > limit && (
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
      )}

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
