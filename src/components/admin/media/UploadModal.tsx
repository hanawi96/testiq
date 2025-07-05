import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MediaService } from '../../../../backend';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface FilePreview {
  file: File;
  id: string;
  preview?: string;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

export default function UploadModal({ isOpen, onClose, onSuccess }: UploadModalProps) {
  const [files, setFiles] = useState<FilePreview[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file selection
  const handleFileSelect = useCallback((selectedFiles: FileList | null) => {
    if (!selectedFiles) return;

    const newFiles: FilePreview[] = Array.from(selectedFiles).map((file, index) => {
      const id = `${Date.now()}-${index}`;
      const preview = file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined;
      
      return {
        file,
        id,
        preview,
        progress: 0,
        status: 'pending'
      };
    });

    setFiles(prev => [...prev, ...newFiles]);
  }, []);

  // Handle drag and drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);

  // Handle file input change
  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files);
  }, [handleFileSelect]);

  // Remove file from list
  const removeFile = useCallback((fileId: string) => {
    setFiles(prev => {
      const file = prev.find(f => f.id === fileId);
      if (file?.preview) {
        URL.revokeObjectURL(file.preview);
      }
      return prev.filter(f => f.id !== fileId);
    });
  }, []);

  // Simulate file upload
  const uploadFile = async (filePreview: FilePreview): Promise<void> => {
    return new Promise((resolve, reject) => {
      // Simulate upload progress
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 30;
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
          
          // Update file status
          setFiles(prev => prev.map(f => 
            f.id === filePreview.id 
              ? { ...f, progress: 100, status: 'success' }
              : f
          ));
          
          resolve();
        } else {
          // Update progress
          setFiles(prev => prev.map(f => 
            f.id === filePreview.id 
              ? { ...f, progress: Math.round(progress) }
              : f
          ));
        }
      }, 200);
    });
  };

  // Handle upload all files
  const handleUploadAll = async () => {
    if (files.length === 0) return;

    setIsUploading(true);

    try {
      // Update all files to uploading status
      setFiles(prev => prev.map(f => ({ ...f, status: 'uploading' as const })));

      // Upload files sequentially (in real app, you might want parallel uploads)
      for (const filePreview of files) {
        try {
          await uploadFile(filePreview);
          
          // Simulate backend upload
          const fileType = filePreview.file.type.startsWith('image/') ? 'image' :
                          filePreview.file.type.includes('pdf') ? 'document' :
                          filePreview.file.type.startsWith('video/') ? 'video' :
                          filePreview.file.type.startsWith('audio/') ? 'audio' : 'document';

          await MediaService.uploadFile({
            name: filePreview.file.name,
            file_type: fileType,
            mime_type: filePreview.file.type,
            size: filePreview.file.size,
            width: fileType === 'image' ? 1200 : undefined,
            height: fileType === 'image' ? 800 : undefined,
            alt_text: fileType === 'image' ? `Image: ${filePreview.file.name}` : undefined,
            description: `Uploaded file: ${filePreview.file.name}`,
            tags: ['uploaded', 'new']
          });

        } catch (error) {
          setFiles(prev => prev.map(f => 
            f.id === filePreview.id 
              ? { ...f, status: 'error', error: 'Upload failed' }
              : f
          ));
        }
      }

      // Success - close modal and refresh
      setTimeout(() => {
        onSuccess();
        handleClose();
      }, 1000);

    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  // Handle close
  const handleClose = () => {
    if (!isUploading) {
      // Clean up preview URLs
      files.forEach(file => {
        if (file.preview) {
          URL.revokeObjectURL(file.preview);
        }
      });
      setFiles([]);
      onClose();
    }
  };

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  // Get file type icon
  const getFileTypeIcon = (file: File) => {
    if (file.type.startsWith('image/')) return '🖼️';
    if (file.type.includes('pdf')) return '📄';
    if (file.type.startsWith('video/')) return '🎥';
    if (file.type.startsWith('audio/')) return '🎵';
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

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50"
          onClick={handleBackdropClick}
        />

        {/* Modal */}
        <div className="flex min-h-full items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-4xl bg-white dark:bg-gray-800 rounded-xl shadow-xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Upload Media Files
              </h3>
              <button
                onClick={handleClose}
                disabled={isUploading}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Drop Zone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  isDragOver
                    ? 'border-primary-400 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                }`}
              >
                <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <div className="mt-4">
                  <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
                    Kéo thả file vào đây
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    hoặc{' '}
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
                    >
                      chọn file từ máy tính
                    </button>
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                    Hỗ trợ: JPG, PNG, GIF, WebP, PDF, MP4 (tối đa 10MB mỗi file)
                  </p>
                </div>
              </div>

              {/* Hidden File Input */}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,application/pdf,video/mp4"
                onChange={handleFileInputChange}
                className="hidden"
              />

              {/* File List */}
              {files.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-4">
                    File đã chọn ({files.length})
                  </h4>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {files.map((filePreview) => (
                      <div
                        key={filePreview.id}
                        className="flex items-center space-x-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                      >
                        {/* Preview */}
                        <div className="w-12 h-12 flex items-center justify-center bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-600">
                          {filePreview.preview ? (
                            <img
                              src={filePreview.preview}
                              alt={filePreview.file.name}
                              className="w-full h-full object-cover rounded"
                            />
                          ) : (
                            <span className="text-xl">
                              {getFileTypeIcon(filePreview.file)}
                            </span>
                          )}
                        </div>

                        {/* File Info */}
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                            {filePreview.file.name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {formatFileSize(filePreview.file.size)}
                          </div>
                          
                          {/* Progress Bar */}
                          {filePreview.status === 'uploading' && (
                            <div className="mt-2">
                              <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                                <div 
                                  className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${filePreview.progress}%` }}
                                />
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {filePreview.progress}%
                              </div>
                            </div>
                          )}

                          {/* Status */}
                          {filePreview.status === 'success' && (
                            <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                              ✅ Upload thành công
                            </div>
                          )}
                          {filePreview.status === 'error' && (
                            <div className="text-xs text-red-600 dark:text-red-400 mt-1">
                              ❌ {filePreview.error || 'Upload thất bại'}
                            </div>
                          )}
                        </div>

                        {/* Remove Button */}
                        {filePreview.status !== 'uploading' && (
                          <button
                            onClick={() => removeFile(filePreview.id)}
                            className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end space-x-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={handleClose}
                disabled={isUploading}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleUploadAll}
                disabled={files.length === 0 || isUploading}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 rounded-lg transition-colors flex items-center space-x-2"
              >
                {isUploading && (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                )}
                <span>{isUploading ? 'Đang upload...' : `Upload ${files.length} file`}</span>
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
}
