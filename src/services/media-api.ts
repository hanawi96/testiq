// Client-side API service for media management

export interface MediaFile {
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

export interface MediaListResponse {
  files: MediaFile[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface MediaListOptions {
  page?: number;
  limit?: number;
  search?: string;
  type?: 'image' | 'video' | 'document' | 'all';
  sortBy?: 'name' | 'size' | 'created_at';
  sortOrder?: 'asc' | 'desc';
}

export class MediaAPI {
  /**
   * Lấy danh sách file media
   */
  static async getMediaFiles(options: MediaListOptions = {}): Promise<{ data: MediaListResponse | null; error: any }> {
    try {
      const params = new URLSearchParams();
      
      if (options.page) params.append('page', options.page.toString());
      if (options.limit) params.append('limit', options.limit.toString());
      if (options.search) params.append('search', options.search);
      if (options.type) params.append('type', options.type);
      if (options.sortBy) params.append('sortBy', options.sortBy);
      if (options.sortOrder) params.append('sortOrder', options.sortOrder);

      const response = await fetch(`/api/admin/media?${params}`);
      const result = await response.json();

      if (!result.success) {
        return { data: null, error: new Error(result.error || 'Lỗi khi lấy danh sách media') };
      }

      return { data: result.data, error: null };

    } catch (error) {
      console.error('MediaAPI: Get files error:', error);
      return { data: null, error };
    }
  }

  /**
   * Upload file mới
   */
  static async uploadFile(file: File, folder: string = '', onProgress?: (progress: number) => void): Promise<{ data: MediaFile | null; error: any }> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (folder) formData.append('folder', folder);

      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        // Track upload progress
        if (onProgress) {
          xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
              const progress = Math.round((e.loaded / e.total) * 100);
              onProgress(progress);
            }
          });
        }

        xhr.addEventListener('load', () => {
          try {
            const result = JSON.parse(xhr.responseText);
            if (xhr.status === 200 || xhr.status === 201) {
              if (result.success) {
                resolve({ data: result.data, error: null });
              } else {
                resolve({ data: null, error: new Error(result.error || 'Upload failed') });
              }
            } else {
              resolve({ data: null, error: new Error(`Upload failed with status ${xhr.status}`) });
            }
          } catch (parseError) {
            resolve({ data: null, error: new Error('Invalid response from server') });
          }
        });

        xhr.addEventListener('error', () => {
          resolve({ data: null, error: new Error('Network error during upload') });
        });

        xhr.open('POST', '/api/admin/media');
        xhr.send(formData);
      });

    } catch (error) {
      console.error('MediaAPI: Upload error:', error);
      return { data: null, error };
    }
  }

  /**
   * Xóa file
   */
  static async deleteFile(filePath: string): Promise<{ error: any }> {
    try {
      const response = await fetch('/api/admin/media', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePaths: [filePath] })
      });

      const result = await response.json();

      if (!result.success) {
        return { error: new Error(result.error || 'Lỗi khi xóa file') };
      }

      return { error: null };

    } catch (error) {
      console.error('MediaAPI: Delete error:', error);
      return { error };
    }
  }

  /**
   * Xóa nhiều file
   */
  static async deleteFiles(filePaths: string[]): Promise<{ error: any }> {
    try {
      const response = await fetch('/api/admin/media', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePaths })
      });

      const result = await response.json();

      if (!result.success) {
        return { error: new Error(result.error || 'Lỗi khi xóa file') };
      }

      return { error: null };

    } catch (error) {
      console.error('MediaAPI: Bulk delete error:', error);
      return { error };
    }
  }

  /**
   * Đổi tên file
   */
  static async renameFile(oldPath: string, newName: string): Promise<{ data: MediaFile | null; error: any }> {
    try {
      const response = await fetch('/api/admin/media/rename', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldPath, newName })
      });

      const result = await response.json();

      if (!result.success) {
        return { data: null, error: new Error(result.error || 'Lỗi khi đổi tên file') };
      }

      return { data: result.data, error: null };

    } catch (error) {
      console.error('MediaAPI: Rename error:', error);
      return { data: null, error };
    }
  }

  /**
   * Copy URL to clipboard
   */
  static async copyToClipboard(url: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(url);
      return true;
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      return false;
    }
  }

  /**
   * Download file
   */
  static downloadFile(url: string, filename: string): void {
    try {
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Failed to download file:', error);
      // Fallback: open in new tab
      window.open(url, '_blank');
    }
  }

  /**
   * Validate file before upload
   */
  static validateFile(file: File): { valid: boolean; error?: string } {
    const allowedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif',
      'video/mp4', 'video/webm', 'video/ogg',
      'application/pdf', 'text/plain', 
      'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!allowedTypes.includes(file.type.toLowerCase())) {
      return { 
        valid: false, 
        error: 'Loại file không được hỗ trợ. Chỉ hỗ trợ: JPG, PNG, GIF, MP4, PDF, DOC, TXT' 
      };
    }

    if (file.size > maxSize) {
      return { 
        valid: false, 
        error: 'Kích thước file không được vượt quá 10MB' 
      };
    }

    return { valid: true };
  }

  /**
   * Format file size
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  /**
   * Get file type from MIME type
   */
  static getFileType(mimeType: string): 'image' | 'video' | 'document' {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    return 'document';
  }

  /**
   * Get file extension from filename
   */
  static getFileExtension(filename: string): string {
    return filename.split('.').pop()?.toLowerCase() || '';
  }

  /**
   * Generate thumbnail URL for images
   */
  static getThumbnailUrl(url: string, size: number = 200): string {
    // For now, return the original URL
    // In the future, this could generate actual thumbnails
    return url;
  }
}
