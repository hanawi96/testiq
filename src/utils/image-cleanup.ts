/**
 * Image Cleanup Utilities for Content Images
 * Handles cleanup of unused images from Supabase Storage
 */

import { ImageStorageService } from '../../backend/storage/image-storage';

export interface ImageCleanupResult {
  removedImages: string[];
  errors: string[];
  totalCleaned: number;
}

/**
 * Extract all image URLs from HTML content
 */
export function extractImageUrls(htmlContent: string): string[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, 'text/html');
  const images = doc.querySelectorAll('img');
  
  return Array.from(images)
    .map(img => img.src)
    .filter(src => src && src.includes('supabase')) // Only Supabase images
    .filter(src => !src.startsWith('data:')); // Exclude base64 images
}

/**
 * Compare old and new content to find removed images
 */
export function findRemovedImages(oldContent: string, newContent: string): string[] {
  const oldImages = new Set(extractImageUrls(oldContent));
  const newImages = new Set(extractImageUrls(newContent));
  
  // Find images that were in old content but not in new content
  const removedImages: string[] = [];
  oldImages.forEach(imageUrl => {
    if (!newImages.has(imageUrl)) {
      removedImages.push(imageUrl);
    }
  });
  
  return removedImages;
}

/**
 * Clean up removed images from storage
 */
export async function cleanupRemovedImages(
  oldContent: string, 
  newContent: string
): Promise<ImageCleanupResult> {
  const result: ImageCleanupResult = {
    removedImages: [],
    errors: [],
    totalCleaned: 0
  };

  try {
    const removedImageUrls = findRemovedImages(oldContent, newContent);
    
    if (removedImageUrls.length === 0) {
      console.log('🧹 Image Cleanup: No images to clean up');
      return result;
    }

    console.log(`🧹 Image Cleanup: Found ${removedImageUrls.length} removed images:`, removedImageUrls);

    // Clean up each removed image
    for (const imageUrl of removedImageUrls) {
      try {
        const filePath = ImageStorageService.extractPathFromUrl(imageUrl);
        if (filePath) {
          // Delete from storage (don't await to avoid blocking)
          ImageStorageService.deleteImage(filePath)
            .then(({ success, error }) => {
              if (success) {
                console.log(`✅ Image Cleanup: Deleted ${filePath}`);

                // Clear browser cache for the deleted image
                if (typeof window !== 'undefined' && 'caches' in window) {
                  caches.keys().then(cacheNames => {
                    cacheNames.forEach(cacheName => {
                      caches.open(cacheName).then(cache => {
                        cache.delete(imageUrl).catch(() => {
                          // Ignore cache deletion errors
                        });
                      });
                    });
                  }).catch(() => {
                    // Ignore cache API errors
                  });
                }
              } else {
                console.warn(`⚠️ Image Cleanup: Failed to delete ${filePath}:`, error);
              }
            })
            .catch(error => {
              console.warn(`⚠️ Image Cleanup: Error deleting ${filePath}:`, error);
            });

          result.removedImages.push(imageUrl);
          result.totalCleaned++;
        }
      } catch (error) {
        console.error(`❌ Image Cleanup: Error processing ${imageUrl}:`, error);
        result.errors.push(`Failed to cleanup ${imageUrl}: ${error}`);
      }
    }

    if (result.totalCleaned > 0) {
      console.log(`✅ Image Cleanup: Initiated cleanup for ${result.totalCleaned} images`);
    }

  } catch (error) {
    console.error('❌ Image Cleanup: General error:', error);
    result.errors.push(`General cleanup error: ${error}`);
  }

  return result;
}

/**
 * Validate if image URL is from our Supabase storage
 */
export function isOurStorageImage(imageUrl: string): boolean {
  return imageUrl.includes('supabase') && 
         !imageUrl.startsWith('data:') &&
         imageUrl.includes('/storage/v1/object/public/');
}

/**
 * Get image statistics from content
 */
export function getImageStats(htmlContent: string) {
  const allImages = extractImageUrls(htmlContent);
  const supabaseImages = allImages.filter(isOurStorageImage);
  const externalImages = allImages.filter(url => !isOurStorageImage(url));
  
  return {
    total: allImages.length,
    supabase: supabaseImages.length,
    external: externalImages.length,
    supabaseUrls: supabaseImages,
    externalUrls: externalImages
  };
}

/**
 * Debounced cleanup function for real-time editing
 */
let cleanupTimeout: NodeJS.Timeout | null = null;

export function debouncedImageCleanup(
  oldContent: string,
  newContent: string,
  delay: number = 5000 // 5 seconds delay
): Promise<ImageCleanupResult> {
  return new Promise((resolve) => {
    // Clear existing timeout
    if (cleanupTimeout) {
      clearTimeout(cleanupTimeout);
    }

    // Set new timeout
    cleanupTimeout = setTimeout(async () => {
      const result = await cleanupRemovedImages(oldContent, newContent);
      resolve(result);
    }, delay);
  });
}
