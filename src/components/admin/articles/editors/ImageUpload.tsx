import React, { useRef, useState } from 'react';
import { Image, Upload, X, Loader2 } from 'lucide-react';
import { ImageStorageService } from '../../../../../backend/storage/image-storage';
import AltTextInput from '../../../ui/AltTextInput';

interface ImageUploadProps {
  onImageUpload: (url: string, alt: string) => void;
  onClose: () => void;
  existingImageUrl?: string; // For replacement/cleanup
}

// Simple cache for uploaded images (session-based)
const uploadCache = new Map<string, string>();

export default function ImageUpload({ onImageUpload, onClose, existingImageUrl }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [altText, setAltText] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Enhanced file validation
  const validateFile = async (file: File): Promise<{ valid: boolean; error?: string }> => {
    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      return { valid: false, error: 'Chỉ hỗ trợ định dạng JPG, PNG, WebP' };
    }

    // Check file size (2MB limit for cover images)
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      return { valid: false, error: 'Kích thước file không được vượt quá 2MB' };
    }

    // Check image dimensions
    return new Promise((resolve) => {
      const img = new (window as any).Image();
      img.onload = () => {
        const minWidth = 800;
        const minHeight = 400;
        const maxWidth = 3840;
        const maxHeight = 2160;

        if (img.width < minWidth || img.height < minHeight) {
          resolve({ valid: false, error: `Kích thước tối thiểu: ${minWidth}x${minHeight}px` });
        } else if (img.width > maxWidth || img.height > maxHeight) {
          resolve({ valid: false, error: `Kích thước tối đa: ${maxWidth}x${maxHeight}px` });
        } else {
          resolve({ valid: true });
        }
        URL.revokeObjectURL(img.src);
      };
      img.onerror = () => {
        resolve({ valid: false, error: 'File không phải là hình ảnh hợp lệ' });
        URL.revokeObjectURL(img.src);
      };
      img.src = URL.createObjectURL(file);
    });
  };

  // Handle file upload with enhanced validation
  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    setUploadError(null);
    setUploadSuccess(null);
    setUploadProgress(0);

    // Check cache first (based on file name + size + lastModified)
    const cacheKey = `${file.name}-${file.size}-${file.lastModified}`;
    const cachedUrl = uploadCache.get(cacheKey);

    if (cachedUrl) {
      console.log('✅ Using cached image URL:', cachedUrl);
      // For cached images, we still need alt text
      setPreviewUrl(cachedUrl);
      setUploadSuccess('✅ Sử dụng ảnh đã upload! Vui lòng thêm mô tả.');
      setIsUploading(false);
      return;
    }

    // Validate file first
    const validation = await validateFile(file);
    if (!validation.valid) {
      setUploadError(validation.error || 'File không hợp lệ');
      setIsUploading(false);
      return;
    }

    // Instant preview for better UX
    const preview = URL.createObjectURL(file);
    setPreviewUrl(preview);

    // Simulate progress for better UX
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => Math.min(prev + Math.random() * 30, 90));
    }, 200);

    try {
      // Use replaceImage for smart cleanup if replacing existing image
      const uploadMethod = existingImageUrl
        ? ImageStorageService.replaceImage(existingImageUrl, file, {
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
      setUploadProgress(100);

      if (data && !error) {
        // Success - cache the result and pass URL to editor
        const action = existingImageUrl ? 'replaced' : 'uploaded';
        console.log(`✅ Image ${action} to Supabase Storage:`, data.url);

        // Cache the uploaded image
        uploadCache.set(cacheKey, data.url);

        // Set preview URL to show alt text input
        setPreviewUrl(data.url);

        // Show success notification
        setUploadSuccess(`✅ ${existingImageUrl ? 'Thay thế' : 'Upload'} thành công! Vui lòng thêm mô tả.`);
        return;
      }

      // If Supabase fails, fallback to base64
      console.warn('Supabase upload failed, falling back to base64:', error);
      setUploadError('Supabase không khả dụng, sử dụng chế độ demo');

      // Convert to base64 as fallback
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setPreviewUrl(result);
        setUploadSuccess('✅ Upload thành công! Vui lòng thêm mô tả.');
      };
      reader.readAsDataURL(file);

    } catch (error: any) {
      console.error('Upload error:', error);
      setUploadError(error.message || 'Lỗi upload hình ảnh');
    } finally {
      clearInterval(progressInterval);
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Cleanup only on unmount
  React.useEffect(() => {
    return () => {
      // Only cleanup object URLs, not state
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, []); // ✅ Empty dependency - only run on unmount

  // Handle drag and drop
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  // Handle URL input
  const handleUrlSubmit = () => {
    if (imageUrl.trim()) {
      setPreviewUrl(imageUrl.trim());
      setUploadSuccess('✅ URL thêm thành công! Vui lòng thêm mô tả.');
    }
  };

  // Handle final insert with alt text
  const handleInsertImage = () => {
    if (previewUrl && altText.trim().length >= 5) {
      onImageUpload(previewUrl, altText.trim());
      // Reset state before closing
      resetState();
      onClose();
    }
  };

  // Reset all state
  const resetState = () => {
    setPreviewUrl(null);
    setAltText('');
    setImageUrl('');
    setUploadError(null);
    setUploadSuccess(null);
    setUploadProgress(0);
    setIsUploading(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="popup-container bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Image size={20} />
            Thêm hình ảnh
            <span className="text-xs bg-green-600 text-white px-2 py-1 rounded-full">
              Production
            </span>
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1"
          >
            <X size={20} />
          </button>
        </div>

        {/* Upload Area */}
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center mb-4 ${
            dragActive
              ? 'border-blue-500 bg-blue-500 bg-opacity-10'
              : 'border-gray-600 hover:border-gray-500'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          {previewUrl ? (
            <div className="flex flex-col items-center gap-4">
              <img
                src={previewUrl}
                alt="Preview"
                className="max-w-full max-h-32 object-contain rounded"
              />
              {isUploading ? (
                <div className="flex flex-col items-center gap-2 w-full">
                  <Loader2 size={24} className="text-blue-500 animate-spin" />
                  <p className="text-gray-300 text-sm">Đang upload...</p>
                  {uploadProgress > 0 && (
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-400 text-sm">Preview</p>
              )}
            </div>
          ) : isUploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 size={32} className="text-blue-500 animate-spin" />
              <p className="text-gray-300">Đang upload...</p>
              {uploadProgress > 0 && (
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Upload size={32} className="text-gray-400" />
              <p className="text-gray-300">
                Kéo thả hình ảnh vào đây hoặc{' '}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-blue-400 hover:text-blue-300 underline"
                >
                  chọn file
                </button>
              </p>
              <p className="text-sm text-gray-500">PNG, JPG, WebP tối đa 5MB</p>
            </div>
          )}
        </div>

        {/* Alt Text Input - Show when image is uploaded/previewed */}
        {previewUrl && (
          <div className="mb-6">
            <AltTextInput
              value={altText}
              onChange={setAltText}
              placeholder="Describe this image for accessibility and SEO..."
              required={true}
              className="w-full"
            />
          </div>
        )}

        {/* Success Message */}
        {uploadSuccess && (
          <div className="bg-green-500 bg-opacity-10 border border-green-500 rounded-lg p-3 mb-4">
            <p className="text-green-400 text-sm">{uploadSuccess}</p>
          </div>
        )}

        {/* Error Message */}
        {uploadError && (
          <div className="bg-red-500 bg-opacity-10 border border-red-500 rounded-lg p-3 mb-4">
            <p className="text-red-400 text-sm">{uploadError}</p>
          </div>
        )}

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* URL Input */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Hoặc nhập URL hình ảnh:
          </label>
          <div className="flex gap-2">
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://example.com/image.jpg"
              className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            />
            <button
              onClick={handleUrlSubmit}
              disabled={!imageUrl.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Thêm
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={() => {
              resetState();
              onClose();
            }}
            className="flex-1 px-4 py-2 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors"
          >
            Hủy
          </button>

          {previewUrl && (
            <button
              onClick={handleInsertImage}
              disabled={!altText.trim() || altText.trim().length < 5}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              Chèn ảnh ✨
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
