/**
 * Simple client-side image optimization utilities
 * For production, consider using server-side image processing
 */

export interface OptimizationOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
}

export class ImageOptimizer {
  /**
   * Ultra-fast image optimization with WebP support
   */
  static async optimizeImage(
    file: File,
    options: OptimizationOptions = {}
  ): Promise<File> {
    const {
      maxWidth = 1920,
      maxHeight = 1080,
      quality = 0.85,
      format = this.getBestFormat(file)
    } = options;

    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        try {
          // Calculate new dimensions
          const { width, height } = this.calculateDimensions(
            img.width,
            img.height,
            maxWidth,
            maxHeight
          );

          // Set canvas size
          canvas.width = width;
          canvas.height = height;

          // Draw and compress
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            
            canvas.toBlob(
              (blob) => {
                if (blob) {
                  const optimizedFile = new File(
                    [blob],
                    this.generateOptimizedFileName(file.name, format),
                    { type: `image/${format}` }
                  );
                  resolve(optimizedFile);
                } else {
                  resolve(file); // Fallback to original
                }
              },
              `image/${format}`,
              quality
            );
          } else {
            resolve(file); // Fallback to original
          }
        } catch (error) {
          console.warn('Image optimization failed, using original:', error);
          resolve(file); // Fallback to original
        }
      };

      img.onerror = () => {
        console.warn('Failed to load image for optimization, using original');
        resolve(file); // Fallback to original
      };

      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Calculate optimal dimensions while maintaining aspect ratio
   */
  private static calculateDimensions(
    originalWidth: number,
    originalHeight: number,
    maxWidth: number,
    maxHeight: number
  ): { width: number; height: number } {
    let { width, height } = { width: originalWidth, height: originalHeight };

    // If image is smaller than max dimensions, keep original size
    if (width <= maxWidth && height <= maxHeight) {
      return { width, height };
    }

    // Calculate scaling factor
    const widthRatio = maxWidth / width;
    const heightRatio = maxHeight / height;
    const ratio = Math.min(widthRatio, heightRatio);

    return {
      width: Math.round(width * ratio),
      height: Math.round(height * ratio),
    };
  }

  /**
   * Generate optimized filename
   */
  private static generateOptimizedFileName(
    originalName: string,
    format: string
  ): string {
    const nameWithoutExt = originalName.split('.')[0];
    return `${nameWithoutExt}.${format}`;
  }

  /**
   * Get best format for optimization (WebP if supported, otherwise JPEG)
   */
  private static getBestFormat(file: File): 'jpeg' | 'png' | 'webp' {
    // Keep PNG for transparency
    if (file.type === 'image/png') {
      return 'png';
    }

    // Use WebP for best compression (if browser supports)
    if (this.supportsWebP()) {
      return 'webp';
    }

    // Default to JPEG
    return 'jpeg';
  }

  /**
   * Check WebP support
   */
  private static supportsWebP(): boolean {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
    } catch {
      return false;
    }
  }

  /**
   * Check if image needs optimization
   */
  static shouldOptimize(
    file: File,
    options: OptimizationOptions = {}
  ): Promise<boolean> {
    const { maxWidth = 1920, maxHeight = 1080 } = options;
    const maxSize = 2 * 1024 * 1024; // 2MB

    return new Promise((resolve) => {
      // Check file size first
      if (file.size > maxSize) {
        resolve(true);
        return;
      }

      // Check dimensions
      const img = new Image();
      img.onload = () => {
        const needsResize = img.width > maxWidth || img.height > maxHeight;
        resolve(needsResize);
      };
      img.onerror = () => resolve(false);
      img.src = URL.createObjectURL(file);
    });
  }
}
