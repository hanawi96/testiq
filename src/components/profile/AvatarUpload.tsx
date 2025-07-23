import React, { useState, useRef, useCallback } from 'react';
import { Camera, Loader2, Check, X } from 'lucide-react';
import { ImageStorageService } from '../../../backend/storage/image-storage';
import AvatarCropper from './AvatarCropper';

interface AvatarUploadProps {
  currentAvatar?: string;
  onAvatarUpdate: (url: string) => void;
  onClose: () => void;
  onStartLoading?: () => void; // New callback for immediate loading
}

export default function AvatarUpload({ currentAvatar, onAvatarUpdate, onClose, onStartLoading }: AvatarUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [originalFileName, setOriginalFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle crop save - Upload final cropped image and delete old one
  const handleCropSave = useCallback(async (croppedImageUrl?: string) => {
    console.log('🚀 Starting avatar upload process...');
    setIsUploading(true);
    setError(null);
    setSuccess(null);
    setShowCropper(false);

    // Progress simulation for better UX
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => Math.min(prev + 15, 90));
    }, 300);

    try {
      // Use provided cropped image URL or fallback to preview
      const finalImageUrl = croppedImageUrl || previewUrl;
      if (!finalImageUrl) {
        throw new Error('No image URL available');
      }

      // Convert cropped blob URL to file with preserved filename
      const response = await fetch(finalImageUrl);
      const blob = await response.blob();

      // Use original filename but force .jpg extension since cropped image is always JPEG
      let fileName = 'avatar.jpg';
      if (originalFileName) {
        const baseName = originalFileName.split('.')[0];
        fileName = `${baseName}.jpg`;

      }
      const croppedFile = new File([blob], fileName, { type: 'image/jpeg' });

      clearInterval(progressInterval);
      setUploadProgress(95);

      // Use replaceImage to upload new and delete old avatar automatically
      console.log('🔄 Replacing avatar:', {
        oldAvatar: currentAvatar,
        hasOldAvatar: !!currentAvatar,
        newFileName: croppedFile.name
      });

      const { data, error: uploadError } = await ImageStorageService.replaceImage(
        currentAvatar || null, // Old avatar URL to delete (convert undefined to null)
        croppedFile,           // New avatar file
        {
          folder: 'avatars',
          maxWidth: 400,
          maxHeight: 400,
          quality: 0.9
        }
      );

      if (data && !uploadError) {
        setUploadProgress(100);

        // Update avatar in database
        try {
          const { AdminProfileService } = await import('../admin/profile/AdminProfileService');
          const { AuthService } = await import('../../../backend');

          const { user } = await AuthService.getCurrentUser();

          if (user) {
            const { success: dbSuccess } = await AdminProfileService.updateAdminProfile(user.id, {
              avatar_url: data.url
            });

            if (dbSuccess) {
              console.log('✅ Database updated successfully');

              // Dispatch event để header update avatar
              window.dispatchEvent(new CustomEvent('avatarUpdated', {
                detail: { avatarUrl: data.url }
              }));

              onAvatarUpdate(data.url);
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

          // Dispatch event ngay cả khi DB update failed
          window.dispatchEvent(new CustomEvent('avatarUpdated', {
            detail: { avatarUrl: data.url }
          }));

          onAvatarUpdate(data.url);
          onClose();
        }
      } else {
        throw new Error(uploadError?.message || 'Upload thất bại');
      }

      // Cleanup blob URLs
      if (croppedImageUrl && croppedImageUrl.startsWith('blob:')) {
        URL.revokeObjectURL(croppedImageUrl);
      }

    } catch (error: any) {
      clearInterval(progressInterval);
      console.error('Upload error:', error);
      setError(error.message || 'Lỗi upload ảnh');
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [originalFileName, onAvatarUpdate, onClose]);

  // Validate file
  const validateFile = (file: File): { valid: boolean; error?: string } => {
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: 'Chỉ hỗ trợ file JPG, PNG, WebP, GIF' };
    }

    if (file.size > maxSize) {
      return { valid: false, error: 'File không được vượt quá 5MB' };
    }

    return { valid: true };
  };

  // Handle file selection - Client-side approach
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


    // Create blob URL for instant preview
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      console.log('📸 Image loaded for crop:', result.substring(0, 50) + '...');
      setPreviewUrl(result);
      setShowCropper(true);
      console.log('🎯 Crop interface should show now');
    };
    reader.readAsDataURL(file);
  };

  // Cleanup function for component unmount
  const cleanup = useCallback(() => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
  }, [previewUrl]);

  // Cleanup on unmount
  React.useEffect(() => {
    return cleanup;
  }, [cleanup]);

  // Handle drag and drop - Client-side approach
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


      // Create blob URL for instant preview
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setPreviewUrl(result);
        setShowCropper(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  // Handle crop cancel - Cleanup client-side resources
  const handleCropCancel = useCallback(() => {
    setShowCropper(false);

    // Cleanup blob URL to free memory
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }

    // Close entire upload modal
    onClose();
  }, [previewUrl, onClose]);

  // Handle remove avatar - Xóa ảnh đại diện với UX mượt mà
  const handleRemoveAvatar = useCallback(async () => {
    if (!currentAvatar || isUploading) return;

    if (!confirm('Xóa ảnh đại diện?')) return;

    // Đóng popup ngay lập tức và bắt đầu loading ở component cha
    onStartLoading?.(); // Trigger loading state ở ProfileComponent
    onClose(); // Đóng popup ngay

    // Thực hiện xóa trong background
    try {
      const { AdminProfileService } = await import('../admin/profile/AdminProfileService');
      const { AuthService } = await import('../../../backend');

      const { user } = await AuthService.getCurrentUser();
      if (!user) throw new Error('Không thể xác thực người dùng');

      await AdminProfileService.updateAdminProfile(user.id, { avatar_url: null });

      // Delay nhẹ để user thấy loading effect, sau đó update UI
      setTimeout(() => {
        // Dispatch event để header update về avatar chữ cái
        window.dispatchEvent(new CustomEvent('avatarUpdated', {
          detail: { avatarUrl: '' }
        }));

        onAvatarUpdate(''); // Empty string để chuyển về avatar chữ cái
      }, 1000); // 1 giây loading

    } catch (error) {
      console.error('Lỗi xóa ảnh đại diện:', error);
      // Nếu lỗi, vẫn update UI để user không bị stuck
      setTimeout(() => {
        // Dispatch event ngay cả khi có lỗi
        window.dispatchEvent(new CustomEvent('avatarUpdated', {
          detail: { avatarUrl: '' }
        }));

        onAvatarUpdate('');
      }, 1000);
    }
  }, [currentAvatar, isUploading, onAvatarUpdate, onClose, onStartLoading]);



  return (
    <>
      {/* AvatarCropper Modal */}
      {showCropper && previewUrl && (
        <AvatarCropper
          imageUrl={previewUrl}
          onCrop={handleCropSave}
          onCancel={handleCropCancel}
          onStartCrop={onStartLoading}
        />
      )}

      {/* Main Upload Modal */}
      {!showCropper && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Cập nhật ảnh đại diện
              </h3>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Current Avatar Preview */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="w-24 h-24 rounded-full border-4 border-gray-200 dark:border-gray-600 overflow-hidden">
                  {currentAvatar ? (
                    <img src={currentAvatar} alt="Current avatar" className="w-full h-full object-cover rounded-full" />
                  ) : (
                    <div className="w-full h-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center rounded-full">
                      <Camera className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                </div>

                {isUploading && (
                  <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                  </div>
                )}
              </div>
            </div>

        {/* Upload Area */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-6 text-center hover:border-blue-500 dark:hover:border-blue-400 transition-colors cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          <Camera className="w-8 h-8 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 dark:text-gray-400 mb-2">
            Kéo thả ảnh vào đây hoặc click để chọn
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500">
            JPG, PNG, WebP, GIF • Tối đa 5MB
          </p>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Progress */}
        {isUploading && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
              <span>Đang upload...</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Messages */}
        {error && (
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
          </div>
        )}

        {success && (
          <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
              <p className="text-green-700 dark:text-green-400 text-sm">{success}</p>
            </div>
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
              {currentAvatar ? (
                <button
                  onClick={handleRemoveAvatar}
                  disabled={isUploading}
                  className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 disabled:bg-red-400 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {isUploading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ pointerEvents: 'none' }}>
                      <path d="M3 6h18" />
                      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                      <line x1="10" y1="11" x2="10" y2="17" />
                      <line x1="14" y1="11" x2="14" y2="17" />
                    </svg>
                  )}
                  {isUploading ? 'Đang xóa...' : 'Xóa ảnh đại diện'}
                </button>
              ) : (
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
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
