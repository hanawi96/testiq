import React, { useState, useCallback, useEffect } from 'react';
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
import { useMediaQuery, clearMediaCache } from '../../../hooks/useMediaQuery';

// Local types to avoid import issues
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

type ViewMode = 'grid' | 'list';
type FileType = 'all' | 'image' | 'video' | 'document';
type SortBy = 'name' | 'size' | 'created_at';
type SortOrder = 'asc' | 'desc';

export default function MediaManager() {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingFile, setEditingFile] = useState<MediaFile | null>(null);
  const [showCropModal, setShowCropModal] = useState(false);
  const [croppingFile, setCroppingFile] = useState<MediaFile | null>(null);

  const [renamingFiles, setRenamingFiles] = useState<Set<string>>(new Set());
  const [croppingFiles, setCroppingFiles] = useState<Set<string>>(new Set());
  const [uploadingFiles, setUploadingFiles] = useState<Map<string, {
    name: string;
    progress: number;
    preview?: string;
    file: File;
    uploadedFile?: MediaFile; // Real uploaded file data
    isCompleted?: boolean; // Simple: true = show real image, false = show loading
  }>>(new Map());

  // Filters
  const [search, setSearch] = useState('');
  const [fileType, setFileType] = useState<FileType>('all');
  const [sortBy, setSortBy] = useState<SortBy>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  const limit = 20;

  // Use optimized media query hook
  const { data: mediaData, isLoading, error, refetch } = useMediaQuery({
    page: currentPage,
    limit,
    search,
    type: fileType === 'all' ? undefined : fileType,
    sortBy,
    sortOrder
  });

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, fileType, sortBy, sortOrder]);

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
        clearMediaCache(); // Clear cache to force refresh
        await refetch();
        setSelectedFiles([]);
        setShowBulkActions(false);
        alert(result.message);
      } else {
        alert(result.error || 'Không thể xóa file');
      }
    } catch (err) {
      alert('Có lỗi xảy ra khi xóa');
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle delete single file
  const handleDeleteFile = async (fileId: string) => {
    // Check if file is in uploadingFiles (newly uploaded)
    const uploadingFile = Array.from(uploadingFiles.entries()).find(([_, data]) =>
      data.uploadedFile?.id === fileId
    );

    // Check if file is in mediaData (existing files)
    const file = mediaData?.files.find(f => f.id === fileId);

    if (!uploadingFile && !file) return;

    const fileName = uploadingFile?.[1].uploadedFile?.name || file?.name || 'file';
    if (!confirm(`Bạn có chắc chắn muốn xóa file "${fileName}"?`)) return;

    setIsUpdating(true);
    try {
      const response = await fetch('/api/admin/media', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePaths: [fileId] })
      });

      const result = await response.json();

      if (result.success) {
        // Remove from uploadingFiles if it's a newly uploaded file
        if (uploadingFile) {
          const [tempId, uploadData] = uploadingFile;
          setUploadingFiles(prev => {
            const newMap = new Map(prev);
            if (uploadData.preview) {
              URL.revokeObjectURL(uploadData.preview);
            }
            newMap.delete(tempId);
            return newMap;
          });

          // Clear cache to refresh data
          clearMediaCache();
        } else {
          // Refresh for existing files
          clearMediaCache();
          await refetch();
        }
      } else {
        alert(result.error || 'Không thể xóa file');
      }
    } catch (err) {
      alert('Có lỗi xảy ra khi xóa');
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

      // Add file to cropping state
      setCroppingFiles(prev => new Set(prev).add(croppingFile.id));

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

      // Update file in uploadingFiles (for newly uploaded files)
      setUploadingFiles(prev => {
        const newMap = new Map(prev);
        for (const [tempId, uploadData] of newMap.entries()) {
          if (uploadData.uploadedFile?.id === croppingFile.id) {
            newMap.set(tempId, {
              ...uploadData,
              uploadedFile: {
                ...uploadData.uploadedFile,
                url: newUrl,
                updated_at: now.toISOString()
              }
            });
            break;
          }
        }
        return newMap;
      });

      // Clear cache to refresh data
      clearMediaCache();

      // Remove from cropping state - image is now ready
      setCroppingFiles(prev => {
        const newSet = new Set(prev);
        newSet.delete(croppingFile.id);
        return newSet;
      });

      // Clean up blob URL
      URL.revokeObjectURL(croppedImageUrl);

    } catch (error: any) {
      console.error('❌ Error saving cropped image:', error);
      alert(error.message || 'Có lỗi xảy ra khi lưu ảnh đã crop');

      // Remove from cropping state on error
      setCroppingFiles(prev => {
        const newSet = new Set(prev);
        newSet.delete(croppingFile.id);
        return newSet;
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle optimistic upload start
  const handleUploadStart = (files: File[]) => {
    const newUploading = new Map(uploadingFiles);
    const fileMap = new Map<string, string>(); // filename -> tempId mapping

    files.forEach(file => {
      const tempId = `temp-${Date.now()}-${Math.random()}`;
      const preview = file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined;
      newUploading.set(tempId, {
        name: file.name,
        progress: 0,
        preview,
        file
      });
      fileMap.set(file.name, tempId);
    });

    setUploadingFiles(newUploading);
    setShowUploadModal(false); // Close modal immediately

    // Start background upload
    uploadFilesBackground(files, fileMap);
  };

  // Background upload process
  const uploadFilesBackground = async (files: File[], fileMap: Map<string, string>) => {
    for (const file of files) {
      const tempId = fileMap.get(file.name);
      if (!tempId) continue;

      try {
        // Update progress during upload
        const result = await MediaAPI.uploadFile(file, 'media', (progress) => {
          setUploadingFiles(prev => {
            const newMap = new Map(prev);
            const fileData = newMap.get(tempId);
            if (fileData) {
              newMap.set(tempId, { ...fileData, progress });
            }
            return newMap;
          });
        });

        if (result.error || !result.data) {
          throw new Error(result.error?.message || 'Upload failed');
        }

        // Success - start smooth transition
        const uploadedFile = result.data;



        // Step 2: Preload the uploaded image if it's an image
        if (uploadedFile.type.startsWith('image/')) {
          await new Promise<void>((resolve) => {
            const img = new Image();
            img.onload = () => resolve();
            img.onerror = () => resolve(); // Continue even if preload fails
            img.src = uploadedFile.url;

            // Timeout fallback
            setTimeout(() => resolve(), 2000);
          });
        }

        // Step 3: Transform loading card into real image - KEEP IT PERMANENTLY
        setUploadingFiles(prev => {
          const newMap = new Map(prev);
          const uploadData = newMap.get(tempId);
          if (uploadData) {
            newMap.set(tempId, {
              ...uploadData,
              uploadedFile,
              isCompleted: true // Transform to real image, stay forever
            });
          }
          return newMap;
        });

        // Clear cache to refresh data
        clearMediaCache();

        // No removal - loading card becomes permanent file display!

      } catch (error: any) {
        console.error('❌ Upload error:', error);

        // Remove failed upload from optimistic state
        setUploadingFiles(prev => {
          const newMap = new Map(prev);
          // Clean up preview URL
          const uploadData = newMap.get(tempId);
          if (uploadData?.preview) {
            URL.revokeObjectURL(uploadData.preview);
          }
          newMap.delete(tempId);
          return newMap;
        });

        // Show error
        alert(error.message || 'Có lỗi xảy ra khi upload file');
      }
    }
  };

  // Handle optimistic update for file rename
  const handleOptimisticUpdate = async (fileId: string, newName: string) => {
    if (!editingFile) return;

    try {
      // Close modal
      setShowEditModal(false);
      setEditingFile(null);

      // Start loading state
      setRenamingFiles(prev => new Set(prev).add(fileId));

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

      // Update file in uploadingFiles (for newly uploaded files)
      setUploadingFiles(prev => {
        const newMap = new Map(prev);
        for (const [tempId, uploadData] of newMap.entries()) {
          if (uploadData.uploadedFile?.id === fileId) {
            newMap.set(tempId, {
              ...uploadData,
              uploadedFile: {
                ...uploadData.uploadedFile,
                id: updatedFile.id,
                name: updatedFile.name,
                url: finalUrl,
                updated_at: new Date().toISOString()
              }
            });
            break;
          }
        }
        return newMap;
      });

      // Clear cache to refresh data
      clearMediaCache();

      // Clear loading state
      setRenamingFiles(prev => {
        const newSet = new Set(prev);
        newSet.delete(fileId);
        return newSet;
      });

      console.log('✅ File rename completed');

    } catch (error: any) {
      console.error('❌ Error renaming file:', error);

      // Clear loading state
      setRenamingFiles(prev => {
        const newSet = new Set(prev);
        newSet.delete(fileId);
        return newSet;
      });

      // Wait a tiny bit before showing error (for better UX)
      await new Promise(resolve => setTimeout(resolve, 300));

      // Show error
      alert(error.message || 'Có lỗi xảy ra khi đổi tên file');
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

  // Skeleton loading component
  const SkeletonGrid = () => (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="relative group bg-gray-50 dark:bg-gray-700 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600 animate-pulse">
          <div className="aspect-square bg-gray-200 dark:bg-gray-600"></div>
          <div className="p-3 space-y-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-3/4"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-1/2"></div>
          </div>
        </div>
      ))}
    </div>
  );

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
              className="flex items-center space-x-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium"
            >
              <Upload className="w-4 h-4" />
              <span>Upload</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {showBulkActions && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
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
                className="flex items-center space-x-2 px-3 py-1 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white text-sm rounded-md"
              >
                {isUpdating ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Trash2 className="w-3 h-3" />
                )}
                <span>{isUpdating ? 'Đang xóa...' : 'Xóa đã chọn'}</span>
              </button>
            </div>
          </div>
        )}

      {/* Media Grid/List - Always show container */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Header - Thiết kế mới giống ảnh */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Icon với background màu hồng */}
              <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
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
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  <circle cx="9" cy="9" r="2"/>
                  <path d="M21 15l-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
                </svg>
              </div>

              {/* Tiêu đề và mô tả */}
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  Media Files
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                  Quản lý {mediaData ? mediaData.total.toLocaleString() : '0'} tệp media và hình ảnh
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-2">
              <button
                onClick={handleSelectAll}
                disabled={!mediaData}
                className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 disabled:opacity-50 px-3 py-1.5 rounded-lg hover:bg-white/50 dark:hover:bg-gray-700/50 transition-colors"
              >
                {mediaData && selectedFiles.length === mediaData.files.length && mediaData.files.length > 0 ? (
                  <CheckSquare className="w-4 h-4" />
                ) : (
                  <Square className="w-4 h-4" />
                )}
                <span>Chọn tất cả</span>
              </button>

              <button
                onClick={() => setShowUploadModal(true)}
                className="flex items-center justify-center w-10 h-10 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors shadow-lg hover:shadow-xl"
                title="Upload media mới"
              >
                <Upload className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

          {/* Content - Progressive Loading */}
          <div className="p-6">
            {viewMode === 'grid' ? (
              // Grid View
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                  {/* Uploading Files */}
                  <AnimatePresence>
                    {Array.from(uploadingFiles.entries()).map(([tempId, uploadData]) => (
                    <motion.div
                      key={tempId}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className={uploadData.isCompleted
                        ? "relative group bg-gray-50 dark:bg-gray-700 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600 hover:border-primary-300 dark:hover:border-primary-600"
                        : "relative bg-white dark:bg-gray-800 rounded-xl overflow-hidden border-2 border-dashed border-blue-300 dark:border-blue-600 shadow-lg"
                      }
                    >
                      {/* Selection Checkbox for completed uploads - Hidden by default, visible on hover or when selected */}
                      {uploadData.isCompleted && uploadData.uploadedFile && (
                        <div className={`absolute top-2 left-2 z-10 transition-opacity duration-200 ${
                          selectedFiles.includes(uploadData.uploadedFile.id)
                            ? 'opacity-100'
                            : 'opacity-0 group-hover:opacity-100'
                        }`}>
                          <input
                            type="checkbox"
                            checked={selectedFiles.includes(uploadData.uploadedFile.id)}
                            onChange={(e) => {
                              e.stopPropagation();
                              handleSelectFile(uploadData.uploadedFile!.id);
                            }}
                            className="w-[17px] h-[17px] rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500 bg-white dark:bg-gray-800 shadow-lg"
                          />
                        </div>
                      )}

                      <div
                        className={`aspect-square flex items-center justify-center p-4 relative ${
                          uploadData.isCompleted && uploadData.uploadedFile ? 'cursor-pointer' : ''
                        }`}
                        onClick={uploadData.isCompleted && uploadData.uploadedFile ? () => handleSelectFile(uploadData.uploadedFile!.id) : undefined}
                        title={uploadData.isCompleted && uploadData.uploadedFile ? "Click để chọn/bỏ chọn" : ""}
                      >
                        {/* Show real image if completed, otherwise loading */}
                        {uploadData.isCompleted && uploadData.uploadedFile ? (
                          <img
                            src={uploadData.uploadedFile.url}
                            alt={uploadData.uploadedFile.name}
                            className="w-full h-full object-cover rounded"
                          />
                        ) : (
                          <>
                            {/* Preview image */}
                            {uploadData.preview && (
                              <img
                                src={uploadData.preview}
                                alt={uploadData.name}
                                className="w-full h-full object-cover rounded"
                              />
                            )}
                            {/* Loading overlay with pulsing effect - always show when not completed */}
                            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center animate-pulse rounded-xl">
                              <div className="text-center">
                                {/* Main spinner */}
                                <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                                <div className="text-white text-xs font-medium animate-pulse">Đang tải lên...</div>
                              </div>
                            </div>
                          </>
                        )}
                      </div>

                      {/* File Info */}
                      <div className="p-3 border-t border-gray-200 dark:border-gray-600">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate flex items-center space-x-2" title={uploadData.uploadedFile?.name || uploadData.name}>
                          <span className="flex-1 truncate">{uploadData.uploadedFile?.name || uploadData.name}</span>
                          {uploadData.uploadedFile && renamingFiles.has(uploadData.uploadedFile.id) && (
                            <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin flex-shrink-0"></div>
                          )}
                          {uploadData.uploadedFile && croppingFiles.has(uploadData.uploadedFile.id) && (
                            <div className="w-3 h-3 border-2 border-green-500 border-t-transparent rounded-full animate-spin flex-shrink-0"></div>
                          )}
                        </div>
                        {uploadData.isCompleted && uploadData.uploadedFile ? (
                          // Show real file info like existing files
                          <>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {formatFileSize(uploadData.uploadedFile.size)}
                              {uploadData.uploadedFile.metadata?.width && uploadData.uploadedFile.metadata?.height && (
                                <span className="ml-1">• {uploadData.uploadedFile.metadata.width}×{uploadData.uploadedFile.metadata.height}</span>
                              )}
                            </div>
                            <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                              {formatDate(uploadData.uploadedFile.created_at)}
                            </div>
                          </>
                        ) : (
                          // Show loading state
                          <div className="text-xs mt-1 flex items-center text-blue-600 dark:text-blue-400">
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse mr-2"></div>
                            Đang tải lên...
                          </div>
                        )}
                      </div>

                      {/* Actions for completed uploads - Visible on hover WITHOUT overlay background */}
                      {uploadData.isCompleted && uploadData.uploadedFile && (
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center space-x-2 pointer-events-none">
                          <div className="flex items-center space-x-2 pointer-events-auto">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(uploadData.uploadedFile!.url, '_blank');
                              }}
                              className="p-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-full text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800 shadow-lg"
                              title="Xem"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditFile(uploadData.uploadedFile!);
                              }}
                              className="p-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-full text-blue-600 hover:bg-white dark:hover:bg-gray-800 shadow-lg"
                              title="Chỉnh sửa"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            {uploadData.uploadedFile.type.startsWith('image/') && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCropFile(uploadData.uploadedFile!);
                                }}
                                className="p-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-full text-green-600 hover:bg-white dark:hover:bg-gray-800 shadow-lg"
                                title="Crop ảnh"
                              >
                                <Crop className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigator.clipboard.writeText(uploadData.uploadedFile!.url);
                              }}
                              className="p-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-full text-purple-600 hover:bg-white dark:hover:bg-gray-800 shadow-lg"
                              title="Copy URL"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteFile(uploadData.uploadedFile!.id);
                              }}
                              disabled={isUpdating}
                              className="p-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-full text-red-600 hover:bg-white dark:hover:bg-gray-800 shadow-lg disabled:opacity-50"
                              title="Xóa"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )}

                    </motion.div>
                    ))}
                  </AnimatePresence>

                  {/* Existing Files */}
                  {mediaData?.files?.map((file) => (
                    <motion.div
                      key={file.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="relative group bg-gray-50 dark:bg-gray-700 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600 hover:border-primary-300 dark:hover:border-primary-600"
                    >
                      {/* Selection Checkbox - Hidden by default, visible on hover or when selected */}
                      <div className={`absolute top-2 left-2 z-10 transition-opacity duration-200 ${
                        selectedFiles.includes(file.id)
                          ? 'opacity-100'
                          : 'opacity-0 group-hover:opacity-100'
                      }`}>
                        <input
                          type="checkbox"
                          checked={selectedFiles.includes(file.id)}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleSelectFile(file.id);
                          }}
                          className="w-[17px] h-[17px] rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500 bg-white dark:bg-gray-800 shadow-lg"
                        />
                      </div>

                      {/* File Preview - Clickable to toggle selection */}
                      <div
                        className="aspect-square flex items-center justify-center p-4 relative cursor-pointer"
                        onClick={() => handleSelectFile(file.id)}
                        title="Click để chọn/bỏ chọn"
                      >
                        {file.type.startsWith('image/') ? (
                          <>
                            <img
                              src={`${file.url}?w=200&h=200&fit=cover`}
                              alt={file.name}
                              className="w-full h-full object-cover rounded"
                              loading="lazy"
                              decoding="async"
                              key={`${file.url}-${file.updated_at}`} // Force re-render when URL or updated_at changes
                            />

                          </>
                        ) : (
                          <div className="text-4xl">
                            {getFileTypeIcon(file.type)}
                          </div>
                        )}
                      </div>

                      {/* File Info */}
                      <div className="p-3 border-t border-gray-200 dark:border-gray-600">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate flex items-center space-x-2" title={file.name}>
                          <span className="flex-1 truncate">{file.name}</span>
                          {renamingFiles.has(file.id) && (
                            <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin flex-shrink-0"></div>
                          )}
                          {croppingFiles.has(file.id) && (
                            <div className="w-3 h-3 border-2 border-green-500 border-t-transparent rounded-full animate-spin flex-shrink-0"></div>
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

                      {/* Actions - Visible on hover WITHOUT overlay background */}
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center space-x-2 pointer-events-none">
                        <div className="flex items-center space-x-2 pointer-events-auto">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(file.url, '_blank');
                            }}
                            className="p-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-full text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800 shadow-lg"
                            title="Xem"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditFile(file);
                            }}
                            className="p-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-full text-blue-600 hover:bg-white dark:hover:bg-gray-800 shadow-lg"
                            title="Chỉnh sửa"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          {file.type.startsWith('image/') && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCropFile(file);
                              }}
                              className="p-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-full text-green-600 hover:bg-white dark:hover:bg-gray-800 shadow-lg"
                              title="Crop ảnh"
                            >
                              <Crop className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopyUrl(file.url);
                            }}
                            className="p-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-full text-purple-600 hover:bg-white dark:hover:bg-gray-800 shadow-lg"
                            title="Copy URL"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteFile(file.id);
                            }}
                            disabled={isUpdating}
                            className="p-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-full text-red-600 hover:bg-white dark:hover:bg-gray-800 shadow-lg disabled:opacity-50"
                            title="Xóa"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                    </motion.div>
                  ))}

                  {/* Skeleton Loading Items */}
                  {isLoading && (
                    <>
                      {Array.from({ length: 12 }).map((_, i) => (
                        <div key={`skeleton-${i}`} className="relative group bg-gray-50 dark:bg-gray-700 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600 animate-pulse">
                          <div className="aspect-square bg-gray-200 dark:bg-gray-600"></div>
                          <div className="p-3 space-y-2">
                            <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-3/4"></div>
                            <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-1/2"></div>
                          </div>
                        </div>
                      ))}
                    </>
                  )}

                  {/* Empty State */}
                  {!isLoading && mediaData && mediaData.files.length === 0 && uploadingFiles.size === 0 && (
                    <div className="col-span-full text-center py-12">
                      <Upload className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">Không có file nào</h3>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Thử điều chỉnh bộ lọc hoặc upload file mới</p>
                    </div>
                  )}
                </div>
              ) : (
                // List View
                <div className="space-y-2">
                  {/* Uploading Files */}
                  <AnimatePresence>
                    {Array.from(uploadingFiles.entries()).map(([tempId, uploadData]) => (
                    <motion.div
                      key={tempId}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className={uploadData.isCompleted
                        ? "flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600"
                        : "flex items-center space-x-4 p-4 rounded-xl border-2 shadow-md bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 border-dashed border-blue-300 dark:border-blue-600"
                      }
                    >
                      {/* Selection Checkbox for completed uploads */}
                      {uploadData.isCompleted && uploadData.uploadedFile && (
                        <input
                          type="checkbox"
                          checked={selectedFiles.includes(uploadData.uploadedFile.id)}
                          onChange={() => handleSelectFile(uploadData.uploadedFile!.id)}
                          className="rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500"
                        />
                      )}

                      {/* Preview Thumbnail */}
                      <div className="w-12 h-12 flex items-center justify-center bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-600 relative">
                        {/* Show real image if completed, otherwise loading */}
                        {uploadData.isCompleted && uploadData.uploadedFile ? (
                          <img
                            src={uploadData.uploadedFile.url}
                            alt={uploadData.uploadedFile.name}
                            className="w-8 h-8 object-cover rounded"
                          />
                        ) : (
                          <>
                            {/* Preview image */}
                            {uploadData.preview && (
                              <img
                                src={uploadData.preview}
                                alt={uploadData.name}
                                className="w-8 h-8 object-cover rounded"
                              />
                            )}
                            {/* Loading overlay with pulsing effect - always show when not completed */}
                            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center animate-pulse rounded">
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            </div>
                          </>
                        )}
                      </div>

                      {/* File Info */}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate flex items-center space-x-2">
                          <span className="flex-1 truncate">{uploadData.uploadedFile?.name || uploadData.name}</span>
                          {uploadData.uploadedFile && renamingFiles.has(uploadData.uploadedFile.id) && (
                            <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin flex-shrink-0"></div>
                          )}
                          {uploadData.uploadedFile && croppingFiles.has(uploadData.uploadedFile.id) && (
                            <div className="w-3 h-3 border-2 border-green-500 border-t-transparent rounded-full animate-spin flex-shrink-0"></div>
                          )}
                        </div>
                        {uploadData.isCompleted && uploadData.uploadedFile ? (
                          // Show real file info like existing files
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {formatFileSize(uploadData.uploadedFile.size)}
                            {uploadData.uploadedFile.metadata?.width && uploadData.uploadedFile.metadata?.height && (
                              <span className="ml-2">• {uploadData.uploadedFile.metadata.width}×{uploadData.uploadedFile.metadata.height}</span>
                            )}
                            <span className="ml-2">• {formatDate(uploadData.uploadedFile.created_at)}</span>
                          </div>
                        ) : (
                          // Show loading state
                          <div className="text-sm text-blue-600 dark:text-blue-400 flex items-center">
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse mr-2"></div>
                            Đang tải lên...
                          </div>
                        )}
                      </div>

                      {/* Actions for completed uploads */}
                      {uploadData.isCompleted && uploadData.uploadedFile && (
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => window.open(uploadData.uploadedFile!.url, '_blank')}
                            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            title="Xem"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleEditFile(uploadData.uploadedFile!)}
                            className="p-2 text-blue-400 hover:text-blue-600 dark:hover:text-blue-300"
                            title="Chỉnh sửa"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          {uploadData.uploadedFile.type.startsWith('image/') && (
                            <button
                              onClick={() => handleCropFile(uploadData.uploadedFile!)}
                              className="p-2 text-green-400 hover:text-green-600 dark:hover:text-green-300"
                              title="Crop ảnh"
                            >
                              <Crop className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => navigator.clipboard.writeText(uploadData.uploadedFile!.url)}
                            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            title="Copy URL"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeleteFile(uploadData.uploadedFile!.id)}
                            disabled={isUpdating}
                            className="p-2 text-red-400 hover:text-red-600 disabled:opacity-50"
                            title="Xóa"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </motion.div>
                    ))}
                  </AnimatePresence>

                  {/* Existing Files */}
                  {mediaData?.files?.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600"
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

                          </>
                        ) : (
                          <span className="text-xl">
                            {getFileTypeIcon(file.type)}
                          </span>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate flex items-center space-x-2">
                          <span className="flex-1 truncate">{file.name}</span>
                          {renamingFiles.has(file.id) && (
                            <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin flex-shrink-0"></div>
                          )}
                          {croppingFiles.has(file.id) && (
                            <div className="w-3 h-3 border-2 border-green-500 border-t-transparent rounded-full animate-spin flex-shrink-0"></div>
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
                          onClick={() => handleEditFile(file)}
                          className="p-2 text-blue-400 hover:text-blue-600 dark:hover:text-blue-300"
                          title="Chỉnh sửa"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        {file.type.startsWith('image/') && (
                          <button
                            onClick={() => handleCropFile(file)}
                            className="p-2 text-green-400 hover:text-green-600 dark:hover:text-green-300"
                            title="Crop ảnh"
                          >
                            <Crop className="w-4 h-4" />
                          </button>
                        )}
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

                  {/* Skeleton Loading Items for List View */}
                  {isLoading && (
                    <>
                      {Array.from({ length: 8 }).map((_, i) => (
                        <div key={`skeleton-list-${i}`} className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg animate-pulse">
                          <div className="w-12 h-12 bg-gray-200 dark:bg-gray-600 rounded"></div>
                          <div className="flex-1 space-y-2">
                            <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-3/4"></div>
                            <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-1/2"></div>
                          </div>
                          <div className="flex space-x-2">
                            <div className="w-8 h-8 bg-gray-200 dark:bg-gray-600 rounded-full"></div>
                            <div className="w-8 h-8 bg-gray-200 dark:bg-gray-600 rounded-full"></div>
                            <div className="w-8 h-8 bg-gray-200 dark:bg-gray-600 rounded-full"></div>
                          </div>
                        </div>
                      ))}
                    </>
                  )}

                  {/* Empty State for List View */}
                  {!isLoading && mediaData && mediaData.files.length === 0 && uploadingFiles.size === 0 && (
                    <div className="text-center py-12">
                      <Upload className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">Không có file nào</h3>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Thử điều chỉnh bộ lọc hoặc upload file mới</p>
                    </div>
                  )}
                </div>
              )}
            </div>

          {/* Pagination */}
          {mediaData && mediaData.total > limit && (
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

      {/* Upload Modal */}
      <UploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onUploadStart={handleUploadStart}
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
