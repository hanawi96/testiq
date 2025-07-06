import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MediaService } from '../../../../backend';
import type { MediaFile, MediaFolder, MediaStats, MediaFilters, MediaListResponse } from '../../../../backend';
import UploadModal from './UploadModal';

export default function AdminMedia() {
  const [mediaData, setMediaData] = useState<MediaListResponse | null>(null);
  const [stats, setStats] = useState<MediaStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<MediaFilters>({
    file_type: 'all',
    search: '',
    sort_by: 'uploaded_at',
    sort_order: 'desc',
    view_mode: 'grid'
  });
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<string>('');

  const limit = 20;

  // Fetch media data
  const fetchMedia = useCallback(async (page: number = currentPage) => {
    console.log(`🔍 Fetch media page ${page}`);
    setError('');
    
    try {
      const { data, error: fetchError } = await MediaService.getMediaFiles(page, limit, filters);
      
      if (fetchError || !data) {
        setError('Không thể tải danh sách media');
        return;
      }
      
      console.log(`✅ Loaded media page ${page}`);
      setMediaData(data);
      
    } catch (err) {
      setError('Có lỗi xảy ra khi tải dữ liệu');
    }
  }, [currentPage, filters]);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const { data: statsData, error: statsError } = await MediaService.getStats();
      if (!statsError && statsData) {
        setStats(statsData);
      }
    } catch (err) {
      console.warn('Could not fetch media stats:', err);
    }
  }, []);

  // Initial load
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([
        fetchMedia(1),
        fetchStats()
      ]);
      setIsLoading(false);
    };
    
    loadData();
  }, [filters]);

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchMedia(page);
  };

  // Handle filter change
  const handleFilterChange = (newFilters: Partial<MediaFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setCurrentPage(1);
  };

  // Handle file selection
  const handleSelectFile = (fileId: string) => {
    setSelectedFiles(prev => {
      const newSelection = prev.includes(fileId)
        ? prev.filter(id => id !== fileId)
        : [...prev, fileId];
      setShowBulkActions(newSelection.length > 0);
      return newSelection;
    });
  };

  // Handle select all
  const handleSelectAll = () => {
    if (selectedFiles.length === mediaData?.files.length) {
      setSelectedFiles([]);
      setShowBulkActions(false);
    } else {
      const allIds = mediaData?.files.map(f => f.id) || [];
      setSelectedFiles(allIds);
      setShowBulkActions(true);
    }
  };

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (selectedFiles.length === 0) return;
    
    if (!confirm(`Bạn có chắc chắn muốn xóa ${selectedFiles.length} file đã chọn?`)) return;
    
    setIsUpdating(true);
    try {
      const { data: deletedCount, error } = await MediaService.bulkDeleteFiles(selectedFiles);
      if (!error) {
        await fetchMedia(currentPage);
        await fetchStats();
        setSelectedFiles([]);
        setShowBulkActions(false);
        alert(`Đã xóa ${deletedCount} file`);
      } else {
        setError(error.message || 'Không thể xóa file');
      }
    } catch (err) {
      setError('Có lỗi xảy ra khi xóa');
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle delete single file
  const handleDeleteFile = async (fileId: string) => {
    const file = mediaData?.files.find(f => f.id === fileId);
    if (!file) return;

    if (file.usage_count > 0) {
      alert(`Không thể xóa file "${file.name}" vì đang được sử dụng ở ${file.usage_count} nơi`);
      return;
    }

    if (!confirm(`Bạn có chắc chắn muốn xóa file "${file.name}"?`)) return;
    
    setIsUpdating(true);
    try {
      const { error } = await MediaService.deleteFile(fileId);
      if (!error) {
        await fetchMedia(currentPage);
        await fetchStats();
      } else {
        setError('Không thể xóa file');
      }
    } catch (err) {
      setError('Có lỗi xảy ra khi xóa');
    } finally {
      setIsUpdating(false);
    }
  };

  // Get file type icon
  const getFileTypeIcon = (fileType: string, mimeType: string) => {
    switch (fileType) {
      case 'image':
        return '🖼️';
      case 'document':
        if (mimeType.includes('pdf')) return '📄';
        return '📝';
      case 'video':
        return '🎥';
      case 'audio':
        return '🎵';
      default:
        return '📁';
    }
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading && !mediaData) {
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Quản lý Media</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Upload, quản lý hình ảnh và file media</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <span>Upload File</span>
          </button>
        </div>
      </div>

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

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {[
            { 
              title: 'Tổng file', 
              value: stats.totalFiles.toString(), 
              icon: '📁',
              bgColor: 'bg-blue-50 dark:bg-blue-900/30',
              textColor: 'text-blue-600 dark:text-blue-400'
            },
            { 
              title: 'Hình ảnh', 
              value: stats.filesByType.images.toString(), 
              icon: '🖼️',
              bgColor: 'bg-green-50 dark:bg-green-900/30',
              textColor: 'text-green-600 dark:text-green-400'
            },
            { 
              title: 'Tài liệu', 
              value: stats.filesByType.documents.toString(), 
              icon: '📄',
              bgColor: 'bg-yellow-50 dark:bg-yellow-900/30',
              textColor: 'text-yellow-600 dark:text-yellow-400'
            },
            { 
              title: 'Dung lượng', 
              value: stats.storageUsed, 
              icon: '💾',
              bgColor: 'bg-purple-50 dark:bg-purple-900/30',
              textColor: 'text-purple-600 dark:text-purple-400'
            },
            { 
              title: 'Upload gần đây', 
              value: stats.recentUploads.toString(), 
              icon: '⬆️',
              bgColor: 'bg-orange-50 dark:bg-orange-900/30',
              textColor: 'text-orange-600 dark:text-orange-400'
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
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stat.value}</p>
                </div>
                <div className={`w-12 h-12 ${stat.bgColor} rounded-lg flex items-center justify-center ${stat.textColor}`}>
                  <span className="text-2xl">{stat.icon}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Storage Usage Bar */}
      {stats && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Dung lượng lưu trữ</h3>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {stats.storageUsed} / {stats.storageQuota} ({stats.usagePercentage}%)
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                stats.usagePercentage > 90 ? 'bg-red-500' : 
                stats.usagePercentage > 70 ? 'bg-yellow-500' : 'bg-green-500'
              }`}
              style={{ width: `${Math.min(stats.usagePercentage, 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tìm kiếm</label>
            <input
              type="text"
              value={filters.search || ''}
              onChange={(e) => handleFilterChange({ search: e.target.value })}
              placeholder="Tên file, mô tả, tags..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* File Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Loại file</label>
            <select
              value={filters.file_type || 'all'}
              onChange={(e) => handleFilterChange({ file_type: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">Tất cả</option>
              <option value="image">Hình ảnh</option>
              <option value="document">Tài liệu</option>
              <option value="video">Video</option>
              <option value="audio">Audio</option>
            </select>
          </div>

          {/* Sort By */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Sắp xếp theo</label>
            <select
              value={filters.sort_by || 'uploaded_at'}
              onChange={(e) => handleFilterChange({ sort_by: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="uploaded_at">Ngày upload</option>
              <option value="name">Tên file</option>
              <option value="size">Kích thước</option>
              <option value="usage_count">Lượt sử dụng</option>
            </select>
          </div>

          {/* Sort Order */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Thứ tự</label>
            <select
              value={filters.sort_order || 'desc'}
              onChange={(e) => handleFilterChange({ sort_order: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="desc">Giảm dần</option>
              <option value="asc">Tăng dần</option>
            </select>
          </div>

          {/* View Mode */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Hiển thị</label>
            <div className="flex rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden">
              <button
                onClick={() => handleFilterChange({ view_mode: 'grid' })}
                className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${
                  filters.view_mode === 'grid'
                    ? 'bg-primary-600 text-white'
                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                }`}
              >
                <svg className="w-4 h-4 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                onClick={() => handleFilterChange({ view_mode: 'list' })}
                className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${
                  filters.view_mode === 'list'
                    ? 'bg-primary-600 text-white'
                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                }`}
              >
                <svg className="w-4 h-4 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bulk Actions Container */}
      <div className="relative">
        <AnimatePresence mode="wait">
          {showBulkActions && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{
                opacity: 1,
                y: 0,
                scale: 1,
                transition: {
                  type: "spring",
                  stiffness: 400,
                  damping: 30,
                  mass: 0.8,
                  opacity: { duration: 0.2, ease: "easeOut" },
                  y: { type: "spring", stiffness: 400, damping: 30 },
                  scale: { type: "spring", stiffness: 400, damping: 30 }
                }
              }}
              exit={{
                opacity: 0,
                y: -15,
                scale: 0.95,
                transition: {
                  duration: 0.2,
                  ease: [0.4, 0.0, 1, 1],
                  opacity: { duration: 0.15 },
                  y: { duration: 0.2, ease: [0.4, 0.0, 1, 1] },
                  scale: { duration: 0.2, ease: [0.4, 0.0, 1, 1] }
                }
              }}
              className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg overflow-hidden mb-4 shadow-sm"
              style={{ willChange: 'transform, opacity' }}
              layout
            >
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                      Đã chọn {selectedFiles.length} file
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedFiles([]);
                      setShowBulkActions(false);
                    }}
                    disabled={isUpdating}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    Bỏ chọn
                  </button>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleBulkDelete}
                    disabled={isUpdating}
                    className="flex items-center space-x-2 px-3 py-1 bg-red-600 hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed text-white text-sm rounded-md transition-all duration-200"
                  >
                    {isUpdating ? (
                      <>
                        <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Đang xóa...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        <span>Xóa đã chọn</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>

      {/* Media Grid/List */}
      {mediaData && (
        <motion.div
          layout
          transition={{ type: "spring", stiffness: 400, damping: 30, mass: 0.8 }}
          className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Media Files ({mediaData.total.toLocaleString()})
              </h3>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={selectedFiles.length === mediaData.files.length && mediaData.files.length > 0}
                  onChange={handleSelectAll}
                  className="rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">Chọn tất cả</span>
              </div>
            </div>
          </div>

          {mediaData.files.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">Không có file nào</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Thử điều chỉnh bộ lọc hoặc upload file mới</p>
            </div>
          ) : (
            <div className="p-6">
              {filters.view_mode === 'grid' ? (
                // Grid View
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {mediaData.files.map((file) => (
                    <motion.div
                      key={file.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="relative group bg-gray-50 dark:bg-gray-700 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600 hover:border-primary-300 dark:hover:border-primary-600"
                    >
                      {/* Selection Checkbox */}
                      <div className="absolute top-2 left-2 z-10">
                        <input
                          type="checkbox"
                          checked={selectedFiles.includes(file.id)}
                          onChange={() => handleSelectFile(file.id)}
                          className="rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500 bg-white dark:bg-gray-800"
                        />
                      </div>

                      {/* File Preview */}
                      <div className="aspect-square flex items-center justify-center p-4">
                        {file.file_type === 'image' ? (
                          <img
                            src={file.thumbnail_url || file.url}
                            alt={file.alt_text || file.name}
                            className="w-full h-full object-cover rounded"
                          />
                        ) : (
                          <div className="text-4xl">
                            {getFileTypeIcon(file.file_type, file.mime_type)}
                          </div>
                        )}
                      </div>

                      {/* File Info */}
                      <div className="p-3 border-t border-gray-200 dark:border-gray-600">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate" title={file.name}>
                          {file.name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {formatFileSize(file.size)}
                          {file.width && file.height && (
                            <span className="ml-1">• {file.width}×{file.height}</span>
                          )}
                        </div>
                        <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                          {formatDate(file.uploaded_at)}
                        </div>
                      </div>

                      {/* Actions Overlay */}
                      <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center space-x-2">
                        <button
                          onClick={() => window.open(file.url, '_blank')}
                          className="p-2 bg-white dark:bg-gray-800 rounded-full text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          title="Xem"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => navigator.clipboard.writeText(file.url)}
                          className="p-2 bg-white dark:bg-gray-800 rounded-full text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          title="Copy URL"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteFile(file.id)}
                          disabled={isUpdating || file.usage_count > 0}
                          className="p-2 bg-white dark:bg-gray-800 rounded-full text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                          title={file.usage_count > 0 ? `Đang được sử dụng (${file.usage_count})` : "Xóa"}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                // List View
                <div className="space-y-2">
                  {mediaData.files.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedFiles.includes(file.id)}
                        onChange={() => handleSelectFile(file.id)}
                        className="rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500"
                      />

                      <div className="w-12 h-12 flex items-center justify-center bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-600">
                        {file.file_type === 'image' ? (
                          <img
                            src={file.thumbnail_url || file.url}
                            alt={file.alt_text || file.name}
                            className="w-full h-full object-cover rounded"
                          />
                        ) : (
                          <span className="text-xl">
                            {getFileTypeIcon(file.file_type, file.mime_type)}
                          </span>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                          {file.name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {formatFileSize(file.size)}
                          {file.width && file.height && (
                            <span className="ml-2">• {file.width}×{file.height}</span>
                          )}
                          <span className="ml-2">• {formatDate(file.uploaded_at)}</span>
                          {file.usage_count > 0 && (
                            <span className="ml-2">• Sử dụng: {file.usage_count}</span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => window.open(file.url, '_blank')}
                          className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                          title="Xem"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => navigator.clipboard.writeText(file.url)}
                          className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                          title="Copy URL"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteFile(file.id)}
                          disabled={isUpdating || file.usage_count > 0}
                          className="p-2 text-red-400 hover:text-red-600 disabled:opacity-50"
                          title={file.usage_count > 0 ? `Đang được sử dụng (${file.usage_count})` : "Xóa"}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Pagination */}
          {mediaData.totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  Hiển thị {((currentPage - 1) * limit) + 1} - {Math.min(currentPage * limit, mediaData.total)}
                  trong tổng số {mediaData.total.toLocaleString()} file
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={!mediaData.hasPrev}
                    className="px-3 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Trước
                  </button>

                  <span className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Trang {currentPage} / {mediaData.totalPages}
                  </span>

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={!mediaData.hasNext}
                    className="px-3 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Sau
                  </button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Upload Modal */}
      <UploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onSuccess={async () => {
          await fetchMedia(currentPage);
          await fetchStats();
        }}
      />
    </div>
  );
}
