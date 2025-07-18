import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MediaAPI } from '../../../services/media-api';
import { X, Upload, File, Image, Video, FileText, Loader2, Check, AlertCircle } from 'lucide-react';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadStart?: (files: File[]) => void;
}

interface UploadFile {
  file: File;
  id: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
  url?: string;
}

export default function UploadModal({ isOpen, onClose, onUploadStart }: UploadModalProps) {
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);
  const [isDragActive, setIsDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Clear files when modal closes
  const handleClose = useCallback(() => {
    setUploadFiles([]); // Clear all files
    setIsDragActive(false);
    setIsUploading(false);
    onClose();
  }, [onClose]);

  // Clear state when modal is closed from outside (optimistic upload)
  useEffect(() => {
    if (!isOpen) {
      setUploadFiles([]);
      setIsDragActive(false);
      setIsUploading(false);
    }
  }, [isOpen]);

  // Handle file selection
  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files) return;

    const newFiles: UploadFile[] = Array.from(files).map(file => {
      // Validate file
      const validation = MediaAPI.validateFile(file);
      if (!validation.valid) {
        return {
          file,
          id: Math.random().toString(36).substring(2, 11),
          status: 'error' as const,
          progress: 0,
          error: validation.error
        };
      }

      return {
        file,
        id: Math.random().toString(36).substring(2, 11),
        status: 'pending' as const,
        progress: 0
      };
    });

    setUploadFiles(prev => [...prev, ...newFiles]);
  }, []);

  // Handle drag and drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);

  // Remove file from list
  const removeFile = (id: string) => {
    setUploadFiles(prev => prev.filter(f => f.id !== id));
  };

  // Clear all files
  const clearAll = () => {
    setUploadFiles([]);
  };

  // Upload single file
  const uploadFile = async (uploadFile: UploadFile): Promise<void> => {
    try {
      setUploadFiles(prev => prev.map(f =>
        f.id === uploadFile.id
          ? { ...f, status: 'uploading', progress: 0 }
          : f
      ));

      const { data, error } = await MediaAPI.uploadFile(
        uploadFile.file,
        'media',
        (progress) => {
          setUploadFiles(prev => prev.map(f =>
            f.id === uploadFile.id
              ? { ...f, progress }
              : f
          ));
        }
      );

      if (error) {
        throw error;
      }

      setUploadFiles(prev => prev.map(f =>
        f.id === uploadFile.id
          ? { ...f, status: 'success', progress: 100, url: data?.url }
          : f
      ));

    } catch (error: any) {
      setUploadFiles(prev => prev.map(f =>
        f.id === uploadFile.id
          ? { ...f, status: 'error', error: error.message }
          : f
      ));
      throw error;
    }
  };

  // Upload all files with optimistic UI
  const handleUploadAll = async () => {
    const pendingFiles = uploadFiles.filter(f => f.status === 'pending');
    if (pendingFiles.length === 0) return;

    // If onUploadStart is provided, use optimistic approach
    if (onUploadStart) {
      const files = pendingFiles.map(f => f.file);
      onUploadStart(files);
      return; // Modal will be closed by parent component
    }

    // Fallback to old approach if no optimistic callback
    setIsUploading(true);

    try {
      let successCount = 0;
      const totalFiles = pendingFiles.length;

      // Upload files sequentially to avoid overwhelming the server
      for (const file of pendingFiles) {
        try {
          await uploadFile(file);
          successCount++;
        } catch (error) {
          console.error('Upload file error:', error);
          // Continue with other files
        }
      }

      // Check if all uploads were successful
      if (successCount === totalFiles) {
        console.log('✅ All files uploaded successfully');

        // Close modal and reset state
        setTimeout(() => {
          handleClose();
        }, 500); // Shorter delay for better UX
      } else {
        console.warn(`⚠️ Only ${successCount}/${totalFiles} files uploaded successfully`);
      }
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  // Get file icon
  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return <Image className="w-8 h-8 text-green-500" />;
    if (file.type.startsWith('video/')) return <Video className="w-8 h-8 text-blue-500" />;
    if (file.type.includes('pdf') || file.type.includes('document')) return <FileText className="w-8 h-8 text-red-500" />;
    return <File className="w-8 h-8 text-gray-500" />;
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
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={(e) => e.target === e.currentTarget && handleClose()}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Upload Media Files
              </h3>
              <button
                onClick={handleClose}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[60vh]">
            {/* Drop Zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragActive
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
              }`}
            >
              <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                Kéo thả file vào đây
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                hoặc
              </p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
              >
                Chọn file
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,video/*,.pdf,.doc,.docx,.txt"
                onChange={(e) => handleFileSelect(e.target.files)}
                className="hidden"
              />
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-4">
                Hỗ trợ: JPG, PNG, GIF, MP4, PDF, DOC, TXT (tối đa 10MB mỗi file)
              </p>
            </div>

            {/* File List */}
            {uploadFiles.length > 0 && (
              <div className="mt-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    File đã chọn ({uploadFiles.length})
                  </h4>
                  <button
                    onClick={clearAll}
                    disabled={isUploading}
                    className="text-sm text-red-600 hover:text-red-800 disabled:opacity-50"
                  >
                    Xóa tất cả
                  </button>
                </div>

                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {uploadFiles.map((uploadFile) => (
                    <div
                      key={uploadFile.id}
                      className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                    >
                      {getFileIcon(uploadFile.file)}

                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                          {uploadFile.file.name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {formatFileSize(uploadFile.file.size)}
                        </div>

                        {/* Progress Bar */}
                        {uploadFile.status === 'uploading' && (
                          <div className="mt-2">
                            <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1">
                              <div
                                className="bg-primary-600 h-1 rounded-full transition-all duration-300"
                                style={{ width: `${uploadFile.progress}%` }}
                              />
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {uploadFile.progress}%
                            </div>
                          </div>
                        )}

                        {/* Error Message */}
                        {uploadFile.status === 'error' && (
                          <div className="text-xs text-red-600 dark:text-red-400 mt-1">
                            {uploadFile.error}
                          </div>
                        )}
                      </div>

                      {/* Status Icon */}
                      <div className="flex-shrink-0">
                        {uploadFile.status === 'uploading' && (
                          <Loader2 className="w-5 h-5 text-primary-600 animate-spin" />
                        )}
                        {uploadFile.status === 'success' && (
                          <Check className="w-5 h-5 text-green-600" />
                        )}
                        {uploadFile.status === 'error' && (
                          <AlertCircle className="w-5 h-5 text-red-600" />
                        )}
                        {uploadFile.status === 'pending' && (
                          <button
                            onClick={() => removeFile(uploadFile.id)}
                            disabled={isUploading}
                            className="p-1 text-gray-400 hover:text-red-600 disabled:opacity-50"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          {uploadFiles.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={handleClose}
                  disabled={isUploading}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 disabled:opacity-50"
                >
                  Hủy
                </button>
                <button
                  onClick={handleUploadAll}
                  disabled={isUploading || uploadFiles.every(f => f.status !== 'pending')}
                  className="flex items-center space-x-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
                >
                  {isUploading && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{isUploading ? 'Đang upload...' : 'Upload tất cả'}</span>
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
