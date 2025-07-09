import { supabaseAdmin } from '../config/supabase';
import { ImageOptimizer } from './image-optimizer';

export interface ImageUploadResult {
  url: string;
  path: string;
  width?: number;
  height?: number;
  size: number;
}

export interface ImageUploadOptions {
  folder?: string;
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
}

/**
 * Simple, optimized image storage service for Supabase
 * Handles upload, optimization, and cleanup
 */
export class ImageStorageService {
  private static readonly BUCKET_NAME = 'images';
  private static readonly MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  private static readonly ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

  /**
   * Upload image to Supabase Storage
   */
  static async uploadImage(
    file: File,
    options: ImageUploadOptions = {}
  ): Promise<{ data: ImageUploadResult | null; error: any }> {
    try {
      // Fast validation
      const validation = this.validateFile(file);
      if (!validation.valid) {
        return { data: null, error: new Error(validation.error) };
      }

      // Generate filename and path
      const fileName = this.generateFileName(file.name);
      const folder = options.folder || 'articles';
      const filePath = `${folder}/${fileName}`;

      // Parallel processing: dimensions + optimization + bucket check
      const [dimensions, optimizedFile] = await Promise.all([
        this.getImageDimensions(file), // Use original for faster dimensions
        this.smartOptimizeImage(file, options),
        this.ensureBucketExists() // Run in parallel
      ]);

      // Upload to Supabase
      if (!supabaseAdmin) {
        return { data: null, error: new Error('Supabase admin client not configured') };
      }

      const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
        .from(this.BUCKET_NAME)
        .upload(filePath, optimizedFile, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        return { data: null, error: uploadError };
      }

      // Get public URL (no await needed)
      const { data: urlData } = supabaseAdmin.storage
        .from(this.BUCKET_NAME)
        .getPublicUrl(filePath);

      const result: ImageUploadResult = {
        url: urlData.publicUrl,
        path: filePath,
        width: dimensions.width,
        height: dimensions.height,
        size: optimizedFile.size,
      };

      return { data: result, error: null };

    } catch (error) {
      console.error('ImageStorageService: Upload error:', error);
      return { data: null, error };
    }
  }

  /**
   * Delete image from storage
   */
  static async deleteImage(path: string): Promise<{ success: boolean; error: any }> {
    try {
      if (!supabaseAdmin) {
        return { success: false, error: new Error('Supabase admin client not configured') };
      }

      const { error } = await supabaseAdmin.storage
        .from(this.BUCKET_NAME)
        .remove([path]);

      return { success: !error, error };

    } catch (error) {
      console.error('ImageStorageService: Delete error:', error);
      return { success: false, error };
    }
  }

  /**
   * Validate file before upload
   */
  private static validateFile(file: File): { valid: boolean; error?: string } {
    // Check file type
    if (!this.ALLOWED_TYPES.includes(file.type)) {
      return { valid: false, error: 'Định dạng file không được hỗ trợ. Chỉ chấp nhận: JPG, PNG, WebP, GIF' };
    }

    // Check file size
    if (file.size > this.MAX_FILE_SIZE) {
      return { valid: false, error: 'File quá lớn. Kích thước tối đa: 5MB' };
    }

    return { valid: true };
  }

  /**
   * Generate unique filename
   */
  private static generateFileName(originalName: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const extension = originalName.split('.').pop()?.toLowerCase() || 'jpg';
    const baseName = originalName.split('.')[0].toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 20);
    
    return `${baseName}-${timestamp}-${random}.${extension}`;
  }

  /**
   * Smart optimization - skip if not needed for speed
   */
  private static async smartOptimizeImage(
    file: File,
    options: ImageUploadOptions
  ): Promise<File> {
    // Fast path: Skip optimization for small files
    const maxSize = 1 * 1024 * 1024; // 1MB threshold
    if (file.size <= maxSize) {
      return file; // No optimization needed
    }

    // Fast path: Skip for WebP (already optimized)
    if (file.type === 'image/webp') {
      return file;
    }

    return this.optimizeImage(file, options);
  }

  /**
   * Optimize image before upload (fallback method)
   */
  private static async optimizeImage(
    file: File,
    options: ImageUploadOptions
  ): Promise<File> {
    try {
      // Check if optimization is needed
      const shouldOptimize = await ImageOptimizer.shouldOptimize(file, {
        maxWidth: options.maxWidth,
        maxHeight: options.maxHeight,
      });

      if (!shouldOptimize) {
        return file;
      }

      // Optimize the image
      const optimizedFile = await ImageOptimizer.optimizeImage(file, {
        maxWidth: options.maxWidth || 1920,
        maxHeight: options.maxHeight || 1080,
        quality: options.quality || 0.85,
        format: file.type.includes('png') ? 'png' : 'jpeg',
      });

      console.log(`Image optimized: ${file.size} → ${optimizedFile.size} bytes`);
      return optimizedFile;

    } catch (error) {
      console.warn('Image optimization failed, using original:', error);
      return file;
    }
  }

  /**
   * Get image dimensions
   */
  private static async getImageDimensions(file: File): Promise<{ width?: number; height?: number }> {
    return new Promise((resolve) => {
      if (!file.type.startsWith('image/')) {
        resolve({});
        return;
      }

      const img = new Image();
      const url = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve({ width: img.width, height: img.height });
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve({});
      };

      img.src = url;
    });
  }

  /**
   * Ensure bucket exists (simple version)
   */
  private static async ensureBucketExists(): Promise<void> {
    try {
      if (!supabaseAdmin) return;

      // Try to list buckets to check if our bucket exists
      const { data: buckets } = await supabaseAdmin.storage.listBuckets();
      const bucketExists = buckets?.some(bucket => bucket.name === this.BUCKET_NAME);

      if (!bucketExists) {
        // Create bucket if it doesn't exist
        await supabaseAdmin.storage.createBucket(this.BUCKET_NAME, {
          public: true,
          allowedMimeTypes: this.ALLOWED_TYPES,
          fileSizeLimit: this.MAX_FILE_SIZE,
        });
      }
    } catch (error) {
      // Ignore errors - bucket might already exist or we don't have permissions
      console.warn('Bucket creation warning:', error);
    }
  }

  /**
   * Create storage bucket if not exists
   */
  static async initializeBucket(): Promise<{ success: boolean; error: any }> {
    try {
      if (!supabaseAdmin) {
        return { success: false, error: new Error('Supabase admin client not configured') };
      }

      // Check if bucket exists
      const { data: buckets, error: listError } = await supabaseAdmin.storage.listBuckets();
      
      if (listError) {
        return { success: false, error: listError };
      }

      const bucketExists = buckets?.some(bucket => bucket.name === this.BUCKET_NAME);

      if (!bucketExists) {
        // Create bucket
        const { error: createError } = await supabaseAdmin.storage.createBucket(this.BUCKET_NAME, {
          public: true,
          allowedMimeTypes: this.ALLOWED_TYPES,
          fileSizeLimit: this.MAX_FILE_SIZE,
        });

        if (createError) {
          return { success: false, error: createError };
        }
      }

      return { success: true, error: null };

    } catch (error) {
      console.error('ImageStorageService: Initialize bucket error:', error);
      return { success: false, error };
    }
  }
}
