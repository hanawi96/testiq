import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Loader2,
  Check,
  AlertCircle,
  Camera,
  Edit3,
  Trash2,
  Eye,
  Crop
} from 'lucide-react';
import { ImageStorageService } from '../../../../../../backend/storage/image-storage';
import ImageCropper from '../../../../ui/ImageCropper';

interface MediaUploadProps {
  value?: string; // Current image URL
  alt?: string; // Alt text
  onChange: (url: string, alt?: string) => void;
  onRemove: () => void;
  disabled?: boolean;
  className?: string;
  isLoading?: boolean; // Loading state from parent
}

interface UploadState {
  isUploading: boolean;
  uploadType: 'normal' | 'crop' | 'rename';
  progress: number;
  error: string | null;
  success: string | null;
  isDragActive: boolean;
  previewUrl: string | null;
}

export default function MediaUpload({
  value,
  alt,
  onChange,
  onRemove,
  disabled = false,
  className = "",
  isLoading = false
}: MediaUploadProps) {
  const [state, setState] = useState<UploadState>({
    isUploading: false,
    uploadType: 'normal',
    progress: 0,
    error: null,
    success: null,
    isDragActive: false,
    previewUrl: null
  });
  
  const [altText, setAltText] = useState(alt || '');
  const [fileName, setFileName] = useState('');
  const [showAltEditor, setShowAltEditor] = useState(false);
  const [showCropper, setShowCropper] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounterRef = useRef(0);

  // Update alt text when prop changes
  useEffect(() => {
    setAltText(alt || '');
  }, [alt]);

  // Update filename when value changes
  useEffect(() => {
    if (value) {
      const extractedFileName = ImageStorageService.extractFileNameFromUrl(value);
      if (extractedFileName) {
        // Tách tên file và extension
        const lastDotIndex = extractedFileName.lastIndexOf('.');
        const nameWithoutExtension = lastDotIndex > 0
          ? extractedFileName.substring(0, lastDotIndex)
          : extractedFileName;
        setFileName(nameWithoutExtension);
      } else {
        setFileName('');
      }
    } else {
      setFileName('');
    }
  }, [value]);

  // File validation
  const validateFile = (file: File): { valid: boolean; error?: string } => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!allowedTypes.includes(file.type.toLowerCase())) {
      return { valid: false, error: 'Chỉ hỗ trợ định dạng JPG, PNG, WebP' };
    }

    if (file.size > maxSize) {
      return { valid: false, error: 'Kích thước file không được vượt quá 5MB' };
    }

    return { valid: true };
  };

  // Handle file upload
  const handleFileUpload = useCallback(async (file: File) => {
    const validation = validateFile(file);
    if (!validation.valid) {
      setState(prev => ({ ...prev, error: validation.error || 'File không hợp lệ' }));
      return;
    }

    setState(prev => ({
      ...prev,
      isUploading: true,
      uploadType: 'normal', // Mark as normal upload
      error: null,
      success: null,
      progress: 0,
      previewUrl: URL.createObjectURL(file)
    }));

    // Simulate progress
    const progressInterval = setInterval(() => {
      setState(prev => ({ 
        ...prev, 
        progress: Math.min(prev.progress + Math.random() * 30, 90) 
      }));
    }, 200);

    try {
      const uploadMethod = value
        ? ImageStorageService.replaceImage(value, file, {
            folder: 'articles',
            maxWidth: 1920,
            maxHeight: 1080,
          })
        : ImageStorageService.uploadImage(file, {
            folder: 'articles',
            maxWidth: 1920,
            maxHeight: 1080,
          });

      const { data, error } = await uploadMethod;

      clearInterval(progressInterval);
      setState(prev => ({ ...prev, progress: 100 }));

      if (data && !error) {
        onChange(data.url, altText);
        setState(prev => ({ 
          ...prev, 
          success: value ? 'Thay thế thành công!' : 'Upload thành công!',
          isUploading: false
        }));

        // Clear success message after 3 seconds
        setTimeout(() => {
          setState(prev => ({ ...prev, success: null, previewUrl: null }));
        }, 3000);
      } else {
        throw new Error(error?.message || 'Upload failed');
      }
    } catch (error: any) {
      clearInterval(progressInterval);
      setState(prev => ({ 
        ...prev, 
        error: error.message || 'Lỗi upload hình ảnh',
        isUploading: false,
        progress: 0
      }));
    }
  }, [value, altText, onChange]);

  // Drag and drop handlers
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setState(prev => ({ ...prev, isDragActive: true }));
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) {
      setState(prev => ({ ...prev, isDragActive: false }));
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setState(prev => ({ ...prev, isDragActive: false }));
    dragCounterRef.current = 0;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  }, [handleFileUpload]);

  // Handle file input change
  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  }, [handleFileUpload]);

  // Handle alt text and filename save
  const handleAltSave = useCallback(async () => {
    if (!value) return;

    const currentFullFileName = ImageStorageService.extractFileNameFromUrl(value);
    let currentNameOnly = '';
    if (currentFullFileName) {
      const lastDotIndex = currentFullFileName.lastIndexOf('.');
      currentNameOnly = lastDotIndex > 0
        ? currentFullFileName.substring(0, lastDotIndex)
        : currentFullFileName;
    }

    const hasFileNameChanged = fileName && currentNameOnly && fileName !== currentNameOnly;

    // Ẩn popup ngay lập tức
    setShowAltEditor(false);

    try {
      setState(prev => ({
        ...prev,
        isUploading: true,
        uploadType: hasFileNameChanged ? 'rename' : 'normal',
        progress: 10
      }));

      let finalUrl = value;

      // If filename changed, rename the file
      if (hasFileNameChanged) {
        setState(prev => ({ ...prev, progress: 50 }));

        // Ghép tên file với extension gốc
        let finalFileName = fileName;
        if (currentFullFileName) {
          const lastDotIndex = currentFullFileName.lastIndexOf('.');
          const extension = lastDotIndex > 0 ? currentFullFileName.substring(lastDotIndex) : '.jpg';
          finalFileName = fileName + extension;
        }

        const renameResult = await ImageStorageService.renameImage(value, finalFileName, {
          folder: 'articles'
        });

        if (renameResult.error || !renameResult.data) {
          throw new Error(renameResult.error?.message || 'Lỗi khi đổi tên file');
        }

        finalUrl = renameResult.data.url;
        setState(prev => ({ ...prev, progress: 80 }));
      }

      // Update with new URL and alt text
      onChange(finalUrl, altText);

      setState(prev => ({
        ...prev,
        isUploading: false,
        progress: 100,
        success: hasFileNameChanged ? 'Tên file và Alt text đã được cập nhật!' : 'Alt text đã được cập nhật!'
      }));

      setTimeout(() => {
        setState(prev => ({ ...prev, success: null, progress: 0 }));
      }, 3000);

    } catch (error: any) {
      console.error('Save error:', error);
      setState(prev => ({
        ...prev,
        isUploading: false,
        progress: 0,
        error: error.message || 'Lỗi khi cập nhật thông tin ảnh'
      }));
    }
  }, [value, altText, fileName, onChange]);

  // Handle crop save with instant loading feedback
  const handleCropSave = useCallback(async (croppedImageUrl: string, cropData?: any) => {
    // INSTANT UX: Start loading immediately when crop is initiated
    setState(prev => ({
      ...prev,
      isUploading: true,
      uploadType: 'crop', // Mark as crop upload
      progress: 10,
      success: null,
      error: null
    }));

    try {
      // Check if we got actual cropped image or just crop data
      if (cropData && croppedImageUrl === value) {
        // Fallback: Server-side crop not implemented, just use original
        console.log('Crop data received (server-side crop not implemented):', cropData);
        setState(prev => ({
          ...prev,
          success: 'Crop settings applied (using original image)',
          isUploading: false,
          progress: 100,
          previewUrl: null // ← CLEAN: Use original image
        }));

        setTimeout(() => {
          setState(prev => ({ ...prev, success: null }));
        }, 3000);
        return;
      }

      // Update progress for better UX
      setState(prev => ({ ...prev, progress: 30 }));

      // INSTANT UI: Show cropped image immediately
      setState(prev => ({
        ...prev,
        progress: 30,
        previewUrl: croppedImageUrl // ← INSTANT: Show cropped result immediately
      }));

      // Normal flow: Convert blob URL to file
      const response = await fetch(croppedImageUrl);
      const blob = await response.blob();
      const file = new File([blob], 'cropped-image.jpg', { type: 'image/jpeg' });

      setState(prev => ({ ...prev, progress: 50 }));

      // Upload cropped image
      const uploadMethod = value
        ? ImageStorageService.replaceImage(value, file, {
            folder: 'articles',
            maxWidth: 1920,
            maxHeight: 1080,
          })
        : ImageStorageService.uploadImage(file, {
            folder: 'articles',
            maxWidth: 1920,
            maxHeight: 1080,
          });

      setState(prev => ({ ...prev, progress: 80 }));

      const { data, error } = await uploadMethod;

      if (data && !error) {
        // INSTANT UI UPDATE: Update image immediately
        setState(prev => ({
          ...prev,
          success: 'Crop và upload thành công!',
          isUploading: false,
          progress: 100,
          previewUrl: null // ← CLEAN: Use final URL from parent
        }));

        // Update parent component
        onChange(data.url, altText);

        // Clean up blob URL if it's a blob
        if (croppedImageUrl.startsWith('blob:')) {
          URL.revokeObjectURL(croppedImageUrl);
        }

        // Clear success message after 3 seconds
        setTimeout(() => {
          setState(prev => ({ ...prev, success: null }));
        }, 3000);
      } else {
        throw new Error(error?.message || 'Upload failed');
      }
    } catch (error: any) {
      console.error('Crop upload error:', error);
      setState(prev => ({
        ...prev,
        error: error.message || 'Lỗi khi upload ảnh đã crop',
        isUploading: false,
        progress: 0,
        previewUrl: null // ← CLEAN: Reset preview on error
      }));

      // Clean up blob URL if it's a blob
      if (croppedImageUrl.startsWith('blob:')) {
        URL.revokeObjectURL(croppedImageUrl);
      }
    }
  }, [value, altText, onChange]);

  // Clear error after 5 seconds
  useEffect(() => {
    if (state.error) {
      const timer = setTimeout(() => {
        setState(prev => ({ ...prev, error: null }));
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [state.error]);

  const hasImage = value || state.previewUrl;
  const displayUrl = state.previewUrl || value;

  // Show skeleton when parent is loading data (edit mode)
  const shouldShowSkeleton = isLoading && !hasImage;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      <div
        className={`
          relative group border-2 border-dashed rounded-xl transition-all duration-300 media-upload-dropzone
          ${state.isDragActive 
            ? 'border-primary-500 bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 shadow-lg scale-[1.02]' 
            : hasImage
              ? 'border-gray-200 dark:border-gray-700 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-700/50'
              : 'border-gray-300 dark:border-gray-600 hover:border-primary-400 dark:hover:border-primary-500 hover:bg-gradient-to-br hover:from-gray-50 hover:to-gray-100 dark:hover:from-gray-800/30 dark:hover:to-gray-700/30'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => !disabled && !state.isUploading && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileInputChange}
          disabled={disabled || state.isUploading}
          className="hidden"
        />

        {shouldShowSkeleton ? (
          // Loading Skeleton for Edit Mode
          <div className="relative">
            <div className="w-full h-48 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-lg animate-pulse">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 bg-gray-300 dark:bg-gray-600 rounded-full animate-pulse"></div>
              </div>
            </div>

            {/* Skeleton for alt text */}
            <div className="mt-3 space-y-2">
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse"></div>
            </div>
          </div>
        ) : hasImage ? (
          // Image Preview with Enhanced Loading States
          <div className="relative">
            <img
              src={displayUrl}
              alt={altText || 'Preview'}
              className={`w-full h-48 object-cover rounded-lg transition-all duration-300 ${
                state.isUploading ? 'opacity-50 scale-105' : ''
              }`}
            />

            {/* Loading overlay for crop processing */}
            {state.isUploading && state.uploadType === 'crop' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center rounded-lg"
                role="status"
                aria-live="polite"
                aria-label={`Đang xử lý crop ảnh, ${state.progress}% hoàn thành`}
              >
                <div className="text-center text-white">
                  <div className="relative w-16 h-16 mx-auto mb-3">
                    <div className="absolute inset-0 border-4 border-white/20 rounded-full"></div>
                    <div
                      className="absolute inset-0 border-4 border-white border-t-transparent rounded-full animate-spin"
                      role="progressbar"
                      aria-valuenow={state.progress}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    ></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Crop className="w-6 h-6 text-white" aria-hidden="true" />
                    </div>
                  </div>
                  <p className="text-sm font-medium">Đang xử lý crop...</p>
                  <p className="text-xs opacity-75">{state.progress}%</p>
                </div>
              </motion.div>
            )}

            {/* Overlay with actions - hidden during upload */}
            {!state.isUploading && (
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-lg flex items-center justify-center media-upload-overlay">
                <div className="flex items-center space-x-3">
                <motion.button
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowCropper(true);
                  }}
                  className="p-3 bg-white/20 backdrop-blur-md rounded-xl text-white hover:bg-white/30 transition-all duration-200 media-upload-button shadow-lg"
                  title="Crop ảnh"
                >
                  <Crop size={18} />
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowAltEditor(true);
                  }}
                  className="p-3 bg-white/20 backdrop-blur-md rounded-xl text-white hover:bg-white/30 transition-all duration-200 media-upload-button shadow-lg"
                  title="Chỉnh sửa Alt text"
                >
                  <Edit3 size={18} />
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(displayUrl, '_blank');
                  }}
                  className="p-3 bg-white/20 backdrop-blur-md rounded-xl text-white hover:bg-white/30 transition-all duration-200 media-upload-button shadow-lg"
                  title="Xem ảnh"
                >
                  <Eye size={18} />
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={async (e) => {
                    e.stopPropagation();



                    try {
                      // Clean up storage file if it exists
                      if (value) {
                        const filePath = ImageStorageService.extractPathFromUrl(value);
                        if (filePath) {
                          // Delete from storage in background (don't wait for it)
                          ImageStorageService.deleteImage(filePath).catch(error =>
                            console.warn('Failed to cleanup storage file:', error)
                          );
                        }
                      }

                      // Clean up local preview URL
                      if (state.previewUrl) {
                        URL.revokeObjectURL(state.previewUrl);
                      }

                      // Clear browser cache for the deleted image
                      if (value && 'caches' in window) {
                        caches.keys().then(cacheNames => {
                          cacheNames.forEach(cacheName => {
                            caches.open(cacheName).then(cache => {
                              cache.delete(value).catch(() => {
                                // Ignore cache deletion errors
                              });
                            });
                          });
                        }).catch(() => {
                          // Ignore cache API errors
                        });
                      }

                      // Update local state
                      setState(prev => ({
                        ...prev,
                        previewUrl: null,
                        error: null,
                        success: null
                      }));

                      // Notify parent component
                      onRemove();
                    } catch (error) {
                      console.error('Error during file removal:', error);
                      // Still proceed with removal even if cleanup fails
                      onRemove();
                    }
                  }}
                  className="p-3 bg-red-500/80 backdrop-blur-md rounded-xl text-white hover:bg-red-600/90 transition-all duration-200 media-upload-button shadow-lg"
                  title="Xóa ảnh"
                >
                  <Trash2 size={18} />
                </motion.button>
                </div>
              </div>
            )}

            {/* Upload progress overlay */}
            {state.isUploading && (state.uploadType === 'normal' || state.uploadType === 'rename') && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/70 to-black/60 rounded-lg flex items-center justify-center backdrop-blur-sm"
              >
                <div className="text-center text-white p-6 bg-white/10 rounded-2xl backdrop-blur-md border border-white/20 media-upload-glass">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <Loader2 size={40} className="mx-auto mb-4 text-primary-400" />
                  </motion.div>
                  <p className="text-lg font-medium mb-3">
                    {state.uploadType === 'rename'
                      ? (state.progress < 50 ? 'Đang cập nhật...' :
                         state.progress < 80 ? 'Đang đổi tên file...' :
                         'Hoàn tất...')
                      : 'Đang upload...'}
                  </p>
                  <div className="w-40 bg-gray-700/50 rounded-full h-3 mt-2 overflow-hidden">
                    <motion.div
                      className="bg-gradient-to-r from-primary-500 to-purple-500 h-3 rounded-full media-upload-progress"
                      initial={{ width: 0 }}
                      animate={{ width: `${state.progress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                  <p className="text-sm mt-2 font-mono">{Math.round(state.progress)}%</p>
                </div>
              </motion.div>
            )}
          </div>
        ) : (
          // Upload Placeholder
          <div className="p-10 text-center">
            <motion.div 
              className="mx-auto w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg"
              whileHover={{ scale: 1.05, rotate: 5 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              {state.isUploading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <Loader2 size={28} className="text-primary-500" />
                </motion.div>
              ) : (
                <Camera size={28} className="text-gray-400" />
              )}
            </motion.div>
            
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
              {state.isUploading ? 'Đang upload...' : 'Thêm ảnh đại diện'}
            </h3>
            
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-xs mx-auto leading-relaxed">
              Kéo thả ảnh vào đây hoặc click để chọn file từ máy tính của bạn
            </p>
            
            <div className="flex items-center justify-center space-x-3 text-xs text-gray-400 bg-gray-50 dark:bg-gray-700/50 rounded-lg py-2 px-4 inline-flex">
              <span className="font-medium">PNG, JPG, WebP</span>
              <span>•</span>
              <span>Tối đa 5MB</span>
              <span>•</span>
              <span>1920×1080 khuyến nghị</span>
            </div>

            {state.isUploading && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6"
              >
                <div className="w-64 mx-auto bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                  <motion.div
                    className="bg-gradient-to-r from-primary-500 to-purple-500 h-3 rounded-full media-upload-progress"
                    initial={{ width: 0 }}
                    animate={{ width: `${state.progress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
                <p className="text-sm text-gray-500 mt-2 font-mono">{Math.round(state.progress)}%</p>
              </motion.div>
            )}
          </div>
        )}
      </div>

      {/* Alt Text Editor Modal */}
      <AnimatePresence>
        {showAltEditor && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowAltEditor(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-2xl p-8 w-full max-w-lg border border-white/20 dark:border-gray-700/50 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-purple-500 rounded-xl flex items-center justify-center">
                  <Edit3 size={20} className="text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  Chỉnh sửa ảnh đại diện
                </h3>
              </div>

              {/* Filename Input */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Tên file ảnh (không bao gồm đuôi)
                </label>
                <input
                  type="text"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  placeholder="Ví dụ: anh-dai-dien-bai-viet"
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white/50 dark:bg-gray-700/50 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all backdrop-blur-sm"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Đuôi file (.jpg, .png) sẽ được giữ nguyên. Tên file sẽ được làm sạch tự động.
                </p>
              </div>

              {/* Alt Text Input */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Mô tả hình ảnh cho accessibility và SEO
                </label>
                <textarea
                  value={altText}
                  onChange={(e) => setAltText(e.target.value)}
                  placeholder="Ví dụ: Biểu đồ thống kê hiệu suất website năm 2024..."
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white/50 dark:bg-gray-700/50 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all backdrop-blur-sm"
                  rows={4}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  {altText.length}/150 ký tự
                </p>
              </div>

              <div className="flex justify-end space-x-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowAltEditor(false)}
                  disabled={state.isUploading}
                  className="px-6 py-3 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors font-medium disabled:opacity-50"
                >
                  Hủy
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleAltSave}
                  disabled={state.isUploading}
                  className="px-6 py-3 bg-gradient-to-r from-primary-600 to-purple-600 hover:from-primary-700 hover:to-purple-700 text-white rounded-xl transition-all font-medium shadow-lg disabled:opacity-50 flex items-center space-x-2"
                >
                  {state.isUploading && (
                    <Loader2 size={16} className="animate-spin" />
                  )}
                  <span>{state.isUploading ? 'Đang lưu...' : 'Lưu thay đổi'}</span>
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Status Messages */}
      <AnimatePresence>
        {state.success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center space-x-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg"
          >
            <Check size={16} className="text-green-600 dark:text-green-400" />
            <span className="text-sm text-green-800 dark:text-green-200">{state.success}</span>
          </motion.div>
        )}

        {state.error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center space-x-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
          >
            <AlertCircle size={16} className="text-red-600 dark:text-red-400" />
            <span className="text-sm text-red-800 dark:text-red-200">{state.error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Image Cropper */}
      <AnimatePresence>
        {showCropper && value && (
          <ImageCropper
            imageUrl={value}
            onCrop={handleCropSave}
            onCancel={() => {
              setShowCropper(false);
              // Reset any loading states if user cancels
              setState(prev => ({
                ...prev,
                isUploading: false,
                uploadType: 'normal',
                progress: 0,
                error: null
              }));
            }}
            initialAspectRatio={null} // Mặc định chế độ crop "tự do"
          />
        )}
      </AnimatePresence>

      {/* Image Info Display */}
      {hasImage && !showAltEditor && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-700 space-y-4"
        >
          {/* Filename Info */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <div className={`w-2 h-2 rounded-full ${fileName ? 'bg-blue-500' : 'bg-gray-400'}`}></div>
                <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                  Tên file
                </p>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed font-mono">
                {fileName || 'Không xác định'}
              </p>
            </div>
          </div>

          {/* Alt Text Info */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <div className={`w-2 h-2 rounded-full ${altText ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                  Alt Text {!altText && '(Mặc định)'}
                </p>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                "{altText || 'Chưa có mô tả ảnh'}"
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowAltEditor(true)}
              className="p-2 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors rounded-lg hover:bg-white/50 dark:hover:bg-gray-600/50"
              title="Chỉnh sửa ảnh đại diện"
            >
              <Edit3 size={16} />
            </motion.button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
