import React, { useRef, useState } from 'react';
import { Image, Upload, X, Loader2 } from 'lucide-react';
import { ImageStorageService } from '../../../../../backend/storage/image-storage';

interface ImageUploadProps {
  onImageUpload: (url: string) => void;
  onClose: () => void;
}

export default function ImageUpload({ onImageUpload, onClose }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file upload
  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    setUploadError(null);
    setUploadSuccess(null);
    setUploadProgress(0);

    try {
      // Try upload to Supabase Storage first
      const { data, error } = await ImageStorageService.uploadImage(file, {
        folder: 'articles',
        maxWidth: 1920,
        maxHeight: 1080,
      });

      if (data && !error) {
        // Success - pass URL to editor
        console.log('✅ Image uploaded to Supabase Storage:', data.url);

        // Show success notification
        setUploadSuccess('✅ Ảnh đã được upload lên Supabase Storage thành công!');
        setUploadError(null);

        // Small delay to show success message
        setTimeout(() => {
          onImageUpload(data.url);
          onClose();
        }, 1000);
        return;
      }

      // If Supabase fails, fallback to base64
      console.warn('Supabase upload failed, falling back to base64:', error);
      setUploadError('Supabase không khả dụng, sử dụng chế độ demo');

      // Convert to base64 as fallback
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        onImageUpload(result);
        onClose();
      };
      reader.readAsDataURL(file);

    } catch (error: any) {
      console.error('Upload error:', error);
      setUploadError(error.message || 'Lỗi upload hình ảnh');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

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
      onImageUpload(imageUrl.trim());
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
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
          className={`border-2 border-dashed rounded-lg p-8 text-center mb-4 transition-colors ${
            dragActive 
              ? 'border-blue-500 bg-blue-500 bg-opacity-10' 
              : 'border-gray-600 hover:border-gray-500'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          {isUploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 size={32} className="text-blue-500 animate-spin" />
              <p className="text-gray-300">Đang upload...</p>
              {uploadProgress > 0 && (
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
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
              <p className="text-sm text-gray-500">PNG, JPG, GIF tối đa 5MB</p>
            </div>
          )}
        </div>

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

        {/* Cancel Button */}
        <button
          onClick={onClose}
          className="w-full px-4 py-2 bg-gray-700 text-gray-300 rounded hover:bg-gray-600"
        >
          Hủy
        </button>
      </div>
    </div>
  );
}
