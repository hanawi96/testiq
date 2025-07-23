import React, { useState, useRef, useCallback } from 'react';
import { Camera, Loader2, Check, X, Upload } from 'lucide-react';
import { ImageStorageService } from '../../../backend/storage/image-storage';
import CoverPhotoCropper from './CoverPhotoCropper';

interface CoverPhotoUploadProps {
  currentCoverPhoto?: string;
  onCoverPhotoUpdate: (newCoverPhotoUrl: string) => void;
  onClose: () => void;
  onStartLoading?: () => void;
}

export default function CoverPhotoUpload({ currentCoverPhoto, onCoverPhotoUpdate, onClose, onStartLoading }: CoverPhotoUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [originalFileName, setOriginalFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Validate file
  const validateFile = (file: File): { valid: boolean; error?: string } => {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: 'Chỉ hỗ trợ file JPG, PNG, WEBP' };
    }

    if (file.size > maxSize) {
      return { valid: false, error: 'File không được vượt quá 10MB' };
    }

    return { valid: true };
  };

  // Handle cover photo save
  const handleCoverPhotoSave = useCallback(async (imageUrl: string) => {
    console.log('🚀 Starting cover photo upload process...');
    setIsUploading(true);
    setError(null);
    setSuccess(null);

    // Progress simulation
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => Math.min(prev + 15, 90));
    }, 300);

    try {
      // Convert image URL to file with preserved filename
      const response = await fetch(imageUrl);
      const blob = await response.blob();

      // Use original filename but force .jpg extension since cropped image is always JPEG
      let fileName = 'cover-photo.jpg';
      if (originalFileName) {
        const baseName = originalFileName.split('.')[0];
        fileName = `${baseName}.jpg`;

      }
      const coverPhotoFile = new File([blob], fileName, { type: 'image/jpeg' });

      clearInterval(progressInterval);
      setUploadProgress(95);

      // Use replaceImage to upload new and delete old cover photo automatically
      const { data, error: uploadError } = await ImageStorageService.replaceImage(
        currentCoverPhoto || null, // Old cover photo URL to delete
        coverPhotoFile,            // New cover photo file
        {
          folder: 'cover-photos',
          maxWidth: 1200,
          maxHeight: 400,
          quality: 0.9
        }
      );

      if (data && !uploadError) {
        setUploadProgress(100);
        
        // Update cover photo in database
        try {
          const { AdminProfileService } = await import('../admin/profile/AdminProfileService');
          const { AuthService } = await import('../../../backend');
          
          const { user } = await AuthService.getCurrentUser();
          
          if (user) {
            const { success: dbSuccess } = await AdminProfileService.updateAdminProfile(user.id, {
              cover_photo_url: data.url
            });
            
            if (dbSuccess) {
              console.log('✅ Cover photo database updated successfully');
              onCoverPhotoUpdate(data.url);
              onClose();
            } else {
              setError('Upload thành công nhưng không thể cập nhật database');
            }
          } else {
            setError('Không thể xác thực người dùng');
          }
        } catch (dbError) {
          console.error('Database service error:', dbError);
          console.log('⚠️ Using fallback - upload successful but DB update failed');
          onCoverPhotoUpdate(data.url);
          onClose();
        }
      } else {
        throw new Error(uploadError?.message || 'Upload thất bại');
      }

      // Cleanup blob URLs
      if (imageUrl.startsWith('blob:')) {
        URL.revokeObjectURL(imageUrl);
      }

    } catch (error: any) {
      clearInterval(progressInterval);
      console.error('Upload error:', error);
      setError(error.message || 'Lỗi upload ảnh bìa');
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [originalFileName, onCoverPhotoUpdate, onClose]);

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validation = validateFile(file);
    if (!validation.valid) {
      setError(validation.error || 'File không hợp lệ');
      return;
    }

    setError(null);
    setSuccess(null);

    // Store original filename for preserved upload
    setOriginalFileName(file.name);


    // Create preview URL and show cropper
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      console.log('📸 Cover photo loaded, showing cropper...');
      setPreviewUrl(result);
      setShowCropper(true);
    };
    reader.readAsDataURL(file);
  };

  // Handle drag and drop
  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
      const validation = validateFile(file);
      if (!validation.valid) {
        setError(validation.error || 'File không hợp lệ');
        return;
      }

      setError(null);
      setSuccess(null);

      // Store original filename for preserved upload
      setOriginalFileName(file.name);


      // Create preview URL and show cropper
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        console.log('📸 Cover photo dropped, showing cropper...');
        setPreviewUrl(result);
        setShowCropper(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  // Handle crop cancel
  const handleCropCancel = useCallback(() => {
    setShowCropper(false);

    // Cleanup blob URL to free memory
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  }, [previewUrl]);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
  }, [previewUrl]);

  React.useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return (
    <>
      {/* CoverPhotoCropper Modal */}
      {showCropper && previewUrl && (
        <CoverPhotoCropper
          imageUrl={previewUrl}
          onCrop={handleCoverPhotoSave}
          onCancel={handleCropCancel}
          onStartCrop={onStartLoading}
        />
      )}

      {/* Main Upload Modal */}
      {!showCropper && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-lg w-full p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Cập nhật ảnh bìa
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Current Cover Photo Preview */}
        <div className="mb-6">
          <div className="aspect-[3/1] bg-gray-100 dark:bg-gray-700 rounded-xl overflow-hidden">
            {currentCoverPhoto ? (
              <img
                src={currentCoverPhoto}
                alt="Current cover photo"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center">
                  <Camera className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                    Chưa có ảnh bìa
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Upload Area */}
        <div
          className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center hover:border-blue-400 dark:hover:border-blue-500 transition-colors cursor-pointer"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400 mb-2">
            Kéo thả ảnh vào đây hoặc click để chọn
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            JPG, PNG, WEBP (tối đa 10MB)
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            Khuyến nghị: 1200x400px
          </p>
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Progress Bar */}
        {isUploading && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
              <span>Đang tải lên...</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <p className="text-green-600 dark:text-green-400 text-sm">{success}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {isUploading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Camera className="w-4 h-4" />
            )}
            {isUploading ? 'Đang tải...' : 'Chọn ảnh'}
          </button>
        </div>
      </div>
        </div>
      )}
    </>
  );
}
