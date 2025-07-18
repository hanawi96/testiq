import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  Search,
  Filter,
  Grid3X3,
  List,
  Eye,
  Copy,
  Trash2,
  Download,
  Edit3,
  Loader2,
  CheckSquare,
  Square,
  Crop
} from 'lucide-react';
import UploadModal from './UploadModal';
import MediaEditModal from './MediaEditModal';
import ImageCropper from '../../ui/ImageCropper';
import { MediaAPI } from '../../../services/media-api';

interface MediaFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  created_at: string;
  updated_at: string;
  metadata?: {
    width?: number;
    height?: number;
    duration?: number;
  };
  // Extended metadata for editing
  title?: string;
  description?: string;
  alt_text?: string;
  tags?: string[];
  subject?: string;
  rating?: string;
  comments?: string;
  origin?: string;
  authors?: string;
  date_taken?: string;
  program_name?: string;
  date_acquired?: string;
  copyright?: string;
}

interface MediaListResponse {
  files: MediaFile[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

type ViewMode = 'grid' | 'list';
type FileType = 'all' | 'image' | 'video' | 'document';
type SortBy = 'name' | 'size' | 'created_at';
type SortOrder = 'asc' | 'desc';

export default function MediaManager() {
  const [mediaData, setMediaData] = useState<MediaListResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingFile, setEditingFile] = useState<MediaFile | null>(null);
  const [showCropModal, setShowCropModal] = useState(false);
  const [croppingFile, setCroppingFile] = useState<MediaFile | null>(null);
  const [loadingFiles, setLoadingFiles] = useState<Set<string>>(new Set());
  const [renamingFiles, setRenamingFiles] = useState<Set<string>>(new Set());
  const [optimisticNames, setOptimisticNames] = useState<Map<string, string>>(new Map());

  // Filters
  const [search, setSearch] = useState('');
  const [fileType, setFileType] = useState<FileType>('all');
  const [sortBy, setSortBy] = useState<SortBy>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  const limit = 20;

  // Fetch media data
  const fetchMedia = useCallback(async (page: number = currentPage) => {
    setError('');
    setIsLoading(true);
    
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        search,
        type: fileType,
        sortBy,
        sortOrder
      });

      const response = await fetch(`/api/admin/media?${params}`);
      const result = await response.json();
      
      if (!result.success) {
        setError(result.error || 'Không thể tải danh sách media');
        return;
      }
      
      setMediaData(result.data);
      
    } catch (err) {
      setError('Có lỗi xảy ra khi tải dữ liệu');
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, search, fileType, sortBy, sortOrder]);

  // Initial load and when filters change
  useEffect(() => {
    fetchMedia(1);
    setCurrentPage(1);
  }, [search, fileType, sortBy, sortOrder]);

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchMedia(page);
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
      const response = await fetch('/api/admin/media', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePaths: selectedFiles })
      });

      const result = await response.json();
      
      if (result.success) {
        await fetchMedia(currentPage);
        setSelectedFiles([]);
        setShowBulkActions(false);
        alert(result.message);
      } else {
        setError(result.error || 'Không thể xóa file');
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

    if (!confirm(`Bạn có chắc chắn muốn xóa file "${file.name}"?`)) return;
    
    setIsUpdating(true);
    try {
      const response = await fetch('/api/admin/media', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePaths: [fileId] })
      });

      const result = await response.json();
      
      if (result.success) {
        await fetchMedia(currentPage);
      } else {
        setError(result.error || 'Không thể xóa file');
      }
    } catch (err) {
      setError('Có lỗi xảy ra khi xóa');
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle copy URL
  const handleCopyUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      // Could add toast notification here
    } catch (err) {
      console.error('Failed to copy URL:', err);
    }
  };

  // Handle edit file
  const handleEditFile = (file: MediaFile) => {
    setEditingFile(file);
    setShowEditModal(true);
  };

  const handleCropFile = (file: MediaFile) => {
    setCroppingFile(file);
    setShowCropModal(true);
  };

  const handleCropSave = async (croppedImageUrl: string) => {
    if (!croppingFile) return;

    try {
      setIsUpdating(true);

      // Close modal first and start loading animation
      setShowCropModal(false);
      setCroppingFile(null);

      // Add file to loading state
      setLoadingFiles(prev => new Set(prev).add(croppingFile.id));

      // Convert blob URL to file
      const response = await fetch(croppedImageUrl);
      const blob = await response.blob();

      // Keep original file name and path
      const file = new File([blob], croppingFile.name, { type: 'image/jpeg' });

      // Replace file on server with same path and name
      const formData = new FormData();
      formData.append('file', file);
      formData.append('replacePath', croppingFile.id); // Use same path to replace

      const uploadResponse = await fetch('/api/admin/media', {
        method: 'POST',
        body: formData
      });

      const result = await uploadResponse.json();

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Lỗi khi lưu ảnh đã crop');
      }

      console.log('✅ File replaced with cropped version:', result.data.name);

      // Prepare new URL with cache busting
      const now = new Date();
      const timestamp = now.getTime();
      const newUrl = `${croppingFile.url.split('?')[0]}?t=${timestamp}`;

      // Preload the new image to ensure it's ready
      const preloadImage = new Image();
      preloadImage.crossOrigin = 'anonymous';

      await new Promise<void>((resolve) => {
        preloadImage.onload = () => {
          console.log('✅ New image preloaded successfully');
          resolve();
        };

        preloadImage.onerror = () => {
          console.warn('⚠️ Image preload failed, continuing anyway');
          resolve(); // Continue even if preload fails
        };

        // Start preloading
        preloadImage.src = newUrl;

        // Fallback timeout to prevent infinite loading
        setTimeout(() => {
          console.warn('⚠️ Image preload timeout, continuing anyway');
          resolve();
        }, 3000);
      });

      // Update UI with new file data and cache busting
      if (mediaData) {
        const updatedFiles = mediaData.files.map(f => {
          if (f.id === croppingFile.id) {
            return {
              ...f,
              url: newUrl, // Use preloaded URL
              updated_at: now.toISOString()
            };
          }
          return f;
        });

        setMediaData({
          ...mediaData,
          files: updatedFiles
        });

        console.log('✅ UI updated with preloaded image');
      }

      // Remove from loading state - image is now ready
      setLoadingFiles(prev => {
        const newSet = new Set(prev);
        newSet.delete(croppingFile.id);
        return newSet;
      });

      // Clean up blob URL
      URL.revokeObjectURL(croppedImageUrl);

    } catch (error: any) {
      console.error('❌ Error saving cropped image:', error);
      alert(error.message || 'Có lỗi xảy ra khi lưu ảnh đã crop');

      // Remove from loading state on error
      setLoadingFiles(prev => {
        const newSet = new Set(prev);
        newSet.delete(croppingFile.id);
        return newSet;
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle optimistic update for file rename
  const handleOptimisticUpdate = async (fileId: string, newName: string) => {
    if (!editingFile) return;

    try {
      // Set optimistic name and start renaming state
      setOptimisticNames(prev => new Map(prev).set(fileId, newName));
      setRenamingFiles(prev => new Set(prev).add(fileId));

      // Close modal
      setShowEditModal(false);
      setEditingFile(null);

      // Call API in background
      const renameResult = await MediaAPI.renameFile(fileId, newName);

      if (renameResult.error || !renameResult.data) {
        throw new Error(renameResult.error?.message || 'Lỗi khi đổi tên file');
      }

      // Success - preload new image before updating UI
      const updatedFile = renameResult.data!;
      let finalUrl = updatedFile.url;

      // Add cache busting for renamed files
      if (updatedFile.type.startsWith('image/')) {
        const timestamp = new Date().getTime();
        finalUrl = `${updatedFile.url.split('?')[0]}?t=${timestamp}`;

        // Preload the new image
        await new Promise<void>((resolve) => {
          const preloadImage = new Image();
          preloadImage.crossOrigin = 'anonymous';

          preloadImage.onload = () => {
            console.log('✅ Renamed image preloaded successfully');
            resolve();
          };

          preloadImage.onerror = () => {
            console.warn('⚠️ Image preload failed, continuing anyway');
            resolve();
          };

          // Start preloading
          preloadImage.src = finalUrl;

          // Fallback timeout - don't wait too long
          setTimeout(() => {
            console.warn('⚠️ Image preload timeout, continuing anyway');
            resolve();
          }, 2000);
        });
      }

      // Update with real data from API (with preloaded URL)
      if (mediaData) {
        const updatedFiles = mediaData.files.map(file =>
          file.id === fileId ? {
            ...file, // Keep all original data (size, type, etc.)
            id: updatedFile.id, // New id from API
            name: updatedFile.name, // New name from API
            url: finalUrl, // Preloaded URL with cache busting
            updated_at: new Date().toISOString()
          } : file
        );
        setMediaData({
          ...mediaData,
          files: updatedFiles
        });
      }

      // Wait a tiny bit for React to update the DOM, then clear optimistic state
      await new Promise(resolve => setTimeout(resolve, 50));

      // Clear optimistic state after UI is updated and image is ready
      setOptimisticNames(prev => {
        const newMap = new Map(prev);
        newMap.delete(fileId);
        return newMap;
      });
      setRenamingFiles(prev => {
        const newSet = new Set(prev);
        newSet.delete(fileId);
        return newSet;
      });

      console.log('✅ File rename completed with preloaded image');

    } catch (error: any) {
      console.error('❌ Error renaming file:', error);

      // Wait a tiny bit before showing error (for better UX)
      await new Promise(resolve => setTimeout(resolve, 300));

      // Revert optimistic update
      setOptimisticNames(prev => {
        const newMap = new Map(prev);
        newMap.delete(fileId);
        return newMap;
      });
      setRenamingFiles(prev => {
        const newSet = new Set(prev);
        newSet.delete(fileId);
        return newSet;
      });

      // Show error
      setError(error.message || 'Có lỗi xảy ra khi đổi tên file');

      // Auto-hide error after 5 seconds
      setTimeout(() => {
        setError('');
      }, 5000);
    }
  };

  // Get file type icon
  const getFileTypeIcon = (type: string) => {
    if (type.startsWith('image/')) return '🖼️';
    if (type.startsWith('video/')) return '🎥';
    if (type.includes('pdf')) return '📄';
    return '📁';
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
          <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
          <span className="text-gray-600 dark:text-gray-400 font-medium">Đang tải...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Error */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4"
        >
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Toolbar */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          {/* Left side - Search and Filters */}
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm kiếm file..."
                className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent w-full sm:w-64"
              />
            </div>

            {/* File Type Filter */}
            <select
              value={fileType}
              onChange={(e) => setFileType(e.target.value as FileType)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">Tất cả file</option>
              <option value="image">Hình ảnh</option>
              <option value="video">Video</option>
              <option value="document">Tài liệu</option>
            </select>

            {/* Sort */}
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [newSortBy, newSortOrder] = e.target.value.split('-') as [SortBy, SortOrder];
                setSortBy(newSortBy);
                setSortOrder(newSortOrder);
              }}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="created_at-desc">Mới nhất</option>
              <option value="created_at-asc">Cũ nhất</option>
              <option value="name-asc">Tên A-Z</option>
              <option value="name-desc">Tên Z-A</option>
              <option value="size-desc">Kích thước lớn</option>
              <option value="size-asc">Kích thước nhỏ</option>
            </select>
          </div>

          {/* Right side - View mode and Upload */}
          <div className="flex items-center space-x-3">
            {/* View Mode Toggle */}
            <div className="flex rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 ${
                  viewMode === 'grid'
                    ? 'bg-primary-600 text-white'
                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                }`}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 ${
                  viewMode === 'list'
                    ? 'bg-primary-600 text-white'
                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            {/* Upload Button */}
            <button
              onClick={() => setShowUploadModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
            >
              <Upload className="w-4 h-4" />
              <span>Upload</span>
            </button>
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
                <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Đã chọn {selectedFiles.length} file
                </span>
                <button
                  onClick={() => {
                    setSelectedFiles([]);
                    setShowBulkActions(false);
                  }}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
                >
                  Bỏ chọn
                </button>
              </div>
              <button
                onClick={handleBulkDelete}
                disabled={isUpdating}
                className="flex items-center space-x-2 px-3 py-1 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white text-sm rounded-md transition-colors"
              >
                {isUpdating ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Trash2 className="w-3 h-3" />
                )}
                <span>{isUpdating ? 'Đang xóa...' : 'Xóa đã chọn'}</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Media Grid/List */}
      {mediaData && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Media Files ({mediaData.total.toLocaleString()})
              </h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleSelectAll}
                  className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                >
                  {selectedFiles.length === mediaData.files.length && mediaData.files.length > 0 ? (
                    <CheckSquare className="w-4 h-4" />
                  ) : (
                    <Square className="w-4 h-4" />
                  )}
                  <span>Chọn tất cả</span>
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          {mediaData.files.length === 0 ? (
            <div className="text-center py-12">
              <Upload className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">Không có file nào</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Thử điều chỉnh bộ lọc hoặc upload file mới</p>
            </div>
          ) : (
            <div className="p-6">
              {viewMode === 'grid' ? (
                // Grid View
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                  {mediaData.files.map((file) => (
                    <motion.div
                      key={file.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="relative group bg-gray-50 dark:bg-gray-700 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600 hover:border-primary-300 dark:hover:border-primary-600 transition-colors"
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
                      <div className="aspect-square flex items-center justify-center p-4 relative">
                        {file.type.startsWith('image/') ? (
                          <>
                            <img
                              src={file.url}
                              alt={file.name}
                              className="w-full h-full object-cover rounded"
                              loading="lazy"
                              key={`${file.url}-${file.updated_at}`} // Force re-render when URL or updated_at changes
                            />
                            {/* Loading Overlay */}
                            {loadingFiles.has(file.id) && (
                              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded">
                                <div className="flex flex-col items-center space-y-2">
                                  <div className="w-8 h-8 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                                  <span className="text-white text-xs font-medium">Đang cập nhật...</span>
                                </div>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="text-4xl">
                            {getFileTypeIcon(file.type)}
                          </div>
                        )}
                      </div>

                      {/* File Info */}
                      <div className="p-3 border-t border-gray-200 dark:border-gray-600">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate flex items-center space-x-2" title={optimisticNames.get(file.id) || file.name}>
                          <span className="flex-1 truncate">
                            {optimisticNames.get(file.id) || file.name}
                          </span>
                          {renamingFiles.has(file.id) && (
                            <div className="flex items-center space-x-1 text-blue-600 dark:text-blue-400">
                              <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                              <span className="text-xs">Đang cập nhật...</span>
                            </div>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {formatFileSize(file.size)}
                          {file.metadata?.width && file.metadata?.height && (
                            <span className="ml-1">• {file.metadata.width}×{file.metadata.height}</span>
                          )}
                        </div>
                        <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                          {formatDate(file.created_at)}
                        </div>
                      </div>

                      {/* Actions Overlay */}
                      <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center space-x-2">
                        <button
                          onClick={() => window.open(file.url, '_blank')}
                          className="p-2 bg-white dark:bg-gray-800 rounded-full text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          title="Xem"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEditFile(file)}
                          className="p-2 bg-white dark:bg-gray-800 rounded-full text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                          title="Chỉnh sửa"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        {file.type.startsWith('image/') && (
                          <button
                            onClick={() => handleCropFile(file)}
                            className="p-2 bg-white dark:bg-gray-800 rounded-full text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
                            title="Crop ảnh"
                          >
                            <Crop className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleCopyUrl(file.url)}
                          className="p-2 bg-white dark:bg-gray-800 rounded-full text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          title="Copy URL"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteFile(file.id)}
                          disabled={isUpdating}
                          className="p-2 bg-white dark:bg-gray-800 rounded-full text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                          title="Xóa"
                        >
                          <Trash2 className="w-4 h-4" />
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

                      <div className="w-12 h-12 flex items-center justify-center bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-600 relative">
                        {file.type.startsWith('image/') ? (
                          <>
                            <img
                              src={file.url}
                              alt={file.name}
                              className="w-full h-full object-cover rounded"
                              loading="lazy"
                              key={`${file.url}-${file.updated_at}`} // Force re-render when URL or updated_at changes
                            />
                            {/* Loading Overlay for List View */}
                            {loadingFiles.has(file.id) && (
                              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded">
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              </div>
                            )}
                          </>
                        ) : (
                          <span className="text-xl">
                            {getFileTypeIcon(file.type)}
                          </span>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate flex items-center space-x-2">
                          <span className="flex-1 truncate">
                            {optimisticNames.get(file.id) || file.name}
                          </span>
                          {renamingFiles.has(file.id) && (
                            <div className="flex items-center space-x-1 text-blue-600 dark:text-blue-400">
                              <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                              <span className="text-xs">Đang cập nhật...</span>
                            </div>
                          )}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {formatFileSize(file.size)}
                          {file.metadata?.width && file.metadata?.height && (
                            <span className="ml-2">• {file.metadata.width}×{file.metadata.height}</span>
                          )}
                          <span className="ml-2">• {formatDate(file.created_at)}</span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => window.open(file.url, '_blank')}
                          className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                          title="Xem"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleCopyUrl(file.url)}
                          className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                          title="Copy URL"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteFile(file.id)}
                          disabled={isUpdating}
                          className="p-2 text-red-400 hover:text-red-600 disabled:opacity-50"
                          title="Xóa"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Pagination */}
          {mediaData.total > limit && (
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  Hiển thị {((currentPage - 1) * limit) + 1} - {Math.min(currentPage * limit, mediaData.total)}
                  trong tổng số {mediaData.total.toLocaleString()} file
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Trước
                  </button>

                  <span className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Trang {currentPage} / {Math.ceil(mediaData.total / limit)}
                  </span>

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={!mediaData.hasMore}
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

      {/* Upload Modal */}
      <UploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onSuccess={async () => {
          console.log('📤 Upload success, refreshing media list...');
          // Refresh media list immediately
          await fetchMedia(currentPage);
          console.log('✅ Media list refreshed');
        }}
      />

      {/* Edit Modal */}
      <MediaEditModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingFile(null);
        }}
        file={editingFile}
        onOptimisticUpdate={handleOptimisticUpdate}
      />

      {/* Crop Modal */}
      {showCropModal && croppingFile && (
        <ImageCropper
          imageUrl={croppingFile.url}
          onCrop={handleCropSave}
          onCancel={() => {
            setShowCropModal(false);
            setCroppingFile(null);
          }}
          initialAspectRatio={null}
        />
      )}
    </div>
  );
}
