import { ImageStorageService } from './image-storage';

/**
 * Initialize storage services
 * Call this on app startup
 */
export async function initializeStorage(): Promise<void> {
  try {
    console.log('🗄️ Initializing storage services...');
    
    // Initialize image storage bucket
    const { success, error } = await ImageStorageService.initializeBucket();
    
    if (success) {
      console.log('✅ Image storage bucket initialized successfully');
    } else {
      console.warn('⚠️ Image storage bucket initialization failed:', error?.message);
    }
    
  } catch (error) {
    console.error('❌ Storage initialization error:', error);
  }
}

/**
 * Storage configuration
 */
export const storageConfig = {
  images: {
    bucket: 'images',
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    folders: {
      articles: 'articles',
      avatars: 'avatars',
      media: 'media',
    },
  },
} as const;
