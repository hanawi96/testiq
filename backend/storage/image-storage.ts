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
   * Upload image to Supabase Storage (original method)
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
   * Upload image with preserved filename for TipTap editor
   */
  static async uploadImageWithPreservedName(
    file: File,
    options: ImageUploadOptions = {}
  ): Promise<{ data: ImageUploadResult | null; error: any }> {
    try {
      // Fast validation
      const validation = this.validateFile(file);
      if (!validation.valid) {
        return { data: null, error: new Error(validation.error) };
      }

      // Generate preserved filename with duplicate handling
      const folder = options.folder || 'articles';
      const fileName = await this.generatePreservedFileName(file.name, folder);
      const filePath = `${folder}/${fileName}`;



      // Parallel processing: dimensions + optimization
      const [dimensions, optimizedFile] = await Promise.all([
        this.getImageDimensions(file),
        this.smartOptimizeImage(file, options),
      ]);

      // Upload to Supabase
      const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
        .from(this.BUCKET_NAME)
        .upload(filePath, optimizedFile, {
          cacheControl: '31536000', // 1 year cache
          upsert: false, // Don't overwrite existing files
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
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
      console.error('ImageStorageService: Upload with preserved name error:', error);
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
   * Extract path from Supabase URL for cleanup
   */
  static extractPathFromUrl(url: string): string | null {
    try {
      console.log('🔍 Extracting path from URL:', url);

      // Remove query parameters first (like ?t=timestamp for cache busting)
      const cleanUrl = url.split('?')[0];
      console.log('🧹 Clean URL (no query params):', cleanUrl);

      // Handle different Supabase storage URL formats
      const patterns = [
        // Standard format: /storage/v1/object/public/images/...
        /\/storage\/v1\/object\/public\/images\/(.+)$/,
        // Alternative format: /storage/v1/object/public/bucket-name/...
        /\/storage\/v1\/object\/public\/[^\/]+\/(.+)$/,
        // Direct bucket access: /images/...
        /\/images\/(.+)$/
      ];

      for (const pattern of patterns) {
        const match = cleanUrl.match(pattern);
        if (match) {
          console.log('✅ Extracted path:', match[1]);
          return match[1];
        }
      }

      console.warn('⚠️ No pattern matched for URL:', cleanUrl);
      return null;
    } catch (error) {
      console.error('❌ Error extracting path from URL:', error);
      return null;
    }
  }

  /**
   * Extract filename from Supabase URL
   */
  static extractFileNameFromUrl(url: string): string | null {
    try {
      const path = this.extractPathFromUrl(url);
      if (!path) return null;

      // Get filename from path (last part after /)
      const pathParts = path.split('/');
      return pathParts[pathParts.length - 1] || null;
    } catch {
      return null;
    }
  }

  /**
   * Smart cleanup: delete old image when replacing with new one
   */
  static async replaceImage(
    oldImageUrl: string | null,
    newFile: File,
    options: ImageUploadOptions = {}
  ): Promise<{ data: ImageUploadResult | null; error: any }> {
    try {
      // FIXED: Upload new image với preserved filename
      const uploadResult = await this.uploadImageWithPreservedName(newFile, options);

      if (uploadResult.error || !uploadResult.data) {
        return uploadResult;
      }

      // Delete old image if exists and is from our storage
      if (oldImageUrl) {
        console.log('🗑️ Attempting to delete old image:', oldImageUrl);
        const oldPath = this.extractPathFromUrl(oldImageUrl);
        console.log('📁 Extracted path:', oldPath);

        if (oldPath) {
          console.log('✅ Deleting old image at path:', oldPath);
          // Delete in background, don't wait for it
          this.deleteImage(oldPath)
            .then(({ success, error }) => {
              if (success) {
                console.log('✅ Old image deleted successfully:', oldPath);
              } else {
                console.warn('❌ Failed to delete old image:', error);
              }
            })
            .catch(error => {
              console.warn('❌ Error during old image cleanup:', error);
            });
        } else {
          console.warn('⚠️ Could not extract path from URL:', oldImageUrl);
        }
      }

      return uploadResult;

    } catch (error) {
      console.error('ImageStorageService: Replace error:', error);
      return { data: null, error };
    }
  }

  /**
   * Rename image file in storage with new filename
   */
  static async renameImage(
    currentImageUrl: string,
    newFileName: string,
    options: ImageUploadOptions = {}
  ): Promise<{ data: ImageUploadResult | null; error: any }> {
    try {
      if (!supabaseAdmin) {
        return { data: null, error: new Error('Supabase admin client not configured') };
      }

      // Extract current path from URL
      const currentPath = this.extractPathFromUrl(currentImageUrl);
      if (!currentPath) {
        return { data: null, error: new Error('Không thể xác định đường dẫn file hiện tại') };
      }

      // Get folder from current path
      const pathParts = currentPath.split('/');
      const folder = pathParts.slice(0, -1).join('/') || (options.folder || 'articles');

      // Clean and validate new filename
      const extension = currentPath.split('.').pop()?.toLowerCase() || 'jpg';
      let cleanBaseName = newFileName
        .replace(/\.[^/.]+$/, '') // Remove extension if provided
        .replace(/[^a-zA-Z0-9\-_\s]/g, '') // Remove special chars
        .replace(/\s+/g, '_') // Replace spaces with underscores
        .replace(/^[-_]+|[-_]+$/g, '') // Remove leading/trailing dashes and underscores
        .trim();

      // Handle edge cases
      if (!cleanBaseName || cleanBaseName.length === 0) {
        cleanBaseName = 'image'; // Default name for invalid filenames
      }

      // Limit length for storage compatibility
      if (cleanBaseName.length > 50) {
        cleanBaseName = cleanBaseName.substring(0, 50);
      }

      const newCleanFileName = `${cleanBaseName}.${extension}`;

      // Check if new filename already exists (with duplicate handling)
      const finalFileName = await this.generatePreservedFileName(newCleanFileName, folder);
      const finalPath = `${folder}/${finalFileName}`;

      // If the new path is the same as current, no need to rename
      if (finalPath === currentPath) {
        // Get current file info for response
        const { data: urlData } = supabaseAdmin.storage
          .from(this.BUCKET_NAME)
          .getPublicUrl(currentPath);

        return {
          data: {
            url: urlData.publicUrl,
            path: currentPath,
            size: 0 // We don't have size info for existing files
          },
          error: null
        };
      }

      // Copy file to new location
      const { error: copyError } = await supabaseAdmin.storage
        .from(this.BUCKET_NAME)
        .copy(currentPath, finalPath);

      if (copyError) {
        return { data: null, error: copyError };
      }

      // Delete old file
      const { error: deleteError } = await supabaseAdmin.storage
        .from(this.BUCKET_NAME)
        .remove([currentPath]);

      if (deleteError) {
        console.warn('Failed to delete old file after rename:', deleteError);
        // Continue anyway, the copy was successful
      }

      // Get public URL for new file
      const { data: urlData } = supabaseAdmin.storage
        .from(this.BUCKET_NAME)
        .getPublicUrl(finalPath);

      const result: ImageUploadResult = {
        url: urlData.publicUrl,
        path: finalPath,
        size: 0 // We don't have size info for copied files
      };

      return { data: result, error: null };

    } catch (error) {
      console.error('ImageStorageService: Rename error:', error);
      return { data: null, error };
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
   * Generate unique filename (original method)
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
   * Generate filename preserving original name with smart duplicate handling
   */
  private static async generatePreservedFileName(
    originalName: string,
    folder: string = 'articles'
  ): Promise<string> {
    // ENHANCED: Clean and normalize filename with edge case handling
    const extension = originalName.split('.').pop()?.toLowerCase() || 'jpg';
    let baseName = originalName.split('.')[0]
      .replace(/[^a-zA-Z0-9\-_\s]/g, '') // Remove special chars except dash, underscore, space
      .replace(/\s+/g, '_') // Replace spaces with underscores
      .replace(/^[-_]+|[-_]+$/g, '') // Remove leading/trailing dashes and underscores
      .trim();

    // Handle edge cases
    if (!baseName || baseName.length === 0) {
      baseName = 'image'; // Default name for invalid filenames
    }

    // Limit length for storage compatibility
    if (baseName.length > 50) {
      baseName = baseName.substring(0, 50);
    }

    const cleanFileName = `${baseName}.${extension}`;



    // OPTIMIZED: Batch check for existing files to reduce API calls
    if (!supabaseAdmin) {
      return cleanFileName; // Return original name if no admin client
    }

    const { data: existingFiles } = await supabaseAdmin.storage
      .from(this.BUCKET_NAME)
      .list(folder, {
        search: baseName, // Search by base name to get all potential conflicts
        limit: 100
      });

    // If no files found, return original name
    if (!existingFiles || existingFiles.length === 0) {
      return cleanFileName;
    }

    // Create set of existing filenames for fast lookup
    const existingNames = new Set(existingFiles.map(file => file.name));

    // If original name doesn't exist, return it
    if (!existingNames.has(cleanFileName)) {
      return cleanFileName;
    }

    // Find next available number
    let counter = 1;
    let newFileName: string;

    do {
      newFileName = `${baseName}_${counter}.${extension}`;
      if (!existingNames.has(newFileName)) {
        break;
      }
      counter++;
    } while (counter < 1000); // Safety limit

    return newFileName;
  }

  /**
   * Ultra-fast smart optimization with intelligent early bailout
   */
  private static async smartOptimizeImage(
    file: File,
    options: ImageUploadOptions
  ): Promise<File> {
    // Early bailout for very small files (< 100KB)
    if (file.size < 100 * 1024) {
      console.log('⚡ Skipping optimization - file too small (<100KB)');
      return file;
    }

    // Fast path: Skip for WebP (already optimized)
    if (file.type === 'image/webp') {
      console.log('⚡ Skipping optimization - already WebP');
      return file;
    }

    // Check if WebP conversion or resizing is beneficial
    try {
      const shouldOptimize = await ImageOptimizer.shouldOptimize(file, {
        maxWidth: options.maxWidth,
        maxHeight: options.maxHeight,
      });

      if (!shouldOptimize) {
        console.log('⚡ Skipping optimization - file already optimal');
        return file;
      }

      console.log(`🔄 Optimizing: ${file.size} bytes, WebP: ${ImageOptimizer.getBestFormat(file) === 'webp'}`);
      return this.optimizeImage(file, options);

    } catch (error) {
      console.warn('Smart optimization check failed, using original:', error);
      return file;
    }
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

      // Optimize the image with smart format selection
      const optimizedFile = await ImageOptimizer.optimizeImage(file, {
        maxWidth: options.maxWidth || 1920,
        maxHeight: options.maxHeight || 1080,
        quality: options.quality || 0.85,
        // Let ImageOptimizer choose the best format (including WebP)
      });

      const compressionRatio = ((file.size - optimizedFile.size) / file.size * 100).toFixed(1);
      console.log(`✅ Image optimized: ${file.size} → ${optimizedFile.size} bytes (${compressionRatio}% smaller)`);
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
