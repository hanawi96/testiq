/**
 * Image optimization utilities for cropping and compression
 */

export interface OptimizationOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'webp' | 'png';
  maintainAspectRatio?: boolean;
}

export interface OptimizationResult {
  blob: Blob;
  url: string;
  originalSize: number;
  optimizedSize: number;
  compressionRatio: number;
}

/**
 * Optimize image with compression and resizing
 */
export async function optimizeImage(
  file: File | Blob,
  options: OptimizationOptions = {}
): Promise<OptimizationResult> {
  const {
    maxWidth = 1920,
    maxHeight = 1080,
    quality = 0.85,
    format = 'jpeg',
    maintainAspectRatio = true
  } = options;

  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    if (!ctx) {
      reject(new Error('Canvas context not available'));
      return;
    }

    img.onload = () => {
      try {
        let { width, height } = img;
        const originalSize = file.size;

        // Calculate new dimensions
        if (maintainAspectRatio) {
          const aspectRatio = width / height;
          
          if (width > maxWidth) {
            width = maxWidth;
            height = width / aspectRatio;
          }
          
          if (height > maxHeight) {
            height = maxHeight;
            width = height * aspectRatio;
          }
        } else {
          width = Math.min(width, maxWidth);
          height = Math.min(height, maxHeight);
        }

        // Set canvas dimensions
        canvas.width = width;
        canvas.height = height;

        // Enable image smoothing for better quality
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to blob
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to create optimized blob'));
              return;
            }

            const optimizedSize = blob.size;
            const compressionRatio = ((originalSize - optimizedSize) / originalSize) * 100;
            const url = URL.createObjectURL(blob);

            resolve({
              blob,
              url,
              originalSize,
              optimizedSize,
              compressionRatio
            });
          },
          `image/${format}`,
          quality
        );
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    // Load image
    if (file instanceof File) {
      img.src = URL.createObjectURL(file);
    } else {
      img.src = URL.createObjectURL(file);
    }
  });
}

/**
 * Create multiple sizes for responsive images
 */
export async function createResponsiveSizes(
  file: File | Blob,
  sizes: { width: number; height?: number; suffix: string }[],
  baseOptions: OptimizationOptions = {}
): Promise<{ [key: string]: OptimizationResult }> {
  const results: { [key: string]: OptimizationResult } = {};

  for (const size of sizes) {
    try {
      const result = await optimizeImage(file, {
        ...baseOptions,
        maxWidth: size.width,
        maxHeight: size.height || size.width,
      });
      results[size.suffix] = result;
    } catch (error) {
      console.error(`Failed to create ${size.suffix} size:`, error);
    }
  }

  return results;
}

/**
 * Get optimal dimensions for different use cases
 */
export const PRESET_SIZES = {
  // Social media optimized
  social: {
    facebook: { width: 1200, height: 630, suffix: 'facebook' },
    twitter: { width: 1200, height: 675, suffix: 'twitter' },
    instagram: { width: 1080, height: 1080, suffix: 'instagram' },
    linkedin: { width: 1200, height: 627, suffix: 'linkedin' }
  },
  
  // Blog optimized
  blog: {
    hero: { width: 1920, height: 1080, suffix: 'hero' },
    featured: { width: 1200, height: 675, suffix: 'featured' },
    thumbnail: { width: 400, height: 225, suffix: 'thumbnail' },
    small: { width: 200, height: 113, suffix: 'small' }
  },
  
  // General purpose
  general: {
    large: { width: 1920, suffix: 'large' },
    medium: { width: 1200, suffix: 'medium' },
    small: { width: 600, suffix: 'small' },
    thumbnail: { width: 300, suffix: 'thumbnail' }
  }
};

/**
 * Auto-suggest optimal crop ratio based on image dimensions
 */
export function suggestOptimalRatio(width: number, height: number): number {
  const currentRatio = width / height;
  
  // Common ratios with tolerance
  const ratios = [
    { ratio: 16/9, name: '16:9' },
    { ratio: 4/3, name: '4:3' },
    { ratio: 1, name: '1:1' },
    { ratio: 3/2, name: '3:2' },
    { ratio: 9/16, name: '9:16' }
  ];
  
  // Find closest ratio
  let closest = ratios[0];
  let minDiff = Math.abs(currentRatio - closest.ratio);
  
  for (const r of ratios) {
    const diff = Math.abs(currentRatio - r.ratio);
    if (diff < minDiff) {
      minDiff = diff;
      closest = r;
    }
  }
  
  // If difference is small (< 10%), suggest current ratio
  if (minDiff / currentRatio < 0.1) {
    return currentRatio;
  }
  
  return closest.ratio;
}

/**
 * Validate image file
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  // Check file type
  if (!file.type.startsWith('image/')) {
    return { valid: false, error: 'File không phải là ảnh' };
  }
  
  // Check supported formats
  const supportedFormats = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (!supportedFormats.includes(file.type)) {
    return { valid: false, error: 'Định dạng ảnh không được hỗ trợ' };
  }
  
  // Check file size (max 10MB)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    return { valid: false, error: 'Kích thước file quá lớn (tối đa 10MB)' };
  }
  
  return { valid: true };
}

/**
 * Get image dimensions from file
 */
export function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
      URL.revokeObjectURL(img.src);
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image'));
      URL.revokeObjectURL(img.src);
    };
    
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
